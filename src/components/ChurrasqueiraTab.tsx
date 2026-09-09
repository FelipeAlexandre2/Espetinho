import React, { useState, useEffect } from 'react';
import { Order, OrderItem, MeatPoint, Product } from '../types';
import { 
  Flame, 
  Clock, 
  CheckCircle2, 
  Bell, 
  Volume2, 
  VolumeX, 
  Utensils, 
  ConciergeBell,
  Sparkles,
  ArrowRight,
  Send,
  UserCheck,
  CheckCheck,
  AlertTriangle
} from 'lucide-react';

interface ChurrasqueiraTabProps {
  orders: Order[];
  products?: Product[];
  onUpdateItemStatus: (orderId: string, itemId: string, nextStatus: 'aguardando' | 'na_grelha' | 'pronto' | 'entregue') => void;
  onUpdateOrderStatus: (orderId: string, status: any) => void;
}

export const ChurrasqueiraTab: React.FC<ChurrasqueiraTabProps> = ({
  orders,
  products,
  onUpdateItemStatus,
  onUpdateOrderStatus,
}) => {
  // Main view selector: 'churrasqueira' (Grelha/Preparo) or 'balcao' (Expedição/Levar para Mesa)
  const [activeView, setActiveView] = useState<'churrasqueira' | 'balcao'>('churrasqueira');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [kdsChurrasqueiraFilter, setKdsChurrasqueiraFilter] = useState<'todos' | 'aguardando' | 'preparando' | 'pronto'>('todos');
  const [balcaoFilter, setBalcaoFilter] = useState<'pendentes' | 'entregues'>('pendentes');

  // Helper function to identify drink items that should not appear on Churrasqueira / Cozinha
  const isDrinkItem = (item: OrderItem) => {
    if (item.category === 'bebidas') return true;
    if (products && products.length > 0) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && prod.category === 'bebidas') return true;
    }
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

  // Play kitchen bell sound
  const playBellSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // Timer tick for real-time elapsed minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Filter active non-completed orders
  const activeOrders = orders.filter((o) => o.status !== 'cancelado');

  // Extract items across active orders (excluding drinks)
  const allActiveItems: Array<{
    orderId: string;
    orderNumber: number;
    tableOrCustomer: string;
    orderCreatedAt: string;
    item: OrderItem;
  }> = [];

  activeOrders.forEach((ord) => {
    ord.items.forEach((item) => {
      // ONLY food/meats/accompaniments appear on churrasqueira/cozinha screen
      if (!isDrinkItem(item)) {
        allActiveItems.push({
          orderId: ord.id,
          orderNumber: ord.orderNumber,
          tableOrCustomer: ord.tableOrCustomer,
          orderCreatedAt: ord.createdAt,
          item,
        });
      }
    });
  });

  // Churrasqueira items categories
  const waitingItems = allActiveItems.filter((i) => i.item.status === 'aguardando');
  const preparingItems = allActiveItems.filter((i) => i.item.status === 'na_grelha');
  const readyItems = allActiveItems.filter((i) => i.item.status === 'pronto');
  const deliveredItems = allActiveItems.filter((i) => i.item.status === 'entregue');

  // Group ready items by Order / Table for the Balcão view
  const readyOrdersMap = new Map<string, {
    orderId: string;
    orderNumber: number;
    tableOrCustomer: string;
    orderCreatedAt: string;
    items: OrderItem[];
  }>();

  activeOrders.forEach((ord) => {
    const readyItemsForOrder = ord.items.filter((i) => i.status === 'pronto' && !isDrinkItem(i));
    if (readyItemsForOrder.length > 0) {
      readyOrdersMap.set(ord.id, {
        orderId: ord.id,
        orderNumber: ord.orderNumber,
        tableOrCustomer: ord.tableOrCustomer,
        orderCreatedAt: ord.createdAt,
        items: readyItemsForOrder,
      });
    }
  });

  const readyOrdersList = Array.from(readyOrdersMap.values());

  // Group recently delivered items by Order / Table
  const deliveredOrdersMap = new Map<string, {
    orderId: string;
    orderNumber: number;
    tableOrCustomer: string;
    orderCreatedAt: string;
    items: OrderItem[];
  }>();

  activeOrders.forEach((ord) => {
    const deliveredItemsForOrder = ord.items.filter((i) => i.status === 'entregue' && !isDrinkItem(i));
    if (deliveredItemsForOrder.length > 0) {
      deliveredOrdersMap.set(ord.id, {
        orderId: ord.id,
        orderNumber: ord.orderNumber,
        tableOrCustomer: ord.tableOrCustomer,
        orderCreatedAt: ord.createdAt,
        items: deliveredItemsForOrder,
      });
    }
  });

  const deliveredOrdersList = Array.from(deliveredOrdersMap.values());

  const handleMoveAllWaitingToGrill = () => {
    waitingItems.forEach(({ orderId, item }) => {
      onUpdateItemStatus(orderId, item.id, 'na_grelha');
    });
  };

  const handleMarkItemReady = (orderId: string, itemId: string) => {
    onUpdateItemStatus(orderId, itemId, 'pronto');
    playBellSound();
  };

  const handleDeliverEntireOrder = (orderId: string, itemsToDeliver: OrderItem[]) => {
    itemsToDeliver.forEach((item) => {
      onUpdateItemStatus(orderId, item.id, 'entregue');
    });
  };

  const getMeatPointBadge = (point?: MeatPoint) => {
    switch (point) {
      case 'mal_passada':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-rose-500 text-white shadow-xs border border-rose-400">
            🥩 MAL PASSADA
          </span>
        );
      case 'ao_ponto':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-500 text-slate-950 shadow-xs border border-amber-400">
            🥩 AO PONTO
          </span>
        );
      case 'bem_passada':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-950 text-amber-100 shadow-xs border border-amber-800">
            🥩 BEM PASSADA
          </span>
        );
      default:
        return null;
    }
  };

  const getElapsedTimeInMinutes = (createdAtISO: string) => {
    const start = new Date(createdAtISO).getTime();
    const diffMs = currentTime - start;
    return Math.max(1, Math.floor(diffMs / 60000));
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner - Header & Sound Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 text-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              🔥 Cozinha & Churrasqueira (KDS)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Alterne entre o preparo na grelha e a expedição de pedidos no balcão em tempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={playBellSound}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
            title="Tocar campainha do garçom"
          >
            <Bell className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Campainha Garçom</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs ${
              soundEnabled
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Som Ligado' : 'Mudo'}</span>
          </button>
        </div>
      </div>

      {/* AS DUAS ABAS PRINCIPAIS: CHURRASQUEIRA vs BALCÃO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* ABA 1: CHURRASQUEIRA */}
        <button
          onClick={() => setActiveView('churrasqueira')}
          className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-left relative overflow-hidden flex items-center justify-between gap-3 shadow-lg active:scale-[0.99] ${
            activeView === 'churrasqueira'
              ? 'bg-gradient-to-br from-slate-900 via-orange-950/40 to-slate-900 border-orange-500 shadow-orange-950/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850 opacity-80'
          }`}
        >
          {activeView === 'churrasqueira' && (
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-red-500" />
          )}
          <div className="flex items-center space-x-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              activeView === 'churrasqueira'
                ? 'bg-gradient-to-br from-red-600 to-orange-600 border-orange-400/40 shadow-md shadow-orange-900/50'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Flame className={`w-6 h-6 ${activeView === 'churrasqueira' ? 'text-amber-300 animate-bounce' : 'text-orange-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  🔥 Churrasqueira
                </h2>
                {activeView === 'churrasqueira' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    Ativa
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Preparo dos espetos na brasa e prontos
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xl sm:text-2xl font-black text-amber-400">
              {waitingItems.length + preparingItems.length}
            </div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">
              Em Produção
            </span>
          </div>
        </button>

        {/* ABA 2: BALCÃO */}
        <button
          onClick={() => setActiveView('balcao')}
          className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-left relative overflow-hidden flex items-center justify-between gap-3 shadow-lg active:scale-[0.99] ${
            activeView === 'balcao'
              ? 'bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border-blue-500 shadow-blue-950/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850 opacity-80'
          }`}
        >
          {activeView === 'balcao' && (
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-400 to-teal-400" />
          )}
          <div className="flex items-center space-x-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              activeView === 'balcao'
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 border-blue-400/40 shadow-md shadow-blue-900/50'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <ConciergeBell className={`w-6 h-6 ${activeView === 'balcao' ? 'text-sky-200 animate-pulse' : 'text-blue-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  🛎️ Balcão
                </h2>
                {activeView === 'balcao' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Ativa
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Levar para a mesa e pedidos entregues
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className={`text-xl sm:text-2xl font-black ${readyItems.length > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`}>
              {readyItems.length}
            </div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">
              Para Levar
            </span>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* DETALHAMENTO DA ABA: CHURRASQUEIRA (PREPARANDO O ESPETO OU JÁ ESTÁ PRONTO)*/}
      {/* ========================================================================= */}
      {activeView === 'churrasqueira' && (
        <div className="space-y-4">
          {/* Sub-navegação do detalhamento da Churrasqueira */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setKdsChurrasqueiraFilter('preparando')}
                className={`py-2 px-3 sm:px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                  kdsChurrasqueiraFilter === 'preparando' || kdsChurrasqueiraFilter === 'todos'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Flame className="w-4 h-4 text-orange-400" />
                <span>🔥 Preparando o Espeto</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-slate-950 text-amber-400">
                  {waitingItems.length + preparingItems.length}
                </span>
              </button>

              <button
                onClick={() => setKdsChurrasqueiraFilter('pronto')}
                className={`py-2 px-3 sm:px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                  kdsChurrasqueiraFilter === 'pronto'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>✅ Já está Pronto!</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-slate-950 text-emerald-400">
                  {readyItems.length}
                </span>
              </button>
            </div>

            {waitingItems.length > 1 && (
              <button
                onClick={handleMoveAllWaitingToGrill}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5 fill-slate-950" />
                <span>⚡ Colocar Todos no Fogo</span>
              </button>
            )}
          </div>

          {/* COLUNAS DE DETALHAMENTO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* SEÇÃO 1: PREPARANDO O ESPETO (NA GRELHA / NA BRASA + FILA) */}
            {(kdsChurrasqueiraFilter === 'todos' || kdsChurrasqueiraFilter === 'preparando' || kdsChurrasqueiraFilter === 'aguardando') && (
              <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                      <Flame className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-black text-amber-400 text-sm sm:text-base uppercase tracking-wider">
                        Preparando o Espeto (Na Grelha & Fila)
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {preparingItems.length} na brasa, {waitingItems.length} aguardando fogo
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-1">
                  {waitingItems.length === 0 && preparingItems.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                      Nenhum espeto sendo preparado na grelha no momento.
                    </div>
                  ) : (
                    <>
                      {/* ESPETOS NA GRELHA (ASSANDO AGORA) */}
                      {preparingItems.map(({ orderId, orderNumber, tableOrCustomer, orderCreatedAt, item }) => {
                        const mins = getElapsedTimeInMinutes(orderCreatedAt);

                        return (
                          <div
                            key={`grilling-${orderId}-${item.id}`}
                            className="bg-slate-800/95 border-2 border-amber-500/60 rounded-xl p-4 space-y-3 shadow-lg relative overflow-hidden"
                          >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 animate-pulse" />

                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-500/30">
                                🍽️ #{orderNumber} - {tableOrCustomer}
                              </span>
                              <span className="text-xs font-bold text-amber-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {mins} min
                              </span>
                            </div>

                            <div>
                              <div className="font-black text-white text-base sm:text-lg">
                                {item.quantity}x {item.productName}
                              </div>
                              {item.meatPoint && (
                                <div className="mt-2">{getMeatPointBadge(item.meatPoint)}</div>
                              )}
                              {item.notes && (
                                <p className="mt-2 text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 font-medium italic">
                                  ⚠️ Observação: {item.notes}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleMarkItemReady(orderId, item.id)}
                              className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm uppercase tracking-wide transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                              <span>Já está Pronto! ✅ (Mandar ao Balcão)</span>
                            </button>
                          </div>
                        );
                      })}

                      {/* ESPETOS NA FILA (AGUARDANDO FOGO) */}
                      {waitingItems.map(({ orderId, orderNumber, tableOrCustomer, orderCreatedAt, item }) => {
                        const mins = getElapsedTimeInMinutes(orderCreatedAt);

                        return (
                          <div
                            key={`waiting-${orderId}-${item.id}`}
                            className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-md"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                Fila #{orderNumber} - {tableOrCustomer}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {mins} min
                              </span>
                            </div>

                            <div>
                              <div className="font-black text-white text-base">
                                {item.quantity}x {item.productName}
                              </div>
                              {item.meatPoint && (
                                <div className="mt-1.5">{getMeatPointBadge(item.meatPoint)}</div>
                              )}
                              {item.notes && (
                                <p className="mt-2 text-xs text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 font-medium italic">
                                  ⚠️ Obs: {item.notes}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => onUpdateItemStatus(orderId, item.id, 'na_grelha')}
                              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                            >
                              <Flame className="w-4 h-4 fill-amber-300 animate-pulse" />
                              <span>Colocar no Fogo 🔥 (Iniciar Preparo)</span>
                            </button>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* SEÇÃO 2: JÁ ESTÁ PRONTO (CONCLUÍDO NA BRASA) */}
            {(kdsChurrasqueiraFilter === 'todos' || kdsChurrasqueiraFilter === 'pronto') && (
              <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-emerald-400 text-sm sm:text-base uppercase tracking-wider">
                        Já está Pronto! (Assado Finalizado)
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {readyItems.length} espetos prontos aguardando retirada no balcão
                      </span>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-black">
                    {readyItems.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-1">
                  {readyItems.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                      Nenhum espeto pronto no momento. Conclua os assados ao lado para enviar ao balcão.
                    </div>
                  ) : (
                    readyItems.map(({ orderId, orderNumber, tableOrCustomer, item }) => (
                      <div
                        key={`ready-${orderId}-${item.id}`}
                        className="bg-slate-800 border border-emerald-500/40 rounded-xl p-4 space-y-3 shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            🍽️ #{orderNumber} - {tableOrCustomer}
                          </span>
                          <span className="text-[11px] font-extrabold text-emerald-300 bg-emerald-950 border border-emerald-600/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            PRONTO P/ SERVIR
                          </span>
                        </div>

                        <div>
                          <div className="font-black text-white text-base">
                            {item.quantity}x {item.productName}
                          </div>
                          {item.meatPoint && (
                            <div className="mt-1.5">{getMeatPointBadge(item.meatPoint)}</div>
                          )}
                        </div>

                        <button
                          onClick={() => setActiveView('balcao')}
                          className="w-full py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                        >
                          <ConciergeBell className="w-4 h-4" />
                          <span>Abrir no Balcão para Levar à Mesa ➔</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETALHAMENTO DA ABA: BALCÃO (LEVAR PARA A MESA & ENTREGUE NA MESA)        */}
      {/* ========================================================================= */}
      {activeView === 'balcao' && (
        <div className="space-y-4">
          {/* Sub-navegação do Balcão */}
          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-2">
            <button
              onClick={() => setBalcaoFilter('pendentes')}
              className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                balcaoFilter === 'pendentes'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>🍽️ Levar para a Mesa</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                balcaoFilter === 'pendentes' ? 'bg-slate-950/60 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {readyOrdersList.length} mesas ({readyItems.length} espetos)
              </span>
            </button>

            <button
              onClick={() => setBalcaoFilter('entregues')}
              className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                balcaoFilter === 'entregues'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CheckCheck className="w-4 h-4" />
              <span>✅ Entregue na Mesa</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-slate-800 text-slate-300">
                {deliveredItems.length}
              </span>
            </button>
          </div>

          {/* DETALHAMENTO 1: LEVAR PARA A MESA */}
          {balcaoFilter === 'pendentes' && (
            <div className="space-y-4">
              {readyOrdersList.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase">Tudo Entregue! Balcão Livre</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Não há espetos aguardando para levar às mesas no momento. Assim que a churrasqueira concluir um espeto, ele aparecerá aqui com alerta sonoro!
                  </p>
                  <button
                    onClick={() => setActiveView('churrasqueira')}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Ver Preparo na Churrasqueira</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {readyOrdersList.map((orderGroup) => {
                    const mins = getElapsedTimeInMinutes(orderGroup.orderCreatedAt);

                    return (
                      <div
                        key={orderGroup.orderId}
                        className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xl shadow-emerald-950/20 relative overflow-hidden"
                      >
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 animate-pulse" />

                        {/* Order & Table Header */}
                        <div className="flex items-start justify-between gap-2 pt-1 border-b border-slate-800 pb-3">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
                              Mesa / Destino
                            </span>
                            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-1.5">
                              🍽️ {orderGroup.tableOrCustomer}
                            </h3>
                            <span className="text-xs text-slate-400">
                              Pedido #{orderGroup.orderNumber}
                            </span>
                          </div>

                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-xs">
                            <Clock className="w-3.5 h-3.5" />
                            {mins} min
                          </span>
                        </div>

                        {/* List of items to take to table */}
                        <div className="space-y-2 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Espetos para levar ({orderGroup.items.length}):
                          </span>

                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {orderGroup.items.map((item) => (
                              <div
                                key={item.id}
                                className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <strong className="text-white text-sm block font-black">
                                    {item.quantity}x {item.productName}
                                  </strong>
                                  {item.meatPoint && (
                                    <div className="mt-1">{getMeatPointBadge(item.meatPoint)}</div>
                                  )}
                                  {item.notes && (
                                    <span className="text-[11px] text-amber-300 block italic truncate mt-0.5">
                                      Obs: {item.notes}
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() => onUpdateItemStatus(orderGroup.orderId, item.id, 'entregue')}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95"
                                  title="Marcar apenas este item como entregue"
                                >
                                  ✓ Entregue
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action: LEVAR PARA A MESA / ENTREGUE NA MESA */}
                        <div className="pt-2 border-t border-slate-800">
                          <button
                            onClick={() => handleDeliverEntireOrder(orderGroup.orderId, orderGroup.items)}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wide transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center space-x-2 cursor-pointer active:scale-95 border border-emerald-400/30"
                          >
                            <CheckCheck className="w-5 h-5" />
                            <span>Levar e Entregar na Mesa</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* DETALHAMENTO 2: ENTREGUE NA MESA (HISTÓRICO) */}
          {balcaoFilter === 'entregues' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-extrabold text-white text-sm sm:text-base uppercase tracking-tight">
                      Espetos Entregues nas Mesas
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Total de {deliveredItems.length} espetos entregues com sucesso
                  </span>
                </div>

                {deliveredOrdersList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Nenhum espeto marcado como entregue ainda nesta sessão.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {deliveredOrdersList.map((group) => (
                      <div
                        key={group.orderId}
                        className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-white text-sm">
                            🍽️ {group.tableOrCustomer}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Entregue na Mesa
                          </span>
                        </div>

                        <div className="space-y-1 pt-1 border-t border-slate-700/50">
                          {group.items.map((item) => (
                            <div key={item.id} className="text-xs text-slate-300 flex items-center justify-between">
                              <span>{item.quantity}x {item.productName}</span>
                              {item.meatPoint && (
                                <span className="text-[10px] text-slate-400">
                                  {item.meatPoint === 'mal_passada' ? 'Mal pass.' : item.meatPoint === 'ao_ponto' ? 'Ao ponto' : 'Bem pass.'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
