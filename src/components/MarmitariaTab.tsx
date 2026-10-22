import React, { useState, useMemo, useEffect } from 'react';
import { 
  MarmitaSize, MarmitaSizeConfig, MarmitaOption, MarmitaItem, 
  MarmitaOrder, MarmitaOrderStatus, MarmitaDeliveryType, MarmitaSettings,
  PaymentMethod, AppUser, MarmitaDailyMenu, DayOfWeekKey
} from '../types';
import { 
  printMarmitaThermalDirect, formatMarmitaWhatsAppText,
  MarmitaLabelMode, MarmitaPaperWidth, MarmitaFontSize
} from '../utils/printMarmita';
import { 
  loadMarmitaDailyMenus, saveMarmitaDailyMenus, getTodayDayOfWeekKey 
} from '../lib/storage';
import { 
  Utensils, Plus, Minus, Trash2, CheckCircle2, Clock, 
  Motorbike, ShoppingBag, MapPin, Phone, MessageSquare, 
  Printer, Search, DollarSign, Calendar, Check, ArrowRight,
  ChefHat, Tag, Send, Sparkles, Copy, Edit3, Save, Share2
} from 'lucide-react';

interface MarmitariaTabProps {
  currentUser: AppUser;
  sizes: MarmitaSizeConfig[];
  options: MarmitaOption[];
  orders: MarmitaOrder[];
  settings: MarmitaSettings;
  onUpdateSizes: (sizes: MarmitaSizeConfig[]) => void;
  onUpdateOptions: (options: MarmitaOption[]) => void;
  onCreateOrder: (order: MarmitaOrder) => void;
  onUpdateOrderStatus: (orderId: string, status: MarmitaOrderStatus, motoboyName?: string) => void;
  onUpdateOrder: (order: MarmitaOrder) => void;
  onDeleteOrder: (orderId: string) => void;
  onUpdateSettings: (settings: MarmitaSettings) => void;
  onSwitchToEspetos?: () => void;
}

export const MarmitariaTab: React.FC<MarmitariaTabProps> = ({
  currentUser,
  sizes: propSizes,
  options,
  orders,
  settings,
  onUpdateSizes,
  onUpdateOptions,
  onCreateOrder,
  onUpdateOrderStatus,
  onDeleteOrder,
  onSwitchToEspetos
}) => {
  // Navigation: 3 clean tabs
  const [activeTab, setActiveTab] = useState<'novo_pedido' | 'fila_kds' | 'cardapio_dia'>('novo_pedido');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  /* =========================================================================
   * SIZES: Strictly PEQUENA (P), MÉDIA (M), GRANDE (G)
   * ========================================================================= */
  const cleanSizes = useMemo(() => {
    const list = propSizes.filter((s) => s.size === 'P' || s.size === 'M' || s.size === 'G');
    if (list.length > 0) return list;
    return [
      {
        size: 'P' as MarmitaSize,
        name: 'Marmita Pequena (P)',
        label: 'Pequena (P)',
        price: 16.00,
        maxProteins: 1,
        maxSides: 2,
        description: '1 carne + arroz, feijão e acompanhamentos',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300'
      },
      {
        size: 'M' as MarmitaSize,
        name: 'Marmita Média (M)',
        label: 'Média (M)',
        price: 20.00,
        maxProteins: 1,
        maxSides: 3,
        description: 'Tamanho mais pedido. 1 carne caprichada + guarnições',
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-300'
      },
      {
        size: 'G' as MarmitaSize,
        name: 'Marmita Grande (G)',
        label: 'Grande (G)',
        price: 25.00,
        maxProteins: 2,
        maxSides: 4,
        description: 'Porção reforçada. Até 2 carnes generosas + guarnições',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-300'
      }
    ];
  }, [propSizes]);

  /* =========================================================================
   * DAILY MENUS: Campo para cadastrar o cardápio de cada dia
   * ========================================================================= */
  const [dailyMenus, setDailyMenus] = useState<MarmitaDailyMenu[]>(() => loadMarmitaDailyMenus());
  const todayKey = useMemo(() => getTodayDayOfWeekKey(), []);
  const [selectedDayKey, setSelectedDayKey] = useState<DayOfWeekKey>(todayKey);

  // Form inputs for selected day's menu
  const activeMenu = useMemo(() => {
    return dailyMenus.find((m) => m.dayKey === selectedDayKey) || dailyMenus[0];
  }, [dailyMenus, selectedDayKey]);

  const [editCarnes, setEditCarnes] = useState<string>('');
  const [editAcompanhamentos, setEditAcompanhamentos] = useState<string>('');
  const [editDestaque, setEditDestaque] = useState<string>('');
  const [editObservacoes, setEditObservacoes] = useState<string>('');

  // Sync edit fields when changing day
  useEffect(() => {
    if (activeMenu) {
      setEditCarnes(activeMenu.carnes.join(', '));
      setEditAcompanhamentos(activeMenu.acompanhamentos.join(', '));
      setEditDestaque(activeMenu.destaquePrato || '');
      setEditObservacoes(activeMenu.observacoes || '');
    }
  }, [activeMenu]);

  // Today's active menu in PDV
  const todayMenu = useMemo(() => {
    return dailyMenus.find((m) => m.dayKey === todayKey) || dailyMenus[0];
  }, [dailyMenus, todayKey]);

  const handleSaveDayMenu = () => {
    const carnesList = editCarnes
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const acompanhamentosList = editAcompanhamentos
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updated = dailyMenus.map((m) => {
      if (m.dayKey === selectedDayKey) {
        return {
          ...m,
          carnes: carnesList.length > 0 ? carnesList : ['Bife Acebolado', 'Frango Grelhado'],
          acompanhamentos: acompanhamentosList.length > 0 ? acompanhamentosList : ['Arroz Branco', 'Feijão Carioca', 'Farofa'],
          destaquePrato: editDestaque.trim() || undefined,
          observacoes: editObservacoes.trim() || undefined,
        };
      }
      return m;
    });

    setDailyMenus(updated);
    saveMarmitaDailyMenus(updated);
    showToast(`✅ Cardápio de ${activeMenu?.dayLabel || selectedDayKey} salvo com sucesso!`);
  };

  // Copy WhatsApp Formatted Daily Menu
  const handleCopyWhatsAppMenu = (menuToCopy = activeMenu) => {
    if (!menuToCopy) return;

    const priceP = cleanSizes.find((s) => s.size === 'P')?.price || 16.00;
    const priceM = cleanSizes.find((s) => s.size === 'M')?.price || 20.00;
    const priceG = cleanSizes.find((s) => s.size === 'G')?.price || 25.00;

    let text = `*🍱 CARDÁPIO DE HOJE — ${menuToCopy.dayLabel.toUpperCase()}*\n`;
    text += `*${settings.restaurantName || 'Maresia Gastronomia'}*\n\n`;

    if (menuToCopy.destaquePrato) {
      text += `⭐ *DESTAQUE DO DIA:*\n${menuToCopy.destaquePrato}\n\n`;
    }

    text += `🥩 *OPÇÕES DE CARNES:*\n`;
    menuToCopy.carnes.forEach((c) => {
      text += `• ${c}\n`;
    });

    text += `\n🥗 *ACOMPANHAMENTOS:*\n`;
    menuToCopy.acompanhamentos.forEach((a) => {
      text += `• ${a}\n`;
    });

    text += `\n📦 *TAMANHOS E VALORES:*\n`;
    text += `• *Pequena (P):* R$ ${priceP.toFixed(2).replace('.', ',')} (1 carne)\n`;
    text += `• *Média (M):* R$ ${priceM.toFixed(2).replace('.', ',')} (1 carne)\n`;
    text += `• *Grande (G):* R$ ${priceG.toFixed(2).replace('.', ',')} (até 2 carnes)\n\n`;

    if (menuToCopy.observacoes) {
      text += `💡 _${menuToCopy.observacoes}_\n\n`;
    }

    text += `🛵 *Faça seu pedido pelo WhatsApp:*\n${settings.phoneWhatsapp || ''}`;

    navigator.clipboard.writeText(text);
    showToast('📋 Cardápio copiado! Pronto para colar no WhatsApp!');
  };

  /* =========================================================================
   * BUILDER / MONTAGEM RÁPIDA DE MARMITA (PDV ÁGIL)
   * ========================================================================= */
  const [selectedSize, setSelectedSize] = useState<MarmitaSize>('M');
  const [selectedProteinas, setSelectedProteinas] = useState<string[]>([]);
  const [selectedBases, setSelectedBases] = useState<string[]>(['Arroz Branco']);
  const [selectedFeijoes, setSelectedFeijoes] = useState<string[]>(['Feijão Carioca']);
  const [selectedSides, setSelectedSides] = useState<string[]>(['Farofa']);
  const [marmitaNotes, setMarmitaNotes] = useState('');
  const [marmitaQuantity, setMarmitaQuantity] = useState(1);

  // Cart for current order
  const [cartItems, setCartItems] = useState<MarmitaItem[]>([]);

  // Customer & Delivery form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<MarmitaDeliveryType>('balcao');
  const [addressOrTable, setAddressOrTable] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(settings.defaultDeliveryFee || 5.00);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [isPaid, setIsPaid] = useState<boolean>(true);

  // Selected Order for Printing
  const [printOrderModal, setPrintOrderModal] = useState<MarmitaOrder | null>(null);
  const [isPrintingLabel, setIsPrintingLabel] = useState(false);

  // KDS search and filter
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Active Size Config
  const currentSizeConfig = useMemo(() => {
    return cleanSizes.find((s) => s.size === selectedSize) || cleanSizes[1] || cleanSizes[0];
  }, [cleanSizes, selectedSize]);

  // Set default protein from today's menu if none selected
  useEffect(() => {
    if (selectedProteinas.length === 0 && todayMenu && todayMenu.carnes.length > 0) {
      setSelectedProteinas([todayMenu.carnes[0]]);
    }
  }, [todayMenu]);

  // Calculate current marmita price
  const currentMarmitaPrice = useMemo(() => {
    let total = currentSizeConfig.price;
    // Extra meats beyond limit: +R$ 7,00 each
    if (selectedProteinas.length > currentSizeConfig.maxProteins) {
      total += (selectedProteinas.length - currentSizeConfig.maxProteins) * 7.00;
    }
    return total;
  }, [currentSizeConfig, selectedProteinas]);

  // Order Cart Totals
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const effectiveDeliveryFee = deliveryType === 'entrega' ? deliveryFee : 0;
  const orderTotal = cartSubtotal + effectiveDeliveryFee;

  // Toggle helpers
  const handleToggleProtein = (name: string) => {
    setSelectedProteinas((prev) => {
      if (prev.includes(name)) {
        return prev.length > 1 ? prev.filter((p) => p !== name) : prev;
      }
      if (prev.length < currentSizeConfig.maxProteins) {
        return [...prev, name];
      }
      if (currentSizeConfig.maxProteins === 1) {
        return [name];
      }
      return [...prev, name];
    });
  };

  const handleToggleSide = (name: string) => {
    setSelectedSides((prev) => {
      if (prev.includes(name)) {
        return prev.filter((s) => s !== name);
      }
      return [...prev, name];
    });
  };

  // Add marmita to order cart
  const handleAddMarmita = () => {
    if (selectedProteinas.length === 0) {
      showToast('⚠️ Selecione a carne para a marmita!');
      return;
    }

    const newItem: MarmitaItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      size: selectedSize,
      sizeName: currentSizeConfig.label,
      bases: selectedBases.length > 0 ? selectedBases : ['Arroz Branco'],
      feijoes: selectedFeijoes.length > 0 ? selectedFeijoes : ['Feijão Carioca'],
      proteinas: selectedProteinas,
      guarnicoes: selectedSides,
      saladas: [],
      adicionais: [],
      price: currentMarmitaPrice,
      quantity: marmitaQuantity,
      notes: marmitaNotes.trim() || undefined
    };

    setCartItems((prev) => [...prev, newItem]);
    setMarmitaNotes('');
    setMarmitaQuantity(1);
    showToast(`✅ Marmita ${currentSizeConfig.label} adicionada!`);
  };

  // Finalize Order
  const handleFinalizeOrder = () => {
    const itemsToSave = [...cartItems];

    // If cart is empty, automatically add the current assembled marmita
    if (itemsToSave.length === 0) {
      if (selectedProteinas.length === 0) {
        showToast('⚠️ Selecione uma carne antes de confirmar o pedido!');
        return;
      }
      itemsToSave.push({
        id: `item-${Date.now()}`,
        size: selectedSize,
        sizeName: currentSizeConfig.label,
        bases: selectedBases,
        feijoes: selectedFeijoes,
        proteinas: selectedProteinas,
        guarnicoes: selectedSides,
        saladas: [],
        adicionais: [],
        price: currentMarmitaPrice,
        quantity: marmitaQuantity,
        notes: marmitaNotes.trim() || undefined
      });
    }

    const finalSubtotal = itemsToSave.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const finalFee = deliveryType === 'entrega' ? deliveryFee : 0;
    const finalTotal = finalSubtotal + finalFee;

    const newOrder: MarmitaOrder = {
      id: `marmita-${Date.now()}`,
      orderNumber: (orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber || 0)) : 100) + 1,
      customerName: customerName.trim() || (deliveryType === 'balcao' ? 'Cliente Balcão' : 'Cliente Marmita'),
      customerPhone: customerPhone.trim() || undefined,
      deliveryType,
      tableOrAddress: addressOrTable.trim() || undefined,
      items: itemsToSave,
      beverages: [],
      subtotal: finalSubtotal,
      deliveryFee: finalFee,
      discount: 0,
      total: finalTotal,
      paymentMethod,
      isPaid,
      status: 'novo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onCreateOrder(newOrder);
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setAddressOrTable('');
    setMarmitaNotes('');
    showToast(`🎉 Pedido #${newOrder.orderNumber} lançado com sucesso!`);
    setPrintOrderModal(newOrder);
  };

  // Advance KDS order status
  const handleAdvanceStatus = (order: MarmitaOrder) => {
    let nextStatus: MarmitaOrderStatus = order.status;
    if (order.status === 'novo') nextStatus = 'em_montagem';
    else if (order.status === 'em_montagem') nextStatus = 'pronto_embalado';
    else if (order.status === 'pronto_embalado') {
      nextStatus = order.deliveryType === 'entrega' ? 'saiu_para_entrega' : 'entregue';
    } else if (order.status === 'saiu_para_entrega') {
      nextStatus = 'entregue';
    }
    onUpdateOrderStatus(order.id, nextStatus);
  };

  // Print thermal receipt
  const handlePrint = async () => {
    if (!printOrderModal) return;
    setIsPrintingLabel(true);
    try {
      await printMarmitaThermalDirect(printOrderModal, settings, {
        mode: 'tampa',
        paperWidth: '80mm',
        fontSize: 'grande',
        singleItemIndex: 'all',
      });
    } finally {
      setIsPrintingLabel(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!printOrderModal) return;
    const text = formatMarmitaWhatsAppText(printOrderModal, settings);
    const phone = printOrderModal.customerPhone?.replace(/\D/g, '') || '';
    const url = phone
      ? `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const activeOrders = orders.filter((o) => o.status !== 'entregue' && o.status !== 'cancelado');
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      orderSearch === '' ||
      o.orderNumber.toString().includes(orderSearch) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.tableOrAddress && o.tableOrAddress.toLowerCase().includes(orderSearch.toLowerCase()));

    const matchesStatus = statusFilter === 'todos' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const weekDays: { key: DayOfWeekKey; label: string; short: string }[] = [
    { key: 'segunda', label: 'Segunda-feira', short: 'Seg' },
    { key: 'terca', label: 'Terça-feira', short: 'Ter' },
    { key: 'quarta', label: 'Quarta-feira', short: 'Qua' },
    { key: 'quinta', label: 'Quinta-feira', short: 'Qui' },
    { key: 'sexta', label: 'Sexta-feira', short: 'Sex' },
    { key: 'sabado', label: 'Sábado', short: 'Sáb' },
    { key: 'domingo', label: 'Domingo', short: 'Dom' },
  ];

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center space-x-2 text-sm">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Marmitaria Maresia</h2>
              <span className="bg-orange-100 text-orange-800 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                {activeOrders.length} em produção
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Cardápio do Dia • Marmitas Pequena, Média e Grande
            </p>
          </div>
        </div>

        {onSwitchToEspetos && (
          <button
            type="button"
            onClick={onSwitchToEspetos}
            className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <span>Ir para Espetos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Navigation: 3 Direct Tabs */}
      <div className="flex items-center space-x-2 p-1 bg-slate-200/70 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('novo_pedido')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'novo_pedido'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>1. Montar Marmita (PDV)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fila_kds')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer relative ${
            activeTab === 'fila_kds'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>2. Fila de Pedidos</span>
          {activeOrders.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-orange-600 text-white">
              {activeOrders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cardapio_dia')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'cardapio_dia'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>3. Cardápio do Dia & Preços</span>
        </button>
      </div>

      {/* =====================================================================
       * TAB 1: MONTAGEM RÁPIDA (PDV ÁGIL COM TIPOS PEQUENA, MÉDIA E GRANDE)
       * ===================================================================== */}
      {activeTab === 'novo_pedido' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Fast Assembly Form */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            
            {/* Banner of Today's Menu Highlight */}
            {todayMenu && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3.5 rounded-2xl border border-orange-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                    📅
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase text-orange-800 tracking-wider block">
                      Cardápio de Hoje ({todayMenu.dayLabel}):
                    </span>
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {todayMenu.destaquePrato ? `⭐ ${todayMenu.destaquePrato} • ` : ''}
                      {todayMenu.carnes.join(' • ')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyWhatsAppMenu(todayMenu)}
                  className="bg-white hover:bg-orange-100 text-orange-700 px-3 py-1.5 rounded-xl border border-orange-200 text-xs font-black shrink-0 flex items-center space-x-1 cursor-pointer transition-all"
                  title="Copiar cardápio formatado para WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>
            )}

            {/* Step 1: Tipos de Marmita (Pequena, Média e Grande) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  1. Tamanho da Marmita:
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {currentSizeConfig.label} selecionada
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {cleanSizes.map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => setSelectedSize(s.size)}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      selectedSize === s.size
                        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-black text-sm sm:text-base text-slate-900">
                      {s.label}
                    </span>
                    <span className="block text-lg font-black text-orange-600 mt-0.5">
                      R$ {s.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="block text-[11px] text-slate-500 font-medium mt-1">
                      {s.size === 'G' ? 'Até 2 carnes' : '1 carne inclusa'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Carnes do Dia (Cadastradas no Cardápio) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  2. Carne do Dia ({todayMenu?.dayLabel}):
                </span>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
                  {selectedProteinas.length} / {currentSizeConfig.maxProteins} inclusa{currentSizeConfig.maxProteins > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {todayMenu?.carnes.map((carneName, index) => {
                  const isSelected = selectedProteinas.includes(carneName);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleToggleProtein(carneName)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-orange-500 bg-orange-600 text-white font-black shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-800 font-bold'
                      }`}
                    >
                      <span className="text-xs truncate">{carneName}</span>
                      {isSelected && <Check className="w-4 h-4 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Base Padrão (Arroz + Feijão) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                3. Arroz & Feijão (Padrão Completo):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBases(['Arroz Branco'])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    selectedBases.includes('Arroz Branco')
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  🍚 Arroz Branco
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBases(['Arroz Integral'])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    selectedBases.includes('Arroz Integral')
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  🍚 Arroz Integral
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFeijoes(['Feijão Carioca'])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    selectedFeijoes.includes('Feijão Carioca')
                      ? 'bg-amber-900 text-white border-amber-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  🍲 Feijão Carioca
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFeijoes(['Feijão Preto'])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    selectedFeijoes.includes('Feijão Preto')
                      ? 'bg-amber-900 text-white border-amber-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  🍲 Feijão Preto
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFeijoes([])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    selectedFeijoes.length === 0
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  🚫 Sem Feijão
                </button>
              </div>
            </div>

            {/* Step 4: Acompanhamentos do Dia */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                4. Acompanhamentos Cadastrados para Hoje:
              </span>
              <div className="flex flex-wrap gap-2">
                {todayMenu?.acompanhamentos.map((sideName, index) => {
                  const isSelected = selectedSides.includes(sideName);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleToggleSide(sideName)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-orange-50 border-orange-500 text-orange-950 font-black'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5 text-orange-600" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{sideName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes & Add Button */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={marmitaNotes}
                  onChange={(e) => setMarmitaNotes(e.target.value)}
                  placeholder="Observação da marmita (Ex: 'Feijão por cima', 'Pouco arroz')..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <div className="flex items-center bg-white border border-slate-300 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMarmitaQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-l-xl cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2.5 font-black text-xs text-slate-800">{marmitaQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setMarmitaQuantity((q) => q + 1)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-r-xl cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddMarmita}
                  className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Adicionar (R$ {(currentMarmitaPrice * marmitaQuantity).toFixed(2).replace('.', ',')})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Order Checkout */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-md space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-orange-600" />
                <span>Resumo do Pedido</span>
              </h3>
              <span className="text-xs font-bold text-slate-400">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} item(s)
              </span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {cartItems.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-500">Nenhuma marmita no carrinho</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Clique em "+ Adicionar" ou "Confirmar Pedido"</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={item.id} className="bg-orange-50/70 p-2.5 rounded-xl border border-orange-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-black text-slate-900 block">
                        {item.quantity}x {item.sizeName} — R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[11px] text-slate-600 block">
                        🥩 {item.proteinas.join(', ')}
                      </span>
                      {item.guarnicoes.length > 0 && (
                        <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                          + {item.guarnicoes.join(', ')}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCartItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Customer & Delivery Form */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Nome do Cliente:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: João / Mesa 04"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tipo de Pedido:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['balcao', 'entrega', 'mesa'] as MarmitaDeliveryType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDeliveryType(type)}
                      className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                        deliveryType === type
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {type === 'balcao' ? '🛍️ Balcão' : type === 'entrega' ? '🛵 Entrega' : '🍽️ Mesa'}
                    </button>
                  ))}
                </div>
              </div>

              {deliveryType === 'entrega' && (
                <div className="space-y-1.5 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <input
                    type="text"
                    value={addressOrTable}
                    onChange={(e) => setAddressOrTable(e.target.value)}
                    placeholder="Rua, número e bairro..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-xs"
                  />
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span>Taxa de Entrega (R$):</span>
                    <input
                      type="number"
                      step="0.5"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 rounded bg-white border border-amber-300 text-right font-black"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-600">Forma de Pagamento:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['pix', 'cartao', 'dinheiro'] as const).map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm === 'cartao' ? 'debito' : pm)}
                    className={`py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                      (pm === 'cartao' && (paymentMethod === 'debito' || paymentMethod === 'credito')) || paymentMethod === pm
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            {/* Total and Submit */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-base font-black text-slate-900">
                <span>Total:</span>
                <span className="text-xl text-orange-600">
                  R$ {orderTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <button
                type="button"
                onClick={handleFinalizeOrder}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Pedido (R$ {orderTotal.toFixed(2).replace('.', ',')})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * TAB 2: FILA DE PEDIDOS & KDS
       * ===================================================================== */}
      {activeTab === 'fila_kds' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Buscar por cliente ou nº..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold w-full sm:w-auto"
            >
              <option value="todos">Todos os Pedidos</option>
              <option value="novo">Novos</option>
              <option value="em_montagem">Em Preparo</option>
              <option value="pronto_embalado">Prontos</option>
              <option value="saiu_para_entrega">Em Entrega</option>
              <option value="entregue">Concluídos</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-1.5" />
                <p className="text-sm font-bold text-slate-600">Nenhum pedido encontrado</p>
                <p className="text-xs text-slate-400">Lance uma marmita no PDV para ver os pedidos aqui.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isCompleted = order.status === 'entregue';
                const statusColors = {
                  novo: 'bg-blue-100 text-blue-800 border-blue-200',
                  em_montagem: 'bg-amber-100 text-amber-800 border-amber-200',
                  pronto_embalado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  saiu_para_entrega: 'bg-purple-100 text-purple-800 border-purple-200',
                  entregue: 'bg-slate-100 text-slate-600 border-slate-200',
                  cancelado: 'bg-red-100 text-red-600 border-red-200',
                };

                const statusLabels = {
                  novo: 'Novo Pedido',
                  em_montagem: 'Em Montagem',
                  pronto_embalado: 'Pronto / Embalado',
                  saiu_para_entrega: 'Saiu para Entrega',
                  entregue: 'Entregue / Concluído',
                  cancelado: 'Cancelado',
                };

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl p-4 border shadow-sm space-y-3 transition-all ${
                      isCompleted ? 'opacity-70 border-slate-200' : 'border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-base">
                        #{order.orderNumber}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm truncate">{order.customerName}</h4>
                      <p className="text-xs text-slate-500">
                        {order.deliveryType === 'entrega' ? '🛵 Delivery' : order.deliveryType === 'mesa' ? '🍽️ Mesa' : '🛍️ Balcão'}
                        {order.tableOrAddress && ` • ${order.tableOrAddress}`}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 text-xs">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="border-b border-slate-200/60 pb-1 last:border-0 last:pb-0">
                          <span className="font-black text-slate-800">
                            {item.quantity}x Marmita {item.sizeName}
                          </span>
                          <p className="text-[11px] text-slate-600">
                            🥩 {item.proteinas.join(', ')}
                          </p>
                          {item.guarnicoes.length > 0 && (
                            <p className="text-[10px] text-slate-500 truncate">
                              + {item.guarnicoes.join(', ')}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-medium mt-0.5">
                              Obs: {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="font-black text-slate-900">
                        Total: <strong className="text-orange-600">R$ {order.total.toFixed(2).replace('.', ',')}</strong>
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {order.paymentMethod.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(order)}
                          className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer"
                        >
                          {order.status === 'novo' ? 'Iniciar Preparo 👨‍🍳' :
                           order.status === 'em_montagem' ? 'Marcar Pronto 📦' :
                           order.status === 'pronto_embalado' && order.deliveryType === 'entrega' ? 'Despachar 🛵' :
                           'Concluir Entrega ✅'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setPrintOrderModal(order)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        title="Imprimir Comanda Térmica"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {order.customerPhone && (
                        <button
                          type="button"
                          onClick={() => {
                            setPrintOrderModal(order);
                            handleShareWhatsApp();
                          }}
                          className="p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 cursor-pointer"
                          title="Enviar aviso WhatsApp"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
       * TAB 3: CAMPO PARA CADASTRAR O CARDÁPIO DE CADA DIA & PREÇOS
       * ===================================================================== */}
      {activeTab === 'cardapio_dia' && (
        <div className="space-y-5">
          {/* Preços dos 3 Tamanhos (Pequena, Média e Grande) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div>
              <h3 className="font-black text-slate-900 text-base">Valores das Marmitas</h3>
              <p className="text-xs text-slate-500">Defina os preços dos 3 tamanhos oficiais do sistema:</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {cleanSizes.map((s) => (
                <div key={s.size} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900">{s.label}</span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {s.size === 'G' ? '2 carnes' : '1 carne'}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Preço (R$):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={s.price}
                      onChange={(e) => {
                        const newPrice = Number(e.target.value);
                        const updated = cleanSizes.map((item) =>
                          item.size === s.size ? { ...item, price: newPrice } : item
                        );
                        onUpdateSizes(updated);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm font-black text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cadastro de Cardápio de Cada Dia da Semana */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <span>📅 Cadastrar Cardápio de Cada Dia</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Cadastre as carnes e acompanhamentos servidos em cada dia da semana.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCopyWhatsAppMenu(activeMenu)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Share2 className="w-4 h-4" />
                <span>Copiar Cardápio p/ WhatsApp</span>
              </button>
            </div>

            {/* Day Selector Buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 p-1.5 bg-slate-100 rounded-xl">
              {weekDays.map((d) => {
                const isSelected = selectedDayKey === d.key;
                const isToday = todayKey === d.key;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSelectedDayKey(d.key)}
                    className={`py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-xs font-black'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{d.short}</span>
                    {isToday && (
                      <span className="block text-[9px] uppercase tracking-wider font-black opacity-90">
                        HOJE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Editing Card for Selected Day */}
            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span>Cardápio de: <strong className="text-orange-600">{activeMenu?.dayLabel}</strong></span>
                </span>
                {todayKey === selectedDayKey && (
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                    Ativo Hoje no PDV
                  </span>
                )}
              </div>

              {/* Carnes do Dia Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">
                  🥩 Carnes / Pratos Principais do Dia (separados por vírgula):
                </label>
                <textarea
                  rows={2}
                  value={editCarnes}
                  onChange={(e) => setEditCarnes(e.target.value)}
                  placeholder="Ex: Bife Acebolado, Filé de Frango Grelhado, Feijoada Completa, Costelinha Suína"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <p className="text-[11px] text-slate-400">
                  Estas carnes aparecerão como opções clicáveis na tela de montagem da marmita.
                </p>
              </div>

              {/* Acompanhamentos do Dia Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">
                  🥗 Acompanhamentos & Guarnições do Dia (separados por vírgula):
                </label>
                <textarea
                  rows={2}
                  value={editAcompanhamentos}
                  onChange={(e) => setEditAcompanhamentos(e.target.value)}
                  placeholder="Ex: Arroz Branco, Feijão Carioca, Farofa da Casa, Macarrão, Vinagrete, Purê de Batatas"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Destaque & Observações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    ⭐ Destaque do Prato Especial (Opcional):
                  </label>
                  <input
                    type="text"
                    value={editDestaque}
                    onChange={(e) => setEditDestaque(e.target.value)}
                    placeholder="Ex: Feijoada Completa com Couve e Torresmo"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    📝 Observações / Recado no WhatsApp:
                  </label>
                  <input
                    type="text"
                    value={editObservacoes}
                    onChange={(e) => setEditObservacoes(e.target.value)}
                    placeholder="Ex: Acompanha vinagrete e farofa crocante"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveDayMenu}
                  className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Cardápio de {activeMenu?.dayLabel}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Thermal Modal */}
      {printOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">
                Imprimir Comanda #{printOrderModal.orderNumber}
              </h3>
              <button
                type="button"
                onClick={() => setPrintOrderModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-black text-xs flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Cliente: <strong>{printOrderModal.customerName}</strong> • Total: <strong>R$ {printOrderModal.total.toFixed(2).replace('.', ',')}</strong>
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrintingLabel}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{isPrintingLabel ? 'Imprimindo...' : 'Imprimir Térmica'}</span>
              </button>

              {printOrderModal.customerPhone && (
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
