import { Product, StockItem, Order, CashShift, AppUser, SystemLog, DEFAULT_ROLE_PERMISSIONS, MarmitaOption, MarmitaSizeConfig, MarmitaOrder, MarmitaSettings, SystemModule, SystemPermission, UserRole } from '../types';
import { INITIAL_PRODUCTS, INITIAL_STOCK, INITIAL_ORDERS, INITIAL_CASH_SHIFT, INITIAL_USERS, INITIAL_LOGS } from '../data/mockData';
import { INITIAL_MARMITA_OPTIONS, INITIAL_MARMITA_SIZES, INITIAL_MARMITA_ORDERS, INITIAL_MARMITA_SETTINGS } from '../data/marmitariaData';

const KEYS = {
  PRODUCTS: 'maresia_products_v2',
  STOCK: 'espetinho_stock_v1',
  ORDERS: 'espetinho_orders_v1',
  CASH_SHIFT: 'espetinho_cash_shift_v1',
  CASH_HISTORY: 'espetinho_cash_history_v1',
  USERS: 'espetinho_users_v1',
  CURRENT_USER: 'espetinho_current_user_v1',
  AUTH_SESSION: 'espetinho_auth_session_v1',
  LOGS: 'espetinho_audit_logs_v1',
  MARMITA_OPTIONS: 'espetinho_marmita_options_v1',
  MARMITA_SIZES: 'espetinho_marmita_sizes_v1',
  MARMITA_ORDERS: 'espetinho_marmita_orders_v1',
  MARMITA_SETTINGS: 'espetinho_marmita_settings_v1',
  ACTIVE_MODULE: 'espetinho_active_module_v1',
};

export function loadProducts(): Product[] {
  try {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    if (!data) return INITIAL_PRODUCTS;
    const parsed: Product[] = JSON.parse(data);
    
    // Ensure all products have updated photoUrls
    const updated = parsed.map((p) => {
      const match = INITIAL_PRODUCTS.find((initP) => initP.id === p.id);
      if (match && match.photoUrl) {
        return { ...p, photoUrl: match.photoUrl };
      }
      return p;
    });

    // Merge any missing initial products (e.g. QA Test Product)
    INITIAL_PRODUCTS.forEach((initP) => {
      if (!updated.some((p) => p.id === initP.id)) {
        updated.unshift(initP);
      }
    });

    return updated;
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products:', e);
  }
}

export function loadStock(): StockItem[] {
  try {
    const data = localStorage.getItem(KEYS.STOCK);
    if (!data) return INITIAL_STOCK;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_STOCK;
  } catch {
    return INITIAL_STOCK;
  }
}

export function saveStock(stock: StockItem[]): void {
  try {
    localStorage.setItem(KEYS.STOCK, JSON.stringify(stock));
  } catch (e) {
    console.error('Error saving stock:', e);
  }
}

export function loadOrders(): Order[] {
  try {
    const data = localStorage.getItem(KEYS.ORDERS);
    if (!data) return INITIAL_ORDERS;
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return INITIAL_ORDERS;
    return parsed.map((o) => ({
      ...o,
      items: Array.isArray(o.items) ? o.items : [],
      payments: Array.isArray(o.payments) ? o.payments : [],
    }));
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving orders:', e);
  }
}

export function loadCashShift(): CashShift {
  try {
    const data = localStorage.getItem(KEYS.CASH_SHIFT);
    return data ? JSON.parse(data) : INITIAL_CASH_SHIFT;
  } catch {
    return INITIAL_CASH_SHIFT;
  }
}

export function saveCashShift(shift: CashShift): void {
  try {
    localStorage.setItem(KEYS.CASH_SHIFT, JSON.stringify(shift));
  } catch (e) {
    console.error('Error saving cash shift:', e);
  }
}

export function loadCashHistory(): CashShift[] {
  try {
    const data = localStorage.getItem(KEYS.CASH_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCashHistory(history: CashShift[]): void {
  try {
    localStorage.setItem(KEYS.CASH_HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving cash history:', e);
  }
}

export function loadUsers(): AppUser[] {
  try {
    const data = localStorage.getItem(KEYS.USERS);
    if (!data) return INITIAL_USERS;
    const parsed: AppUser[] = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_USERS;
    
    // Backfill any missing passwords, pins or permissions from INITIAL_USERS / DEFAULT_ROLE_PERMISSIONS
    return parsed.map((user) => {
      const match = INITIAL_USERS.find((u) => u.id === user.id);
      let userPerms: any = user.permissions;
      if (typeof userPerms === 'string') {
        try { userPerms = JSON.parse(userPerms); } catch { userPerms = {}; }
      }
      const defaultPerms = DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS.garcom;
      const mergedPerms: Record<SystemPermission, boolean> = {
        ...defaultPerms,
        ...(userPerms && typeof userPerms === 'object' ? userPerms : {}),
      };

      if (match) {
        return {
          ...user,
          password: user.password || match.password || '1234',
          pin: user.pin || match.pin || '1234',
          permissions: mergedPerms,
        };
      }
      return {
        ...user,
        password: user.password || user.pin || '1234',
        pin: user.pin || '1234',
        permissions: mergedPerms,
      };
    });
  } catch {
    return INITIAL_USERS;
  }
}

export function saveUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users:', e);
  }
}

export interface AuthSession {
  isAuthenticated: boolean;
  userId?: string;
  rememberMe?: boolean;
}

export function loadAuthSession(): AuthSession {
  try {
    const data = localStorage.getItem(KEYS.AUTH_SESSION);
    if (data) {
      const parsed: AuthSession = JSON.parse(data);
      return parsed;
    }
    return { isAuthenticated: false };
  } catch {
    return { isAuthenticated: false };
  }
}

export function saveAuthSession(session: AuthSession): void {
  try {
    localStorage.setItem(KEYS.AUTH_SESSION, JSON.stringify(session));
  } catch (e) {
    console.error('Error saving auth session:', e);
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(KEYS.AUTH_SESSION);
  } catch (e) {
    console.error('Error clearing auth session:', e);
  }
}

export function loadCurrentUser(): AppUser {
  try {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    if (data) {
      const parsed: AppUser = JSON.parse(data);
      let userPerms: any = parsed.permissions;
      if (typeof userPerms === 'string') {
        try { userPerms = JSON.parse(userPerms); } catch { userPerms = {}; }
      }
      const defaultPerms = DEFAULT_ROLE_PERMISSIONS[parsed.role] || DEFAULT_ROLE_PERMISSIONS.garcom;
      const mergedPerms: Record<SystemPermission, boolean> = {
        ...defaultPerms,
        ...(userPerms && typeof userPerms === 'object' ? userPerms : {}),
      };

      return {
        ...parsed,
        permissions: mergedPerms,
      };
    }
    return INITIAL_USERS[0];
  } catch {
    return INITIAL_USERS[0];
  }
}

export function saveCurrentUser(user: AppUser): void {
  try {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (e) {
    console.error('Error saving current user:', e);
  }
}

/* =========================================================================
 * MARMITARIA STORAGE HELPERS
 * ========================================================================= */

export function loadMarmitaOptions(): MarmitaOption[] {
  try {
    const data = localStorage.getItem(KEYS.MARMITA_OPTIONS);
    if (!data) return INITIAL_MARMITA_OPTIONS;
    const parsed: MarmitaOption[] = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_MARMITA_OPTIONS;
    return parsed;
  } catch {
    return INITIAL_MARMITA_OPTIONS;
  }
}

export function saveMarmitaOptions(options: MarmitaOption[]): void {
  try {
    localStorage.setItem(KEYS.MARMITA_OPTIONS, JSON.stringify(options));
  } catch (e) {
    console.error('Error saving marmita options:', e);
  }
}

export function loadMarmitaSizes(): MarmitaSizeConfig[] {
  try {
    const data = localStorage.getItem(KEYS.MARMITA_SIZES);
    if (!data) return INITIAL_MARMITA_SIZES;
    const parsed: MarmitaSizeConfig[] = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_MARMITA_SIZES;
    return parsed;
  } catch {
    return INITIAL_MARMITA_SIZES;
  }
}

export function saveMarmitaSizes(sizes: MarmitaSizeConfig[]): void {
  try {
    localStorage.setItem(KEYS.MARMITA_SIZES, JSON.stringify(sizes));
  } catch (e) {
    console.error('Error saving marmita sizes:', e);
  }
}

export function loadMarmitaOrders(): MarmitaOrder[] {
  try {
    const data = localStorage.getItem(KEYS.MARMITA_ORDERS);
    if (!data) return INITIAL_MARMITA_ORDERS;
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return INITIAL_MARMITA_ORDERS;
    return parsed.map((o) => ({
      ...o,
      items: Array.isArray(o.items)
        ? o.items.map((it: any) => ({
            ...it,
            proteinas: Array.isArray(it.proteinas) ? it.proteinas : [],
            bases: Array.isArray(it.bases) ? it.bases : [],
            feijoes: Array.isArray(it.feijoes) ? it.feijoes : [],
            guarnicoes: Array.isArray(it.guarnicoes) ? it.guarnicoes : [],
            saladas: Array.isArray(it.saladas) ? it.saladas : [],
            adicionais: Array.isArray(it.adicionais) ? it.adicionais : [],
          }))
        : [],
      beverages: Array.isArray(o.beverages) ? o.beverages : [],
    }));
  } catch {
    return INITIAL_MARMITA_ORDERS;
  }
}

export function saveMarmitaOrders(orders: MarmitaOrder[]): void {
  try {
    localStorage.setItem(KEYS.MARMITA_ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving marmita orders:', e);
  }
}

export function loadMarmitaSettings(): MarmitaSettings {
  try {
    const data = localStorage.getItem(KEYS.MARMITA_SETTINGS);
    return data ? JSON.parse(data) : INITIAL_MARMITA_SETTINGS;
  } catch {
    return INITIAL_MARMITA_SETTINGS;
  }
}

export function saveMarmitaSettings(settings: MarmitaSettings): void {
  try {
    localStorage.setItem(KEYS.MARMITA_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving marmita settings:', e);
  }
}

export function loadActiveModule(): SystemModule {
  try {
    const data = localStorage.getItem(KEYS.ACTIVE_MODULE);
    if (data === 'marmitaria' || data === 'espetos') {
      return data;
    }
    return 'espetos';
  } catch {
    return 'espetos';
  }
}

export function saveActiveModule(module: SystemModule): void {
  try {
    localStorage.setItem(KEYS.ACTIVE_MODULE, module);
  } catch (e) {
    console.error('Error saving active module:', e);
  }
}


// Backend API synchronization helpers
export async function fetchProductsFromApi(): Promise<Product[] | null> {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveProducts(data);
        return data;
      }
    }
  } catch (e) {
    console.warn('API sync unavailable for products, using local storage');
  }
  return null;
}

export async function syncProductToApi(product: Product): Promise<void> {
  try {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  } catch (e) {
    console.warn('Failed to sync product to API', e);
  }
}

export async function syncOrderToApi(order: Order): Promise<void> {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  } catch (e) {
    console.warn('Failed to sync order to API', e);
  }
}

export async function fetchOrdersFromApi(): Promise<Order[] | null> {
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveOrders(data);
        return data;
      }
    }
  } catch (e) {
    console.warn('API sync unavailable for orders');
  }
  return null;
}

export async function fetchStockFromApi(): Promise<StockItem[] | null> {
  try {
    const res = await fetch('/api/stock');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStock(data);
        return data;
      }
    }
  } catch (e) {
    console.warn('API sync unavailable for stock');
  }
  return null;
}

export async function syncStockToApi(stockItem: StockItem): Promise<void> {
  try {
    await fetch(`/api/stock/${stockItem.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stockItem),
    });
  } catch (e) {
    console.warn('Failed to sync stock item to API', e);
  }
}

export async function deleteStockFromApi(stockId: string): Promise<void> {
  try {
    await fetch(`/api/stock/${stockId}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('Failed to delete stock item from API', e);
  }
}

export async function fetchCashShiftFromApi(): Promise<CashShift | null> {
  try {
    const res = await fetch('/api/cash-shift');
    if (res.ok) {
      const data = await res.json();
      if (data && data.status) {
        saveCashShift(data);
        return data;
      }
    }
  } catch (e) {
    console.warn('API sync unavailable for cash shift');
  }
  return null;
}

export async function syncCashShiftToApi(shift: CashShift): Promise<void> {
  try {
    await fetch('/api/cash-shift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shift),
    });
  } catch (e) {
    console.warn('Failed to sync cash shift to API', e);
  }
}

export async function fetchUsersFromApi(): Promise<AppUser[] | null> {
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const sanitizedUsers: AppUser[] = data.map((u: any) => {
          let perms = u.permissions;
          if (typeof perms === 'string') {
            try { perms = JSON.parse(perms); } catch { perms = {}; }
          }
          const defaultPerms = DEFAULT_ROLE_PERMISSIONS[u.role as UserRole] || DEFAULT_ROLE_PERMISSIONS.garcom;
          const mergedPerms: Record<SystemPermission, boolean> = {
            ...defaultPerms,
            ...(perms && typeof perms === 'object' ? perms : {}),
          };
          return {
            ...u,
            permissions: mergedPerms,
          };
        });
        saveUsers(sanitizedUsers);
        return sanitizedUsers;
      }
    }
  } catch (e) {
    console.warn('API sync unavailable for users');
  }
  return null;
}

export async function syncUserToApi(user: AppUser): Promise<void> {
  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
  } catch (e) {
    console.warn('Failed to sync user to API', e);
  }
}

export async function deleteUserFromApi(userId: string): Promise<void> {
  try {
    await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('Failed to delete user from API', e);
  }
}

export async function deleteProductFromApi(productId: string): Promise<void> {
  try {
    await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('Failed to delete product from API', e);
  }
}

export async function deleteOrderFromApi(orderId: string): Promise<void> {
  try {
    await fetch(`/api/orders/${orderId}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('Failed to delete order from API', e);
  }
}

export function loadAuditLogs(): SystemLog[] {
  try {
    const data = localStorage.getItem(KEYS.LOGS);
    if (!data) return INITIAL_LOGS;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_LOGS;
  } catch {
    return INITIAL_LOGS;
  }
}

export function saveAuditLogs(logs: SystemLog[]): void {
  try {
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving audit logs:', e);
  }
}

export async function fetchLogsFromApi(): Promise<SystemLog[] | null> {
  try {
    const res = await fetch('/api/logs');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveAuditLogs(data);
        return data;
      }
    }
  } catch (e) {
    console.warn('API sync unavailable for audit logs');
  }
  return null;
}

export async function syncLogToApi(log: SystemLog): Promise<void> {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
  } catch (e) {
    console.warn('Failed to sync log to API', e);
  }
}

export async function clearLogsFromApi(): Promise<void> {
  try {
    await fetch('/api/logs', {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('Failed to clear logs from API', e);
  }
}


