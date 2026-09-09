import React, { useState, useMemo } from 'react';
import { Product, Order, CashShift, PaymentMethod, OrderItem, TABLES, AppUser, hasPermission } from '../types';
import { 
  DollarSign, ShoppingCart, Lock, Unlock, Plus, Minus, Trash2, 
  QrCode, CreditCard, Banknote, Sparkles, CheckCircle2, 
  Printer, User, Receipt, Utensils, ChevronDown, ChevronUp, ShieldAlert
} from 'lucide-react';

interface CaixaTabProps {
  products?: Product[];
  orders: Order[];
  cashShift: CashShift;
  currentUser?: AppUser;
  onOpenShift: (operatorName: string, initialFloat: number) => void;
  onCloseShift: (finalCashInHand: number) => void;
  onCreateOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => void;
  onPayTableOrders?: (
    tableOrCustomer: string,
    paymentMethod: PaymentMethod,
    extraCartItems: OrderItem[],
    discount: number,
    includeServiceFee: boolean
  ) => void;
  onPrintReceipt: (order: Order) => void;
}

interface CartItem extends OrderItem {
  requiresMeatPoint?: boolean;
}

export const CaixaTab: React.FC<CaixaTabProps> = ({
  products,
  orders,
  cashShift,
  currentUser,
  onOpenShift,
  onCloseShift,
  onCreateOrder,
  onPayTableOrders,
  onPrintReceipt,
}) => {
  const canOpenCloseCash = hasPermission(currentUser, 'open_close_shift');
  const canApplyDiscounts = hasPermission(currentUser, 'give_discounts');
  const canOperatePos = hasPermission(currentUser, 'access_caixa');

  // POS State
  const [selectedTable, setSelectedTable] = useState('Mesa 01');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [includeServiceFee, setIncludeServiceFee] = useState(true);

  // Map open active unpaid orders per table
  const openOrdersByTable = useMemo(() => {
    const map: Record<string, Order[]> = {};
    orders.forEach((ord) => {
      if (!ord.isPaid && ord.status !== 'cancelado') {
        const tbl = ord.tableOrCustomer;
        if (!map[tbl]) {
          map[tbl] = [];
        }
        map[tbl].push(ord);
      }
    });
    return map;
  }, [orders]);

  // Active orders for currently selected table
  const currentTableOrders = openOrdersByTable[selectedTable] || [];
  const currentTableActiveItems = currentTableOrders.flatMap((o) => o.items);
  const currentTableTotal = currentTableOrders.reduce((sum, o) => sum + o.total, 0);

  // Array of occupied tables with active unpaid consumption
  const occupiedTablesList = useMemo(() => {
    return Object.keys(openOrdersByTable)
      .filter((tbl) => (openOrdersByTable[tbl] || []).length > 0)
      .map((tbl) => {
        const activeOrds = openOrdersByTable[tbl];
        const itemCount = activeOrds.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
        const totalBill = activeOrds.reduce((sum, o) => sum + o.total, 0);
        return {
          table: tbl,
          itemCount,
          totalBill,
        };
      });
  }, [openOrdersByTable]);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [amountReceived, setAmountReceived] = useState<number>(0);

  // Cash shift modal state
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [operatorInput, setOperatorInput] = useState(cashShift.operatorName || 'Atendente');
  const [floatInput, setFloatInput] = useState(cashShift.initialFloat || 150);
  const [closingCashInput, setClosingCashInput] = useState(cashShift.initialFloat + cashShift.salesByPaymentMethod.dinheiro);

  const [showMobileTables, setShowMobileTables] = useState<boolean>(false);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const serviceFee = includeServiceFee ? (currentTableTotal + subtotal) * 0.10 : 0;
  const totalExtraCart = Math.max(0, subtotal - discount);

  // Combined Grand Total for currently selected table (Table Accumulated + Cart Total + Service Fee)
  const grandTotalToPay = Math.max(0, currentTableTotal + totalExtraCart + serviceFee);
  const changeDue = Math.max(0, amountReceived - grandTotalToPay);

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeCartItem = (cartItemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== cartItemId));
  };

  // Submit Order (Full payment for table account + any new cart items)
  const handleFinalizeOrder = () => {
    if (cart.length === 0 && currentTableOrders.length === 0) return;

    if (cashShift.status !== 'aberto') {
      alert('Atenção: Abra o caixa antes de lançar vendas!');
      setIsShiftModalOpen(true);
      return;
    }

    if (onPayTableOrders) {
      onPayTableOrders(selectedTable, paymentMethod, cart, discount, includeServiceFee);
    } else {
      if (cart.length > 0) {
        onCreateOrder({
          tableOrCustomer: selectedTable,
          items: cart,
          status: 'novo',
          subtotal,
          discount,
          serviceFee,
          total: grandTotalToPay,
          paymentMethod,
          isPaid: true,
        });
      }
    }

    // Reset cart & close payment modal
    setCart([]);
    setIsPaymentModalOpen(false);
  };

  const cartTotalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-12">
      {/* Top Bar - Cashier Shift Status & Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 text-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-xl text-slate-900 uppercase tracking-tight flex items-center gap-2">
                💰 Frente de Caixa (POS)
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                cashShift.status === 'aberto' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cashShift.status === 'aberto' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {cashShift.status === 'aberto' ? 'Caixa Aberto' : 'Caixa Fechado'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Operador: <strong className="text-slate-800">{cashShift.operatorName || 'Atendente'}</strong> • Fundo de Troco: <strong className="text-slate-800">R$ {(cashShift.initialFloat || 0).toFixed(2).replace('.', ',')}</strong>
            </p>
          </div>
        </div>

        {/* Shift sales totals & Open/Close Cash buttons */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t border-slate-100 md:border-t-0">
          <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-bold">Vendas no Turno</span>
            <span className="font-black text-emerald-600 text-sm">
              R$ {cashShift.totalSales.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {cashShift.status === 'aberto' ? (
            <button
              type="button"
              disabled={!canOpenCloseCash}
              onClick={() => {
                if (!canOpenCloseCash) return;
                setClosingCashInput(cashShift.initialFloat + cashShift.salesByPaymentMethod.dinheiro);
                setIsShiftModalOpen(true);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-xs flex items-center space-x-1.5 shrink-0 ${
                canOpenCloseCash
                  ? 'cursor-pointer active:scale-95 bg-rose-600 hover:bg-rose-500 text-white border border-rose-600'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
              title={!canOpenCloseCash ? 'Requer permissão de Gerência/Supervisor para fechar caixa' : 'Fechar turno de caixa'}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Fechar Caixa</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!canOpenCloseCash}
              onClick={() => {
                if (!canOpenCloseCash) return;
                setIsShiftModalOpen(true);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-xs flex items-center space-x-1.5 shrink-0 ${
                canOpenCloseCash
                  ? 'cursor-pointer active:scale-95 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600 animate-pulse'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
              title={!canOpenCloseCash ? 'Requer permissão para abrir caixa' : 'Abrir turno de caixa'}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Abrir Caixa Agora</span>
            </button>
          )}
        </div>
      </div>

      {/* Closed Shift Warning Alert */}
      {cashShift.status === 'fechado' && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 border border-amber-300/40 animate-in fade-in duration-200">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-xs">
              <Lock className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base leading-tight">CAIXA FECHADO NO MOMENTO</h4>
              <p className="text-xs text-rose-100 mt-0.5">
                Abra o caixa registrando operador e troco inicial para liberar lançamentos e recebimentos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsShiftModalOpen(true)}
            className="px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all shrink-0 active:scale-95 border border-rose-200 uppercase tracking-wider flex items-center gap-1.5"
          >
            <Unlock className="w-3.5 h-3.5 text-rose-600" />
            <span>Abrir Caixa Agora</span>
          </button>
        </div>
      )}

      {/* PROMINENT OPEN TABLES WITH UNPAID CONSUMPTION BANNER */}
      {occupiedTablesList.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-emerald-600/10 border-2 border-emerald-400/80 rounded-2xl p-3.5 sm:p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-sm animate-pulse">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-tight flex items-center gap-2">
                  <span>Mesas Com Pedido Aberto ({occupiedTablesList.length})</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                    Aguardando Pagamento
                  </span>
                </h3>
                <p className="text-[11px] text-slate-600 font-medium">
                  Selecione a mesa abaixo para puxar a comanda e realizar a cobrança.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {occupiedTablesList.map(({ table, itemCount, totalBill }) => {
              const isSelected = selectedTable === table;
              return (
                <div
                  key={`open-${table}`}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'bg-white border-red-500 shadow-md ring-2 ring-red-400/30'
                      : 'bg-white border-emerald-300 hover:border-emerald-500 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-black text-slate-900 text-xs sm:text-sm block">
                        {table}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold block">
                        {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase">Total</span>
                      <span className="font-black text-emerald-600 text-xs sm:text-sm block">
                        R$ {totalBill.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTable(table);
                      }}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer text-center ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      👁️ Comanda
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTable(table);
                        setAmountReceived(totalBill);
                        setIsPaymentModalOpen(true);
                      }}
                      className="flex-1 py-1 px-1.5 rounded-lg text-[11px] font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer active:scale-95"
                    >
                      <DollarSign className="w-3 h-3" />
                      <span>Cobrar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table Occupancy & Selection Panel */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Utensils className="w-4 h-4 text-red-500" />
            <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-tight">
              Selecione a Mesa / Comanda ({Object.keys(openOrdersByTable).length} com consumo)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-3 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs" />
                Ocupada
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                Livre
              </span>
            </div>
            {/* Mobile Expand / Collapse Toggle */}
            <button
              onClick={() => setShowMobileTables(!showMobileTables)}
              className="sm:hidden text-xs font-black text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{showMobileTables ? 'Ocultar Mesas' : 'Trocar Mesa'}</span>
              {showMobileTables ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Quick Scroll Bar (When Collapsed) */}
        {!showMobileTables && (
          <div className="sm:hidden flex items-center space-x-2 overflow-x-auto py-1 scrollbar-none touch-pan-x">
            {TABLES.map((tbl) => {
              const activeOrds = openOrdersByTable[tbl] || [];
              const isOccupied = activeOrds.length > 0;
              const isSelected = selectedTable === tbl;
              return (
                <button
                  key={tbl}
                  onClick={() => {
                    setSelectedTable(tbl);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : isOccupied
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span>{tbl}</span>
                  {isOccupied && (
                    <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full">
                      {activeOrds.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Full Grid */}
        <div className={`grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 ${
          showMobileTables ? 'block' : 'hidden sm:grid'
        }`}>
          {TABLES.map((tbl) => {
            const activeOrds = openOrdersByTable[tbl] || [];
            const isOccupied = activeOrds.length > 0;
            const itemCount = activeOrds.reduce((sum, o) => sum + o.items.reduce((is, i) => is + i.quantity, 0), 0);
            const totalBill = activeOrds.reduce((sum, o) => sum + o.total, 0);
            const isSelected = selectedTable === tbl;

            return (
              <button
                key={tbl}
                onClick={() => {
                  setSelectedTable(tbl);
                  setShowMobileTables(false);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer active:scale-95 relative ${
                  isSelected
                    ? 'ring-2 ring-red-500 border-red-500 bg-red-50/60 shadow-sm'
                    : isOccupied
                    ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100/70'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black ${isOccupied ? 'text-emerald-950' : 'text-slate-700'}`}>
                    {tbl}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                </div>
                {isOccupied ? (
                  <div className="mt-1">
                    <div className="text-[10px] font-extrabold text-emerald-800">
                      {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                    </div>
                    <div className="text-[10px] font-black text-emerald-950">
                      R$ {totalBill.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                ) : (
                  <div className="mt-1.5 text-[10px] text-slate-400 font-semibold">
                    Livre
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Caixa & Comanda Layout (Left: Detailed Comanda & Items, Right: Carrinho & Fechamento) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* LEFT 7 COLUMNS: DETAILED COMANDA OF SELECTED TABLE */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span>Comanda da {selectedTable}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      currentTableOrders.length > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {currentTableOrders.length > 0 ? '🟢 Consumo Aberto' : '⚪ Livre'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Histórico detalhado de espetinhos e bebidas solicitados nesta mesa.
                  </p>
                </div>
              </div>

              {currentTableOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (currentTableOrders[0]) {
                      onPrintReceipt(currentTableOrders[0]);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Pré-Conta</span>
                </button>
              )}
            </div>

            {currentTableOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Utensils className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-extrabold text-slate-600 text-sm">
                  {selectedTable} está livre (sem consumo no momento)
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Para lançar novos pedidos para esta mesa, utilize a aba <strong>Cardápio & Pedidos</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-amber-900 block">
                      Total Acumulado na {selectedTable}
                    </span>
                    <span className="text-[11px] text-amber-700 font-medium">
                      {currentTableActiveItems.reduce((acc, i) => acc + i.quantity, 0)} itens lançados
                    </span>
                  </div>
                  <span className="text-2xl font-black text-amber-950">
                    R$ {currentTableTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Itens Registrados na Comanda
                  </div>
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {currentTableActiveItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-slate-900 text-sm">
                            {item.quantity}x {item.productName}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.meatPoint === 'mal_passada' && <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">Mal Passada</span>}
                            {item.meatPoint === 'ao_ponto' && <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">Ao Ponto</span>}
                            {item.meatPoint === 'bem_passada' && <span className="text-[10px] font-extrabold bg-amber-950 text-amber-100 px-1.5 py-0.2 rounded">Bem Passada</span>}
                            {item.notes && <span className="text-[11px] text-slate-500 italic">({item.notes})</span>}
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${
                            item.status === 'na_grelha' ? 'bg-orange-100 text-orange-900 border border-orange-200' :
                            item.status === 'pronto' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                            item.status === 'entregue' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                            'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}>
                            {item.status === 'na_grelha' ? '🔥 Na Grelha' : item.status === 'pronto' ? '✅ Pronto' : item.status === 'entregue' ? '🍽️ Entregue' : '⏳ Na Fila'}
                          </span>
                          <div className="font-black text-slate-900 text-sm">
                            R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 5 COLUMNS: CARRINHO / FECHAMENTO DA CONTA & RECEBIMENTO */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-5 flex flex-col space-y-4">
            {/* Table / Customer selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-extrabold text-slate-500 uppercase">
                  Comanda / Mesa Selecionada
                </label>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  currentTableOrders.length > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {selectedTable} {currentTableOrders.length > 0 ? '(Ocupada)' : '(Livre)'}
                </span>
              </div>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  {TABLES.map((tbl) => {
                    const activeOrds = openOrdersByTable[tbl] || [];
                    const count = activeOrds.reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + i.quantity, 0), 0);
                    return (
                      <option key={tbl} value={tbl}>
                        {tbl} {count > 0 ? `🟢 (${count} itens)` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Extra Cart Items if any */}
            {cart.length > 0 && (
              <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50/50 space-y-2 max-h-[180px] overflow-y-auto">
                <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Itens no Carrinho ({cartTotalQty})
                </div>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 space-y-0.5">
                      <div className="font-extrabold text-slate-900 text-xs">
                        {item.productName}
                      </div>
                      <div className="text-xs font-black text-slate-900">
                        R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-black text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeCartItem(item.id)}
                        className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations & Toggles */}
            <div className="space-y-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex justify-between items-center font-extrabold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span>Consumo Acumulado ({selectedTable}):</span>
                <span className="text-sm font-black text-slate-900">
                  R$ {currentTableTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {cart.length > 0 && (
                <div className="flex justify-between items-center">
                  <span>Itens Adicionais no Carrinho:</span>
                  <span className="font-bold text-slate-800">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeServiceFee}
                    onChange={(e) => setIncludeServiceFee(e.target.checked)}
                    className="w-4 h-4 text-red-500 rounded focus:ring-red-400"
                  />
                  <span>Taxa de Serviço (10%)</span>
                </label>
                <span className="font-bold text-slate-800">R$ {serviceFee.toFixed(2).replace('.', ',')}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-700">Desconto Especial (R$)</span>
                  {!canApplyDiscounts && (
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Requer Gerência
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  disabled={!canApplyDiscounts}
                  value={discount || ''}
                  onChange={(e) => {
                    if (!canApplyDiscounts) return;
                    setDiscount(parseFloat(e.target.value) || 0);
                  }}
                  placeholder="0,00"
                  className={`w-24 px-2.5 py-1 text-right font-bold border rounded-lg outline-none text-xs ${
                    !canApplyDiscounts 
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'text-slate-900 bg-slate-50 border-slate-300 focus:ring-1 focus:ring-red-500'
                  }`}
                  title={!canApplyDiscounts ? 'Apenas usuários com permissão de desconto podem conceder abatimentos' : 'Informe o valor do desconto'}
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t-2 border-dashed border-slate-200 text-slate-900 text-base font-black">
                <span>TOTAL A COBRAR</span>
                <span className="text-emerald-600 text-2xl font-extrabold">
                  R$ {grandTotalToPay.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Action Button: Receive Payment */}
            <div className="pt-2">
              <button
                disabled={currentTableOrders.length === 0 && cart.length === 0}
                onClick={() => {
                  setAmountReceived(grandTotalToPay);
                  setIsPaymentModalOpen(true);
                }}
                className={`w-full py-4 px-4 rounded-xl font-black text-sm shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98 ${
                  currentTableOrders.length > 0 || cart.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>💰 Receber & Finalizar Conta ({selectedTable})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 2: PAYMENT PROCESSING */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  Receber Pagamento
                </h3>
                <p className="text-xs font-bold text-amber-700">
                  {selectedTable}
                </p>
              </div>
              <span className="font-black text-emerald-600 text-xl">
                R$ {grandTotalToPay.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* Bill Summary Breakdown inside Payment Modal */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
              {currentTableTotal > 0 && (
                <div className="flex justify-between text-slate-700 font-bold">
                  <span>Consumo da {selectedTable} ({currentTableActiveItems.length} itens):</span>
                  <span>R$ {currentTableTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {includeServiceFee && serviceFee > 0 && (
                <div className="flex justify-between text-slate-700 font-bold">
                  <span>Taxa de Serviço (10%):</span>
                  <span>R$ {serviceFee.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Desconto Aplicado:</span>
                  <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-black pt-1 border-t border-slate-200 text-sm">
                <span>Total a Cobrar:</span>
                <span className="text-emerald-600">R$ {grandTotalToPay.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {/* Select Payment Method */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('pix')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                  paymentMethod === 'pix'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Pix Instantâneo</span>
              </button>

              <button
                onClick={() => setPaymentMethod('credito')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                  paymentMethod === 'credito'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Cartão de Crédito</span>
              </button>

              <button
                onClick={() => setPaymentMethod('debito')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                  paymentMethod === 'debito'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Cartão de Débito</span>
              </button>

              <button
                onClick={() => setPaymentMethod('dinheiro')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                  paymentMethod === 'dinheiro'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Dinheiro / Espécie</span>
              </button>
            </div>

            {/* Dynamic details for selected payment method */}
            {paymentMethod === 'pix' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-3">
                <p className="text-xs font-bold text-slate-700">
                  Apresente o QR Code do Pix para o cliente:
                </p>
                <div className="w-36 h-36 bg-white p-2 border border-slate-300 rounded-xl mx-auto flex items-center justify-center shadow-inner">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ESPETINHO_DO_CHEFE_PIX_${grandTotalToPay.toFixed(2)}`}
                    alt="Pix QR Code"
                    referrerPolicy="no-referrer"
                    className="w-full h-full"
                  />
                </div>
                <span className="text-[11px] text-emerald-600 font-bold bg-emerald-100 px-2.5 py-1 rounded-full inline-block">
                  ✓ Aguardando confirmação do banco...
                </span>
              </div>
            )}

            {paymentMethod === 'dinheiro' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Valor Recebido (R$)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-base font-bold border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Troco a Devolver
                    </label>
                    <div className="px-3 py-2 text-base font-black text-rose-600 bg-white border border-slate-200 rounded-xl">
                      R$ {changeDue.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(paymentMethod === 'credito' || paymentMethod === 'debito') && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                <p className="text-xs font-bold text-slate-700">
                  Aproxime ou insira o cartão na maquininha.
                </p>
                <p className="text-[11px] text-slate-500">
                  Transação pré-autorizada no valor de R$ {grandTotalToPay.toFixed(2).replace('.', ',')}
                </p>
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Voltar
              </button>
              <button
                onClick={handleFinalizeOrder}
                className="flex-1 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md cursor-pointer"
              >
                Confirmar Pagamento & Liberar Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CASH SHIFT OPEN / CLOSE AUDIT */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-xl ${cashShift.status === 'aberto' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {cashShift.status === 'aberto' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-tight">
                    {cashShift.status === 'aberto' ? 'Fechar Turno do Caixa' : 'Abrir Turno do Caixa'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {cashShift.status === 'aberto' ? 'Auditoria de valores e fechamento da gaveta' : 'Abertura de caixa e registro de troco inicial'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {cashShift.status === 'aberto' ? (
              <div className="space-y-4 text-xs text-slate-700">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Fundo de Troco Inicial:</span>
                    <strong className="font-bold text-slate-900">R$ {cashShift.initialFloat.toFixed(2).replace('.', ',')}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Vendas em Dinheiro (+):</span>
                    <strong className="font-bold text-emerald-700">R$ {cashShift.salesByPaymentMethod.dinheiro.toFixed(2).replace('.', ',')}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Vendas em Pix:</span>
                    <strong className="font-bold text-emerald-600">R$ {cashShift.salesByPaymentMethod.pix.toFixed(2).replace('.', ',')}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Vendas em Cartão (Crédito/Débito):</span>
                    <strong className="font-bold text-blue-600">R$ {(cashShift.salesByPaymentMethod.credito + cashShift.salesByPaymentMethod.debito).toFixed(2).replace('.', ',')}</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                    <span>Dinheiro Esperado na Gaveta:</span>
                    <span className="text-slate-900 font-extrabold">
                      R$ {(cashShift.initialFloat + cashShift.salesByPaymentMethod.dinheiro).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Valor Contado em Dinheiro na Gaveta (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    value={closingCashInput}
                    onChange={(e) => setClosingCashInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-base font-black text-slate-900 border border-slate-300 focus:border-rose-500 rounded-xl outline-none"
                  />
                </div>

                {/* Drawer Cash Audit Difference */}
                {(() => {
                  const expected = cashShift.initialFloat + cashShift.salesByPaymentMethod.dinheiro;
                  const diff = closingCashInput - expected;
                  if (Math.abs(diff) < 0.01) {
                    return (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Caixa conferido perfeitamente! Nenhuma divergência de troco.</span>
                      </div>
                    );
                  }
                  if (diff > 0) {
                    return (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-xl text-xs flex items-center justify-between font-medium">
                        <span>🟢 Sobra de Caixa Detectada:</span>
                        <strong className="font-black text-amber-700">+ R$ {diff.toFixed(2).replace('.', ',')}</strong>
                      </div>
                    );
                  }
                  return (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl text-xs flex items-center justify-between font-medium">
                      <span>🔴 Quebra / Falta de Caixa:</span>
                      <strong className="font-black text-rose-700">- R$ {Math.abs(diff).toFixed(2).replace('.', ',')}</strong>
                    </div>
                  );
                })()}

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsShiftModalOpen(false)}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onCloseShift(closingCashInput);
                      setIsShiftModalOpen(false);
                    }}
                    className="flex-1 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Confirmar Fechamento</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nome do Operador do Caixa *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Oliveira"
                      value={operatorInput}
                      onChange={(e) => setOperatorInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl font-medium focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Fundo de Troco Inicial (R$) *
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={floatInput}
                    onChange={(e) => setFloatInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-base font-black text-slate-900 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Atalhos:</span>
                    {[50, 100, 150, 200, 300].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFloatInput(val)}
                        className={`px-2 py-1 text-[11px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                          floatInput === val
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        R$ {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] leading-relaxed">
                  💡 A abertura de caixa registra o início das operações do turno e habilita o recebimento e liquidação de contas das mesas.
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsShiftModalOpen(false)}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenShift(operatorInput || 'Atendente', floatInput);
                      setIsShiftModalOpen(false);
                    }}
                    className="flex-1 py-2.5 text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Abrir Caixa Agora</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
