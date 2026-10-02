import React, { useState, useEffect } from 'react';
import { Product, Category, Order, MeatPoint, OrderItem, TABLES } from '../types';
import { 
  Flame, Search, ShoppingBag, Plus, Minus, X, Check, Clock, 
  ChevronRight, ArrowLeft, Utensils, Sparkles, CheckCircle2, 
  AlertCircle, ChefHat, RefreshCw, Smartphone, Eye, Info
} from 'lucide-react';
import { fetchOrdersFromApi, syncOrderToApi } from '../lib/storage';

interface CustomerMenuProps {
  products: Product[];
  initialTable?: string;
  onExitCustomerMode?: () => void;
  onOrderCreated?: (order: Order) => void;
}

const CATEGORIES: { id: Category | 'todos'; label: string; icon: string }[] = [
  { id: 'todos', label: 'Todos', icon: '🍽️' },
  { id: 'espetos', label: 'Espetos & Jantinha', icon: '🍢' },
  { id: 'pratos_executivos', label: 'Pratos Executivos', icon: '🍛' },
  { id: 'batatas_recheadas', label: 'Batatas Recheadas', icon: '🥔' },
  { id: 'pasteis', label: 'Pastéis', icon: '🥟' },
  { id: 'lanches', label: 'Lanches & Dogs', icon: '🍔' },
  { id: 'porcoes', label: 'Porções', icon: '🍟' },
  { id: 'caldos', label: 'Caldos', icon: '🥣' },
  { id: 'bebidas', label: 'Bebidas Geladas', icon: '🍺' },
  { id: 'adicionais', label: 'Adicionais', icon: '➕' },
];

export const CustomerMenu: React.FC<CustomerMenuProps> = ({
  products,
  initialTable = 'Mesa 01',
  onExitCustomerMode,
  onOrderCreated,
}) => {
  const [selectedTable, setSelectedTable] = useState<string>(initialTable);
  const [isChangingTable, setIsChangingTable] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart state
  interface CartItem {
    id: string;
    product: Product;
    quantity: number;
    meatPoint?: MeatPoint;
    notes?: string;
  }
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [orderGeneralNotes, setOrderGeneralNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Item customization modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [modalMeatPoint, setModalMeatPoint] = useState<MeatPoint>('ao_ponto');
  const [modalNotes, setModalNotes] = useState<string>('');

  // Order placed tracking state
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Sync initial table from props or URL
  useEffect(() => {
    if (initialTable) {
      setSelectedTable(initialTable);
    }
  }, [initialTable]);

  // Load existing orders for this table on mount or table change
  const refreshTableOrders = async () => {
    try {
      const allOrders = await fetchOrdersFromApi();
      if (allOrders) {
        const matching = (allOrders || []).filter(
          (o) => o && o.tableOrCustomer && o.tableOrCustomer.toLowerCase().includes(selectedTable.toLowerCase()) && o.status !== 'cancelado'
        );
        setTableOrders(matching);

        // If we have an active order being tracked, update it
        if (activeOrderId) {
          const current = allOrders.find((o) => o.id === activeOrderId);
          if (current) setActiveOrder(current);
        }
      }
    } catch (e) {
      console.warn('Could not refresh orders for customer view', e);
    }
  };

  useEffect(() => {
    refreshTableOrders();
    // Poll table orders every 4 seconds for live status tracking
    const interval = setInterval(refreshTableOrders, 4000);
    return () => clearInterval(interval);
  }, [selectedTable, activeOrderId]);

  // Trigger brief toast
  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  // Open item customization
  const handleOpenProduct = (product: Product) => {
    if (!product.isAvailable) return;
    setSelectedProduct(product);
    setModalQuantity(1);
    setModalMeatPoint('ao_ponto');
    setModalNotes('');
  };

  // Add to cart from modal
  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product: selectedProduct,
      quantity: modalQuantity,
      meatPoint: selectedProduct.requiresMeatPoint ? modalMeatPoint : undefined,
      notes: modalNotes.trim() ? modalNotes.trim() : undefined,
    };

    setCart((prev) => [...prev, newItem]);
    triggerToast(`+${modalQuantity}x ${selectedProduct.name} adicionado à sacola!`);
    setSelectedProduct(null);
  };

  // Remove or change quantity in cart
  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  // Totals calculation
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Submit Order directly to kitchen & system!
  const handleSubmitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const orderNumber = Math.floor(1000 + Math.random() * 9000);
      const nowIso = new Date().toISOString();

      const orderItems: OrderItem[] = cart.map((ci) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: ci.product.id,
        productName: ci.product.name,
        quantity: ci.quantity,
        price: ci.product.price,
        meatPoint: ci.meatPoint,
        notes: ci.notes,
        status: 'aguardando',
        requiresMeatPoint: ci.product.requiresMeatPoint,
        category: ci.product.category,
      }));

      const finalTableLabel = customerName.trim() 
        ? `${selectedTable} (${customerName.trim()})` 
        : `${selectedTable}`;

      const newOrder: Order = {
        id: `order-qr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        orderNumber,
        tableOrCustomer: finalTableLabel,
        items: orderItems,
        status: 'novo',
        createdAt: nowIso,
        updatedAt: nowIso,
        subtotal: cartSubtotal,
        discount: 0,
        serviceFee: 0,
        total: cartSubtotal,
        isPaid: false,
        notes: orderGeneralNotes.trim() 
          ? `[📱 Pedido via QR Code] ${orderGeneralNotes.trim()}` 
          : '[📱 Pedido via QR Code do Cliente]',
      };

      // 1. Post to backend
      await syncOrderToApi(newOrder);

      // 2. Notify parent app if attached
      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }

      // 3. Clear cart and set active order tracking
      setCart([]);
      setIsCartOpen(false);
      setActiveOrderId(newOrder.id);
      setActiveOrder(newOrder);
      setOrderGeneralNotes('');

      // Refresh table orders
      await refreshTableOrders();

      triggerToast('🎉 Pedido enviado para a churrasqueira!');
    } catch (err) {
      console.error('Failed to submit customer order:', err);
      alert('Houve um erro ao enviar o pedido. Por favor, tente novamente ou chame o garçom.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products
  const filteredProducts = (products || []).filter((p) => {
    if (!p) return false;
    const matchesCat = selectedCategory === 'todos' || p.category === selectedCategory;
    const matchesSearch = 
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-28 selection:bg-red-500 selection:text-white">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white border border-red-500/40 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Top Banner / Restaurant Info */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center shadow-lg shadow-red-500/20 text-white shrink-0">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  MARESIA
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-ping" />
                  18:00 - 23:00
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                (67) 99125-6083 • @maresia
              </p>
            </div>
          </div>

          {/* Table Selector Pill */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsChangingTable(true)}
              className="flex items-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Clique para trocar de mesa"
            >
              <span>📍</span>
              <span className="font-black">{selectedTable}</span>
              <span className="text-[10px] text-red-300 underline ml-0.5">Trocar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Active Order Live Tracking Banner (if customer recently made an order) */}
      {activeOrder && (
        <div className="max-w-2xl mx-auto w-full px-4 pt-4">
          <div className="bg-gradient-to-r from-slate-800 to-slate-850 border border-red-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-red-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono font-black text-xs border border-red-500/30">
                  #{activeOrder.orderNumber}
                </span>
                <span className="text-xs font-bold text-white">Status do Seu Pedido</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Atualizado ao vivo
              </span>
            </div>

            {/* Stepper Progress */}
            <div className="grid grid-cols-3 gap-2 my-2 text-center text-xs">
              {/* Step 1: Recebido */}
              <div className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                activeOrder.status === 'novo'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold ring-2 ring-amber-500/30'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  activeOrder.status === 'novo' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-700 text-slate-300'
                }`}>
                  1
                </div>
                <span className="text-[11px] leading-tight">Recebido na Cozinha</span>
              </div>

              {/* Step 2: Na Churrasqueira */}
              <div className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                activeOrder.status === 'na_churrasqueira'
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-300 font-bold ring-2 ring-orange-500/30 animate-pulse'
                  : activeOrder.status === 'pronto' || activeOrder.status === 'entregue'
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : 'bg-slate-850/50 border-slate-800 text-slate-500'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  activeOrder.status === 'na_churrasqueira' ? 'bg-orange-500 text-slate-950 font-black' : 'bg-slate-700 text-slate-400'
                }`}>
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] leading-tight">Na Brasa / Preparo</span>
              </div>

              {/* Step 3: Pronto */}
              <div className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                activeOrder.status === 'pronto' || activeOrder.status === 'entregue'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold ring-2 ring-emerald-500/30'
                  : 'bg-slate-850/50 border-slate-800 text-slate-500'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  activeOrder.status === 'pronto' || activeOrder.status === 'entregue' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-700 text-slate-400'
                }`}>
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] leading-tight">Pronto p/ Mesa!</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800">
              <span className="text-slate-400">
                {activeOrder.items.length} {activeOrder.items.length === 1 ? 'item' : 'itens'} • Total: <strong className="text-white">R$ {activeOrder.total.toFixed(2)}</strong>
              </span>
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="text-red-400 hover:text-red-300 underline font-semibold cursor-pointer"
              >
                Ver conta da mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-4 space-y-4">
        {/* Search bar & Table Orders summary trigger */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar espeto, cerveja, porção..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {tableOrders.length > 0 && (
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-750 px-3 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer shadow-sm"
              title="Ver conta da mesa"
            >
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Conta da Mesa</span>
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                {tableOrders.length}
              </span>
            </button>
          )}
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x -mx-4 px-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/80'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Products Grid / List */}
        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-800/40 rounded-3xl border border-slate-800">
              <Utensils className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">Nenhum item encontrado</p>
              <p className="text-xs text-slate-500 mt-1">Tente pesquisar por outro nome ou categoria.</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleOpenProduct(product)}
                className={`bg-slate-800/90 hover:bg-slate-800 border rounded-2xl p-3 sm:p-3.5 transition-all flex gap-3 sm:gap-4 items-center relative overflow-hidden group cursor-pointer active:scale-[0.99] ${
                  product.isAvailable
                    ? 'border-slate-700/80 hover:border-red-500/40 shadow-sm'
                    : 'border-slate-800 opacity-60 grayscale cursor-not-allowed'
                }`}
              >
                {/* Product Photo */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-900 shrink-0 relative border border-slate-700/50">
                  <img
                    src={product.photoUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {!product.isAvailable && (
                    <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center text-[10px] font-black uppercase tracking-wider text-red-400">
                      Esgotado
                    </div>
                  )}
                  {product.requiresMeatPoint && product.isAvailable && (
                    <span className="absolute bottom-1 right-1 bg-red-600/90 text-white text-[9px] font-black px-1 py-0.5 rounded shadow">
                      🥩 Brasa
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className="font-bold text-sm sm:text-base text-white leading-tight truncate">
                      {product.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2">
                    {product.description || 'Preparo especial na brasa com tempero exclusivo.'}
                  </p>
                  
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] text-slate-400 font-semibold">R$</span>
                      <span className="text-base sm:text-lg font-black text-amber-400">
                        {product.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        /{product.unit}
                      </span>
                    </div>

                    {product.isAvailable ? (
                      <button
                        type="button"
                        className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-md shadow-red-500/20 active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pedir</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-500">Indisponível</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Floating Cart Bottom Pill Bar */}
      {cartItemsCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 inset-x-0 z-40 px-4 max-w-lg mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black py-3.5 px-5 rounded-2xl shadow-2xl shadow-red-600/40 border border-red-400/30 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer animate-in slide-in-from-bottom-6 duration-300"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center font-black text-xs">
                {cartItemsCount}
              </div>
              <span className="text-sm font-extrabold tracking-wide">
                Ver Sacola ({selectedTable})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black bg-black/20 px-2.5 py-1 rounded-lg">
                R$ {cartSubtotal.toFixed(2)}
              </span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Item Customization Modal / Bottom Sheet */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            {/* Header Image */}
            <div className="relative h-44 sm:h-52 bg-slate-950 shrink-0">
              <img
                src={selectedProduct.photoUrl}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/60" />
              
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3 left-4 right-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-400 bg-red-950/70 border border-red-800/40 px-2 py-0.5 rounded-full inline-block mb-1">
                  {selectedProduct.category.replace('_', ' ')}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  {selectedProduct.name}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {selectedProduct.description || 'Grelhado artesanal preparado na brasa com tempero do chefe.'}
              </p>

              {/* Meat Point Selector (if requiresMeatPoint) */}
              {selectedProduct.requiresMeatPoint && (
                <div className="space-y-2 bg-slate-800/70 border border-slate-750 p-3.5 rounded-2xl">
                  <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span>🥩</span>
                    <span>Ponto da Carne (Obrigatório):</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'mal_passada', label: 'Mal Passada', desc: 'Suculenta / Vermelha' },
                      { id: 'ao_ponto', label: 'Ao Ponto', desc: 'Recomendação do Chefe' },
                      { id: 'bem_passada', label: 'Bem Passada', desc: 'Sem sangue / Firme' },
                    ].map((pt) => (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => setModalMeatPoint(pt.id as MeatPoint)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          modalMeatPoint === pt.id
                            ? 'bg-red-500/20 border-red-500 text-white font-black ring-2 ring-red-500/30'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-xs font-bold">{pt.label}</div>
                        <div className="text-[10px] text-slate-400 leading-tight">{pt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions / Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Alguma observação para este item? (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: sem cebola, limão e gelo no copo, farofa separada..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-300">Quantidade:</span>
                <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold transition-all cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-black text-sm text-white">
                    {modalQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Total do item:</span>
                <span className="text-lg font-black text-amber-400">
                  R$ {(selectedProduct.price * modalQuantity).toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg shadow-red-500/30 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Adicionar à Sacola</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer / Review Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            {/* Cart Header */}
            <div className="px-4 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base text-white">
                    Sua Sacola de Pedidos
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Pedido para: <strong className="text-red-400">{selectedTable}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="font-bold text-sm">Sua sacola está vazia</p>
                  <p className="text-xs text-slate-500 mt-1">Adicione espetos e bebidas do cardápio para pedir.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-800/80 border border-slate-750 rounded-2xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                          {item.product.name}
                        </h4>
                        <span className="font-black text-xs text-amber-400 shrink-0">
                          R$ {(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      
                      {item.meatPoint && (
                        <div className="text-[10px] font-bold text-red-400 mt-0.5">
                          Ponto: {item.meatPoint.replace('_', ' ')}
                        </div>
                      )}
                      
                      {item.notes && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5">
                          Obs: {item.notes}
                        </div>
                      )}
                    </div>

                    {/* Quantity Modifier */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQuantity(item.id, -1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-xs text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQuantity(item.id, 1)}
                        className="w-6 h-6 rounded bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Extra inputs when cart has items */}
              {cart.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-300">
                      Seu Nome (opcional, para identificação):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos, Família Silva..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-300">
                      Observação geral do pedido (opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Trazer pratos e talheres adicionais..."
                      value={orderGeneralNotes}
                      onChange={(e) => setOrderGeneralNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 text-[11px] text-amber-300 flex items-start gap-2">
                    <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Ao confirmar, seu pedido será enviado <strong>instantaneamente</strong> para a tela da churrasqueira e cozinha!
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Mesa:</span>
                  <strong className="text-white font-bold">{selectedTable}</strong>
                </div>
                <div className="flex items-center justify-between text-sm sm:text-base border-t border-slate-800/80 pt-2">
                  <span className="font-bold text-slate-300">Total do Pedido:</span>
                  <span className="font-black text-xl text-amber-400">
                    R$ {cartSubtotal.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitOrder}
                  className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm py-3.5 rounded-2xl shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enviando para a churrasqueira...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4 text-amber-300" />
                      <span>Confirmar e Enviar Pedido</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Change Modal */}
      {isChangingTable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>📍</span>
                <span>Selecione sua Mesa</span>
              </h3>
              <button
                onClick={() => setIsChangingTable(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Escolha a mesa onde você está acomodado para que o garçom traga seu pedido no local correto:
            </p>

            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
              {TABLES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSelectedTable(t);
                    setIsChangingTable(false);
                    triggerToast(`Mesa alterada para ${t}`);
                  }}
                  className={`p-2.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
                    selectedTable === t
                      ? 'bg-red-500 text-white font-black shadow-md shadow-red-500/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table Accumulated Orders History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-sm text-white">
                  Histórico & Conta da {selectedTable}
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              {tableOrders.length === 0 ? (
                <p className="text-center py-8 text-slate-500">
                  Nenhum pedido registrado para esta mesa ainda.
                </p>
              ) : (
                tableOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-red-400 font-mono">
                        Pedido #{ord.orderNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        ord.status === 'pronto' || ord.status === 'entregue'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : ord.status === 'na_churrasqueira'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {ord.status === 'novo' ? 'Recebido' : ord.status === 'na_churrasqueira' ? 'Na Grelha' : 'Pronto'}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-750">
                      {ord.items.map((it) => (
                        <div key={it.id} className="py-1 flex items-center justify-between text-slate-300">
                          <span>
                            {it.quantity}x {it.productName}
                            {it.meatPoint ? ` (${it.meatPoint.replace('_', ' ')})` : ''}
                          </span>
                          <span className="font-semibold text-slate-400">
                            R$ {(it.price * it.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1.5 border-t border-slate-750 flex items-center justify-between font-bold text-white">
                      <span>Subtotal</span>
                      <span className="text-amber-400 font-black">
                        R$ {ord.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total of the table */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block">
                  Total Acumulado da Mesa:
                </span>
                <span className="text-xl font-black text-amber-400">
                  R$ {tableOrders.reduce((acc, o) => acc + o.total, 0).toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation / Staff Link */}
      <footer className="mt-auto pt-8 pb-4 text-center border-t border-slate-800/60 max-w-2xl mx-auto w-full px-4 text-slate-500 text-xs">
        <p className="font-semibold text-slate-300">
          Maresia • Cardápio Digital Interativo
        </p>
        <p className="text-[11px] mt-1 text-slate-400">
          Horário: 18:00 às 23:00 • WhatsApp: (67) 99125-6083 • @maresia
        </p>

        {onExitCustomerMode && (
          <div className="mt-4 pt-3 border-t border-slate-800/40">
            <button
              onClick={onExitCustomerMode}
              className="text-[11px] text-slate-500 hover:text-slate-300 underline font-medium cursor-pointer inline-flex items-center gap-1"
            >
              <span>🔒 Área da Equipe / Acessar Sistema</span>
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};
