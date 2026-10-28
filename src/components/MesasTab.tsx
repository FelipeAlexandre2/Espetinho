import React, { useState, useMemo } from 'react';
import { 
  Order, OrderItem, Product, AppUser, MeatPoint, 
  TABLE_OPTIONS, ReceiptType 
} from '../types';
import { 
  Utensils, Plus, Minus, Trash2, Printer, Search, 
  Check, X, Clock, DollarSign, Users, ShoppingBag, 
  AlertCircle, ChefHat, Flame, Sparkles, Receipt,
  CheckCircle2, ArrowRight, RefreshCw, Layers
} from 'lucide-react';
import { printReceiptDirect, getReceiptSettings } from '../utils/printReceipt';
import { isBeverageProduct, isSkewerOrMeatProduct } from '../utils/productUtils';
import { sendOrderToPrintQueue } from '../lib/storage';

interface MesasTabProps {
  orders: Order[];
  products: Product[];
  currentUser: AppUser;
  onCreateOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateOrderItems?: (orderId: string, items: OrderItem[], newTotal: number) => void;
  onPrintReceipt: (order: Order, type?: ReceiptType) => void;
  onGoToCaixa?: (tableName: string) => void;
}

export const MesasTab: React.FC<MesasTabProps> = ({
  orders,
  products,
  currentUser,
  onCreateOrder,
  onUpdateOrderItems,
  onPrintReceipt,
  onGoToCaixa,
}) => {
  // Currently selected table to view or add items
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Filter state for tables grid
  const [tableFilter, setTableFilter] = useState<'todas' | 'livres' | 'ocupadas'>('todas');
  const [searchTableQuery, setSearchTableQuery] = useState('');

  // Menu Category Filter inside the ordering view
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchProductQuery, setSearchProductQuery] = useState('');

  // Cart of new items being prepared for the selected table
  const [newItems, setNewItems] = useState<OrderItem[]>([]);
  
  // Meat point selection modal/popover
  const [meatPointItem, setMeatPointItem] = useState<{ product: Product; meatPoint: MeatPoint } | null>(null);
  const [itemNote, setItemNote] = useState<string>('');

  // Success notification after order emission
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Group active orders by table name
  const activeOrdersByTable = useMemo(() => {
    const map: Record<string, Order> = {};
    (orders || [])
      .filter((o) => o && !o.isPaid && o.status !== 'cancelado')
      .forEach((ord) => {
        if (ord.tableOrCustomer) {
          map[ord.tableOrCustomer] = ord;
        }
      });
    return map;
  }, [orders]);

  // Categories available in products
  const categories = useMemo(() => {
    const set = new Set<string>();
    (products || []).forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['todos', ...Array.from(set)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      if (!p.isAvailable) return false;
      const matchesCat = selectedCategory === 'todos' || p.category === selectedCategory;
      const matchesQuery =
        !searchProductQuery ||
        p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchProductQuery.toLowerCase()));
      return matchesCat && matchesQuery;
    });
  }, [products, selectedCategory, searchProductQuery]);

  // Overall metrics
  const totalTables = TABLE_OPTIONS.length;
  const occupiedCount = Object.keys(activeOrdersByTable).length;
  const freeCount = totalTables - occupiedCount;
  const totalInConsumption = (Object.values(activeOrdersByTable) as Order[]).reduce(
    (sum, ord) => sum + (ord.total || 0),
    0
  );

  // Filtered tables for the grid
  const displayedTables = useMemo(() => {
    return TABLE_OPTIONS.filter((tableName) => {
      const isOccupied = !!activeOrdersByTable[tableName];
      if (tableFilter === 'livres' && isOccupied) return false;
      if (tableFilter === 'ocupadas' && !isOccupied) return false;
      if (searchTableQuery) {
        return tableName.toLowerCase().includes(searchTableQuery.toLowerCase());
      }
      return true;
    });
  }, [activeOrdersByTable, tableFilter, searchTableQuery]);

  // Open a table for ordering
  const handleOpenTable = (tableName: string) => {
    setSelectedTable(tableName);
    setNewItems([]);
    setSelectedCategory('todos');
    setSearchProductQuery('');
  };

  // Close the ordering panel
  const handleCloseTable = () => {
    setSelectedTable(null);
    setNewItems([]);
  };

  // Add a product to the pending items for the table
  const handleAddProduct = (product: Product, meatPoint?: MeatPoint, notes?: string) => {
    // Check whether the product is a beverage or skewer/meat
    const isDrink = isBeverageProduct(product);
    const isSkewer = !isDrink && isSkewerOrMeatProduct(product);

    // Meat point prompt ONLY appears for skewers/meats, NEVER for beverages
    if (isSkewer && !meatPoint) {
      setMeatPointItem({ product, meatPoint: 'ao_ponto' });
      setItemNote('');
      return;
    }

    setNewItems((prev) => {
      const targetMeatPoint = isDrink ? undefined : meatPoint;
      const existingIdx = prev.findIndex(
        (i) => i.productId === product.id && i.meatPoint === targetMeatPoint && (i.notes || '') === (notes || '')
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1,
        };
        return updated;
      }
      const newItem: OrderItem = {
        id: `table-item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        meatPoint: targetMeatPoint,
        notes: notes || undefined,
        status: 'entregue',
        requiresMeatPoint: isSkewer,
        category: product.category,
      };
      return [...prev, newItem];
    });
  };

  const handleConfirmMeatPoint = () => {
    if (meatPointItem) {
      handleAddProduct(meatPointItem.product, meatPointItem.meatPoint, itemNote);
      setMeatPointItem(null);
      setItemNote('');
    }
  };

  const handleUpdateItemQty = (index: number, delta: number) => {
    setNewItems((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        updated.splice(index, 1);
      } else {
        updated[index] = { ...updated[index], quantity: newQty };
      }
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setNewItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Confirm Order & Print Kitchen/Grill Production Sticker
  const handleConfirmAndPrint = () => {
    if (!selectedTable || newItems.length === 0) return;

    const currentActiveOrder = activeOrdersByTable[selectedTable];
    const newItemsSubtotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let finalOrderForPrinting: Order;

    if (currentActiveOrder) {
      // Append new items to existing table order
      const combinedItems = [...currentActiveOrder.items, ...newItems];
      const updatedTotal = combinedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      
      if (onUpdateOrderItems) {
        onUpdateOrderItems(currentActiveOrder.id, combinedItems, updatedTotal);
      }

      // Order representation with JUST the new items for the kitchen sticker
      finalOrderForPrinting = {
        ...currentActiveOrder,
        items: newItems,
        total: newItemsSubtotal,
        notes: `Adicional Mesa ${selectedTable}`,
      };
    } else {
      // Create fresh new order for this table
      const newOrderData = {
        orderNumber: Math.floor(1000 + Math.random() * 9000),
        customerName: selectedTable,
        tableOrCustomer: selectedTable,
        items: newItems,
        status: 'novo' as const,
        subtotal: newItemsSubtotal,
        discount: 0,
        serviceFee: 0,
        total: newItemsSubtotal,
        isPaid: false,
        notes: `Atendente: ${currentUser.name}`,
      };

      onCreateOrder(newOrderData);

      finalOrderForPrinting = {
        ...newOrderData,
        id: `order-temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Detect if running on mobile device or desktop
    const isMobileDevice = typeof window !== 'undefined' && (
      window.innerWidth <= 768 || 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );

    // Send to USB Printer queue on the computer
    sendOrderToPrintQueue(finalOrderForPrinting, 'etiqueta_mesa', isMobileDevice ? 'celular' : 'terminal').catch(console.warn);

    // If on computer (or non-mobile), trigger local print directly as well
    if (!isMobileDevice) {
      try {
        const settings = getReceiptSettings();
        printReceiptDirect(finalOrderForPrinting, settings, 'etiqueta_mesa', '58mm');
      } catch (e) {
        console.warn('Erro na impressão direta, abrindo modal:', e);
        onPrintReceipt(finalOrderForPrinting, 'etiqueta_mesa');
      }
    }

    setSuccessBanner(`✅ Pedido lançado na ${selectedTable}! Etiqueta 58mm enviada para a impressora USB.`);
    setNewItems([]);
    
    // Auto-clear success banner after 4 seconds
    setTimeout(() => {
      setSuccessBanner(null);
    }, 4000);
  };

  // Current active order for selected table
  const activeOrder = selectedTable ? activeOrdersByTable[selectedTable] : null;
  const newItemsTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const existingOrderTotal = activeOrder ? activeOrder.total : 0;
  const combinedTotal = existingOrderTotal + newItemsTotal;

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-sm">{successBanner}</p>
              <p className="text-xs text-emerald-100">Etiqueta pronta para a equipe de produção não se perder.</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner: Metrics & Quick Summary */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Utensils className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Mapa de Mesas & Atendimento
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Selecione o número da mesa para lançar os itens do cardápio e emitir a etiqueta de produção na hora.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[80px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total</span>
              <span className="text-base sm:text-lg font-black text-slate-800">{totalTables}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-center min-w-[80px]">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Livres</span>
              <span className="text-base sm:text-lg font-black text-emerald-700">{freeCount}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-center min-w-[80px]">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Ocupadas</span>
              <span className="text-base sm:text-lg font-black text-rose-700">{occupiedCount}</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-slate-900 text-white min-w-[130px] text-right">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Consumo Atual</span>
              <span className="text-base sm:text-lg font-black text-white">
                R$ {totalInConsumption.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Filters */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setTableFilter('todas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                tableFilter === 'todas'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({totalTables})
            </button>
            <button
              onClick={() => setTableFilter('livres')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                tableFilter === 'livres'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Livres ({freeCount})
            </button>
            <button
              onClick={() => setTableFilter('ocupadas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                tableFilter === 'ocupadas'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Ocupadas ({occupiedCount})
            </button>
          </div>

          {/* Search Table */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar mesa..."
              value={searchTableQuery}
              onChange={(e) => setSearchTableQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Main Grid of Tables */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {displayedTables.map((tableName) => {
          const activeOrd = activeOrdersByTable[tableName];
          const isOccupied = !!activeOrd;
          const itemsCount = isOccupied
            ? (activeOrd.items || []).reduce((sum, i) => sum + i.quantity, 0)
            : 0;
          const orderTime = isOccupied && activeOrd.createdAt
            ? new Date(activeOrd.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : null;

          return (
            <div
              key={tableName}
              onClick={() => handleOpenTable(tableName)}
              className={`group relative rounded-3xl p-4 sm:p-5 transition-all duration-200 cursor-pointer border flex flex-col justify-between select-none active:scale-95 ${
                isOccupied
                  ? 'bg-white border-rose-200 hover:border-rose-400 hover:shadow-lg shadow-sm ring-1 ring-rose-100'
                  : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md'
              }`}
            >
              {/* Top Row: Table Name & Status Badge */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Espaço
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight group-hover:text-amber-600 transition">
                    {tableName}
                  </h3>
                </div>

                <span
                  className={`w-3 h-3 rounded-full shrink-0 shadow-xs ring-4 ${
                    isOccupied
                      ? 'bg-rose-500 ring-rose-100 animate-pulse'
                      : 'bg-emerald-500 ring-emerald-100'
                  }`}
                  title={isOccupied ? 'Mesa Ocupada' : 'Mesa Livre'}
                />
              </div>

              {/* Middle Section: Consumption Details or Ready Status */}
              <div className="my-4">
                {isOccupied ? (
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">Total:</span>
                      <span className="text-base font-black text-rose-600">
                        R$ {activeOrd.total.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" />
                        {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
                      </span>
                      {orderTime && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {orderTime}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      Disponível
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Action Prompt */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className={isOccupied ? 'text-rose-600' : 'text-slate-500 group-hover:text-amber-600'}>
                  {isOccupied ? 'Ver / Adicionar' : '+ Abrir Pedido'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* DEDICATED ORDERING MODAL / PANEL FOR THE SELECTED TABLE                  */}
      {/* ========================================================================= */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-50 rounded-[32px] w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xl shadow-inner">
                  🪑
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {selectedTable}
                    </h2>
                    {activeOrder ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white">
                        Mesa Ocupada
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white">
                        Nova Mesa
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Atendente: <strong className="text-amber-400">{currentUser.name}</strong> • Selecione os itens do cardápio e emita a etiqueta de produção
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseTable}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: 2-Column Responsive Layout */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
              {/* Left Column: Full Cardápio Menu (Cols 7 on LG) */}
              <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 overflow-hidden bg-white">
                {/* Search & Categories */}
                <div className="space-y-3 mb-4 shrink-0">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Pesquisar espetos, porções, bebidas..."
                      value={searchProductQuery}
                      onChange={(e) => setSearchProductQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat === 'todos' ? '🍽️ Todos' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Cards List */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                  {filteredProducts.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Nenhum produto encontrado nesta categoria.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {filteredProducts.map((product) => {
                        const isDrink = isBeverageProduct(product);
                        const isSkewer = !isDrink && isSkewerOrMeatProduct(product);

                        return (
                          <div
                            key={product.id}
                            className="p-3 rounded-2xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/30 transition flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              {product.photoUrl ? (
                                <img
                                  src={product.photoUrl}
                                  alt={product.name}
                                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 text-slate-400 text-lg">
                                  {isDrink ? '🥤' : isSkewer ? '🍢' : '🍽️'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                                  {product.name}
                                </h4>
                                <span className="text-xs font-black text-emerald-600 block">
                                  R$ {product.price.toFixed(2).replace('.', ',')}
                                </span>
                                {isSkewer && (
                                  <span className="text-[10px] font-extrabold text-orange-600 block">
                                    🥩 Escolher Ponto da Carne
                                  </span>
                                )}
                                {isDrink && (
                                  <span className="text-[10px] font-semibold text-blue-600 block">
                                    🥤 Bebida
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddProduct(product)}
                              className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm transition active:scale-95 cursor-pointer font-black"
                              title={isSkewer ? "Escolher ponto da carne e adicionar à mesa" : "Adicionar diretamente à mesa"}
                            >
                              <Plus className="w-4 h-4 stroke-[3]" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Table Comanda & Ticket Summary (Cols 5 on LG) */}
              <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col bg-slate-100 overflow-hidden">
                {/* Panel Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-4 h-4 text-slate-600" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                      Comanda da {selectedTable}
                    </h3>
                  </div>

                  {activeOrder && (
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                      Conta Aberta
                    </span>
                  )}
                </div>

                {/* Items Container */}
                <div className="flex-1 overflow-y-auto py-3 space-y-4">
                  {/* Section 1: Previously ordered items on table */}
                  {activeOrder && activeOrder.items.length > 0 && (
                    <div className="p-3 rounded-2xl bg-white border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Já Consumido na Mesa
                        </span>
                        <span className="text-xs font-black text-slate-700">
                          R$ {activeOrder.total.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div className="space-y-1.5 divide-y divide-slate-100 text-xs">
                        {activeOrder.items.map((it, idx) => (
                          <div key={idx} className="pt-1.5 first:pt-0 flex justify-between text-slate-600">
                            <div>
                              <span>
                                {it.quantity}x {it.productName}
                              </span>
                              {it.meatPoint && (
                                <span className="ml-1 text-[10px] text-orange-600 font-bold">
                                  ({it.meatPoint.replace('_', ' ')})
                                </span>
                              )}
                              {it.notes && (
                                <span className="block text-[10px] text-slate-400 italic">
                                  Obs: {it.notes}
                                </span>
                              )}
                            </div>
                            <span className="font-bold shrink-0">
                              R$ {(it.price * it.quantity).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 2: NEW items to order right now */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-600" />
                        Novos Itens a Lançar & Imprimir
                      </span>
                      <span className="text-xs font-black text-amber-800">
                        {newItems.length} {newItems.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>

                    {newItems.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        <ShoppingBag className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        Clique no <strong className="text-slate-600">+</strong> dos produtos ao lado para montar o pedido desta mesa.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {newItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-white border border-amber-200/80 shadow-2xs flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {item.productName}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span>R$ {item.price.toFixed(2).replace('.', ',')}</span>
                                {item.meatPoint && (
                                  <span className="font-bold text-orange-600 bg-orange-50 px-1.5 py-0.2 rounded text-[10px]">
                                    🥩 {item.meatPoint.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                              {item.notes && (
                                <p className="text-[10px] text-slate-400 italic truncate">
                                  Obs: {item.notes}
                                </p>
                              )}
                            </div>

                            {/* Qty controls */}
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                onClick={() => handleUpdateItemQty(idx, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-black text-xs text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateItemQty(idx, 1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleRemoveItem(idx)}
                                className="w-6 h-6 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer ml-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Totals and Primary Action Button */}
                <div className="pt-3 border-t border-slate-200 shrink-0 space-y-3">
                  <div className="space-y-1">
                    {activeOrder && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Consumo Anterior:</span>
                        <span className="font-bold">
                          R$ {activeOrder.total.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-slate-700 font-bold">
                      <span>Novos Itens:</span>
                      <span className="text-amber-600">
                        R$ {newItemsTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                      <span>Total Geral da Mesa:</span>
                      <span className="text-emerald-600">
                        R$ {combinedTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Primary Action Button: Lançar e Imprimir Etiqueta */}
                  <button
                    onClick={handleConfirmAndPrint}
                    disabled={newItems.length === 0}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Printer className="w-5 h-5" />
                    <span>Lançar Pedido & Imprimir Etiqueta</span>
                  </button>

                  {/* Secondary Table Actions */}
                  {activeOrder && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onPrintReceipt(activeOrder, 'pre_conta')}
                        className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        <span>Imprimir Parcial</span>
                      </button>

                      {onGoToCaixa && (
                        <button
                          onClick={() => {
                            handleCloseTable();
                            onGoToCaixa(selectedTable);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Cobrar no Caixa</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MEAT POINT SELECTION MODAL                                                */}
      {/* ========================================================================= */}
      {meatPointItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-slate-800 mb-1">
              Ponto da Carne: {meatPointItem.product.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              A etiqueta de produção sairá com esta informação para a churrasqueira.
            </p>

            <div className="space-y-2 mb-4">
              {(['mal_passada', 'ao_ponto', 'bem_passada'] as MeatPoint[]).map((pt) => {
                const label = pt === 'mal_passada' ? '🥩 Mal Passada (Vermelha por dentro)' : pt === 'ao_ponto' ? '🍖 Ao Ponto (Suculenta e rosada)' : '🔥 Bem Passada (Sem ponto rosado)';
                const isSelected = meatPointItem.meatPoint === pt;
                return (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setMeatPointItem({ ...meatPointItem, meatPoint: pt })}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-400/40'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{label}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                  </button>
                );
              })}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observação opcional:
              </label>
              <input
                type="text"
                placeholder="Ex: sem sal, bem tostadinho..."
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMeatPointItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmMeatPoint}
                className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md cursor-pointer"
              >
                Confirmar Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
