import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db';
import { products, orders, stockItems, cashShifts, users, auditLogs } from './src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_STOCK, 
  INITIAL_ORDERS, 
  INITIAL_CASH_SHIFT, 
  INITIAL_USERS,
  INITIAL_LOGS
} from './src/data/mockData';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // In-memory fallback stores
  let memoryProducts = [...INITIAL_PRODUCTS];
  let memoryStock = [...INITIAL_STOCK];
  let memoryOrders = [...INITIAL_ORDERS];
  let memoryCashShift = { ...INITIAL_CASH_SHIFT };
  let memoryUsers = [...INITIAL_USERS];
  let memoryLogs = [...INITIAL_LOGS];

  // Helper to check DB readiness and seed initial data if empty
  async function seedIfEmpty() {
    if (!db) return;
    try {
      // Seed Logs
      try {
        const existingLogs = await db.select().from(auditLogs);
        if (existingLogs.length === 0) {
          console.log('Seeding database with initial audit logs...');
          for (const l of INITIAL_LOGS) {
            await db.insert(auditLogs).values({
              ...l,
              details: (l.details || {}) as any,
            }).onConflictDoNothing();
          }
        }
      } catch (errLogs) {
        console.warn('Could not seed audit_logs table (table might be initializing):', errLogs);
      }
      // Seed Users
      try {
        const existingUsers = await db.select().from(users);
        if (existingUsers.length === 0) {
          console.log('Seeding database with initial users...');
          for (const u of INITIAL_USERS) {
            await db.insert(users).values({
              ...u,
              permissions: u.permissions as any,
            }).onConflictDoNothing();
          }
        }
      } catch (errUser) {
        console.warn('Could not seed users table (table might be initializing):', errUser);
      }

      // Seed Products
      try {
        const existingProducts = await db.select().from(products);
        if (existingProducts.length === 0) {
          console.log('Seeding database with initial products...');
          for (const p of INITIAL_PRODUCTS) {
            await db.insert(products).values(p).onConflictDoNothing();
          }
        }
      } catch (errProd) {
        console.warn('Could not seed products:', errProd);
      }

      // Seed Stock
      try {
        const existingStock = await db.select().from(stockItems);
        if (existingStock.length === 0) {
          console.log('Seeding database with initial stock...');
          for (const s of INITIAL_STOCK) {
            await db.insert(stockItems).values(s).onConflictDoNothing();
          }
        }
      } catch (errStock) {
        console.warn('Could not seed stock:', errStock);
      }

      // Seed Orders
      try {
        const existingOrders = await db.select().from(orders);
        if (existingOrders.length === 0) {
          console.log('Seeding database with initial orders...');
          for (const o of INITIAL_ORDERS) {
            await db.insert(orders).values({
              ...o,
              items: o.items as any,
            }).onConflictDoNothing();
          }
        }
      } catch (errOrders) {
        console.warn('Could not seed orders:', errOrders);
      }

      // Seed Cash Shift
      try {
        const existingShifts = await db.select().from(cashShifts);
        if (existingShifts.length === 0 && INITIAL_CASH_SHIFT) {
          console.log('Seeding database with initial cash shift...');
          await db.insert(cashShifts).values({
            ...INITIAL_CASH_SHIFT,
            salesByPaymentMethod: INITIAL_CASH_SHIFT.salesByPaymentMethod as any,
          }).onConflictDoNothing();
        }
      } catch (errShifts) {
        console.warn('Could not seed cash shift:', errShifts);
      }
    } catch (err) {
      console.error('Error during database seed/check:', err);
    }
  }

  // Seed DB in background if connected
  seedIfEmpty().catch(console.error);

  // Health API
  app.get('/api/health', async (req, res) => {
    let dbConnected = false;
    if (db) {
      try {
        await db.select().from(products).limit(1);
        dbConnected = true;
      } catch (e) {
        dbConnected = false;
      }
    }
    res.json({
      status: 'ok',
      database: dbConnected ? 'postgresql' : 'local_fallback',
      timestamp: new Date().toISOString()
    });
  });

  // ================= USERS API =================
  app.get('/api/users', async (req, res) => {
    if (!db) {
      return res.json(memoryUsers);
    }
    try {
      const list = await db.select().from(users);
      if (list.length > 0) {
        memoryUsers = list as any;
        return res.json(list);
      }
      return res.json(memoryUsers);
    } catch (err) {
      console.warn('DB fetch users failed, returning in-memory users:', err);
      return res.json(memoryUsers);
    }
  });

  app.post('/api/users', async (req, res) => {
    const newUser = req.body;
    if (!newUser || !newUser.name || !newUser.email || !newUser.pin) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes (nome, email, pin).' });
    }

    // Default id and createdAt if not supplied
    if (!newUser.id) {
      newUser.id = `user-${Date.now()}`;
    }
    if (!newUser.createdAt) {
      newUser.createdAt = new Date().toISOString();
    }
    if (!newUser.status) {
      newUser.status = 'ativo';
    }

    // Save to memory
    const existingIndex = memoryUsers.findIndex((u) => u.id === newUser.id);
    if (existingIndex >= 0) {
      memoryUsers[existingIndex] = newUser;
    } else {
      memoryUsers.unshift(newUser);
    }

    if (db) {
      try {
        await db.insert(users).values({
          ...newUser,
          permissions: newUser.permissions as any,
        }).onConflictDoUpdate({
          target: users.id,
          set: {
            ...newUser,
            permissions: newUser.permissions as any,
          },
        });
      } catch (e) {
        console.error('Failed to save user in db:', e);
      }
    }

    res.status(201).json(newUser);
  });

  app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const updatedUser = req.body;

    const userIndex = memoryUsers.findIndex((u) => u.id === id);
    if (userIndex >= 0) {
      memoryUsers[userIndex] = { ...memoryUsers[userIndex], ...updatedUser };
    } else {
      memoryUsers.push(updatedUser);
    }

    if (db) {
      try {
        await db.update(users).set({
          ...updatedUser,
          permissions: updatedUser.permissions as any,
        }).where(eq(users.id, id));
      } catch (e) {
        console.error('Failed to update user in db:', e);
      }
    }

    res.json(updatedUser);
  });

  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;

    // Safety check: Don't delete if it's the last active admin
    const activeAdmins = memoryUsers.filter((u) => u.role === 'admin' && u.status === 'ativo');
    const targetUser = memoryUsers.find((u) => u.id === id);
    if (targetUser && targetUser.role === 'admin' && activeAdmins.length <= 1) {
      return res.status(400).json({ 
        error: 'Não é possível excluir o único Administrador ativo do sistema.' 
      });
    }

    memoryUsers = memoryUsers.filter((u) => u.id !== id);

    if (db) {
      try {
        await db.delete(users).where(eq(users.id, id));
      } catch (e) {
        console.error('Failed to delete user in db:', e);
      }
    }

    res.json({ success: true, id });
  });

  app.post('/api/users/verify-pin', async (req, res) => {
    const { userId, pin } = req.body;
    let targetUser = userId 
      ? memoryUsers.find((u) => u.id === userId)
      : memoryUsers.find((u) => u.pin === pin && u.status === 'ativo');

    if (!targetUser && db) {
      try {
        if (userId) {
          const found = await db.select().from(users).where(eq(users.id, userId));
          if (found.length > 0) targetUser = found[0] as any;
        } else if (pin) {
          const found = await db.select().from(users).where(eq(users.pin, pin));
          if (found.length > 0) targetUser = found[0] as any;
        }
      } catch (e) {
        console.error('Error fetching user for pin verification:', e);
      }
    }

    if (!targetUser) {
      return res.status(404).json({ valid: false, message: 'Usuário ou PIN não localizado.' });
    }

    if (targetUser.pin === pin) {
      return res.json({ valid: true, user: targetUser });
    } else {
      return res.status(401).json({ valid: false, message: 'PIN incorreto.' });
    }
  });

  // ================= AUDIT LOGS API =================
  app.get('/api/logs', async (req, res) => {
    if (!db) {
      return res.json(memoryLogs);
    }
    try {
      const list = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));
      if (list.length > 0) {
        memoryLogs = list as any;
        return res.json(list);
      }
      return res.json(memoryLogs);
    } catch (err) {
      console.warn('DB fetch logs failed, returning in-memory logs:', err);
      return res.json(memoryLogs);
    }
  });

  app.post('/api/logs', async (req, res) => {
    const newLog = req.body;
    if (!newLog || !newLog.title || !newLog.category) {
      return res.status(400).json({ error: 'Dados de log inválidos' });
    }

    if (!newLog.id) {
      newLog.id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    }
    if (!newLog.timestamp) {
      newLog.timestamp = new Date().toISOString();
    }
    if (!newLog.severity) {
      newLog.severity = 'info';
    }

    // Keep up to 500 logs in memory
    memoryLogs.unshift(newLog);
    if (memoryLogs.length > 500) {
      memoryLogs = memoryLogs.slice(0, 500);
    }

    if (db) {
      try {
        await db.insert(auditLogs).values({
          ...newLog,
          details: (newLog.details || {}) as any,
        }).onConflictDoNothing();
      } catch (e) {
        console.error('Failed to insert log into DB:', e);
      }
    }

    res.status(201).json(newLog);
  });

  app.delete('/api/logs', async (req, res) => {
    memoryLogs = [];
    if (db) {
      try {
        await db.delete(auditLogs);
      } catch (e) {
        console.error('Failed to clear logs in db:', e);
      }
    }
    res.json({ success: true, message: 'Logs de auditoria limpos com sucesso.' });
  });

  // ================= PRODUCTS API =================
  app.get('/api/products', async (req, res) => {
    if (!db) return res.json(memoryProducts);
    try {
      const list = await db.select().from(products);
      if (list.length > 0) {
        memoryProducts = list as any;
        return res.json(list);
      }
      return res.json(memoryProducts);
    } catch (err) {
      return res.json(memoryProducts);
    }
  });

  app.post('/api/products', async (req, res) => {
    const item = req.body;
    if (!item.id) {
      item.id = 'prod-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }
    const existingIndex = memoryProducts.findIndex((p) => p.id === item.id);
    if (existingIndex >= 0) {
      memoryProducts[existingIndex] = item;
    } else {
      memoryProducts.unshift(item);
    }

    if (db) {
      try {
        await db.insert(products).values(item).onConflictDoUpdate({
          target: products.id,
          set: item,
        });
      } catch (e) {
        console.error('Failed to insert product in db', e);
      }
    }
    res.json(item);
  });

  app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const item = { ...req.body, id };
    const index = memoryProducts.findIndex((p) => p.id === id);
    if (index >= 0) {
      memoryProducts[index] = { ...memoryProducts[index], ...item };
    } else {
      memoryProducts.push(item);
    }

    if (db) {
      try {
        await db.update(products).set(item).where(eq(products.id, id));
      } catch (e) {
        console.error('Failed to update product in db', e);
      }
    }
    res.json(memoryProducts.find((p) => p.id === id) || item);
  });

  app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    memoryProducts = memoryProducts.filter((p) => p.id !== id);

    if (db) {
      try {
        await db.delete(products).where(eq(products.id, id));
      } catch (e) {
        console.error('Failed to delete product in db', e);
      }
    }
    res.json({ success: true, id });
  });

  // ================= ORDERS API =================
  app.get('/api/orders', async (req, res) => {
    const sanitize = (list: any[]) =>
      (list || []).map((o: any) => ({
        ...o,
        items: Array.isArray(o?.items) ? o.items : [],
        payments: Array.isArray(o?.payments) ? o.payments : [],
      }));

    if (!db) return res.json(sanitize(memoryOrders));
    try {
      const list = await db.select().from(orders);
      if (list && list.length > 0) {
        const sanitized = sanitize(list);
        memoryOrders = sanitized as any;
        return res.json(sanitized);
      }
      return res.json(sanitize(memoryOrders));
    } catch (err) {
      return res.json(sanitize(memoryOrders));
    }
  });

  app.post('/api/orders', async (req, res) => {
    const order = { ...req.body };
    if (!order.id) {
      order.id = 'ord-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }
    if (!order.orderNumber) {
      const maxNum = memoryOrders.reduce((max, o) => Math.max(max, o.orderNumber || 0), 100);
      order.orderNumber = maxNum + 1;
    }
    if (!order.createdAt) {
      order.createdAt = new Date().toISOString();
    }
    if (order.total === undefined) {
      const itemsSum = Array.isArray(order.items) 
        ? order.items.reduce((s: number, i: any) => s + (Number(i.product?.price || 0) * Number(i.quantity || 1)), 0)
        : 0;
      order.total = itemsSum;
    }

    const index = memoryOrders.findIndex((o) => o.id === order.id);
    if (index >= 0) {
      memoryOrders[index] = order;
    } else {
      memoryOrders.unshift(order);
    }

    if (db) {
      try {
        await db.insert(orders).values({
          ...order,
          items: order.items as any,
          payments: order.payments as any,
        }).onConflictDoUpdate({
          target: orders.id,
          set: {
            ...order,
            items: order.items as any,
            payments: order.payments as any,
          },
        });
      } catch (e) {
        console.error('Failed to save order in db', e);
      }
    }
    res.json(order);
  });

  app.put('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const order = { ...req.body, id };
    const index = memoryOrders.findIndex((o) => o.id === id);
    if (index >= 0) {
      memoryOrders[index] = { ...memoryOrders[index], ...order };
    } else {
      memoryOrders.unshift(order);
    }

    if (db) {
      try {
        await db.update(orders).set({
          ...order,
          items: order.items as any,
        }).where(eq(orders.id, id));
      } catch (e) {
        console.error('Failed to update order in db', e);
      }
    }
    res.json(memoryOrders.find((o) => o.id === id) || order);
  });

  app.patch('/api/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const index = memoryOrders.findIndex((o) => o.id === id);
    if (index >= 0) {
      memoryOrders[index] = { ...memoryOrders[index], status };
    }

    if (db) {
      try {
        await db.update(orders).set({ status }).where(eq(orders.id, id));
      } catch (e) {
        console.error('Failed to update order status in db', e);
      }
    }
    res.json(memoryOrders.find((o) => o.id === id) || { id, status });
  });

  app.patch('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const partial = req.body;
    const index = memoryOrders.findIndex((o) => o.id === id);
    if (index >= 0) {
      memoryOrders[index] = { ...memoryOrders[index], ...partial };
    }

    if (db) {
      try {
        await db.update(orders).set(partial).where(eq(orders.id, id));
      } catch (e) {
        console.error('Failed to patch order in db', e);
      }
    }
    res.json(memoryOrders.find((o) => o.id === id) || { id, ...partial });
  });

  app.delete('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    memoryOrders = memoryOrders.filter((o) => o.id !== id);

    if (db) {
      try {
        await db.delete(orders).where(eq(orders.id, id));
      } catch (e) {
        console.error('Failed to delete order in db', e);
      }
    }
    res.json({ success: true, id });
  });

  // ================= STOCK API =================
  app.get('/api/stock', async (req, res) => {
    if (!db) return res.json(memoryStock);
    try {
      const list = await db.select().from(stockItems);
      if (list.length > 0) {
        memoryStock = list as any;
        return res.json(list);
      }
      return res.json(memoryStock);
    } catch (err) {
      return res.json(memoryStock);
    }
  });

  app.post('/api/stock', async (req, res) => {
    const item = req.body;
    const index = memoryStock.findIndex((s) => s.id === item.id);
    if (index >= 0) {
      memoryStock[index] = item;
    } else {
      memoryStock.unshift(item);
    }

    if (db) {
      try {
        await db.insert(stockItems).values(item).onConflictDoUpdate({
          target: stockItems.id,
          set: item,
        });
      } catch (e) {
        console.error('Failed to save stock item in db', e);
      }
    }
    res.json(item);
  });

  app.put('/api/stock/:id', async (req, res) => {
    const { id } = req.params;
    const item = req.body;
    const index = memoryStock.findIndex((s) => s.id === id);
    if (index >= 0) {
      memoryStock[index] = { ...memoryStock[index], ...item };
    }

    if (db) {
      try {
        await db.update(stockItems).set(item).where(eq(stockItems.id, id));
      } catch (e) {
        console.error('Failed to update stock in db', e);
      }
    }
    res.json(item);
  });

  app.delete('/api/stock/:id', async (req, res) => {
    const { id } = req.params;
    memoryStock = memoryStock.filter((s) => s.id !== id);

    if (db) {
      try {
        await db.delete(stockItems).where(eq(stockItems.id, id));
      } catch (e) {
        console.error('Failed to delete stock item in db', e);
      }
    }
    res.json({ success: true, id });
  });

  // ================= CASH SHIFT API =================
  app.get('/api/cash-shift', async (req, res) => {
    if (!db) return res.json(memoryCashShift);
    try {
      const list = await db.select().from(cashShifts).where(eq(cashShifts.status, 'aberto'));
      if (list.length > 0) {
        memoryCashShift = list[0] as any;
        return res.json(list[0]);
      }
      return res.json(memoryCashShift);
    } catch (err) {
      return res.json(memoryCashShift);
    }
  });

  app.post('/api/cash-shift', async (req, res) => {
    const shift = req.body;
    memoryCashShift = shift;

    if (db) {
      try {
        await db.insert(cashShifts).values({
          ...shift,
          salesByPaymentMethod: shift.salesByPaymentMethod as any,
        }).onConflictDoUpdate({
          target: cashShifts.id,
          set: {
            ...shift,
            salesByPaymentMethod: shift.salesByPaymentMethod as any,
          },
        });
      } catch (e) {
        console.error('Failed to save cash shift in db', e);
      }
    }
    res.json(shift);
  });

  // Serve Frontend / Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Espetaria Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
