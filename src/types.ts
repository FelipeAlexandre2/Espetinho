export type Category = 
  | 'espetos'
  | 'pratos_executivos'
  | 'batatas_recheadas'
  | 'pasteis'
  | 'lanches'
  | 'porcoes'
  | 'caldos'
  | 'bebidas'
  | 'adicionais'
  | 'espetos_tradicionais'
  | 'espetos_especiais'
  | 'acompanhamentos'
  | 'sobremesas';

export type MeatPoint = 'mal_passada' | 'ao_ponto' | 'bem_passada';

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  costPrice: number;
  description: string;
  photoUrl: string;
  requiresMeatPoint: boolean;
  isAvailable: boolean;
  isQuickPos: boolean;
  stockQty: number;
  unit: string; // 'unid', 'porção', 'lata', 'garrafa'
}

export type OrderStatus = 'novo' | 'na_churrasqueira' | 'pronto' | 'entregue' | 'cancelado';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  meatPoint?: MeatPoint;
  notes?: string;
  status: 'aguardando' | 'na_grelha' | 'pronto' | 'entregue';
  requiresMeatPoint?: boolean;
  category?: Category;
}

export type PaymentMethod = 'pix' | 'credito' | 'debito' | 'dinheiro' | 'multiplo';

export interface PaymentSplit {
  id?: string;
  method: 'pix' | 'credito' | 'debito' | 'dinheiro';
  amount: number;
  cashReceived?: number;
  change?: number;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  tableOrCustomer: string; // 'Mesa 04', 'Cliente João', 'Balcão'
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string; // ISO string
  updatedAt: string;
  subtotal: number;
  discount: number;
  serviceFee: number; // 10% or custom
  total: number;
  paymentMethod?: PaymentMethod;
  payments?: PaymentSplit[]; // Detalhamento de pagamentos múltiplos / divididos
  change?: number; // Troco total se houver pagamento em dinheiro
  isPaid: boolean;
  notes?: string;
}

export interface ReceiptSettings {
  restaurantName: string;
  subtitle?: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  footerMessage?: string;
  autoCut?: boolean;
}

export type ReceiptPaperWidth = '80mm' | '58mm' | 'a4';
export type ReceiptType = 'cliente' | 'cozinha' | 'pre_conta';

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  restaurantName: 'MARESIA',
  subtitle: 'Espetinhos, Bebidas & Porções',
  cnpj: '12.345.678/0001-90',
  address: 'Horário: 18:00 - 23:00',
  phone: '(67) 99125-6083',
  footerMessage: 'Instagram: @maresia • Volte sempre! 🔥',
  autoCut: true,
};

export interface StockItem {
  id: string;
  name: string;
  category: string;
  currentQty: number;
  minQty: number;
  unit: string;
  costPrice: number;
  supplier: string;
  lastRestocked: string;
}

export interface CashShift {
  id: string;
  openedAt: string;
  closedAt?: string;
  operatorName: string;
  initialFloat: number;
  salesByPaymentMethod: {
    pix: number;
    credito: number;
    debito: number;
    dinheiro: number;
    multiplo?: number;
  };
  totalSales: number;
  status: 'aberto' | 'fechado';
}

export type SystemModule = 'espetos' | 'marmitaria';

export type TabType = 
  | 'caixa' 
  | 'pedidos' 
  | 'churrasqueira' 
  | 'cardapio' 
  | 'estoque' 
  | 'relatorios' 
  | 'pedidos_estoque' 
  | 'usuarios' 
  | 'auditoria'
  | 'marmitaria';

export type UserRole = 'admin' | 'gerente' | 'caixa' | 'churrasqueiro' | 'garcom';

export type SystemPermission = 
  | 'access_caixa'
  | 'open_close_shift'
  | 'give_discounts'
  | 'cancel_orders'
  | 'access_churrasqueira'
  | 'manage_menu'
  | 'manage_stock'
  | 'view_reports'
  | 'manage_users'
  | 'view_audit_logs'
  | 'access_marmitaria';

export type LogCategory = 'login' | 'cardapio' | 'caixa' | 'pedidos' | 'estoque' | 'usuarios' | 'sistema';

export type LogActionType = 
  | 'login_sucesso' 
  | 'login_falha' 
  | 'troca_operador' 
  | 'produto_criado' 
  | 'produto_editado' 
  | 'produto_excluido' 
  | 'produto_disponibilidade'
  | 'estoque_ajustado'
  | 'estoque_entrada'
  | 'estoque_excluido'
  | 'pedido_criado' 
  | 'pedido_atualizado' 
  | 'pedido_cancelado' 
  | 'pedido_pago'
  | 'caixa_aberto' 
  | 'caixa_fechado' 
  | 'usuario_criado' 
  | 'usuario_editado' 
  | 'usuario_excluido' 
  | 'usuario_permissao_alterada'
  | 'usuario_status_alterado'
  | 'sistema_backup';

export interface SystemLog {
  id: string;
  timestamp: string; // ISO string
  formattedDate?: string;
  category: LogCategory;
  actionType: LogActionType;
  title: string;
  description: string;
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  severity: 'info' | 'warning' | 'success' | 'danger';
  details?: {
    targetName?: string;
    targetId?: string;
    previousValue?: any;
    newValue?: any;
    price?: number;
    costPrice?: number;
    orderNumber?: number;
    table?: string;
    total?: number;
    notes?: string;
    [key: string]: any;
  };
  ipAddress?: string;
}

export interface AppUser {
  id: string;
  name: string;
  username?: string; // Nome de usuário exclusivo para login
  email: string;
  role: UserRole;
  pin: string; // 4-6 digit numeric code for quick access
  password?: string; // Optional password for email/password login
  phone?: string;
  avatar?: string;
  status: 'ativo' | 'inativo';
  permissions: Record<SystemPermission, boolean>;
  createdAt: string;
  lastLogin?: string;
}

export const ROLE_CONFIG: Record<UserRole, { label: string; description: string; badgeClass: string }> = {
  admin: {
    label: 'Administrador (Dono)',
    description: 'Acesso irrestrito a todas as funções, relatórios financeiros e configurações.',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  gerente: {
    label: 'Gerente Geral',
    description: 'Acesso a caixa, relatórios, cardápio, estoque e supervisão da equipe.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  caixa: {
    label: 'Operador de Caixa (POS)',
    description: 'Abertura/fechamento de caixa, lançamento de comandas e recebimento de pagamentos.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  churrasqueiro: {
    label: 'Churrasqueiro / Cozinha',
    description: 'Painel KDS de produção, controle de ponto das carnes e expedição.',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  garcom: {
    label: 'Garçom / Atendente',
    description: 'Lançamento de pedidos nas mesas, consulta de cardápio e entrega no balcão.',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
  }
};

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Record<SystemPermission, boolean>> = {
  admin: {
    access_caixa: true,
    open_close_shift: true,
    give_discounts: true,
    cancel_orders: true,
    access_churrasqueira: true,
    manage_menu: true,
    manage_stock: true,
    view_reports: true,
    manage_users: true,
    view_audit_logs: true,
    access_marmitaria: true,
  },
  gerente: {
    access_caixa: true,
    open_close_shift: true,
    give_discounts: true,
    cancel_orders: true,
    access_churrasqueira: true,
    manage_menu: true,
    manage_stock: true,
    view_reports: true,
    manage_users: false,
    view_audit_logs: true,
    access_marmitaria: true,
  },
  caixa: {
    access_caixa: true,
    open_close_shift: true,
    give_discounts: true,
    cancel_orders: false,
    access_churrasqueira: false,
    manage_menu: false,
    manage_stock: false,
    view_reports: false,
    manage_users: false,
    view_audit_logs: false,
    access_marmitaria: false,
  },
  churrasqueiro: {
    access_caixa: false,
    open_close_shift: false,
    give_discounts: false,
    cancel_orders: false,
    access_churrasqueira: true,
    manage_menu: false,
    manage_stock: false,
    view_reports: false,
    manage_users: false,
    view_audit_logs: false,
    access_marmitaria: false,
  },
  garcom: {
    access_caixa: false,
    open_close_shift: false,
    give_discounts: false,
    cancel_orders: false,
    access_churrasqueira: false,
    manage_menu: false,
    manage_stock: false,
    view_reports: false,
    manage_users: false,
    view_audit_logs: false,
    access_marmitaria: false,
  }
};

export const PERMISSION_DEFINITIONS: { key: SystemPermission; label: string; category: string; description: string }[] = [
  {
    key: 'access_marmitaria',
    label: '🍱 Módulo Marmitaria & Marmitex',
    category: 'Módulos do Sistema',
    description: 'Acesso completo ao sistema de montagem de marmitas (P/M/G/Executiva), cardápio do dia e entregas. Se desativado, o botão e opção de marmitaria NÃO aparecem para o usuário.'
  },
  {
    key: 'access_caixa',
    label: 'Frente de Caixa (POS)',
    category: 'Vendas & Caixa',
    description: 'Acessar o terminal Frente de Caixa (POS), comandas e recebimento de pagamentos.'
  },
  {
    key: 'open_close_shift',
    label: 'Abrir & Fechar Caixa',
    category: 'Vendas & Caixa',
    description: 'Iniciar turno com fundo de troco e realizar sangria/fechamento.'
  },
  {
    key: 'give_discounts',
    label: 'Aplicar Descontos',
    category: 'Vendas & Caixa',
    description: 'Inserir abatimentos em reais ou percentuais nas contas.'
  },
  {
    key: 'cancel_orders',
    label: 'Cancelar Pedidos e Itens',
    category: 'Vendas & Caixa',
    description: 'Estornar itens lançados ou cancelar comandas ativas.'
  },
  {
    key: 'access_churrasqueira',
    label: 'KDS Cozinha & Churrasqueira',
    category: 'Produção',
    description: 'Acessar a fila da grelha, alterar status de preparo e chamar garçom.'
  },
  {
    key: 'manage_menu',
    label: 'Gerenciar Cardápio & Preços',
    category: 'Cardápio & Estoque',
    description: 'Adicionar produtos, alterar preços e pausar itens esgotados.'
  },
  {
    key: 'manage_stock',
    label: 'Controle de Estoque & Insumos',
    category: 'Cardápio & Estoque',
    description: 'Ajustar quantidades, registrar entradas e gerenciar fornecedores.'
  },
  {
    key: 'view_reports',
    label: 'Relatórios Financeiros & Vendas',
    category: 'Administração',
    description: 'Visualizar faturamento diário/mensal, ticket médio e lucros.'
  },
  {
    key: 'manage_users',
    label: 'Gerenciar Usuários & Permissões',
    category: 'Administração',
    description: 'Criar contas de operadores, editar cargos e trocar PINs.'
  },
  {
    key: 'view_audit_logs',
    label: 'Auditoria & Logs de Atividade',
    category: 'Administração',
    description: 'Acessar histórico de todas as alterações de cardápio, estoque, caixa e logins.'
  }
];

export const TABLES = [
  'Balcão 01', 'Balcão 02',
  'Mesa 01', 'Mesa 02', 'Mesa 03', 'Mesa 04', 'Mesa 05', 'Mesa 06',
  'Mesa 07', 'Mesa 08', 'Mesa 09', 'Mesa 10', 'Mesa 11', 'Mesa 12',
  'Mesa 13', 'Mesa 14', 'Mesa 15', 'Mesa 16', 'Mesa 17', 'Mesa 18',
  'Mesa 19', 'Mesa 20',
  'Para Viagem', 'Delivery'
];

/**
 * Checks if a given user has a specific system permission.
 * - Explicit user permissions are checked first (with string JSON parsing safety).
 * - Admin role has full root access by default if not explicitly overridden.
 * - Role defaults from DEFAULT_ROLE_PERMISSIONS are used as baseline.
 */
export function hasPermission(user: AppUser | null | undefined, permission: SystemPermission): boolean {
  if (!user) return false;
  
  // 1. Explicit permission overrides set directly on user object take precedence
  if (user.permissions) {
    let perms: any = user.permissions;
    if (typeof perms === 'string') {
      try {
        perms = JSON.parse(perms);
      } catch {
        perms = null;
      }
    }
    if (perms && typeof perms === 'object' && typeof perms[permission] === 'boolean') {
      return perms[permission];
    }
  }
  
  // 2. Admin role has full access by default
  if (user.role === 'admin') return true;
  
  // 3. Default permissions for user's role
  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[user.role];
  if (defaultPerms && typeof defaultPerms[permission] === 'boolean') {
    return defaultPerms[permission];
  }
  return false;
}

/**
 * Helper to check if a user is permitted to see and enter the Marmitaria system.
 */
export function canUserAccessMarmitaria(user: AppUser | null | undefined): boolean {
  return hasPermission(user, 'access_marmitaria');
}

/**
 * Checks if a user is permitted to create/launch orders on tables.
 * Permitted for: Admin, Gerente, Caixa, Garçom, or anyone with access_caixa.
 */
export function canUserCreateOrder(user: AppUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'gerente' || user.role === 'garcom' || user.role === 'caixa') {
    return true;
  }
  return hasPermission(user, 'access_caixa');
}

/**
 * Returns the primary required permission key for a given tab, or null if generally accessible.
 */
export function getTabRequiredPermission(tab: TabType): SystemPermission | null {
  switch (tab) {
    case 'caixa':
      return 'access_caixa';
    case 'churrasqueira':
      return 'access_churrasqueira';
    case 'estoque':
      return 'manage_stock';
    case 'relatorios':
      return 'view_reports';
    case 'usuarios':
      return 'manage_users';
    case 'auditoria':
      return 'view_audit_logs';
    case 'marmitaria':
      return 'access_marmitaria';
    default:
      return null;
  }
}

/**
 * Returns a human-friendly title for a given tab.
 */
export function getTabTitle(tab: TabType): string {
  switch (tab) {
    case 'cardapio':
      return 'Cardápio & Produtos';
    case 'caixa':
      return 'Frente de Caixa (POS)';
    case 'pedidos':
    case 'pedidos_estoque':
      return 'Gestão de Pedidos';
    case 'churrasqueira':
      return 'Cozinha & Churrasqueira (KDS)';
    case 'estoque':
      return 'Controle de Estoque';
    case 'relatorios':
      return 'Relatórios & Desempenho';
    case 'usuarios':
      return 'Usuários & Permissões';
    case 'auditoria':
      return 'Auditoria & Logs';
    case 'marmitaria':
      return 'Sistema Marmitaria & Marmitex';
    default:
      return tab;
  }
}

/**
 * Returns the default starting tab for a user according to their permissions and operational role.
 */
export function getDefaultTabForUser(user: AppUser): TabType {
  if (user.role === 'churrasqueiro' || (hasPermission(user, 'access_churrasqueira') && !hasPermission(user, 'access_caixa'))) {
    return 'churrasqueira';
  }
  if (user.role === 'garcom') {
    return 'pedidos';
  }
  if (hasPermission(user, 'access_caixa')) {
    return 'caixa';
  }
  if (hasPermission(user, 'access_churrasqueira')) {
    return 'churrasqueira';
  }
  if (hasPermission(user, 'manage_stock')) {
    return 'estoque';
  }
  if (hasPermission(user, 'access_marmitaria')) {
    return 'marmitaria';
  }
  return 'cardapio';
}

/* =========================================================================
 * MARMITARIA MODULE DATA STRUCTURES
 * ========================================================================= */

export type MarmitaSize = 'P' | 'M' | 'G' | 'executiva';

export interface MarmitaSizeConfig {
  size: MarmitaSize;
  label: string;
  name: string;
  price: number;
  weightGrams?: number;
  maxProteins: number;
  maxSides: number;
  description: string;
  badgeColor: string;
}

export type MarmitaOptionCategory = 
  | 'base' 
  | 'feijao' 
  | 'proteina' 
  | 'guarnicao' 
  | 'salada' 
  | 'adicional' 
  | 'bebida';

export interface MarmitaOption {
  id: string;
  name: string;
  category: MarmitaOptionCategory;
  isAvailableToday: boolean;
  extraPrice: number; // 0 for included items, > 0 for premium or extras
  description?: string;
  icon?: string;
}

export interface MarmitaItem {
  id: string;
  size: MarmitaSize;
  sizeName: string;
  bases: string[]; // e.g. ["Arroz Branco"]
  feijoes: string[]; // e.g. ["Feijão Carioca"]
  proteinas: string[]; // e.g. ["Bife Acebolado", "Frango Grelhado"]
  guarnicoes: string[]; // e.g. ["Farofa da Casa", "Macarrão"]
  saladas: string[]; // e.g. ["Vinagrete"]
  adicionais: { name: string; price: number }[];
  price: number;
  quantity: number;
  notes?: string;
}

export interface MarmitaBeverage {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type MarmitaOrderStatus = 
  | 'novo' 
  | 'em_montagem' 
  | 'pronto_embalado' 
  | 'saiu_para_entrega' 
  | 'entregue' 
  | 'cancelado';

export type MarmitaDeliveryType = 'balcao' | 'retirada' | 'entrega' | 'mesa';

export interface MarmitaOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone?: string;
  deliveryType: MarmitaDeliveryType;
  tableOrAddress?: string; // 'Mesa 02' or 'Rua das Palmeiras, 145 - Centro'
  motoboyName?: string;
  items: MarmitaItem[];
  beverages: MarmitaBeverage[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  payments?: PaymentSplit[];
  isPaid: boolean;
  changeFor?: number; // Troco para R$
  status: MarmitaOrderStatus;
  notes?: string;
  generalNotes?: string;
  createdAt: string; // ISO
  updatedAt: string;
}

export interface MarmitaSettings {
  restaurantName: string;
  subtitle: string;
  phoneWhatsapp: string;
  address: string;
  defaultDeliveryFee: number;
  pixKey: string;
  pixKeyType: 'cnpj' | 'celular' | 'email' | 'aleatoria';
  autoPrintOnCreate: boolean;
  footerMessage?: string;
}


