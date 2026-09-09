import React, { useState, useEffect } from 'react';
import { 
  TabType, Product, StockItem, Order, CashShift, OrderStatus, MeatPoint, PaymentMethod, OrderItem, AppUser,
  SystemLog, LogCategory, LogActionType, hasPermission, getTabRequiredPermission, getTabTitle, getDefaultTabForUser,
  SystemModule, MarmitaOrder, MarmitaOrderStatus, MarmitaSizeConfig, MarmitaOption, MarmitaSettings
} from './types';
import { 
  loadProducts, saveProducts, 
  loadStock, saveStock, 
  loadOrders, saveOrders, 
  loadCashShift, saveCashShift,
  loadUsers, saveUsers,
  loadCurrentUser, saveCurrentUser,
  loadAuthSession, saveAuthSession, clearAuthSession,
  loadAuditLogs, saveAuditLogs,
  loadActiveModule, saveActiveModule,
  loadMarmitaOrders, saveMarmitaOrders,
  loadMarmitaOptions, saveMarmitaOptions,
  loadMarmitaSizes, saveMarmitaSizes,
  loadMarmitaSettings, saveMarmitaSettings,
  fetchProductsFromApi, fetchOrdersFromApi, fetchStockFromApi, fetchCashShiftFromApi, fetchUsersFromApi,
  fetchLogsFromApi, syncLogToApi, clearLogsFromApi,
  syncOrderToApi, syncProductToApi, syncStockToApi, deleteStockFromApi, syncCashShiftToApi,
  syncUserToApi, deleteUserFromApi, deleteProductFromApi, deleteOrderFromApi
} from './lib/storage';

import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { CardapioTab } from './components/CardapioTab';
import { PedidosEstoqueTab } from './components/PedidosEstoqueTab';
import { ChurrasqueiraTab } from './components/ChurrasqueiraTab';
import { CaixaTab } from './components/CaixaTab';
import { RelatoriosTab } from './components/RelatoriosTab';
import { UsuariosTab } from './components/UsuariosTab';
import { AuditoriaTab } from './components/AuditoriaTab';
import { MarmitariaTab } from './components/MarmitariaTab';
import { ModuleSelectModal } from './components/ModuleSelectModal';
import { StartupScreen } from './components/StartupScreen';
import { ReceiptModal } from './components/ReceiptModal';
import { AccessDeniedView } from './components/AccessDeniedView';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('caixa');
  const [activeModule, setActiveModule] = useState<SystemModule>(() => loadActiveModule());
  const [isModuleModalOpen, setIsModuleModalOpen] = useState<boolean>(false);
  const [showStartupScreen, setShowStartupScreen] = useState<boolean>(() => {
    // When starting the system, show the choice screen by default unless remembered
    const remembered = localStorage.getItem('gastro_remember_startup_choice') === 'true';
    if (remembered) return false;
    return true;
  });

  // Core app state
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [stock, setStock] = useState<StockItem[]>(() => loadStock());
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const [cashShift, setCashShift] = useState<CashShift>(() => loadCashShift());
  const [users, setUsers] = useState<AppUser[]>(() => loadUsers());
  const [currentUser, setCurrentUser] = useState<AppUser>(() => loadCurrentUser());
  const [logs, setLogs] = useState<SystemLog[]>(() => loadAuditLogs());

  // Marmitaria Module State
  const [marmitaOrders, setMarmitaOrders] = useState<MarmitaOrder[]>(() => loadMarmitaOrders());
  const [marmitaSizes, setMarmitaSizes] = useState<MarmitaSizeConfig[]>(() => loadMarmitaSizes());
  const [marmitaOptions, setMarmitaOptions] = useState<MarmitaOption[]>(() => loadMarmitaOptions());
  const [marmitariaSettings, setMarmitariaSettings] = useState<MarmitaSettings>(() => loadMarmitaSettings());

  // Authentication State: If not authenticated, displays Login Screen
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const session = loadAuthSession();
    return session.isAuthenticated;
  });

  // Receipt Modal State
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Initial fetch from PostgreSQL backend API
  useEffect(() => {
    fetchProductsFromApi().then((apiProds) => {
      if (apiProds && apiProds.length > 0) setProducts(apiProds);
    });
    fetchOrdersFromApi().then((apiOrders) => {
      if (apiOrders && apiOrders.length > 0) setOrders(apiOrders);
    });
    fetchStockFromApi().then((apiStock) => {
      if (apiStock && apiStock.length > 0) setStock(apiStock);
    });
    fetchCashShiftFromApi().then((apiShift) => {
      if (apiShift) setCashShift(apiShift);
    });
    fetchUsersFromApi().then((apiUsers) => {
      if (apiUsers && apiUsers.length > 0) {
        setUsers(apiUsers);
        setCurrentUser((current) => {
          const match = apiUsers.find((u) => u.id === current.id);
          return match || current;
        });
      }
    });
    fetchLogsFromApi().then((apiLogs) => {
      if (apiLogs && apiLogs.length > 0) setLogs(apiLogs);
    });
  }, []);

  // Sync state changes with localStorage
  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveStock(stock);
  }, [stock]);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveCashShift(cashShift);
  }, [cashShift]);

  useEffect(() => {
    saveUsers(users);
  }, [users]);

  useEffect(() => {
    saveCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveAuditLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveActiveModule(activeModule);
  }, [activeModule]);

  useEffect(() => {
    saveMarmitaOrders(marmitaOrders);
  }, [marmitaOrders]);

  useEffect(() => {
    saveMarmitaSizes(marmitaSizes);
  }, [marmitaSizes]);

  useEffect(() => {
    saveMarmitaOptions(marmitaOptions);
  }, [marmitaOptions]);

  useEffect(() => {
    saveMarmitaSettings(marmitariaSettings);
  }, [marmitariaSettings]);

  // Marmitaria Handlers
  const handleSelectModule = (module: SystemModule) => {
    setActiveModule(module);
    saveActiveModule(module);
    if (module === 'marmitaria') {
      setActiveTab('marmitaria');
    } else {
      if (activeTab === 'marmitaria') {
        setActiveTab('caixa');
      }
    }
    addAuditLog(
      'sistema',
      'sistema_backup',
      'Alternância de Módulo do Sistema',
      `Operador "${currentUser.name}" alternou para o módulo ${module === 'marmitaria' ? 'MARMITARIA' : 'ESPETOPRO'}.`,
      'info',
      { module, operator: currentUser.name }
    );
  };

  const handleStartupSelectSystem = (module: SystemModule, rememberChoice: boolean) => {
    if (rememberChoice) {
      localStorage.setItem('gastro_remember_startup_choice', 'true');
    } else {
      localStorage.removeItem('gastro_remember_startup_choice');
    }
    handleSelectModule(module);
    setShowStartupScreen(false);
  };

  const handleCreateMarmitaOrder = (newOrder: MarmitaOrder) => {
    setMarmitaOrders((prev) => [newOrder, ...prev]);
    addAuditLog(
      'pedidos',
      'pedido_criado',
      `Novo Pedido de Marmitaria (#${newOrder.orderNumber})`,
      `Pedido #${newOrder.orderNumber} (${newOrder.customerName || 'Balcão'}) no valor de R$ ${newOrder.total.toFixed(2)}.`,
      'success',
      { orderNumber: newOrder.orderNumber, total: newOrder.total, type: newOrder.deliveryType }
    );
  };

  const handleUpdateMarmitaStatus = (orderId: string, status: MarmitaOrderStatus, motoboyName?: string) => {
    setMarmitaOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status, motoboyName: motoboyName ?? ord.motoboyName } : ord))
    );
    const ord = marmitaOrders.find((o) => o.id === orderId);
    if (ord) {
      addAuditLog(
        'pedidos',
        'pedido_atualizado',
        `Marmita #${ord.orderNumber} Status: ${status.toUpperCase()}`,
        `Pedido de marmita #${ord.orderNumber} atualizado para status "${status.toUpperCase()}".`,
        'info',
        { orderId, orderNumber: ord.orderNumber, newStatus: status, motoboy: motoboyName }
      );
    }
  };

  const handleUpdateMarmitaOrder = (updatedOrder: MarmitaOrder) => {
    setMarmitaOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    addAuditLog(
      'pedidos',
      'pedido_atualizado',
      `Marmita #${updatedOrder.orderNumber} Atualizada`,
      `Pedido #${updatedOrder.orderNumber} alterado no painel.`,
      'info'
    );
  };

  const handleDeleteMarmitaOrder = (orderId: string) => {
    setMarmitaOrders((prev) => prev.filter((o) => o.id !== orderId));
    addAuditLog(
      'pedidos',
      'pedido_cancelado',
      'Pedido de Marmita Removido',
      `Pedido ${orderId} foi removido do sistema.`,
      'warning'
    );
  };

  const handleUpdateMarmitaSizes = (sizes: MarmitaSizeConfig[]) => {
    setMarmitaSizes(sizes);
    saveMarmitaSizes(sizes);
  };

  const handleUpdateMarmitaOptions = (options: MarmitaOption[]) => {
    setMarmitaOptions(options);
    saveMarmitaOptions(options);
  };

  const handleUpdateMarmitaSettings = (settings: MarmitaSettings) => {
    setMarmitariaSettings(settings);
    saveMarmitaSettings(settings);
  };

  // Helper to record an audit log
  const addAuditLog = (
    category: LogCategory,
    actionType: LogActionType,
    title: string,
    description: string,
    severity: 'info' | 'warning' | 'success' | 'danger' = 'info',
    details: Record<string, any> = {}
  ) => {
    const newLog: SystemLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      category,
      actionType,
      title,
      description,
      userName: currentUser.name,
      userRole: currentUser.role,
      userAvatar: currentUser.avatar,
      severity,
      details,
      ipAddress: 'Terminal Local'
    };
    setLogs((prev) => [newLog, ...prev]);
    syncLogToApi(newLog);
  };

  // User & Permissions Handlers
  const handleAddUser = (newUserData: Omit<AppUser, 'id' | 'createdAt'>) => {
    const newUser: AppUser = {
      ...newUserData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [newUser, ...prev]);
    syncUserToApi(newUser);
    addAuditLog(
      'usuarios',
      'usuario_criado',
      'Novo Usuário Cadastrado',
      `Colaborador "${newUser.name}" cadastrado com perfil ${newUser.role.toUpperCase()}.`,
      'info',
      { targetName: newUser.name, role: newUser.role, email: newUser.email }
    );
  };

  const handleUpdateUser = (updatedUser: AppUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    syncUserToApi(updatedUser);
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    addAuditLog(
      'usuarios',
      'usuario_editado',
      'Usuário e Permissões Atualizados',
      `Cadastro do colaborador "${updatedUser.name}" (${updatedUser.role}) atualizado.`,
      'warning',
      { targetName: updatedUser.name, role: updatedUser.role, status: updatedUser.status }
    );
  };

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteUserFromApi(userId);
    if (targetUser) {
      addAuditLog(
        'usuarios',
        'usuario_excluido',
        'Usuário Excluído',
        `Colaborador "${targetUser.name}" (${targetUser.role}) foi removido do sistema.`,
        'danger',
        { targetName: targetUser.name, role: targetUser.role }
      );
    }
  };

  // Authentication and Session Handlers
  const handleLoginSuccess = (user: AppUser, rememberMe: boolean) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    saveCurrentUser(user);
    saveAuthSession({ isAuthenticated: true, userId: user.id, rememberMe });

    // Set starting tab matching user's permissions
    const defaultTab = getDefaultTabForUser(user);
    const currentTabReq = getTabRequiredPermission(activeTab);
    if (currentTabReq && !hasPermission(user, currentTabReq)) {
      setActiveTab(defaultTab);
    }

    const nowFormatted = `Hoje, às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const updatedUser: AppUser = {
      ...user,
      lastLogin: nowFormatted,
    };
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    syncUserToApi(updatedUser);

    addAuditLog(
      'login',
      'login_sucesso',
      'Login Realizado com Sucesso',
      `Operador "${user.name}" (${user.role.toUpperCase()}) autenticou-se no terminal.`,
      'success',
      { operator: user.name, role: user.role, email: user.email }
    );
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    clearAuthSession();
    setShowStartupScreen(true);
    addAuditLog(
      'login',
      'troca_operador',
      'Terminal Bloqueado / Logout',
      `Operador "${currentUser.name}" encerrou a sessão no terminal.`,
      'info',
      { operator: currentUser.name, role: currentUser.role }
    );
  };

  const handleLogFailedAttempt = (attemptedEmail: string, reason: string) => {
    addAuditLog(
      'login',
      'login_falha',
      'Tentativa de Login Falhou',
      `Tentativa de acesso para "${attemptedEmail}" rejeitada. Motivo: ${reason}.`,
      'danger',
      { attemptedEmail, reason }
    );
  };

  const handleSwitchCurrentUser = (newUser: AppUser) => {
    const freshUser = users.find((u) => u.id === newUser.id) || newUser;
    setCurrentUser(freshUser);
    saveCurrentUser(freshUser);
    saveAuthSession({ isAuthenticated: true, userId: freshUser.id, rememberMe: true });
    
    // Check if new user has access to currently selected tab, else route to their default
    const reqPerm = getTabRequiredPermission(activeTab);
    if (reqPerm && !hasPermission(freshUser, reqPerm)) {
      setActiveTab(getDefaultTabForUser(freshUser));
    }

    // Optionally update the cash shift operator name if it is open
    setCashShift((prev) => ({
      ...prev,
      operatorName: `${freshUser.name} (${freshUser.role})`,
    }));
    addAuditLog(
      'login',
      'troca_operador',
      'Login / Troca de Operador',
      `Sessão ativa alterada para "${freshUser.name}" (${freshUser.role.toUpperCase()}).`,
      'success',
      { operator: freshUser.name, role: freshUser.role }
    );
  };

  // Product Handlers
  const handleAddProduct = (newProdData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProdData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
    syncProductToApi(newProduct);
    addAuditLog(
      'cardapio',
      'produto_criado',
      'Novo Item Adicionado ao Cardápio',
      `Produto "${newProduct.name}" cadastrado por R$ ${newProduct.price.toFixed(2).replace('.', ',')} na categoria "${newProduct.category}".`,
      'success',
      {
        targetName: newProduct.name,
        targetId: newProduct.id,
        price: newProduct.price,
        category: newProduct.category,
      }
    );
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const previousProd = products.find((p) => p.id === updatedProduct.id);
    let desc = `Produto "${updatedProduct.name}" atualizado no cardápio.`;
    let sev: 'info' | 'warning' = 'info';

    if (previousProd && previousProd.price !== updatedProduct.price) {
      const diff = updatedProduct.price - previousProd.price;
      const diffStr = diff > 0 ? `+R$ ${diff.toFixed(2)}` : `-R$ ${Math.abs(diff).toFixed(2)}`;
      desc = `Preço do produto "${updatedProduct.name}" alterado de R$ ${previousProd.price.toFixed(2).replace('.', ',')} para R$ ${updatedProduct.price.toFixed(2).replace('.', ',')} (${diffStr}).`;
      sev = 'warning';
    } else if (previousProd && previousProd.isAvailable !== updatedProduct.isAvailable) {
      desc = `Disponibilidade do item "${updatedProduct.name}" alterada para: ${updatedProduct.isAvailable ? 'DISPONÍVEL' : 'PAUSADO/ESGOTADO'}.`;
      sev = 'warning';
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    syncProductToApi(updatedProduct);

    addAuditLog(
      'cardapio',
      'produto_editado',
      'Item do Cardápio Modificado',
      desc,
      sev,
      {
        targetName: updatedProduct.name,
        targetId: updatedProduct.id,
        previousValue: previousProd ? `R$ ${previousProd.price.toFixed(2).replace('.', ',')}` : undefined,
        newValue: `R$ ${updatedProduct.price.toFixed(2).replace('.', ',')}`,
        available: updatedProduct.isAvailable,
      }
    );
  };

  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    deleteProductFromApi(productId);

    if (target) {
      addAuditLog(
        'cardapio',
        'produto_excluido',
        'Item Excluído do Cardápio',
        `Produto "${target.name}" (R$ ${target.price.toFixed(2).replace('.', ',')}) foi excluído do cardápio.`,
        'danger',
        { targetName: target.name, targetId: productId, price: target.price }
      );
    }
  };

  // Stock Handlers
  const handleRestockItem = (stockId: string, addedQty: number) => {
    const item = stock.find((s) => s.id === stockId);
    setStock((prev) =>
      prev.map((it) => {
        if (it.id === stockId) {
          const updated = {
            ...it,
            currentQty: it.currentQty + addedQty,
            lastRestocked: new Date().toISOString().split('T')[0],
          };
          syncStockToApi(updated);
          return updated;
        }
        return it;
      })
    );

    if (item) {
      addAuditLog(
        'estoque',
        'estoque_entrada',
        'Entrada de Mercadoria no Estoque',
        `Adicionadas +${addedQty} ${item.unit} ao insumo "${item.name}" (Estoque anterior: ${item.currentQty} ➔ Novo: ${item.currentQty + addedQty}).`,
        'info',
        {
          targetName: item.name,
          addedQty,
          previousValue: `${item.currentQty} ${item.unit}`,
          newValue: `${item.currentQty + addedQty} ${item.unit}`,
        }
      );
    }
  };

  const handleDeductStockItem = (stockId: string, deductedQty: number, reason: string) => {
    const item = stock.find((s) => s.id === stockId);
    setStock((prev) =>
      prev.map((it) => {
        if (it.id === stockId) {
          const updated = {
            ...it,
            currentQty: Math.max(0, it.currentQty - deductedQty),
          };
          syncStockToApi(updated);
          return updated;
        }
        return it;
      })
    );

    if (item) {
      addAuditLog(
        'estoque',
        'estoque_ajustado',
        'Baixa / Ajuste Manual de Estoque',
        `Baixa de -${deductedQty} ${item.unit} no item "${item.name}". Motivo: ${reason}.`,
        'warning',
        {
          targetName: item.name,
          deductedQty,
          reason,
          newValue: `${Math.max(0, item.currentQty - deductedQty)} ${item.unit}`,
        }
      );
    }
  };

  const handleAddStockItem = (newItemData: Omit<StockItem, 'id' | 'lastRestocked'>) => {
    const newItem: StockItem = {
      ...newItemData,
      id: `stk-${Date.now()}`,
      lastRestocked: new Date().toISOString().split('T')[0],
    };
    setStock((prev) => [newItem, ...prev]);
    syncStockToApi(newItem);
    addAuditLog(
      'estoque',
      'estoque_entrada',
      'Novo Insumo Cadastrado no Estoque',
      `Insumo "${newItem.name}" cadastrado com ${newItem.currentQty} ${newItem.unit} (Mín: ${newItem.minQty}).`,
      'info',
      { targetName: newItem.name, unit: newItem.unit, currentQty: newItem.currentQty }
    );
  };

  const handleUpdateStockItem = (updatedItem: StockItem) => {
    setStock((prev) =>
      prev.map((item) => {
        if (item.id === updatedItem.id) {
          syncStockToApi(updatedItem);
          return updatedItem;
        }
        return item;
      })
    );
    addAuditLog(
      'estoque',
      'estoque_ajustado',
      'Insumo de Estoque Atualizado',
      `Dados do item "${updatedItem.name}" atualizados no controle de estoque.`,
      'info',
      { targetName: updatedItem.name, currentQty: updatedItem.currentQty, minQty: updatedItem.minQty }
    );
  };

  const handleDeleteStockItem = (stockId: string) => {
    const item = stock.find((s) => s.id === stockId);
    setStock((prev) => prev.filter((it) => it.id !== stockId));
    deleteStockFromApi(stockId);
    if (item) {
      addAuditLog(
        'estoque',
        'estoque_excluido',
        'Insumo Removido do Estoque',
        `O item de estoque "${item.name}" foi excluído.`,
        'danger',
        { targetName: item.name }
      );
    }
  };

  const handleSyncStockFromProducts = () => {
    setStock((prevStock) => {
      const existingNames: string[] = prevStock.map((s) => s.name.toLowerCase().trim());
      const newItems: StockItem[] = [];

      products.forEach((prod) => {
        const prodNameLower = prod.name.toLowerCase().trim();
        const hasMatch = existingNames.some(
          (name) => name.includes(prodNameLower) || prodNameLower.includes(name)
        );

        if (!hasMatch) {
          const category = prod.category === 'bebidas' ? 'Bebida' : 'Comida';
          const newItem: StockItem = {
            id: `stk-prod-${prod.id}`,
            name: prod.name,
            category,
            currentQty: prod.stockQty || 30,
            minQty: 10,
            unit: prod.unit || 'unid',
            costPrice: prod.costPrice || 5.00,
            supplier: 'Fornecedor Local',
            lastRestocked: new Date().toISOString().split('T')[0],
          };
          newItems.push(newItem);
          syncStockToApi(newItem);
        }
      });

      if (newItems.length === 0) {
        alert('O estoque já possui todos os produtos do cardápio sincronizados!');
        return prevStock;
      }

      alert(`Sincronização concluída! ${newItems.length} novo(s) produto(s) do cardápio foram adicionados ao estoque.`);
      return [...newItems, ...prevStock];
    });
  };

  const handleUpdateStockMinQty = (stockId: string, minQty: number) => {
    setStock((prev) =>
      prev.map((item) => {
        if (item.id === stockId) {
          const updated = { ...item, minQty: Math.max(0, minQty) };
          syncStockToApi(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const handleBatchUpdateStockMinQty = (minQty: number, categoryFilter?: string) => {
    setStock((prev) =>
      prev.map((item) => {
        if (!categoryFilter || categoryFilter === 'todos') {
          const updated = { ...item, minQty: Math.max(0, minQty) };
          syncStockToApi(updated);
          return updated;
        }
        // Match category normalizer
        const catLower = (item.category || '').toLowerCase();
        const filterLower = categoryFilter.toLowerCase();
        let matches = false;
        if (filterLower === 'bebida' && (catLower.includes('bebida') || catLower.includes('cerveja') || catLower.includes('refrigerante'))) {
          matches = true;
        } else if (filterLower === 'comida' && (catLower.includes('comida') || catLower.includes('carne') || catLower.includes('espeto') || catLower.includes('queijo') || catLower.includes('pão'))) {
          matches = true;
        } else if (filterLower === 'diversos' && !catLower.includes('bebida') && !catLower.includes('comida') && !catLower.includes('carne') && !catLower.includes('espeto')) {
          matches = true;
        } else if (catLower.includes(filterLower)) {
          matches = true;
        }

        if (matches) {
          const updated = { ...item, minQty: Math.max(0, minQty) };
          syncStockToApi(updated);
          return updated;
        }
        return item;
      })
    );
  };

  // Order Handlers
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          // If order is updated, update item statuses if appropriate
          const updatedItems = ord.items.map((item) => {
            if (newStatus === 'na_churrasqueira' && item.status === 'aguardando') {
              return { ...item, status: 'na_grelha' as const };
            }
            if (newStatus === 'pronto' && item.status !== 'entregue') {
              return { ...item, status: 'pronto' as const };
            }
            if (newStatus === 'entregue') {
              return { ...item, status: 'entregue' as const };
            }
            return item;
          });

          const updatedOrder = {
            ...ord,
            status: newStatus,
            items: updatedItems,
            updatedAt: new Date().toISOString(),
          };
          syncOrderToApi(updatedOrder);
          return updatedOrder;
        }
        return ord;
      })
    );
  };

  const handleUpdateOrderItemStatus = (
    orderId: string,
    itemId: string,
    nextStatus: 'aguardando' | 'na_grelha' | 'pronto' | 'entregue'
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updatedItems = ord.items.map((item) =>
            item.id === itemId ? { ...item, status: nextStatus } : item
          );

          // Calculate overall order status based on item statuses
          const allPronto = updatedItems.every((i) => i.status === 'pronto' || i.status === 'entregue');
          const anyInGrill = updatedItems.some((i) => i.status === 'na_grelha');

          let overallStatus = ord.status;
          if (allPronto) {
            overallStatus = 'pronto';
          } else if (anyInGrill) {
            overallStatus = 'na_churrasqueira';
          }

          const updatedOrder = {
            ...ord,
            items: updatedItems,
            status: overallStatus,
            updatedAt: new Date().toISOString(),
          };
          syncOrderToApi(updatedOrder);
          return updatedOrder;
        }
        return ord;
      })
    );
  };

  // POS Create Order Handler
  const handleCreateOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    const nextOrderNumber = orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber)) + 1 : 101;

    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: nextOrderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    syncOrderToApi(newOrder);

    // Update Cash shift totals (only if order is paid)
    if (orderData.paymentMethod && orderData.isPaid) {
      setCashShift((prevShift) => {
        const method = orderData.paymentMethod!;
        const currentByMethod = prevShift.salesByPaymentMethod[method] || 0;

        const updatedShift = {
          ...prevShift,
          totalSales: prevShift.totalSales + orderData.total,
          salesByPaymentMethod: {
            ...prevShift.salesByPaymentMethod,
            [method]: currentByMethod + orderData.total,
          },
        };
        syncCashShiftToApi(updatedShift);
        return updatedShift;
      });
    }

    // Automatically deduct stock for ordered items
    orderData.items.forEach((item) => {
      setProducts((prevProds) =>
        prevProds.map((p) => {
          if (p.id === item.productId) {
            const updatedP = { ...p, stockQty: Math.max(0, p.stockQty - item.quantity) };
            syncProductToApi(updatedP);
            return updatedP;
          }
          return p;
        })
      );
    });

    // Automatically pop receipt preview modal ONLY if order is paid at cashier front
    if (newOrder.isPaid) {
      setReceiptOrder(newOrder);
    }

    addAuditLog(
      'pedidos',
      'pedido_criado',
      `Novo Pedido #${newOrder.orderNumber}`,
      `Pedido para "${newOrder.tableOrCustomer}" registrado com ${newOrder.items.length} itens (Total: R$ ${newOrder.total.toFixed(2).replace('.', ',')}${newOrder.isPaid ? ` - Pago via ${newOrder.paymentMethod?.toUpperCase()}` : ' - Em Aberto'}).`,
      newOrder.isPaid ? 'success' : 'info',
      {
        orderNumber: newOrder.orderNumber,
        tableOrCustomer: newOrder.tableOrCustomer,
        total: newOrder.total,
        itemCount: newOrder.items.length,
        isPaid: newOrder.isPaid,
        paymentMethod: newOrder.paymentMethod
      }
    );
  };

  // Pay all unpaid orders registered for a table
  const handlePayTableOrders = (
    tableOrCustomer: string,
    paymentMethod: PaymentMethod,
    extraCartItems: OrderItem[] = [],
    discount: number = 0,
    includeServiceFee: boolean = true
  ) => {
    // 1. Get all unpaid orders for this table
    const unpaidTableOrders = orders.filter(
      (o) => o.tableOrCustomer === tableOrCustomer && !o.isPaid && o.status !== 'cancelado'
    );

    let totalCollected = 0;

    // 2. Mark all existing unpaid orders for this table as paid and delivered
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.tableOrCustomer === tableOrCustomer && !ord.isPaid && ord.status !== 'cancelado') {
          const updated = {
            ...ord,
            isPaid: true,
            paymentMethod,
            status: 'entregue' as const,
            items: ord.items.map((i) => ({ ...i, status: 'entregue' as const })),
            updatedAt: new Date().toISOString(),
          };
          syncOrderToApi(updated);
          totalCollected += ord.total;
          return updated;
        }
        return ord;
      })
    );

    // 3. Create a new paid order if extra items were added directly in POS cart
    let newOrderForReceipt: Order | null = null;
    if (extraCartItems.length > 0) {
      const nextOrderNumber = orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber)) + 1 : 101;
      const subtotal = extraCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const serviceFee = includeServiceFee ? subtotal * 0.10 : 0;
      const total = Math.max(0, subtotal + serviceFee - discount);
      totalCollected += total;

      newOrderForReceipt = {
        id: `ord-${Date.now()}`,
        orderNumber: nextOrderNumber,
        tableOrCustomer,
        items: extraCartItems,
        status: 'entregue',
        subtotal,
        discount,
        serviceFee,
        total,
        paymentMethod,
        isPaid: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setOrders((prev) => [newOrderForReceipt!, ...prev]);
      syncOrderToApi(newOrderForReceipt!);

      // Deduct stock for new items
      extraCartItems.forEach((item) => {
        setProducts((prevProds) =>
          prevProds.map((p) => {
            if (p.id === item.productId) {
              const updatedP = { ...p, stockQty: Math.max(0, p.stockQty - item.quantity) };
              syncProductToApi(updatedP);
              return updatedP;
            }
            return p;
          })
        );
      });
    }

    // 4. Update Cash shift totals with totalCollected
    if (totalCollected > 0 && paymentMethod) {
      setCashShift((prevShift) => {
        const currentByMethod = prevShift.salesByPaymentMethod[paymentMethod] || 0;
        const updatedShift = {
          ...prevShift,
          totalSales: prevShift.totalSales + totalCollected,
          salesByPaymentMethod: {
            ...prevShift.salesByPaymentMethod,
            [paymentMethod]: currentByMethod + totalCollected,
          },
        };
        syncCashShiftToApi(updatedShift);
        return updatedShift;
      });
    }

    // 5. Generate a consolidated receipt for printing
    const combinedItems = [
      ...unpaidTableOrders.flatMap((o) => o.items),
      ...extraCartItems,
    ];

    const consolidatedSubtotal = unpaidTableOrders.reduce((sum, o) => sum + o.subtotal, 0) + (extraCartItems.reduce((sum, i) => sum + i.price * i.quantity, 0));
    const consolidatedServiceFee = unpaidTableOrders.reduce((sum, o) => sum + o.serviceFee, 0) + (includeServiceFee && extraCartItems.length > 0 ? extraCartItems.reduce((sum, i) => sum + i.price * i.quantity, 0) * 0.1 : 0);
    const consolidatedDiscount = unpaidTableOrders.reduce((sum, o) => sum + o.discount, 0) + discount;

    const consolidatedOrder: Order = {
      id: `receipt-${Date.now()}`,
      orderNumber: unpaidTableOrders[0]?.orderNumber || (newOrderForReceipt ? newOrderForReceipt.orderNumber : 100),
      tableOrCustomer,
      items: combinedItems,
      status: 'entregue',
      subtotal: consolidatedSubtotal,
      discount: consolidatedDiscount,
      serviceFee: consolidatedServiceFee,
      total: totalCollected,
      paymentMethod,
      isPaid: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setReceiptOrder(consolidatedOrder);

    addAuditLog(
      'pedidos',
      'pedido_pago',
      `Comanda Paga: ${tableOrCustomer}`,
      `Pagamento recebido no valor de R$ ${totalCollected.toFixed(2).replace('.', ',')} via ${paymentMethod.toUpperCase()} (${combinedItems.length} itens).`,
      'success',
      {
        tableOrCustomer,
        total: totalCollected,
        paymentMethod,
        itemCount: combinedItems.length
      }
    );
  };

  // Cashier Shift Handlers
  const handleOpenShift = (operatorName: string, initialFloat: number) => {
    const newShift: CashShift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      operatorName,
      initialFloat,
      salesByPaymentMethod: { pix: 0, credito: 0, debito: 0, dinheiro: 0 },
      totalSales: 0,
      status: 'aberto',
    };
    setCashShift(newShift);
    syncCashShiftToApi(newShift);
    addAuditLog(
      'caixa',
      'caixa_aberto',
      'Abertura de Turno do Caixa',
      `Caixa aberto por "${operatorName}" com fundo de troco inicial de R$ ${initialFloat.toFixed(2).replace('.', ',')}.`,
      'success',
      { operatorName, initialFloat }
    );
  };

  const handleCloseShift = (finalCashInHand: number) => {
    setCashShift((prev) => {
      const closed = {
        ...prev,
        closedAt: new Date().toISOString(),
        status: 'fechado' as const,
      };
      syncCashShiftToApi(closed);
      return closed;
    });
    addAuditLog(
      'caixa',
      'caixa_fechado',
      'Fechamento de Turno do Caixa',
      `Turno de caixa encerrado por "${cashShift.operatorName}". Total de vendas no turno: R$ ${cashShift.totalSales.toFixed(2).replace('.', ',')}.`,
      'warning',
      { operatorName: cashShift.operatorName, totalSales: cashShift.totalSales, finalCashInHand }
    );
  };

  // Metric counts for Navbar
  const activeOrdersCount = orders.filter(
    (o) => o.status === 'novo' || o.status === 'na_churrasqueira' || o.status === 'pronto'
  ).length;

  // Helper function to check if item is a drink
  const isDrinkItem = (item: OrderItem) => {
    if (item.category === 'bebidas') return true;
    const product = products.find((p) => p.id === item.productId);
    if (product && product.category === 'bebidas') return true;
    const nameLower = (item.productName || '').toLowerCase();
    return (
      nameLower.includes('cerveja') ||
      nameLower.includes('coca') ||
      nameLower.includes('refrigerante') ||
      nameLower.includes('suco') ||
      nameLower.includes('água') ||
      nameLower.includes('agua') ||
      nameLower.includes('bebida') ||
      nameLower.includes('guaraná') ||
      nameLower.includes('guarana') ||
      nameLower.includes('chopp') ||
      nameLower.includes('heineken') ||
      nameLower.includes('long neck') ||
      nameLower.includes('skol') ||
      nameLower.includes('brahma') ||
      nameLower.includes('amstel') ||
      nameLower.includes('eisenbahn') ||
      nameLower.includes('red bull') ||
      nameLower.includes('monster') ||
      nameLower.includes('vodka') ||
      nameLower.includes('gin') ||
      nameLower.includes('whisky') ||
      nameLower.includes('pinga') ||
      nameLower.includes('cachaça') ||
      nameLower.includes('caipirinha') ||
      nameLower.includes('soda') ||
      nameLower.includes('fanta') ||
      nameLower.includes('tônica') ||
      nameLower.includes('tonica') ||
      nameLower.includes('sprite') ||
      nameLower.includes('lata')
    );
  };

  const grillItemsCount = orders
    .filter((o) => o.status !== 'entregue' && o.status !== 'cancelado')
    .reduce((count, ord) => {
      const grillingItems = ord.items.filter(
        (i) => (i.status === 'na_grelha' || i.status === 'aguardando') && !isDrinkItem(i)
      );
      return count + grillingItems.reduce((s, i) => s + i.quantity, 0);
    }, 0);

  const todaySalesTotal = cashShift.totalSales;

  // Active Marmitaria Orders Count
  const activeMarmitasCount = marmitaOrders.filter(
    (o) => o.status === 'pendente' || o.status === 'em_montagem' || o.status === 'pronto'
  ).length;

  // Render dedicated Startup Screen when system starts or requested by operator
  if (showStartupScreen) {
    return (
      <StartupScreen
        currentUser={currentUser}
        activeOrdersCount={activeOrdersCount}
        marmitaOrdersCount={activeMarmitasCount}
        onSelectSystem={handleStartupSelectSystem}
        onLogout={isAuthenticated ? handleLogout : undefined}
      />
    );
  }

  // Render dedicated Login Screen when user is not authenticated
  if (!isAuthenticated) {
    return (
      <LoginScreen
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onLogFailedAttempt={handleLogFailedAttempt}
        currentModule={activeModule}
        onSelectModule={handleSelectModule}
        onBackToStartup={() => setShowStartupScreen(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans antialiased selection:bg-amber-500 selection:text-slate-950 flex flex-col">
      {/* Top Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cashShift={cashShift}
        currentUser={currentUser}
        users={users}
        onSwitchCurrentUser={handleSwitchCurrentUser}
        activeOrdersCount={activeOrdersCount}
        grillItemsCount={grillItemsCount}
        todaySalesTotal={todaySalesTotal}
        onOpenCashModal={() => setActiveTab('caixa')}
        onLogout={handleLogout}
        currentModule={activeModule}
        onSelectModule={handleSelectModule}
        marmitaOrdersCount={activeMarmitasCount}
        onOpenModuleSelectModal={() => setShowStartupScreen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-20 sm:pb-8">
        {/* Permission Gate Checker */}
        {(() => {
          const requiredPerm = getTabRequiredPermission(activeTab);
          if (requiredPerm && !hasPermission(currentUser, requiredPerm)) {
            return (
              <AccessDeniedView
                currentUser={currentUser}
                requiredPermission={requiredPerm}
                tabTitle={getTabTitle(activeTab)}
                onNavigateToDefaultTab={() => setActiveTab(getDefaultTabForUser(currentUser))}
                onLogout={handleLogout}
                users={users}
                onAuthorizeSupervisor={(supervisor) => handleSwitchCurrentUser(supervisor)}
              />
            );
          }

          return (
            <>
              {/* Tab 0: Marmitaria (Marmitex, KDS, Cardápio do dia, Pedidos Delivery & Balcão) */}
              {activeTab === 'marmitaria' && (
                <MarmitariaTab
                  currentUser={currentUser}
                  sizes={marmitaSizes}
                  options={marmitaOptions}
                  orders={marmitaOrders}
                  settings={marmitariaSettings}
                  onUpdateSizes={handleUpdateMarmitaSizes}
                  onUpdateOptions={handleUpdateMarmitaOptions}
                  onCreateOrder={handleCreateMarmitaOrder}
                  onUpdateOrderStatus={handleUpdateMarmitaStatus}
                  onUpdateOrder={handleUpdateMarmitaOrder}
                  onDeleteOrder={handleDeleteMarmitaOrder}
                  onUpdateSettings={handleUpdateMarmitaSettings}
                  onSwitchToEspetos={() => {
                    handleSelectModule('espetos');
                    setActiveTab('caixa');
                  }}
                />
              )}

              {/* Tab 1: Frente de Caixa (POS) */}
              {activeTab === 'caixa' && (
                <CaixaTab
                  products={products}
                  orders={orders}
                  cashShift={cashShift}
                  currentUser={currentUser}
                  onOpenShift={handleOpenShift}
                  onCloseShift={handleCloseShift}
                  onCreateOrder={handleCreateOrder}
                  onPayTableOrders={handlePayTableOrders}
                  onPrintReceipt={(ord) => setReceiptOrder(ord)}
                />
              )}

              {/* Tab 2: Pedidos */}
              {(activeTab === 'pedidos' || activeTab === 'pedidos_estoque') && (
                <PedidosEstoqueTab
                  initialSubTab="pedidos"
                  orders={orders}
                  stock={stock}
                  products={products}
                  currentUser={currentUser}
                  onCreateOrder={handleCreateOrder}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onPrintReceipt={(ord) => setReceiptOrder(ord)}
                  onRestockItem={handleRestockItem}
                  onDeductStockItem={handleDeductStockItem}
                  onAddStockItem={handleAddStockItem}
                  onUpdateStockItem={handleUpdateStockItem}
                  onDeleteStockItem={handleDeleteStockItem}
                  onSyncStockFromProducts={handleSyncStockFromProducts}
                />
              )}

              {/* Tab 3: Churrasqueira e Cozinha (KDS) */}
              {activeTab === 'churrasqueira' && (
                <ChurrasqueiraTab
                  orders={orders}
                  products={products}
                  onUpdateItemStatus={handleUpdateOrderItemStatus}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                />
              )}

              {/* Tab 4: Cardápio */}
              {activeTab === 'cardapio' && (
                <CardapioTab
                  products={products}
                  currentUser={currentUser}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onCreateOrder={handleCreateOrder}
                />
              )}

              {/* Tab 5: Estoque */}
              {activeTab === 'estoque' && (
                <PedidosEstoqueTab
                  initialSubTab="estoque"
                  orders={orders}
                  stock={stock}
                  products={products}
                  currentUser={currentUser}
                  onCreateOrder={handleCreateOrder}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onPrintReceipt={(ord) => setReceiptOrder(ord)}
                  onRestockItem={handleRestockItem}
                  onDeductStockItem={handleDeductStockItem}
                  onAddStockItem={handleAddStockItem}
                  onUpdateStockItem={handleUpdateStockItem}
                  onDeleteStockItem={handleDeleteStockItem}
                  onSyncStockFromProducts={handleSyncStockFromProducts}
                />
              )}

              {/* Tab 6: Relatórios de Vendas & Qual Vende Mais */}
              {activeTab === 'relatorios' && (
                <RelatoriosTab
                  orders={orders}
                  products={products}
                />
              )}

              {/* Tab 7: Gestão de Usuários & Permissões */}
              {activeTab === 'usuarios' && (
                <UsuariosTab
                  users={users}
                  currentUser={currentUser}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onSwitchCurrentUser={handleSwitchCurrentUser}
                />
              )}

              {/* Tab 8: Auditoria & Histórico de Atividades */}
              {activeTab === 'auditoria' && (
                <AuditoriaTab
                  logs={logs}
                  currentUser={currentUser}
                  onClearLogs={() => {
                    setLogs([]);
                    clearLogsFromApi();
                  }}
                  onAddCustomLog={(logData) => {
                    addAuditLog(
                      logData.category || 'sistema',
                      logData.actionType || 'sistema_backup',
                      logData.title || 'Registro Manual',
                      logData.description || 'Evento registrado manualmente no painel.',
                      logData.severity || 'info',
                      logData.details || {}
                    );
                  }}
                  onRefreshLogs={() => {
                    fetchLogsFromApi().then((apiLogs) => {
                      if (apiLogs && apiLogs.length > 0) setLogs(apiLogs);
                    });
                  }}
                />
              )}
            </>
          );
        })()}
      </main>

      {/* Module Selection Modal */}
      <ModuleSelectModal
        isOpen={isModuleModalOpen}
        onClose={() => setIsModuleModalOpen(false)}
        currentUser={currentUser}
        activeModule={activeModule}
        onSelectModule={handleSelectModule}
        marmitaOrdersCount={activeMarmitasCount}
        espetoOrdersCount={activeOrdersCount}
      />

      {/* Thermal Receipt Modal (Espetos) */}
      <ReceiptModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />
    </div>
  );
}
