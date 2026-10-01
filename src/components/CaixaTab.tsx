import React, { useState, useMemo } from 'react';
import { Product, Order, CashShift, PaymentMethod, PaymentSplit, OrderItem, TABLES, AppUser, hasPermission } from '../types';
import { 
  DollarSign, ShoppingCart, Lock, Unlock, Plus, Minus, Trash2, 
  QrCode, CreditCard, Banknote, Sparkles, CheckCircle2, 
  Printer, User, Receipt, Utensils, ChevronDown, ChevronUp, ShieldAlert,
  Split, Layers, ArrowRightLeft, AlertCircle, PlusCircle, Check
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
    includeServiceFee: boolean,
    payments?: PaymentSplit[],
    totalChange?: number
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
    (orders || []).forEach((ord) => {
      if (ord && !ord.isPaid && ord.status !== 'cancelado') {
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
  const currentTableActiveItems = currentTableOrders.flatMap((o) => (o && Array.isArray(o.items) ? o.items : []));
  const currentTableTotal = currentTableOrders.reduce((sum, o) => sum + (o?.total || 0), 0);

  // Array of occupied tables with active unpaid consumption
  const occupiedTablesList = useMemo(() => {
    return Object.keys(openOrdersByTable)
      .filter((tbl) => (openOrdersByTable[tbl] || []).length > 0)
      .map((tbl) => {
        const activeOrds = openOrdersByTable[tbl] || [];
        const itemCount = activeOrds.reduce((sum, o) => sum + (Array.isArray(o?.items) ? o.items : []).reduce((s, i) => s + (i?.quantity || 0), 0), 0);
        const totalBill = activeOrds.reduce((sum, o) => sum + (o?.total || 0), 0);
        return {
          table: tbl,
          itemCount,
          totalBill,
        };
      });
  }, [openOrdersByTable]);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'single' | 'split'>('single');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [amountReceived, setAmountReceived] = useState<number>(0);

  // Split / Multiple payments state (2 or more payment methods)
  const [splits, setSplits] = useState<PaymentSplit[]>([
    { method: 'pix', amount: 0 },
    { method: 'dinheiro', amount: 0, cashReceived: 0, change: 0 },
  ]);
  const [activePixSplitIndex, setActivePixSplitIndex] = useState<number | null>(null);

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

  // Split payment calculations
  const totalSplitsAssigned = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const remainingToAssign = Math.round((grandTotalToPay - totalSplitsAssigned) * 100) / 100;
  const isSplitFullyCovered = Math.abs(remainingToAssign) <= 0.01;
  const isSplitOverCovered = remainingToAssign < -0.01;
  const isSplitUnderCovered = remainingToAssign > 0.01;

  const totalCashChangeDue = paymentMode === 'split'
    ? splits.reduce((sum, s) => sum + (s.method === 'dinheiro' && s.cashReceived ? Math.max(0, s.cashReceived - s.amount) : 0), 0)
    : (paymentMethod === 'dinheiro' ? changeDue : 0);

  const openPaymentModal = (targetTotal: number = grandTotalToPay) => {
    setAmountReceived(targetTotal);
    // Initialize 2 default splits (50% each)
    const half = Math.round((targetTotal / 2) * 100) / 100;
    const remainder = Math.round((targetTotal - half) * 100) / 100;
    setSplits([
      { method: 'pix', amount: half },
      { method: 'dinheiro', amount: remainder, cashReceived: remainder, change: 0 },
    ]);
    setActivePixSplitIndex(null);
    setIsPaymentModalOpen(true);
  };

  const updateSplit = (index: number, patch: Partial<PaymentSplit>) => {
    setSplits((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const updated = { ...s, ...patch };
        if (updated.method === 'dinheiro' && updated.cashReceived !== undefined) {
          updated.change = Math.max(0, updated.cashReceived - updated.amount);
        }
        return updated;
      })
    );
  };

  // Smart update for split amount: when there are 2 splits, editing one automatically balances the other!
  const updateSplitAmount = (index: number, newAmount: number) => {
    const cleanAmount = Math.max(0, isNaN(newAmount) ? 0 : newAmount);
    setSplits((prev) => {
      const next = [...prev];
      if (next.length === 2) {
        const otherIndex = index === 0 ? 1 : 0;
        next[index] = {
          ...next[index],
          amount: cleanAmount,
          cashReceived: next[index].method === 'dinheiro' && (!next[index].cashReceived || next[index].cashReceived < cleanAmount)
            ? cleanAmount
            : next[index].cashReceived,
          change: next[index].method === 'dinheiro' && next[index].cashReceived
            ? Math.max(0, (next[index].cashReceived || 0) - cleanAmount)
            : 0,
        };
        const remainder = Math.max(0, Math.round((grandTotalToPay - cleanAmount) * 100) / 100);
        next[otherIndex] = {
          ...next[otherIndex],
          amount: remainder,
          cashReceived: next[otherIndex].method === 'dinheiro' && (!next[otherIndex].cashReceived || next[otherIndex].cashReceived < remainder)
            ? remainder
            : next[otherIndex].cashReceived,
          change: next[otherIndex].method === 'dinheiro' && next[otherIndex].cashReceived
            ? Math.max(0, (next[otherIndex].cashReceived || 0) - remainder)
            : 0,
        };
      } else {
        next[index] = {
          ...next[index],
          amount: cleanAmount,
          cashReceived: next[index].method === 'dinheiro' && (!next[index].cashReceived || next[index].cashReceived < cleanAmount)
            ? cleanAmount
            : next[index].cashReceived,
          change: next[index].method === 'dinheiro' && next[index].cashReceived
            ? Math.max(0, (next[index].cashReceived || 0) - cleanAmount)
            : 0,
        };
      }
      return next;
    });
  };

  // Automatically balance the remaining amount into the last split line
  const autoBalanceRemaining = () => {
    setSplits((prev) => {
      if (prev.length === 0) return prev;
      const otherSum = prev.slice(0, -1).reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
      const remainder = Math.max(0, Math.round((grandTotalToPay - otherSum) * 100) / 100);
      const next = [...prev];
      const lastIdx = next.length - 1;
      next[lastIdx] = {
        ...next[lastIdx],
        amount: remainder,
        cashReceived: next[lastIdx].method === 'dinheiro' ? Math.max(remainder, next[lastIdx].cashReceived || remainder) : next[lastIdx].cashReceived,
        change: next[lastIdx].method === 'dinheiro' && next[lastIdx].cashReceived ? Math.max(0, (next[lastIdx].cashReceived || 0) - remainder) : 0,
      };
      return next;
    });
  };

  const addSplitLine = (method: 'pix' | 'credito' | 'debito' | 'dinheiro' = 'credito') => {
    const currentSum = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const left = Math.max(0, Math.round((grandTotalToPay - currentSum) * 100) / 100);
    setSplits((prev) => [
      ...prev,
      { method, amount: left, cashReceived: left, change: 0 },
    ]);
  };

  const removeSplitLine = (index: number) => {
    if (splits.length <= 2) return; // Keep at least 2 lines for split payment
    setSplits((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // Rebalance last item
      if (filtered.length > 0) {
        const otherSum = filtered.slice(0, -1).reduce((s, x) => s + (Number(x.amount) || 0), 0);
        const remainder = Math.max(0, Math.round((grandTotalToPay - otherSum) * 100) / 100);
        filtered[filtered.length - 1].amount = remainder;
      }
      return filtered;
    });
  };

  const splitEqually = (parts: number) => {
    const base = Math.floor((grandTotalToPay / parts) * 100) / 100;
    let distributed = 0;
    const newSplits: PaymentSplit[] = [];
    const defaultMethods: ('pix' | 'credito' | 'debito' | 'dinheiro')[] = ['pix', 'dinheiro', 'credito', 'debito'];

    for (let i = 0; i < parts; i++) {
      const isLast = i === parts - 1;
      const amt = isLast ? Math.round((grandTotalToPay - distributed) * 100) / 100 : base;
      distributed += amt;
      const method = splits[i]?.method || defaultMethods[i % defaultMethods.length];
      newSplits.push({
        method,
        amount: amt,
        cashReceived: method === 'dinheiro' ? amt : undefined,
        change: 0,
      });
    }
    setSplits(newSplits);
  };

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

    let finalSplitsList = splits;
    if (paymentMode === 'split') {
      const sumSplits = splits.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
      const diff = Math.round((grandTotalToPay - sumSplits) * 100) / 100;
      if (Math.abs(diff) > 0.001) {
        // Automatically balance into the last split item so cashier is never blocked
        finalSplitsList = [...splits];
        const lastIdx = finalSplitsList.length - 1;
        const otherSum = finalSplitsList.slice(0, lastIdx).reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
        const adjustedAmount = Math.max(0, Math.round((grandTotalToPay - otherSum) * 100) / 100);
        finalSplitsList[lastIdx] = {
          ...finalSplitsList[lastIdx],
          amount: adjustedAmount,
          cashReceived: finalSplitsList[lastIdx].method === 'dinheiro' 
            ? Math.max(adjustedAmount, finalSplitsList[lastIdx].cashReceived || adjustedAmount)
            : finalSplitsList[lastIdx].cashReceived,
          change: finalSplitsList[lastIdx].method === 'dinheiro' && finalSplitsList[lastIdx].cashReceived
            ? Math.max(0, (finalSplitsList[lastIdx].cashReceived || 0) - adjustedAmount)
            : 0,
        };
      }
    }

    const cleanSplits = paymentMode === 'split'
      ? finalSplitsList
          .filter((s) => s.amount > 0)
          .map((s) => ({
            ...s,
            change: s.method === 'dinheiro' && s.cashReceived ? Math.max(0, s.cashReceived - s.amount) : 0,
          }))
      : undefined;

    const finalMethod: PaymentMethod = paymentMode === 'split' ? 'multiplo' : paymentMethod;

    if (onPayTableOrders) {
      onPayTableOrders(
        selectedTable, 
        finalMethod, 
        cart, 
        discount, 
        includeServiceFee,
        cleanSplits,
        totalCashChangeDue
      );
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
          paymentMethod: finalMethod,
          payments: cleanSplits,
          change: totalCashChangeDue,
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
                        openPaymentModal(totalBill);
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
                  openPaymentModal(grandTotalToPay);
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

      {/* MODAL 2: PAYMENT PROCESSING (SUPPORTS SINGLE & MULTIPLE / SPLIT PAYMENTS) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
                  <span>Receber Pagamento</span>
                </h3>
                <p className="text-xs font-bold text-amber-700">
                  {selectedTable} • {currentTableActiveItems.length + cart.length} itens no total
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total a Cobrar</span>
                <span className="font-black text-emerald-600 text-xl sm:text-2xl">
                  R$ {grandTotalToPay.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Bill Summary Breakdown inside Payment Modal */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
              {currentTableTotal > 0 && (
                <div className="flex justify-between text-slate-700 font-bold">
                  <span>Consumo da {selectedTable} ({currentTableActiveItems.length} itens):</span>
                  <span>R$ {currentTableTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {cart.length > 0 && (
                <div className="flex justify-between text-slate-700 font-bold">
                  <span>Itens Adicionados no Balcão ({cart.length} itens):</span>
                  <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {includeServiceFee && serviceFee > 0 && (
                <div className="flex justify-between text-slate-700 font-bold">
                  <span>Taxa de Serviço Opcional (10%):</span>
                  <span>R$ {serviceFee.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Desconto Aplicado:</span>
                  <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-black pt-1.5 border-t border-slate-200 text-sm">
                <span>Total Líquido da Comanda:</span>
                <span className="text-emerald-600">R$ {grandTotalToPay.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {/* PAYMENT MODE TOGGLE: FORMA ÚNICA vs DIVIDIR / MÚLTIPLAS FORMAS */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Como o cliente irá pagar?
              </label>
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentMode('single')}
                  className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    paymentMode === 'single'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-slate-700" />
                  <span>Forma Única (100%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('split');
                    const currentSum = splits.reduce((s, x) => s + (x.amount || 0), 0);
                    if (Math.abs(currentSum - grandTotalToPay) > 0.01) {
                      splitEqually(2);
                    }
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    paymentMode === 'split'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>Dividir em 2+ Opções</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    paymentMode === 'split' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    Múltiplo
                  </span>
                </button>
              </div>
            </div>

            {/* MODE 1: SINGLE PAYMENT */}
            {paymentMode === 'single' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                      paymentMethod === 'pix'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>⚡ Pix Instantâneo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credito')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                      paymentMethod === 'credito'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>💳 Cartão de Crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('debito')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                      paymentMethod === 'debito'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>💳 Cartão de Débito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('dinheiro');
                      if (!amountReceived || amountReceived < grandTotalToPay) {
                        setAmountReceived(grandTotalToPay);
                      }
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                      paymentMethod === 'dinheiro'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>💵 Dinheiro / Espécie</span>
                  </button>
                </div>

                {/* Single Pix View */}
                {paymentMethod === 'pix' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-3">
                    <p className="text-xs font-bold text-slate-700">
                      Apresente o QR Code do Pix para o cliente escanear:
                    </p>
                    <div className="w-36 h-36 bg-white p-2 border border-slate-300 rounded-xl mx-auto flex items-center justify-center shadow-inner">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MARESIA_PIX_${grandTotalToPay.toFixed(2)}`}
                        alt="Pix QR Code"
                        referrerPolicy="no-referrer"
                        className="w-full h-full"
                      />
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold bg-emerald-100 px-2.5 py-1 rounded-full inline-block">
                      ✓ QR Code gerado para R$ {grandTotalToPay.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}

                {/* Single Cash View with Quick Bills */}
                {paymentMethod === 'dinheiro' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        Valor Recebido pelo Cliente:
                      </label>
                      <div className="flex gap-1">
                        {[
                          { label: 'Exato', val: grandTotalToPay },
                          { label: 'R$ 20', val: 20 },
                          { label: 'R$ 50', val: 50 },
                          { label: 'R$ 100', val: 100 },
                          { label: 'R$ 200', val: 200 },
                        ]
                          .filter((b) => b.label === 'Exato' || b.val >= grandTotalToPay || grandTotalToPay <= 200)
                          .slice(0, 5)
                          .map((b, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setAmountReceived(b.val)}
                              className="px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-800 font-bold text-[10px] border border-slate-300 rounded-md shadow-2xs transition-all cursor-pointer"
                            >
                              {b.label}
                            </button>
                          ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={amountReceived || ''}
                            onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                            className="w-full pl-9 pr-3 py-2 text-base font-black border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="px-3 py-2 text-base font-black text-rose-600 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500">Troco:</span>
                          <span>R$ {changeDue.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Single Card View */}
                {(paymentMethod === 'credito' || paymentMethod === 'debito') && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-700">
                      Insira ou aproxime o cartão na maquininha.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Transação no valor de <strong className="text-slate-800">R$ {grandTotalToPay.toFixed(2).replace('.', ',')}</strong> via {paymentMethod === 'credito' ? 'CRÉDITO' : 'DÉBITO'}.
                    </p>
                  </div>
                )}

                {/* Quick Split Prompt Shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('split');
                    splitEqually(2);
                  }}
                  className="w-full p-2.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Split className="w-4 h-4 text-emerald-600" />
                  <span>Cliente quer pagar com 2 formas (ex: metade Pix e metade Cartão)? Clique aqui</span>
                </button>
              </div>
            )}

            {/* MODE 2: MULTIPLE / SPLIT PAYMENTS (2 OU MAIS FORMAS) - ULTRA SIMPLIFIED */}
            {paymentMode === 'split' && (
              <div className="space-y-3 animate-in fade-in duration-100">
                {/* 1-Click Fast Split Shortcuts */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-emerald-50/60 border border-emerald-200 rounded-xl text-[11px]">
                  <span className="font-extrabold text-emerald-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Divisão Rápida em 1 Clique:</span>
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => splitEqually(2)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-300 shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      👥 Meio a Meio (2x)
                    </button>
                    <button
                      type="button"
                      onClick={() => splitEqually(3)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-300 shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      3 Partes
                    </button>
                    <button
                      type="button"
                      onClick={() => splitEqually(4)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-300 shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      4 Partes
                    </button>
                  </div>
                </div>

                {/* List of Split Payment Lines */}
                <div className="space-y-2.5">
                  {splits.map((split, index) => {
                    const isCash = split.method === 'dinheiro';
                    const isPix = split.method === 'pix';
                    const isShowingPixQr = activePixSplitIndex === index;

                    return (
                      <div 
                        key={index} 
                        className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl p-3.5 space-y-2.5 shadow-2xs transition-all"
                      >
                        {/* Header for this split row */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono font-bold">
                              {index + 1}
                            </span>
                            <span>{index === 0 ? '1ª Opção de Pagamento' : index === 1 ? '2ª Opção de Pagamento' : `${index + 1}ª Opção`}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              R$ {(split.amount || 0).toFixed(2).replace('.', ',')}
                            </span>

                            {isPix && split.amount > 0 && (
                              <button
                                type="button"
                                onClick={() => setActivePixSplitIndex(isShowingPixQr ? null : index)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all cursor-pointer ${
                                  isShowingPixQr 
                                    ? 'bg-emerald-600 text-white border-emerald-600' 
                                    : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                                }`}
                              >
                                <QrCode className="w-3 h-3" />
                                <span>{isShowingPixQr ? 'Ocultar QR' : 'Ver QR Pix'}</span>
                              </button>
                            )}

                            {splits.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeSplitLine(index)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                                title="Remover esta forma"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Select method buttons for this line (Colored and clear) */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { id: 'pix', label: 'Pix', icon: QrCode, activeColor: 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400' },
                            { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, activeColor: 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400' },
                            { id: 'debito', label: 'Débito', icon: CreditCard, activeColor: 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-400' },
                            { id: 'credito', label: 'Crédito', icon: CreditCard, activeColor: 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-400' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                updateSplit(index, { 
                                  method: m.id as any,
                                  cashReceived: m.id === 'dinheiro' ? split.amount : undefined 
                                });
                                if (m.id !== 'pix' && activePixSplitIndex === index) {
                                  setActivePixSplitIndex(null);
                                }
                              }}
                              className={`py-2 px-1 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                split.method === m.id
                                  ? `${m.activeColor} shadow-xs`
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <m.icon className="w-3.5 h-3.5 shrink-0" />
                              <span>{m.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Value Input (With Auto-Balance Note) */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">
                              Valor a pagar nesta opção:
                            </label>
                            {splits.length === 2 && (
                              <span className="text-[10px] text-emerald-700 font-extrabold">
                                ⚡ Ajusta a outra opção automaticamente
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={split.amount || ''}
                              onChange={(e) => updateSplitAmount(index, parseFloat(e.target.value) || 0)}
                              className="w-full pl-9 pr-3 py-2 text-base font-black border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                              placeholder="0,00"
                            />
                          </div>
                        </div>

                        {/* Cash specific: Received & Change */}
                        {isCash && (
                          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-amber-900">
                                Dinheiro entregue pelo cliente:
                              </span>
                              <div className="flex gap-1">
                                {[
                                  { label: 'Exato', val: split.amount },
                                  { label: '+R$ 10', val: (split.amount || 0) + 10 },
                                  { label: '+R$ 20', val: (split.amount || 0) + 20 },
                                  { label: '+R$ 50', val: (split.amount || 0) + 50 },
                                ].map((chip, cIdx) => (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    onClick={() => updateSplit(index, { cashReceived: chip.val })}
                                    className="px-1.5 py-0.5 bg-white text-slate-700 hover:bg-amber-100 font-bold text-[10px] border border-amber-300 rounded transition-all cursor-pointer"
                                  >
                                    {chip.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  value={split.cashReceived !== undefined ? split.cashReceived : ''}
                                  onChange={(e) => updateSplit(index, { cashReceived: parseFloat(e.target.value) || 0 })}
                                  className="w-full pl-8 pr-2 py-1.5 text-sm font-bold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                  placeholder="Ex: 50"
                                />
                              </div>

                              <div className="px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-600">Troco:</span>
                                <span className="text-sm font-black text-rose-600">
                                  R$ {Math.max(0, (split.cashReceived || 0) - split.amount).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Dynamic Pix QR Preview for this specific split */}
                        {isShowingPixQr && isPix && split.amount > 0 && (
                          <div className="p-3 bg-white border border-emerald-300 rounded-xl text-center space-y-2 shadow-inner">
                            <p className="text-[11px] font-bold text-emerald-900">
                              QR Code Pix para esta fração (R$ {split.amount.toFixed(2).replace('.', ',')}):
                            </p>
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=MARESIA_PIX_SPLIT_${split.amount.toFixed(2)}`}
                              alt="Pix Split QR Code"
                              referrerPolicy="no-referrer"
                              className="w-28 h-28 mx-auto border border-slate-200 rounded-lg p-1 bg-white"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Another Payment Method Button (3+, 4+, etc.) */}
                <button
                  type="button"
                  onClick={() => addSplitLine()}
                  className="w-full py-2.5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>+ Adicionar 3ª Opção de Pagamento (ou mais)</span>
                </button>

                {/* Live Distribution Status Card */}
                <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                  isSplitFullyCovered
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  <div className="flex justify-between font-bold">
                    <span>Total da Conta:</span>
                    <span>R$ {grandTotalToPay.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Distribuído ({(splits || []).filter((s) => s && s.amount > 0).length} opções):</span>
                    <span className="font-mono font-black">R$ {totalSplitsAssigned.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex items-center justify-between font-black pt-1.5 border-t border-current/20 text-sm">
                    <span className="flex items-center gap-1">
                      {isSplitFullyCovered ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Conta 100% Equilibrada e Pronta!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>Diferença: R$ {Math.abs(remainingToAssign).toFixed(2).replace('.', ',')}</span>
                        </>
                      )}
                    </span>

                    {!isSplitFullyCovered && (
                      <button
                        type="button"
                        onClick={autoBalanceRemaining}
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer active:scale-95 shadow-xs"
                      >
                        ⚡ Ajustar Restante Agora
                      </button>
                    )}
                  </div>

                  {totalCashChangeDue > 0 && (
                    <div className="flex justify-between font-black text-rose-600 pt-1 border-t border-current/20">
                      <span>Troco Total em Dinheiro a Devolver:</span>
                      <span className="text-sm font-black">R$ {totalCashChangeDue.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Modal Actions */}
            <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleFinalizeOrder}
                className="flex-2 py-3 text-xs sm:text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>
                  {paymentMode === 'split'
                    ? `Confirmar Pagamento Dividido (${(splits || []).filter((s) => s && s.amount > 0).length} opções) & Liberar`
                    : 'Confirmar Pagamento & Liberar Mesa'}
                </span>
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
