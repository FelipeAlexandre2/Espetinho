import React, { useState } from 'react';
import { Order, StockItem, OrderStatus, MeatPoint, Product, PaymentMethod, OrderItem, AppUser, hasPermission, canUserCreateOrder } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockData';
import { 
  ClipboardList, Package, Search, Filter, Printer, CheckCircle2, 
  Flame, Clock, AlertTriangle, Plus, Minus, ArrowDownRight, ArrowUpRight, 
  AlertCircle, ChevronRight, XCircle, Check, UtensilsCrossed, GlassWater, Boxes,
  Trash2, ShoppingBag, X, CreditCard, QrCode, Banknote, Edit2, RefreshCw, Lock
} from 'lucide-react';

interface PedidosEstoqueTabProps {
  orders: Order[];
  stock: StockItem[];
  products?: Product[];
  currentUser?: AppUser;
  onCreateOrder?: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onPrintReceipt: (order: Order) => void;
  onRestockItem: (stockId: string, addedQty: number) => void;
  onDeductStockItem: (stockId: string, deductedQty: number, reason: string) => void;
  onAddStockItem: (newItem: Omit<StockItem, 'id' | 'lastRestocked'>) => void;
  onUpdateStockItem?: (updatedItem: StockItem) => void;
  onDeleteStockItem?: (stockId: string) => void;
  onSyncStockFromProducts?: () => void;
  initialSubTab?: 'pedidos' | 'estoque';
}

export const PedidosEstoqueTab: React.FC<PedidosEstoqueTabProps> = ({
  orders,
  stock,
  products = INITIAL_PRODUCTS,
  currentUser,
  onCreateOrder,
  onUpdateOrderStatus,
  onPrintReceipt,
  onRestockItem,
  onDeductStockItem,
  onAddStockItem,
  onUpdateStockItem,
  onDeleteStockItem,
  onSyncStockFromProducts,
  initialSubTab = 'pedidos',
}) => {
  const canCreateOrder = canUserCreateOrder(currentUser);
  const canCancelOrder = hasPermission(currentUser, 'cancel_orders');
  const canManageStock = hasPermission(currentUser, 'manage_stock');

  const [subTab, setSubTab] = useState<'pedidos' | 'estoque'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Pedidos state
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'todos'>('todos');
  const [orderSearch, setOrderSearch] = useState('');

  // New Order Creation Modal State
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrderTable, setNewOrderTable] = useState('Mesa 01');
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
  const [newOrderNotes, setNewOrderNotes] = useState('');
  const [newOrderPaymentMethod, setNewOrderPaymentMethod] = useState<PaymentMethod>('pix');
  const [newOrderIsPaid, setNewOrderIsPaid] = useState(false);
  const [newOrderSearch, setNewOrderSearch] = useState('');
  const [newOrderCategory, setNewOrderCategory] = useState<string>('todos');
  const [selectedProdForMeat, setSelectedProdForMeat] = useState<Product | null>(null);
  const [selectedMeatPoint, setSelectedMeatPoint] = useState<MeatPoint>('ao_ponto');

  // Estoque state
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState<'todos' | 'Comida' | 'Bebida' | 'Diversos'>('todos');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isNewStockModalOpen, setIsNewStockModalOpen] = useState(false);
  const [isEditStockModalOpen, setIsEditStockModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [editingStockItem, setEditingStockItem] = useState<StockItem | null>(null);
  const [restockQty, setRestockQty] = useState(10);

  // New stock item form state
  const [newStockForm, setNewStockForm] = useState({
    name: '',
    category: 'Comida',
    currentQty: 50,
    minQty: 15,
    unit: 'unid',
    costPrice: 5.00,
    supplier: 'Fornecedor Local',
  });

  // Helper normalizer for categories: Comida, Bebida, Diversos
  const getNormalizedCategory = (cat: string): 'Comida' | 'Bebida' | 'Diversos' => {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('bebida') || lower.includes('cerveja') || lower.includes('refrigerante') || lower.includes('suco') || lower.includes('drink')) {
      return 'Bebida';
    }
    if (lower.includes('comida') || lower.includes('carne') || lower.includes('espeto') || lower.includes('latic') || lower.includes('horti') || lower.includes('aliment') || lower.includes('queijo') || lower.includes('pão')) {
      return 'Comida';
    }
    return 'Diversos';
  };

  // Helper to check if stock item is low inventory (<= configured minQty)
  const isItemLowStock = (item: StockItem) => item.currentQty <= item.minQty;

  // Filter Orders
  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = orderStatusFilter === 'todos' || ord.status === orderStatusFilter;
    const matchesSearch = ord.tableOrCustomer.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          ord.orderNumber.toString().includes(orderSearch);
    return matchesStatus && matchesSearch;
  });

  // Filter Stock by Search, Category Filter, and Low Stock Alert Toggle
  const filteredStock = stock.filter((stk) => {
    const itemNormCat = getNormalizedCategory(stk.category);
    const matchesCategory = stockCategoryFilter === 'todos' || itemNormCat === stockCategoryFilter;
    const matchesSearch = stk.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
                           stk.category.toLowerCase().includes(stockSearch.toLowerCase()) ||
                           stk.supplier.toLowerCase().includes(stockSearch.toLowerCase());
    const matchesLowFilter = !onlyLowStock || isItemLowStock(stk);
    return matchesCategory && matchesSearch && matchesLowFilter;
  });

  // Counts for each category & low stock items
  const comidaCount = stock.filter((s) => getNormalizedCategory(s.category) === 'Comida').length;
  const bebidaCount = stock.filter((s) => getNormalizedCategory(s.category) === 'Bebida').length;
  const diversosCount = stock.filter((s) => getNormalizedCategory(s.category) === 'Diversos').length;

  const lowStockCount = stock.filter(isItemLowStock).length;
  const totalStockValue = stock.reduce((sum, s) => sum + s.currentQty * s.costPrice, 0);

  const getMeatPointBadge = (point?: MeatPoint) => {
    switch (point) {
      case 'mal_passada':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">🥩 Mal Passada</span>;
      case 'ao_ponto':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">🥩 Ao Ponto</span>;
      case 'bem_passada':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-950 text-amber-100 border border-amber-800">🥩 Bem Passada</span>;
      default:
        return null;
    }
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'novo':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">✨ Novo Pedido</span>;
      case 'na_churrasqueira':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1"><Flame className="w-3 h-3 text-orange-600" /> Na Churrasqueira</span>;
      case 'pronto':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> Pronto para Servir</span>;
      case 'entregue':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Entregue / Concluído</span>;
      case 'cancelado':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Cancelado</span>;
    }
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStockItem && restockQty > 0) {
      onRestockItem(selectedStockItem.id, restockQty);
      setIsRestockModalOpen(false);
      setSelectedStockItem(null);
    }
  };

  const handleNewStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStockForm.name.trim()) {
      onAddStockItem(newStockForm);
      setIsNewStockModalOpen(false);
      setNewStockForm({
        name: '',
        category: 'Comida',
        currentQty: 50,
        minQty: 15,
        unit: 'unid',
        costPrice: 5.00,
        supplier: 'Fornecedor Local',
      });
    }
  };

  const handleEditStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStockItem && onUpdateStockItem) {
      onUpdateStockItem(editingStockItem);
      setIsEditStockModalOpen(false);
      setEditingStockItem(null);
    }
  };

  const handleQuickAdjustStock = (item: StockItem, delta: number) => {
    const newQty = Math.max(0, item.currentQty + delta);
    if (onUpdateStockItem) {
      onUpdateStockItem({ ...item, currentQty: newQty });
    } else if (delta > 0) {
      onRestockItem(item.id, delta);
    } else if (delta < 0) {
      onDeductStockItem(item.id, Math.abs(delta), 'Ajuste rápido');
    }
  };

  // Order Item Handlers for New Order Modal
  const handleSelectProductForNewOrder = (product: Product) => {
    if (product.requiresMeatPoint) {
      setSelectedProdForMeat(product);
      setSelectedMeatPoint('ao_ponto');
    } else {
      addItemToNewOrder(product);
    }
  };

  const addItemToNewOrder = (product: Product, meatPoint?: MeatPoint) => {
    setNewOrderItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === product.id && i.meatPoint === meatPoint
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }
      const newItem: OrderItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        meatPoint,
        status: 'aguardando',
        requiresMeatPoint: product.requiresMeatPoint,
      };
      return [...prev, newItem];
    });
  };

  const handleUpdateItemQtyInNewOrder = (itemId: string, delta: number) => {
    setNewOrderItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const handleRemoveItemFromNewOrder = (itemId: string) => {
    setNewOrderItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const newOrderTotal = newOrderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleConfirmCreateNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrderItems.length === 0) return;

    if (onCreateOrder) {
      onCreateOrder({
        tableOrCustomer: newOrderTable.trim() || 'Mesa / Cliente',
        items: newOrderItems,
        status: 'novo',
        subtotal: newOrderTotal,
        discount: 0,
        serviceFee: 0,
        total: newOrderTotal,
        isPaid: newOrderIsPaid,
        paymentMethod: newOrderIsPaid ? newOrderPaymentMethod : undefined,
        notes: newOrderNotes.trim() || undefined,
      });
    }

    // Reset state & close modal
    setIsNewOrderModalOpen(false);
    setNewOrderItems([]);
    setNewOrderTable('Mesa 01');
    setNewOrderNotes('');
    setNewOrderIsPaid(false);
  };

  const filteredModalProducts = products.filter((p) => {
    const matchesCat = newOrderCategory === 'todos' || p.category === newOrderCategory;
    const matchesSearch = p.name.toLowerCase().includes(newOrderSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Title Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
            {subTab === 'pedidos' ? <ClipboardList className="w-6 h-6" /> : <Package className="w-6 h-6 text-orange-600" />}
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              {subTab === 'pedidos' ? '📝 Gestão de Pedidos & Comandas' : '📦 Controle de Estoque & Insumos'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {subTab === 'pedidos' 
                ? 'Acompanhe comandas, mesas, delivery e balcão em tempo real.' 
                : 'Gerencie entradas, saídas, níveis críticos e reposição de ingredientes.'}
            </p>
          </div>
        </div>

        {subTab === 'pedidos' ? (
          canCreateOrder ? (
            <button
              onClick={() => setIsNewOrderModalOpen(true)}
              className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Novo Pedido</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-500 px-3 py-2 rounded-xl text-xs font-bold shrink-0">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Sem Permissão de Lançamento</span>
            </div>
          )
        ) : (
          canManageStock ? (
            <button
              onClick={() => setIsNewStockModalOpen(true)}
              className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 text-red-400" />
              <span>Cadastrar Insumo</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-500 px-3 py-2 rounded-xl text-xs font-bold shrink-0">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Estoque em Modo Leitura</span>
            </div>
          )
        )}
      </div>

      {/* SUB-VIEW 1: PEDIDOS */}
      {subTab === 'pedidos' && (
        <div className="space-y-4 sm:space-y-5">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Status chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
              {(['todos', 'novo', 'na_churrasqueira', 'pronto', 'entregue', 'cancelado'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                    orderStatusFilter === st
                      ? 'bg-slate-900 text-red-400 shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {st === 'todos' ? 'Todos os Pedidos' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por mesa ou Nº..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-medium">Nenhum pedido encontrado com os filtros atuais.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredOrders.map((ord) => {
                const formattedTime = new Date(ord.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={ord.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Top Row */}
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Pedido #{ord.orderNumber}
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-lg">
                            {ord.tableOrCustomer}
                          </h3>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {getOrderStatusBadge(ord.status)}
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formattedTime}
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                        {ord.items.map((item) => (
                          <div
                            key={item.id}
                            className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-900">
                                {item.quantity}x {item.productName}
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                {item.meatPoint && getMeatPointBadge(item.meatPoint)}
                                {item.notes && (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded italic">
                                    Obs: {item.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="font-bold text-slate-700">
                              R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Row - Totals & Actions */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Forma Pagto: <strong className="text-slate-800 uppercase">{ord.paymentMethod || 'Pendente'}</strong>
                        </span>
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] block">Total Geral</span>
                          <span className="font-black text-emerald-600 text-base">
                            R$ {ord.total.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      {/* Status advancement buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        {ord.status === 'novo' && (
                          <button
                            onClick={() => onUpdateOrderStatus(ord.id, 'na_churrasqueira')}
                            className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Enviar p/ Churrasqueira</span>
                          </button>
                        )}

                        {ord.status === 'na_churrasqueira' && (
                          <button
                            onClick={() => onUpdateOrderStatus(ord.id, 'pronto')}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Marcar como Pronto</span>
                          </button>
                        )}

                        {ord.status === 'pronto' && (
                          <button
                            onClick={() => onUpdateOrderStatus(ord.id, 'entregue')}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <span>Entregar à Mesa</span>
                          </button>
                        )}

                        <button
                          onClick={() => onPrintReceipt(ord)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                          title="Imprimir Comprovante Térmico"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {ord.status !== 'cancelado' && ord.status !== 'entregue' && (
                          canCancelOrder ? (
                            <button
                              onClick={() => {
                                if (confirm('Deseja cancelar este pedido?')) {
                                  onUpdateOrderStatus(ord.id, 'cancelado');
                                }
                              }}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-medium transition-colors cursor-pointer active:scale-95"
                              title="Cancelar Pedido"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-2 rounded-xl bg-slate-50 text-slate-300 border border-slate-200 text-xs font-medium cursor-not-allowed"
                              title="Requer permissão de gerência para cancelar pedidos"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: ESTOQUE */}
      {subTab === 'estoque' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Stock Header & Actions Bar */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
                <Package className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                  Organização do Estoque
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gerencie insumos, bebidas, carnes e atualize quantidades com rapidez
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
              {onSyncStockFromProducts && canManageStock && (
                <button
                  type="button"
                  onClick={onSyncStockFromProducts}
                  className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold rounded-xl border border-slate-300 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                  title="Copiar produtos do Cardápio que faltam no estoque"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sincronizar Cardápio</span>
                </button>
              )}

              {canManageStock ? (
                <button
                  type="button"
                  onClick={() => setIsNewStockModalOpen(true)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Novo Insumo</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-500 px-3 py-2 rounded-xl text-xs font-bold">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Modo Visualização</span>
                </div>
              )}
            </div>
          </div>

          {/* Metrics summary cards - compact grid on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
            <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-2.5 sm:space-x-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase truncate">Insumos Total</p>
                <h3 className="text-base sm:text-2xl font-black text-slate-900 truncate">{stock.length} itens</h3>
              </div>
            </div>

            <div 
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`p-3 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center space-x-2.5 sm:space-x-4 ${
                onlyLowStock 
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/50' 
                  : 'bg-white border-slate-200 hover:border-rose-300'
              }`}
            >
              <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                lowStockCount > 0 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase truncate">Estoque Baixo</p>
                  {onlyLowStock && (
                    <span className="text-[9px] font-extrabold bg-rose-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Filtrado</span>
                  )}
                </div>
                <h3 className={`text-base sm:text-2xl font-black truncate ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {lowStockCount} {lowStockCount === 1 ? 'item' : 'itens'}
                </h3>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-2.5 sm:space-x-4 col-span-2 sm:col-span-1">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase truncate">Valor do Estoque</p>
                <h3 className="text-base sm:text-2xl font-black text-slate-900 truncate">
                  R$ {totalStockValue.toFixed(2).replace('.', ',')}
                </h3>
              </div>
            </div>
          </div>

          {/* Top Stock Warning Alert Banner when items are low */}
          {lowStockCount > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/15 to-amber-500/10 border-2 border-rose-400/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <span>⚠️ Alerta de Estoque Crítico</span>
                    <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                      {lowStockCount} {lowStockCount === 1 ? 'item crítico' : 'itens críticos'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    Insumos com quantidade igual ou inferior ao limite crítico configurado exigem reposição.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer active:scale-95 ${
                  onlyLowStock
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30'
                    : 'bg-white border-2 border-rose-500 text-rose-700 hover:bg-rose-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{onlyLowStock ? 'Ver Todo o Estoque' : 'Filtrar Apenas Críticos'}</span>
              </button>
            </div>
          )}

          {/* Category Filter Tabs (Comida, Bebida, Diversos, Críticos) */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            {/* Category tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x">
              <button
                onClick={() => { setStockCategoryFilter('todos'); setOnlyLowStock(false); }}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5 ${
                  stockCategoryFilter === 'todos' && !onlyLowStock
                    ? 'bg-slate-900 text-amber-400 shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Todos ({stock.length})</span>
              </button>

              <button
                onClick={() => { setStockCategoryFilter('Comida'); setOnlyLowStock(false); }}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5 border ${
                  stockCategoryFilter === 'Comida' && !onlyLowStock
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs font-black'
                    : 'bg-amber-50 text-amber-900 border-amber-200/80 hover:bg-amber-100'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-700" />
                <span> Comida ({comidaCount})</span>
              </button>

              <button
                onClick={() => { setStockCategoryFilter('Bebida'); setOnlyLowStock(false); }}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5 border ${
                  stockCategoryFilter === 'Bebida' && !onlyLowStock
                    ? 'bg-sky-500 text-white border-sky-600 shadow-xs font-black'
                    : 'bg-sky-50 text-sky-900 border-sky-200/80 hover:bg-sky-100'
                }`}
              >
                <GlassWater className="w-3.5 h-3.5 text-sky-700" />
                <span> Bebida ({bebidaCount})</span>
              </button>

              <button
                onClick={() => { setStockCategoryFilter('Diversos'); setOnlyLowStock(false); }}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5 border ${
                  stockCategoryFilter === 'Diversos' && !onlyLowStock
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs font-black'
                    : 'bg-purple-50 text-purple-900 border-purple-200/80 hover:bg-purple-100'
                }`}
              >
                <Boxes className="w-3.5 h-3.5 text-purple-700" />
                <span> Diversos ({diversosCount})</span>
              </button>

              {/* Quick Filter: Low Stock Warning Tab */}
              <button
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5 border ${
                  onlyLowStock
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs font-black ring-2 ring-rose-400'
                    : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle className={`w-3.5 h-3.5 ${onlyLowStock ? 'text-white' : 'text-rose-600'}`} />
                <span>Críticos ({lowStockCount})</span>
              </button>
            </div>

            {/* Table Search */}
            <div className="relative min-w-[180px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar no estoque..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* MOBILE CARDS VIEW (For small screens < sm) */}
          <div className="sm:hidden space-y-2.5">
            {filteredStock.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-500 border border-slate-200 text-xs">
                {onlyLowStock ? 'Nenhum item com estoque baixo no momento.' : 'Nenhum insumo encontrado nesta categoria.'}
              </div>
            ) : (
              filteredStock.map((item) => {
                const isLow = isItemLowStock(item);
                const normCat = getNormalizedCategory(item.category);
                return (
                  <div 
                    key={item.id} 
                    className={`rounded-2xl p-3.5 border shadow-xs space-y-3 transition-all ${
                      isLow 
                        ? 'bg-rose-50/70 border-rose-300 border-l-4 border-l-rose-600' 
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900 leading-tight">{item.name}</span>
                          {isLow && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white inline-flex items-center gap-1 shadow-2xs animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              Crítico
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.supplier}</div>
                      </div>
                      {normCat === 'Comida' && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 inline-flex items-center gap-1">
                          <UtensilsCrossed className="w-3 h-3 text-amber-700" />
                          Comida
                        </span>
                      )}
                      {normCat === 'Bebida' && (
                        <span className="bg-sky-100 text-sky-900 border border-sky-200 px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 inline-flex items-center gap-1">
                          <GlassWater className="w-3 h-3 text-sky-700" />
                          Bebida
                        </span>
                      )}
                      {normCat === 'Diversos' && (
                        <span className="bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 inline-flex items-center gap-1">
                          <Boxes className="w-3 h-3 text-purple-700" />
                          Diversos
                        </span>
                      )}
                    </div>

                    {/* Quantity & Quick 1-Tap Buttons */}
                    <div className={`flex items-center justify-between p-2.5 rounded-xl text-xs ${
                      isLow ? 'bg-white border border-rose-200' : 'bg-slate-50 border border-slate-200/60'
                    }`}>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-semibold">Qtd Atual / Mín</span>
                        <span className={`font-black text-sm ${isLow ? 'text-rose-700' : 'text-slate-900'}`}>
                          {item.currentQty} {item.unit} <span className="text-slate-400 font-normal text-[10px]">(mín: {item.minQty})</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustStock(item, -1)}
                          className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg flex items-center justify-center font-bold text-sm transition-all cursor-pointer active:scale-95"
                          title="Remover 1 unidade"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-extrabold text-slate-900 px-1 min-w-[20px] text-center">{item.currentQty}</span>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustStock(item, 1)}
                          className="w-7 h-7 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg flex items-center justify-center font-bold text-sm shadow-2xs transition-all cursor-pointer active:scale-95"
                          title="Adicionar 1 unidade"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => {
                          setSelectedStockItem(item);
                          setRestockQty(10);
                          setIsRestockModalOpen(true);
                        }}
                        className={`flex-1 py-1.5 text-white text-xs font-extrabold rounded-xl shadow-2xs transition-colors flex items-center justify-center space-x-1 cursor-pointer ${
                          isLow ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Repor Entrada</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingStockItem(item);
                          setIsEditStockModalOpen(true);
                        }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
                        title="Editar Insumo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteStockItem && (
                        <button
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir "${item.name}" do estoque?`)) {
                              onDeleteStockItem(item.id);
                            }
                          }}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer"
                          title="Excluir do Estoque"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP TABLE VIEW (Visible >= sm) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Insumo / Produto</th>
                    <th className="py-3.5 px-4">Categoria</th>
                    <th className="py-3.5 px-4 text-center">Quantidade Atual</th>
                    <th className="py-3.5 px-4 text-center">Estoque Mínimo</th>
                    <th className="py-3.5 px-4 text-right">Custo Unitário</th>
                    <th className="py-3.5 px-4">Fornecedor</th>
                    <th className="py-3.5 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        {onlyLowStock ? 'Nenhum item com estoque baixo no momento.' : 'Nenhum insumo encontrado nesta categoria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map((item) => {
                      const isLow = isItemLowStock(item);
                      const stockPercentage = Math.min(100, Math.round((item.currentQty / (item.minQty * 2)) * 100));
                      const normCat = getNormalizedCategory(item.category);

                      return (
                        <tr 
                          key={item.id} 
                          className={`transition-colors ${
                            isLow 
                              ? 'bg-rose-50/70 hover:bg-rose-100/80 border-l-4 border-l-rose-600' 
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center space-x-2">
                              {isLow && (
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
                              )}
                              <span>{item.name}</span>
                              {isLow && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white shadow-2xs">
                                  ⚠️ Crítico!
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            {normCat === 'Comida' && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-700" />
                                <span>Comida</span>
                              </span>
                            )}
                            {normCat === 'Bebida' && (
                              <span className="bg-sky-100 text-sky-900 border border-sky-200 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                <GlassWater className="w-3.5 h-3.5 text-sky-700" />
                                <span>Bebida</span>
                              </span>
                            )}
                            {normCat === 'Diversos' && (
                              <span className="bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                <Boxes className="w-3.5 h-3.5 text-purple-700" />
                                <span>Diversos</span>
                              </span>
                            )}
                          </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5 mb-1">
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustStock(item, -1)}
                              className="w-6 h-6 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-md flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                              title="Diminuir 1"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className={`font-black text-base min-w-[28px] text-center ${isLow ? 'text-rose-700' : 'text-slate-900'}`}>
                              {item.currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustStock(item, 1)}
                              className="w-6 h-6 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-md flex items-center justify-center font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                              title="Aumentar 1"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <span className="text-xs text-slate-400 font-medium ml-1">{item.unit}</span>
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="w-24 bg-slate-200 rounded-full h-1.5 mx-auto overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                isLow ? 'bg-rose-600 animate-pulse' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(6, stockPercentage)}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-medium">
                          {item.minQty} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                          R$ {item.costPrice.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {item.supplier}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedStockItem(item);
                                setRestockQty(10);
                                setIsRestockModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition-colors flex items-center space-x-1 cursor-pointer"
                              title="Adicionar entrada de estoque"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Repor</span>
                            </button>

                            <button
                              onClick={() => {
                                setEditingStockItem(item);
                                setIsEditStockModalOpen(true);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors cursor-pointer"
                              title="Editar Insumo"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {onDeleteStockItem && (
                              <button
                                onClick={() => {
                                  if (confirm(`Excluir "${item.name}" do estoque?`)) {
                                    onDeleteStockItem(item.id);
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-lg border border-rose-200 transition-colors cursor-pointer"
                                title="Excluir Insumo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Repor Estoque */}
      {isRestockModalOpen && selectedStockItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in duration-150">
            <h3 className="font-extrabold text-slate-900 text-lg mb-2">
              Entrada de Estoque: {selectedStockItem.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Estoque atual: <strong className="text-slate-800">{selectedStockItem.currentQty} {selectedStockItem.unit}</strong>
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Quantidade a adicionar ({selectedStockItem.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-base font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all"
                >
                  Confirmar Reposição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Insumo */}
      {isNewStockModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in duration-150">
            <h3 className="font-extrabold text-slate-900 text-lg mb-4">
              Cadastrar Novo Insumo no Estoque
            </h3>

            <form onSubmit={handleNewStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome do Insumo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Saco de Carvão 10kg"
                  value={newStockForm.name}
                  onChange={(e) => setNewStockForm({ ...newStockForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Categoria *
                  </label>
                  <select
                    value={newStockForm.category}
                    onChange={(e) => setNewStockForm({ ...newStockForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="Comida">🍖 Comida (Carnes, Espetos, Alimentos)</option>
                    <option value="Bebida">🥤 Bebida (Cervejas, Refrigerantes, Sucos)</option>
                    <option value="Diversos">📦 Diversos (Carvão, Descartáveis, Limpeza)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={newStockForm.unit}
                    onChange={(e) => setNewStockForm({ ...newStockForm, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="unid">Unidade (unid)</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="saco">Saco</option>
                    <option value="fardo">Fardo</option>
                    <option value="caixa">Caixa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Qtd Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStockForm.currentQty}
                    onChange={(e) => setNewStockForm({ ...newStockForm, currentQty: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newStockForm.minQty}
                    onChange={(e) => setNewStockForm({ ...newStockForm, minQty: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Custo Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newStockForm.costPrice}
                    onChange={(e) => setNewStockForm({ ...newStockForm, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  value={newStockForm.supplier}
                  onChange={(e) => setNewStockForm({ ...newStockForm, supplier: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewStockModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md transition-all"
                >
                  Cadastrar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Insumo */}
      {isEditStockModalOpen && editingStockItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <span>Editar Insumo: {editingStockItem.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => { setIsEditStockModalOpen(false); setEditingStockItem(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome do Insumo *
                </label>
                <input
                  type="text"
                  required
                  value={editingStockItem.name}
                  onChange={(e) => setEditingStockItem({ ...editingStockItem, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Categoria *
                  </label>
                  <select
                    value={editingStockItem.category}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="Comida">🍖 Comida</option>
                    <option value="Bebida">🥤 Bebida</option>
                    <option value="Diversos">📦 Diversos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={editingStockItem.unit}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="unid">Unidade (unid)</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="saco">Saco</option>
                    <option value="fardo">Fardo</option>
                    <option value="caixa">Caixa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Qtd Atual
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingStockItem.currentQty}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, currentQty: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingStockItem.minQty}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, minQty: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Preço Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingStockItem.costPrice}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Fornecedor / Origem
                </label>
                <input
                  type="text"
                  value={editingStockItem.supplier}
                  onChange={(e) => setEditingStockItem({ ...editingStockItem, supplier: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsEditStockModalOpen(false); setEditingStockItem(null); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR NOVO PEDIDO */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center font-bold shadow-md shadow-red-500/20">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Lançar Novo Pedido
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selecione os itens do cardápio e informe a mesa/cliente
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Split into Menu Catalog & Order Cart */}
            <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
              {/* Left Column: Menu Selector (7 cols) */}
              <div className="lg:col-span-7 space-y-3 flex flex-col">
                {/* Table / Customer Name */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    📍 Mesa / Identificação do Cliente *
                  </label>
                  <input
                    type="text"
                    value={newOrderTable}
                    onChange={(e) => setNewOrderTable(e.target.value)}
                    placeholder="Ex: Mesa 05, Cliente Carlos, Balcão..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                    required
                  />
                  {/* Quick table chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {['Mesa 01', 'Mesa 02', 'Mesa 03', 'Mesa 04', 'Mesa 05', 'Balcão', 'Delivery'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setNewOrderTable(chip)}
                        className={`px-2.5 py-1 rounded-md font-bold whitespace-nowrap transition-all text-[11px] ${
                          newOrderTable === chip
                            ? 'bg-red-500 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Search & Categories */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar no cardápio..."
                      value={newOrderSearch}
                      onChange={(e) => setNewOrderSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'espetos_tradicionais', label: 'Tradicionais' },
                      { id: 'espetos_especiais', label: 'Especiais' },
                      { id: 'acompanhamentos', label: 'Acomp.' },
                      { id: 'bebidas', label: 'Bebidas' },
                      { id: 'sobremesas', label: 'Sobremesas' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewOrderCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap text-[11px] transition-all ${
                          newOrderCategory === cat.id
                            ? 'bg-slate-900 text-red-400 shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Cards Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
                  {filteredModalProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProductForNewOrder(p)}
                      className="bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-300 rounded-xl p-2.5 text-left transition-all group flex flex-col justify-between h-24 relative overflow-hidden cursor-pointer active:scale-95"
                    >
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs line-clamp-1 group-hover:text-red-600">
                          {p.name}
                        </div>
                        {p.requiresMeatPoint && (
                          <span className="text-[9px] text-red-600 bg-red-50 border border-red-200 px-1 py-0.2 rounded font-bold inline-block mt-0.5">
                            🥩 Ponto
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-black text-slate-900 text-xs">
                          R$ {p.price.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="w-5 h-5 rounded-lg bg-slate-900 text-white group-hover:bg-red-500 flex items-center justify-center font-bold text-xs">
                          +
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Order Items Summary & Payment (5 cols) */}
              <div className="lg:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-red-500" />
                      Itens do Pedido ({newOrderItems.reduce((acc, i) => acc + i.quantity, 0)})
                    </span>
                    {newOrderItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNewOrderItems([])}
                        className="text-[11px] font-bold text-slate-400 hover:text-red-600 transition-colors"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Items List */}
                  {newOrderItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <UtensilsCrossed className="w-8 h-8 mx-auto mb-1 opacity-40" />
                      <p className="text-xs font-medium">Nenhum item selecionado ainda.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Clique nos produtos ao lado para adicionar.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {newOrderItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-extrabold text-xs text-slate-900 truncate">
                              {item.productName}
                            </div>
                            {item.meatPoint && (
                              <div className="text-[10px] text-amber-700 font-bold">
                                🥩 {item.meatPoint === 'mal_passada' ? 'Mal Passada' : item.meatPoint === 'ao_ponto' ? 'Ao Ponto' : 'Bem Passada'}
                              </div>
                            )}
                            <div className="text-[11px] font-bold text-slate-500">
                              R$ {item.price.toFixed(2).replace('.', ',')}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQtyInNewOrder(item.id, -1)}
                              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center active:scale-95"
                            >
                              -
                            </button>
                            <span className="text-xs font-black w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQtyInNewOrder(item.id, 1)}
                              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center active:scale-95"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromNewOrder(item.id)}
                              className="w-6 h-6 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Payment status options */}
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newOrderIsPaid}
                          onChange={(e) => setNewOrderIsPaid(e.target.checked)}
                          className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-slate-300"
                        />
                        <span>Pedido já foi Pago?</span>
                      </label>
                      {newOrderIsPaid && (
                        <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          PAGO
                        </span>
                      )}
                    </div>

                    {newOrderIsPaid && (
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'pix', label: 'Pix', icon: QrCode },
                          { id: 'credito', label: 'Crédito', icon: CreditCard },
                          { id: 'debito', label: 'Débito', icon: CreditCard },
                          { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setNewOrderPaymentMethod(m.id as PaymentMethod)}
                            className={`px-2 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 border transition-all ${
                              newOrderPaymentMethod === m.id
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <m.icon className="w-3 h-3" />
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    <input
                      type="text"
                      placeholder="Observações do pedido (ex: sem cebola)..."
                      value={newOrderNotes}
                      onChange={(e) => setNewOrderNotes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Total & Submit */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-slate-900">
                    <span className="text-xs font-extrabold uppercase">Total do Pedido</span>
                    <span className="text-lg font-black text-emerald-600">
                      R$ {newOrderTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNewOrderModalOpen(false)}
                      className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCreateNewOrder}
                      disabled={newOrderItems.length === 0}
                      className="flex-2 py-2.5 text-xs font-black text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmar Pedido</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MINI-MODAL: SELEÇÃO DE PONTO DA CARNE */}
      {selectedProdForMeat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center space-y-1">
              <span className="text-3xl">🥩</span>
              <h4 className="text-base font-black text-slate-900">
                Escolha o Ponto da Carne
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                {selectedProdForMeat.name}
              </p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'mal_passada', label: 'Mal Passada', desc: 'Sua de sangue, bem macia e suculenta' },
                { id: 'ao_ponto', label: 'Ao Ponto', desc: 'Centro rosado e textura equilibrada' },
                { id: 'bem_passada', label: 'Bem Passada', desc: 'Grelhada por completo, bem douradinha' },
              ].map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setSelectedMeatPoint(pt.id as MeatPoint)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedMeatPoint === pt.id
                      ? 'border-red-500 bg-red-50/50 ring-2 ring-red-500/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-extrabold text-xs text-slate-900">{pt.label}</div>
                  <div className="text-[10px] text-slate-500">{pt.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedProdForMeat(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  addItemToNewOrder(selectedProdForMeat, selectedMeatPoint);
                  setSelectedProdForMeat(null);
                }}
                className="flex-1 py-2 text-xs font-black text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-sm"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
