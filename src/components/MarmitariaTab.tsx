import React, { useState, useMemo } from 'react';
import { 
  MarmitaSize, MarmitaSizeConfig, MarmitaOption, MarmitaOptionCategory,
  MarmitaItem, MarmitaOrder, MarmitaOrderStatus, MarmitaDeliveryType, MarmitaSettings,
  PaymentMethod, AppUser, hasPermission
} from '../types';
import { 
  generateMarmitaLabelHtml, printMarmitaThermalDirect, formatMarmitaWhatsAppText,
  MarmitaLabelMode, MarmitaPaperWidth, MarmitaFontSize
} from '../utils/printMarmita';
import { 
  Utensils, Plus, Minus, Trash2, CheckCircle2, Clock, 
  Motorbike, ShoppingBag, MapPin, Phone, MessageSquare, 
  Printer, Search, Filter, Sparkles, AlertCircle, DollarSign, 
  Calendar, Layers, Check, Edit2, Copy, ArrowRight,
  ChevronRight, RefreshCw, ChefHat, Tag, PackageCheck, Send,
  Smartphone, ZoomIn
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
  sizes,
  options,
  orders,
  settings,
  onUpdateSizes,
  onUpdateOptions,
  onCreateOrder,
  onUpdateOrderStatus,
  onUpdateOrder,
  onDeleteOrder,
  onUpdateSettings,
  onSwitchToEspetos
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'montar' | 'pedidos' | 'cardapio_dia' | 'relatorios' | 'config'>('montar');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  /* =========================================================================
   * STATE: BUILDER / MONTAGEM DE MARMITA
   * ========================================================================= */
  const [selectedSize, setSelectedSize] = useState<MarmitaSize>('M');
  const [selectedBases, setSelectedBases] = useState<string[]>(['Arroz Branco Soltinho']);
  const [selectedFeijoes, setSelectedFeijoes] = useState<string[]>(['Feijão Carioca da Casa (Caldo Grosso)']);
  const [selectedProteinas, setSelectedProteinas] = useState<string[]>([]);
  const [selectedGuarnicoes, setSelectedGuarnicoes] = useState<string[]>([]);
  const [selectedSaladas, setSelectedSaladas] = useState<string[]>([]);
  const [selectedAdicionais, setSelectedAdicionais] = useState<{ name: string; price: number }[]>([]);
  const [marmitaNotes, setMarmitaNotes] = useState('');
  const [marmitaQuantity, setMarmitaQuantity] = useState(1);

  // Cart / Assembled Marmitas List in active order
  const [assembledItems, setAssembledItems] = useState<MarmitaItem[]>([]);
  const [selectedBeverages, setSelectedBeverages] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);

  // Customer & Delivery form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<MarmitaDeliveryType>('entrega');
  const [tableOrAddress, setTableOrAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(settings.defaultDeliveryFee || 5.00);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [changeFor, setChangeFor] = useState<string>('');
  const [orderGeneralNotes, setOrderGeneralNotes] = useState('');

  // Selected Order for Label Thermal Print Modal
  const [printOrderModal, setPrintOrderModal] = useState<MarmitaOrder | null>(null);
  const [labelMode, setLabelMode] = useState<MarmitaLabelMode>('tampa');
  const [labelPaperWidth, setLabelPaperWidth] = useState<MarmitaPaperWidth>('80mm');
  const [labelFontSize, setLabelFontSize] = useState<MarmitaFontSize>('grande');
  const [labelSelectedItemIndex, setLabelSelectedItemIndex] = useState<number | 'all'>('all');
  const [isPrintingLabel, setIsPrintingLabel] = useState(false);

  const handlePrintMarmitaLabel = async () => {
    if (!printOrderModal) return;
    setIsPrintingLabel(true);
    try {
      await printMarmitaThermalDirect(printOrderModal, settings, {
        mode: labelMode,
        paperWidth: labelPaperWidth,
        fontSize: labelFontSize,
        singleItemIndex: labelSelectedItemIndex,
      });
    } finally {
      setIsPrintingLabel(false);
    }
  };

  const handleShareMarmitaWhatsApp = () => {
    if (!printOrderModal) return;
    const text = formatMarmitaWhatsAppText(printOrderModal, settings);
    const phone = printOrderModal.customerPhone?.replace(/\D/g, '') || '';
    const url = phone
      ? `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filter & Search in Pedidos tab
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('todos');
  const [orderDeliveryFilter, setOrderDeliveryFilter] = useState<string>('todos');

  // Quick motoboy prompt
  const [motoboyModalOrder, setMotoboyModalOrder] = useState<MarmitaOrder | null>(null);
  const [motoboyInputName, setMotoboyInputName] = useState('');

  // Current selected size config
  const currentSizeConfig = useMemo(() => {
    return sizes.find((s) => s.size === selectedSize) || sizes[0];
  }, [sizes, selectedSize]);

  // Available options grouped by category
  const availableOptionsByCategory = useMemo(() => {
    const map: Record<MarmitaOptionCategory, MarmitaOption[]> = {
      base: [],
      feijao: [],
      proteina: [],
      guarnicao: [],
      salada: [],
      adicional: [],
      bebida: []
    };
    options.forEach((opt) => {
      if (opt.isAvailableToday) {
        if (!map[opt.category]) map[opt.category] = [];
        map[opt.category].push(opt);
      }
    });
    return map;
  }, [options]);

  // Calculate current single box price
  const currentBoxBasePrice = currentSizeConfig.price;
  const currentBoxExtraPrice = useMemo(() => {
    let extra = 0;
    // Check extra on bases
    selectedBases.forEach((bName) => {
      const opt = options.find((o) => o.name === bName);
      if (opt && opt.extraPrice > 0) extra += opt.extraPrice;
    });
    // Check extra on feijao
    selectedFeijoes.forEach((fName) => {
      const opt = options.find((o) => o.name === fName);
      if (opt && opt.extraPrice > 0) extra += opt.extraPrice;
    });
    // Check extra on proteinas beyond limit or premium meat
    selectedProteinas.forEach((pName, index) => {
      const opt = options.find((o) => o.name === pName);
      if (opt && opt.extraPrice > 0) extra += opt.extraPrice;
      // If user selected more proteins than allowed in size:
      if (index >= currentSizeConfig.maxProteins) {
        extra += 7.00; // Extra protein fee
      }
    });
    // Check adicionais
    selectedAdicionais.forEach((adc) => {
      extra += adc.price;
    });
    return extra;
  }, [selectedBases, selectedFeijoes, selectedProteinas, selectedAdicionais, currentSizeConfig, options]);

  const singleMarmitaTotalPrice = currentBoxBasePrice + currentBoxExtraPrice;

  // Toggle helper for base / feijao (Single select or max 1-2)
  const handleToggleBase = (optName: string) => {
    setSelectedBases((prev) => (prev.includes(optName) ? [] : [optName]));
  };

  const handleToggleFeijao = (optName: string) => {
    setSelectedFeijoes((prev) => (prev.includes(optName) ? [] : [optName]));
  };

  // Toggle for Proteina
  const handleToggleProteina = (optName: string) => {
    setSelectedProteinas((prev) => {
      if (prev.includes(optName)) {
        return prev.filter((p) => p !== optName);
      }
      return [...prev, optName];
    });
  };

  // Toggle for Guarnicao
  const handleToggleGuarnicao = (optName: string) => {
    setSelectedGuarnicoes((prev) => {
      if (prev.includes(optName)) {
        return prev.filter((g) => g !== optName);
      }
      return [...prev, optName];
    });
  };

  // Toggle for Salada
  const handleToggleSalada = (optName: string) => {
    setSelectedSaladas((prev) => {
      if (prev.includes(optName)) {
        return prev.filter((s) => s !== optName);
      }
      return [...prev, optName];
    });
  };

  // Toggle for Adicionais
  const handleToggleAdicional = (opt: MarmitaOption) => {
    setSelectedAdicionais((prev) => {
      const exists = prev.some((a) => a.name === opt.name);
      if (exists) {
        return prev.filter((a) => a.name !== opt.name);
      }
      return [...prev, { name: opt.name, price: opt.extraPrice }];
    });
  };

  // Add Beverage
  const handleAddBeverage = (opt: MarmitaOption) => {
    setSelectedBeverages((prev) => {
      const existing = prev.find((b) => b.id === opt.id);
      if (existing) {
        return prev.map((b) => (b.id === opt.id ? { ...b, quantity: b.quantity + 1 } : b));
      }
      return [...prev, { id: opt.id, name: opt.name, price: opt.extraPrice, quantity: 1 }];
    });
  };

  const handleRemoveBeverage = (id: string) => {
    setSelectedBeverages((prev) => {
      const existing = prev.find((b) => b.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map((b) => (b.id === id ? { ...b, quantity: b.quantity - 1 } : b));
      }
      return prev.filter((b) => b.id !== id);
    });
  };

  // Add currently assembled Marmita to order cart
  const handleAddMarmitaToOrderCart = () => {
    if (selectedProteinas.length === 0) {
      showToast('⚠️ Selecione pelo menos 1 opção de carne/proteína para a marmita!');
      return;
    }
    if (selectedBases.length === 0) {
      showToast('⚠️ Selecione o tipo de arroz/base da marmita!');
      return;
    }

    const newItem: MarmitaItem = {
      id: `item-marm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      size: selectedSize,
      sizeName: currentSizeConfig.name,
      bases: [...selectedBases],
      feijoes: [...selectedFeijoes],
      proteinas: [...selectedProteinas],
      guarnicoes: [...selectedGuarnicoes],
      saladas: [...selectedSaladas],
      adicionais: [...selectedAdicionais],
      price: singleMarmitaTotalPrice,
      quantity: marmitaQuantity,
      notes: marmitaNotes.trim() || undefined,
    };

    setAssembledItems((prev) => [...prev, newItem]);
    showToast(`✅ ${marmitaQuantity}x ${currentSizeConfig.label} adicionada ao pedido!`);

    // Reset single box form for next box
    setMarmitaNotes('');
    setMarmitaQuantity(1);
    // Keep base/feijao defaults, reset proteins and sides for next custom box
    setSelectedProteinas([]);
    setSelectedGuarnicoes([]);
    setSelectedSaladas([]);
    setSelectedAdicionais([]);
  };

  const handleRemoveItemFromCart = (index: number) => {
    setAssembledItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate Cart Totals
  const cartSubtotal = useMemo(() => {
    const itemsTotal = assembledItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const beveragesTotal = selectedBeverages.reduce((acc, bev) => acc + bev.price * bev.quantity, 0);
    return itemsTotal + beveragesTotal;
  }, [assembledItems, selectedBeverages]);

  const effectiveDeliveryFee = deliveryType === 'entrega' ? Number(deliveryFee) || 0 : 0;
  const cartTotal = Math.max(0, cartSubtotal + effectiveDeliveryFee - (Number(discount) || 0));

  // Finalize & Create Marmita Order
  const handleFinalizeOrder = () => {
    if (assembledItems.length === 0) {
      // If user hasn't pressed "Adicionar Marmita", but has configured one in the screen, auto-add it!
      if (selectedProteinas.length > 0) {
        const autoItem: MarmitaItem = {
          id: `item-marm-${Date.now()}`,
          size: selectedSize,
          sizeName: currentSizeConfig.name,
          bases: [...selectedBases],
          feijoes: [...selectedFeijoes],
          proteinas: [...selectedProteinas],
          guarnicoes: [...selectedGuarnicoes],
          saladas: [...selectedSaladas],
          adicionais: [...selectedAdicionais],
          price: singleMarmitaTotalPrice,
          quantity: marmitaQuantity,
          notes: marmitaNotes.trim() || undefined,
        };
        assembledItems.push(autoItem);
      } else {
        showToast('⚠️ Adicione pelo menos 1 marmita ao pedido antes de finalizar!');
        return;
      }
    }

    if (!customerName.trim()) {
      showToast('⚠️ Informe o nome do cliente ou número da comanda/mesa!');
      return;
    }

    if (deliveryType === 'entrega' && !tableOrAddress.trim()) {
      showToast('⚠️ Informe o endereço de entrega do cliente!');
      return;
    }

    // Generate next order number
    const maxNumber = orders.reduce((max, ord) => Math.max(max, ord.orderNumber || 0), 200);
    const nextOrderNumber = maxNumber + 1;

    const newOrder: MarmitaOrder = {
      id: `marm-ord-${Date.now()}`,
      orderNumber: nextOrderNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      deliveryType,
      tableOrAddress: tableOrAddress.trim() || (deliveryType === 'balcao' ? 'Retirada Balcão' : 'Local'),
      items: [...assembledItems],
      beverages: [...selectedBeverages],
      subtotal: cartSubtotal,
      deliveryFee: effectiveDeliveryFee,
      discount: Number(discount) || 0,
      total: cartTotal,
      paymentMethod,
      isPaid,
      changeFor: changeFor ? Number(changeFor) : undefined,
      status: 'novo',
      notes: orderGeneralNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onCreateOrder(newOrder);
    showToast(`🎉 Pedido #${newOrder.orderNumber} criado com sucesso!`);

    // Reset entire order form
    setAssembledItems([]);
    setSelectedBeverages([]);
    setCustomerName('');
    setCustomerPhone('');
    setTableOrAddress('');
    setDiscount(0);
    setChangeFor('');
    setOrderGeneralNotes('');

    // Open thermal print modal
    if (settings.autoPrintOnCreate) {
      setPrintOrderModal(newOrder);
    }
  };

  // Advance Order Status Helper
  const handleNextStatus = (order: MarmitaOrder) => {
    switch (order.status) {
      case 'novo':
        onUpdateOrderStatus(order.id, 'em_montagem');
        showToast(`🍱 Pedido #${order.orderNumber} movido para "Em Montagem"`);
        break;
      case 'em_montagem':
        onUpdateOrderStatus(order.id, 'pronto_embalado');
        showToast(`📦 Pedido #${order.orderNumber} marcado como "Pronto / Embalado"!`);
        break;
      case 'pronto_embalado':
        if (order.deliveryType === 'entrega') {
          // Open motoboy modal
          setMotoboyModalOrder(order);
          setMotoboyInputName(order.motoboyName || 'Marcio Motoboy');
        } else {
          onUpdateOrderStatus(order.id, 'entregue');
          showToast(`✅ Pedido #${order.orderNumber} entregue no balcão/mesa!`);
        }
        break;
      case 'saiu_para_entrega':
        onUpdateOrderStatus(order.id, 'entregue');
        showToast(`🏁 Pedido #${order.orderNumber} concluído e entregue com sucesso!`);
        break;
      default:
        break;
    }
  };

  // WhatsApp Message Generator
  const handleOpenWhatsApp = (order: MarmitaOrder) => {
    if (!order.customerPhone) {
      showToast('⚠️ Este pedido não possui telefone/WhatsApp cadastrado.');
      return;
    }
    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    
    let statusText = 'está sendo preparado';
    if (order.status === 'em_montagem') statusText = 'está sendo montado na cozinha com todo capricho';
    if (order.status === 'pronto_embalado') statusText = 'está PRONTO e quentinho aguardando retirada';
    if (order.status === 'saiu_para_entrega') statusText = `acabou de SAIR PARA ENTREGA com nosso motoboy ${order.motoboyName || ''}`;
    if (order.status === 'entregue') statusText = 'foi entregue! Bom apetite';

    const itemsSummary = order.items.map((i) => `• ${i.quantity}x ${i.sizeName} (${i.proteinas.join(' + ')})`).join('\n');

    const msg = `Olá *${order.customerName}*! Tudo bem? 🍱\n\nSeu pedido *#${order.orderNumber}* no *${settings.restaurantName}* ${statusText}! 🔥\n\n*Detalhes do Pedido:*\n${itemsSummary}\n💰 *Total:* R$ ${order.total.toFixed(2).replace('.', ',')} (${order.paymentMethod.toUpperCase()}${order.isPaid ? ' - PAGO' : ' - PAGAR NA ENTREGA'})\n\nAgradecemos a preferência! Dúvidas estamos à disposição! 🛵💨`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encoded}`, '_blank');
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return (orders || []).filter((ord) => {
      if (!ord) return false;
      // Search
      const searchMatch = !orderSearch.trim() || 
        (ord.customerName && ord.customerName.toLowerCase().includes(orderSearch.toLowerCase())) ||
        String(ord.orderNumber).includes(orderSearch) ||
        (ord.customerPhone && ord.customerPhone.includes(orderSearch)) ||
        (ord.tableOrAddress && ord.tableOrAddress.toLowerCase().includes(orderSearch.toLowerCase()));

      // Status
      const statusMatch = orderStatusFilter === 'todos' || ord.status === orderStatusFilter;

      // Delivery type
      const deliveryMatch = orderDeliveryFilter === 'todos' || ord.deliveryType === orderDeliveryFilter;

      return searchMatch && statusMatch && deliveryMatch;
    });
  }, [orders, orderSearch, orderStatusFilter, orderDeliveryFilter]);

  // Financial metrics for marmitaria
  const metrics = useMemo(() => {
    const todayOrders = (orders || []).filter((o) => o && o.status !== 'cancelado');
    const totalRevenue = todayOrders.reduce((sum, o) => sum + (o?.total || 0), 0);
    const totalBoxesSold = todayOrders.reduce((sum, o) => {
      return sum + (o?.items || []).reduce((s, i) => s + (i?.quantity || 0), 0);
    }, 0);

    const countBySize: Record<MarmitaSize, number> = { P: 0, M: 0, G: 0, executiva: 0 };
    todayOrders.forEach((o) => {
      (o?.items || []).forEach((i) => {
        if (i && countBySize[i.size] !== undefined) {
          countBySize[i.size] += i.quantity || 0;
        }
      });
    });

    const activeCount = (orders || []).filter((o) => o && o.status !== 'entregue' && o.status !== 'cancelado').length;

    return {
      totalRevenue,
      totalBoxesSold,
      countBySize,
      activeCount,
      totalOrdersCount: todayOrders.length
    };
  }, [orders]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center space-x-2 text-sm animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Module Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl shadow-orange-950/10 border border-amber-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 sm:space-x-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner shrink-0">
            <ChefHat className="w-7 h-7 sm:w-8 sm:h-8 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/20 text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/30">
                🍱 Sistema Marmitaria & Marmitex
              </span>
              <span className="bg-amber-950/40 text-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {metrics.activeCount} Pedidos em Produção
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mt-0.5">
              {settings.restaurantName}
            </h2>
            <p className="text-xs sm:text-sm text-amber-100/90 font-medium">
              {settings.subtitle} • WhatsApp: {settings.phoneWhatsapp}
            </p>
          </div>
        </div>

        {/* Quick actions & Module Return */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {onSwitchToEspetos && (
            <button
              onClick={onSwitchToEspetos}
              className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white px-3.5 py-2.5 rounded-xl font-black text-xs border border-amber-400/40 shadow-md transition-all active:scale-95 cursor-pointer"
              title="Voltar para o Sistema de Espetos e Churrasqueira"
            >
              <span>🍖 Ir para Sistema Espetos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 p-1.5 bg-slate-200/80 rounded-2xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('montar')}
          className={`flex items-center space-x-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'montar'
              ? 'bg-white text-orange-600 shadow-md shadow-slate-950/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>Montar Marmita (PDV)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pedidos')}
          className={`flex items-center space-x-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'pedidos'
              ? 'bg-white text-orange-600 shadow-md shadow-slate-950/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Fila de Pedidos & KDS</span>
          {metrics.activeCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-orange-500 text-white">
              {metrics.activeCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('cardapio_dia')}
          className={`flex items-center space-x-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'cardapio_dia'
              ? 'bg-white text-orange-600 shadow-md shadow-slate-950/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Cardápio do Dia</span>
        </button>

        <button
          onClick={() => setActiveSubTab('relatorios')}
          className={`flex items-center space-x-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'relatorios'
              ? 'bg-white text-orange-600 shadow-md shadow-slate-950/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Vendas & Relatórios</span>
        </button>

        <button
          onClick={() => setActiveSubTab('config')}
          className={`flex items-center space-x-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'config'
              ? 'bg-white text-orange-600 shadow-md shadow-slate-950/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Tamanhos & Preços</span>
        </button>
      </div>

      {/* =====================================================================
       * SUB-TAB 1: MONTAGEM ÁGIL DE MARMITA (PDV)
       * ===================================================================== */}
      {activeSubTab === 'montar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Interactive Box Builder Form (8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            {/* Step 1: Tamanho da Marmita */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-black flex items-center justify-center">1</span>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Escolha o Tamanho da Marmita</h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">Preço base & limites</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {sizes.map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => setSelectedSize(s.size)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      selectedSize === s.size
                        ? 'border-orange-500 bg-orange-50/80 ring-2 ring-orange-400/40 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    {selectedSize === s.size && (
                      <CheckCircle2 className="w-4 h-4 text-orange-600 absolute top-2.5 right-2.5" />
                    )}
                    <span className="font-black text-sm block text-slate-900">{s.label}</span>
                    <span className="text-xs font-bold text-slate-500 block">{s.weightGrams}g • Até {s.maxProteins} carne{s.maxProteins > 1 ? 's' : ''}</span>
                    <span className="text-base font-black text-orange-600 mt-1 block">
                      R$ {s.price.toFixed(2).replace('.', ',')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Arroz & Base */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-black flex items-center justify-center">2</span>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Arroz & Base</h3>
                </div>
                <span className="text-xs text-slate-500">Escolha a base</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {availableOptionsByCategory.base.map((opt) => {
                  const isSelected = selectedBases.includes(opt.name);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleToggleBase(opt.name)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-extrabold">{opt.name}</span>
                      {opt.extraPrice > 0 ? (
                        <span className="text-[11px] font-black text-amber-600 shrink-0 ml-1">
                          +R$ {opt.extraPrice.toFixed(2).replace('.', ',')}
                        </span>
                      ) : (
                        isSelected && <Check className="w-4 h-4 text-orange-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Feijão */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-black flex items-center justify-center">3</span>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Feijão do Dia</h3>
                </div>
                <span className="text-xs text-slate-500">Escolha o caldo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {availableOptionsByCategory.feijao.map((opt) => {
                  const isSelected = selectedFeijoes.includes(opt.name);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleToggleFeijao(opt.name)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-extrabold">{opt.name}</span>
                      {opt.extraPrice > 0 ? (
                        <span className="text-[11px] font-black text-amber-600 shrink-0 ml-1">
                          +R$ {opt.extraPrice.toFixed(2).replace('.', ',')}
                        </span>
                      ) : (
                        isSelected && <Check className="w-4 h-4 text-orange-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Carnes / Proteínas do Dia */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-black flex items-center justify-center">4</span>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Carnes & Proteínas do Dia</h3>
                </div>
                <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                  Selecionado: {selectedProteinas.length} / {currentSizeConfig.maxProteins} inclusas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableOptionsByCategory.proteina.map((opt) => {
                  const isSelected = selectedProteinas.includes(opt.name);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleToggleProteina(opt.name)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/90 text-orange-950 font-bold ring-1 ring-orange-400'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="pr-2">
                        <span className="text-xs sm:text-sm font-black block text-slate-900">{opt.name}</span>
                        {opt.description && (
                          <span className="text-[11px] text-slate-500 line-clamp-1">{opt.description}</span>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center space-x-1">
                        {opt.extraPrice > 0 && (
                          <span className="text-[11px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                            +R$ {opt.extraPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 5: Guarnições */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-black flex items-center justify-center">5</span>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Guarnições & Acompanhamentos</h3>
                </div>
                <span className="text-xs text-slate-500">Até {currentSizeConfig.maxSides} opções</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableOptionsByCategory.guarnicao.map((opt) => {
                  const isSelected = selectedGuarnicoes.includes(opt.name);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleToggleGuarnicao(opt.name)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-extrabold line-clamp-1">{opt.name}</span>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ml-1 ${
                        isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 6: Saladas */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-black flex items-center justify-center">6</span>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Saladas Frescas</h3>
                </div>
                <span className="text-xs text-slate-500">Opcional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableOptionsByCategory.salada.map((opt) => {
                  const isSelected = selectedSaladas.includes(opt.name);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleToggleSalada(opt.name)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-extrabold">{opt.name}</span>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ml-1 ${
                        isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 7: Adicionais Extras */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-black flex items-center justify-center">7</span>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Adicionais Extras</h3>
                </div>
                <span className="text-xs text-slate-500">Turbine sua marmita</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableOptionsByCategory.adicional.map((opt) => {
                  const isSelected = selectedAdicionais.some((a) => a.name === opt.name);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleToggleAdicional(opt)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-extrabold">{opt.name}</span>
                      <span className="text-xs font-black text-amber-600 shrink-0 ml-1">
                        +R$ {opt.extraPrice.toFixed(2).replace('.', ',')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Marmita Single Notes & Add to Order Button */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações desta marmita (Ex: "Feijão por cima", "Sem cebola no bife", "Pouco arroz"):
                </label>
                <input
                  type="text"
                  value={marmitaNotes}
                  onChange={(e) => setMarmitaNotes(e.target.value)}
                  placeholder="Instruções para o montador da marmita..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-600">Qtd:</span>
                  <div className="flex items-center bg-white border border-slate-300 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setMarmitaQuantity((q) => Math.max(1, q - 1))}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-l-xl cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 font-black text-sm text-slate-900">{marmitaQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setMarmitaQuantity((q) => q + 1)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-r-xl cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddMarmitaToOrderCart}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Incluir esta Marmita (R$ {(singleMarmitaTotalPrice * marmitaQuantity).toFixed(2).replace('.', ',')})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Order Cart, Delivery, Customer Info & Checkout (4-5 Cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4 sticky top-20">
            <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-orange-600" />
                  <h3 className="font-black text-slate-900 text-base">Resumo do Pedido</h3>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {assembledItems.reduce((acc, i) => acc + i.quantity, 0)} marmita(s)
                </span>
              </div>

              {/* List of Assembled Marmitas */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {assembledItems.length === 0 ? (
                  <div className="text-center py-6 px-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <ChefHat className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-500">Nenhuma marmita incluída ainda</p>
                    <p className="text-[11px] text-slate-400">Monte as carnes e clique em "Incluir esta Marmita"</p>
                  </div>
                ) : (
                  assembledItems.map((item, idx) => (
                    <div key={item.id} className="bg-orange-50/60 p-3 rounded-xl border border-orange-200/80 text-xs relative space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900">
                          {item.quantity}x {item.sizeName}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-orange-700">
                            R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromCart(idx)}
                            className="text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        🥩 <strong>Carnes:</strong> {item.proteinas.join(', ') || 'Nenhuma'}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        🍚 {item.bases.join(', ')} • 🍲 {item.feijoes.join(', ')}
                      </p>
                      {item.guarnicoes.length > 0 && (
                        <p className="text-[10px] text-slate-500">
                          🥔 <strong>Guarnições:</strong> {item.guarnicoes.join(', ')}
                        </p>
                      )}
                      {item.adicionais.length > 0 && (
                        <p className="text-[10px] text-amber-700 font-bold">
                          ✨ <strong>Extras:</strong> {item.adicionais.map((a) => a.name).join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                          Obs: {item.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Beverages Quick Add */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block">Bebidas & Sucos para Acompanhar:</span>
                <div className="flex flex-wrap gap-1.5">
                  {availableOptionsByCategory.bebida.map((beb) => (
                    <button
                      key={beb.id}
                      type="button"
                      onClick={() => handleAddBeverage(beb)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-100 text-slate-800 text-[11px] font-bold border border-slate-200 transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <span>+ {beb.name} (R$ {beb.extraPrice.toFixed(2).replace('.', ',')})</span>
                    </button>
                  ))}
                </div>

                {selectedBeverages.length > 0 && (
                  <div className="bg-slate-50 p-2 rounded-xl space-y-1 text-xs">
                    {selectedBeverages.map((b) => (
                      <div key={b.id} className="flex items-center justify-between">
                        <span className="text-slate-700 font-medium">{b.quantity}x {b.name}</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900">R$ {(b.price * b.quantity).toFixed(2).replace('.', ',')}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBeverage(b.id)}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer & Delivery Method */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nome do Cliente *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: João da Silva / Balcão / Mesa 04"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">WhatsApp / Tel</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Tipo de Entrega</label>
                    <select
                      value={deliveryType}
                      onChange={(e) => setDeliveryType(e.target.value as MarmitaDeliveryType)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="entrega">🛵 Delivery / Moto</option>
                      <option value="balcao">🛍️ Retirada Balcão</option>
                      <option value="mesa">🍽️ Mesa / Local</option>
                    </select>
                  </div>
                </div>

                {deliveryType === 'entrega' && (
                  <div className="space-y-2 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-0.5">Endereço de Entrega *</label>
                      <input
                        type="text"
                        value={tableOrAddress}
                        onChange={(e) => setTableOrAddress(e.target.value)}
                        placeholder="Rua, número, bairro e complemento..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900">Taxa de Entrega (R$):</span>
                      <input
                        type="number"
                        step="0.5"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(Number(e.target.value))}
                        className="w-20 px-2 py-1 rounded bg-white border border-amber-300 text-xs font-black text-right"
                      />
                    </div>
                  </div>
                )}

                {deliveryType === 'mesa' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Número da Mesa</label>
                    <input
                      type="text"
                      value={tableOrAddress}
                      onChange={(e) => setTableOrAddress(e.target.value)}
                      placeholder="Ex: Mesa 05"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block">Forma de Pagamento:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['pix', 'credito', 'debito', 'dinheiro'] as PaymentMethod[]).map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                        paymentMethod === pm
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'dinheiro' && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-600">Troco para (R$):</span>
                    <input
                      type="number"
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                      placeholder="Ex: 50.00"
                      className="w-24 px-2 py-1 rounded-lg bg-slate-50 border border-slate-300 text-xs font-bold text-right"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk-paid"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded cursor-pointer"
                  />
                  <label htmlFor="chk-paid" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Pedido Já Pago (Pelo app/balcão)
                  </label>
                </div>
              </div>

              {/* Total & Checkout Button */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Subtotal Marmitas & Bebidas:</span>
                  <span>R$ {cartSubtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {deliveryType === 'entrega' && (
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Taxa de Entrega:</span>
                    <span>R$ {effectiveDeliveryFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-base font-black text-slate-900 pt-1 border-t border-dashed border-slate-200">
                  <span>Total do Pedido:</span>
                  <span className="text-xl text-orange-600">
                    R$ {cartTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleFinalizeOrder}
                  className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-amber-500 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center space-x-2 cursor-pointer active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Finalizar & Imprimir Etiqueta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * SUB-TAB 2: FILA DE PEDIDOS & EXPEDIÇÃO (KDS)
       * ===================================================================== */}
      {activeSubTab === 'pedidos' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Buscar por cliente, endereço ou #..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none"
              >
                <option value="todos">Todos os Status</option>
                <option value="novo">Novos Pedidos</option>
                <option value="em_montagem">Em Montagem</option>
                <option value="pronto_embalado">Prontos / Embalados</option>
                <option value="saiu_para_entrega">Saiu para Entrega</option>
                <option value="entregue">Entregues / Concluídos</option>
              </select>

              <select
                value={orderDeliveryFilter}
                onChange={(e) => setOrderDeliveryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="entrega">🛵 Delivery</option>
                <option value="balcao">🛍️ Balcão</option>
                <option value="mesa">🍽️ Mesa</option>
              </select>
            </div>
          </div>

          {/* Orders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h4 className="font-extrabold text-slate-700 text-base">Nenhum pedido encontrado</h4>
                <p className="text-xs text-slate-400">Lance uma nova marmita no PDV para ver os pedidos aqui.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isCompleted = order.status === 'entregue';
                const isCancelled = order.status === 'cancelado';

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-sm space-y-3 relative transition-all ${
                      order.status === 'novo' ? 'border-orange-400 ring-2 ring-orange-400/20' :
                      order.status === 'em_montagem' ? 'border-amber-400 bg-amber-50/20' :
                      order.status === 'pronto_embalado' ? 'border-emerald-400 bg-emerald-50/20' :
                      order.status === 'saiu_para_entrega' ? 'border-blue-400 bg-blue-50/20' :
                      'border-slate-200 opacity-80'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-black text-xs">
                          #{order.orderNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                          order.deliveryType === 'entrega' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          order.deliveryType === 'balcao' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          'bg-purple-100 text-purple-800 border-purple-200'
                        }`}>
                          {order.deliveryType === 'entrega' ? '🛵 Delivery' : order.deliveryType === 'balcao' ? '🛍️ Balcão' : '🍽️ Mesa'}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        order.status === 'novo' ? 'bg-red-100 text-red-800' :
                        order.status === 'em_montagem' ? 'bg-amber-100 text-amber-800' :
                        order.status === 'pronto_embalado' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'saiu_para_entrega' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'entregue' ? 'bg-slate-100 text-slate-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {order.status === 'novo' ? '🔔 Novo' :
                         order.status === 'em_montagem' ? '👨‍🍳 Montando' :
                         order.status === 'pronto_embalado' ? '📦 Pronto' :
                         order.status === 'saiu_para_entrega' ? '🛵 Na Rota' :
                         order.status === 'entregue' ? '✅ Entregue' : 'Cancelado'}
                      </span>
                    </div>

                    {/* Customer & Address */}
                    <div>
                      <h4 className="font-black text-slate-900 text-sm sm:text-base">{order.customerName}</h4>
                      {order.tableOrAddress && (
                        <p className="text-xs text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{order.tableOrAddress}</span>
                        </p>
                      )}
                      {order.motoboyName && order.status === 'saiu_para_entrega' && (
                        <p className="text-xs text-blue-700 font-bold flex items-center gap-1 mt-0.5">
                          <Motorbike className="w-3.5 h-3.5 shrink-0" />
                          <span>Motoboy: {order.motoboyName}</span>
                        </p>
                      )}
                    </div>

                    {/* Items List */}
                    <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100 text-xs">
                      {order.items.map((item) => (
                        <div key={item.id} className="space-y-0.5 border-b border-slate-200/60 pb-1.5 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between font-black text-slate-900">
                            <span>{item.quantity}x {item.sizeName}</span>
                            <span>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                          </div>
                          <p className="text-[11px] text-orange-950 font-bold">
                            🥩 {item.proteinas.join(' + ')}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            🍚 {item.bases.join(', ')} • 🍲 {item.feijoes.join(', ')}
                          </p>
                          {item.guarnicoes.length > 0 && (
                            <p className="text-[10px] text-slate-500">
                              🥔 {item.guarnicoes.join(', ')}
                            </p>
                          )}
                          {item.adicionais.length > 0 && (
                            <p className="text-[10px] text-amber-700 font-bold">
                              ✨ {item.adicionais.map((a) => a.name).join(', ')}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-semibold">
                              Obs: {item.notes}
                            </p>
                          )}
                        </div>
                      ))}

                      {order.beverages.length > 0 && (
                        <div className="pt-1 text-[11px] font-bold text-slate-700">
                          🥤 Bebidas: {order.beverages.map((b) => `${b.quantity}x ${b.name}`).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Financial Summary */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="font-extrabold text-slate-700">
                        Total: <strong className="text-orange-600 text-sm">R$ {order.total.toFixed(2).replace('.', ',')}</strong>
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {order.paymentMethod.toUpperCase()} • {order.isPaid ? '✅ PAGO' : '⚠️ PENDENTE'}
                      </span>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center gap-1.5 pt-2">
                      {!isCompleted && !isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleNextStatus(order)}
                          className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-2 px-3 rounded-xl font-black text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <span>
                            {order.status === 'novo' ? 'Começar Montagem 👨‍🍳' :
                             order.status === 'em_montagem' ? 'Marcar Pronto 📦' :
                             order.status === 'pronto_embalado' && order.deliveryType === 'entrega' ? 'Despachar Motoboy 🛵' :
                             'Finalizar Entrega ✅'}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setPrintOrderModal(order)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                        title="Imprimir Etiqueta / Comanda da Marmita"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {order.customerPhone && (
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(order)}
                          className="p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-all cursor-pointer"
                          title="Enviar aviso no WhatsApp do cliente"
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
       * SUB-TAB 3: CARDÁPIO DO DIA (OPÇÕES DE HOJE)
       * ===================================================================== */}
      {activeSubTab === 'cardapio_dia' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Cardápio do Dia (Disponibilidade)</h3>
              <p className="text-xs text-slate-500">
                Ative ou desative o que está sendo servido hoje na sua marmitaria com 1 toque.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['proteina', 'guarnicao', 'base', 'feijao', 'salada', 'adicional'] as MarmitaOptionCategory[]).map((cat) => {
              const categoryOptions = (options || []).filter((o) => o && o.category === cat);
              const catTitle = 
                cat === 'proteina' ? '🥩 Carnes & Proteínas do Dia' :
                cat === 'guarnicao' ? '🥔 Guarnições & Acompanhamentos' :
                cat === 'base' ? '🍚 Arroz & Bases' :
                cat === 'feijao' ? '🍲 Feijões' :
                cat === 'salada' ? '🥗 Saladas Frescas' : '✨ Adicionais & Extras';

              return (
                <div key={cat} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-2">{catTitle}</h4>
                  <div className="space-y-2">
                    {categoryOptions.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          opt.isAvailableToday
                            ? 'bg-slate-50/80 border-slate-200 text-slate-900'
                            : 'bg-slate-100/40 border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <div>
                          <span className="font-extrabold text-xs block">{opt.name}</span>
                          {opt.extraPrice > 0 && (
                            <span className="text-[10px] text-amber-600 font-bold">+R$ {opt.extraPrice.toFixed(2).replace('.', ',')}</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = options.map((o) =>
                              o.id === opt.id ? { ...o, isAvailableToday: !o.isAvailableToday } : o
                            );
                            onUpdateOptions(updated);
                            showToast(`Disponibilidade de "${opt.name}" atualizada!`);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            opt.isAvailableToday
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {opt.isAvailableToday ? 'DISPONÍVEL' : 'PAUSADO'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
       * SUB-TAB 4: VENDAS & RELATÓRIOS DE MARMITARIA
       * ===================================================================== */}
      {activeSubTab === 'relatorios' && (
        <div className="space-y-4">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Faturamento Total</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 block mt-1">
                R$ {metrics.totalRevenue.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Marmitas Vendidas</span>
              <span className="text-xl sm:text-2xl font-black text-orange-600 block mt-1">
                {metrics.totalBoxesSold} unidades
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Pedidos Finalizados</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1">
                {metrics.totalOrdersCount} pedidos
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Ticket Médio</span>
              <span className="text-xl sm:text-2xl font-black text-blue-600 block mt-1">
                R$ {metrics.totalOrdersCount > 0 ? (metrics.totalRevenue / metrics.totalOrdersCount).toFixed(2).replace('.', ',') : '0,00'}
              </span>
            </div>
          </div>

          {/* Breakdown por tamanho */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-black text-slate-900 text-sm sm:text-base">Marmitas Vendidas por Tamanho</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['P', 'M', 'G', 'executiva'] as MarmitaSize[]).map((sizeKey) => {
                const count = metrics.countBySize[sizeKey] || 0;
                const sizeObj = sizes.find((s) => s.size === sizeKey);
                return (
                  <div key={sizeKey} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="font-extrabold text-xs text-slate-700 block">{sizeObj?.name || sizeKey}</span>
                    <span className="text-lg font-black text-orange-600 mt-1 block">{count} un.</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * SUB-TAB 5: TAMANHOS & PREÇOS CONFIG
       * ===================================================================== */}
      {activeSubTab === 'config' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Configurações de Preços & Tamanhos</h3>
              <p className="text-xs text-slate-500">Edite os preços base e limites de carne de cada marmita.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {sizes.map((s, idx) => (
                <div key={s.size} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-black text-sm text-slate-900 block">{s.name}</span>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600">Preço Base (R$):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={s.price}
                      onChange={(e) => {
                        const newSizes = [...sizes];
                        newSizes[idx] = { ...newSizes[idx], price: Number(e.target.value) };
                        onUpdateSizes(newSizes);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-black text-orange-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600">Limite de Carnes Inclusas:</label>
                    <input
                      type="number"
                      value={s.maxProteins}
                      onChange={(e) => {
                        const newSizes = [...sizes];
                        newSizes[idx] = { ...newSizes[idx], maxProteins: Number(e.target.value) };
                        onUpdateSizes(newSizes);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * MODAL: ETIQUETA TÉRMICA DA MARMITA (PARA TAMPA OU MOTOBOY)
       * ===================================================================== */}
      {printOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-4 sm:p-6 border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">Etiqueta & Comanda de Marmita</h3>
                  <p className="text-xs font-bold text-slate-500">
                    Pedido #{printOrderModal.orderNumber} • {printOrderModal.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrintOrderModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Controls: Format, Paper & Font Size */}
            <div className="bg-slate-100 p-3 rounded-2xl space-y-2.5 text-xs">
              {/* Mode Selector */}
              <div className="flex items-center justify-between gap-1">
                <span className="font-extrabold text-slate-700 text-[11px] uppercase tracking-wider">Modelo:</span>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs w-full max-w-xs">
                  <button
                    type="button"
                    onClick={() => setLabelMode('tampa')}
                    className={`py-1.5 px-2 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      labelMode === 'tampa'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Etiqueta de Tampa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelMode('comanda')}
                    className={`py-1.5 px-2 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      labelMode === 'comanda'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Motorbike className="w-3.5 h-3.5" />
                    <span>Comanda Entrega</span>
                  </button>
                </div>
              </div>

              {/* Width & Font Size Selectors */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
                {/* Paper width */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-600">Papel:</span>
                  <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setLabelPaperWidth('80mm')}
                      className={`px-2 py-0.5 rounded text-[11px] font-black cursor-pointer ${
                        labelPaperWidth === '80mm' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      80mm (Balcão)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabelPaperWidth('58mm')}
                      className={`px-2 py-0.5 rounded text-[11px] font-black cursor-pointer ${
                        labelPaperWidth === '58mm' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      58mm (Mini)
                    </button>
                  </div>
                </div>

                {/* Font Size Selector for High Legibility */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-600">Letra:</span>
                  <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setLabelFontSize('normal')}
                      className={`px-2 py-0.5 rounded text-[11px] font-black cursor-pointer ${
                        labelFontSize === 'normal' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabelFontSize('grande')}
                      className={`px-2 py-0.5 rounded text-[11px] font-black flex items-center gap-1 cursor-pointer ${
                        labelFontSize === 'grande' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ZoomIn className="w-3 h-3" />
                      <span>Extra Grande</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Marmita individual selector (when mode is tampa and multiple boxes exist) */}
              {labelMode === 'tampa' && printOrderModal.items.length > 1 && (
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/80 overflow-x-auto pb-1">
                  <span className="text-[11px] font-bold text-slate-600 shrink-0">Imprimir:</span>
                  <button
                    type="button"
                    onClick={() => setLabelSelectedItemIndex('all')}
                    className={`px-2 py-1 rounded-lg text-xs font-black cursor-pointer shrink-0 ${
                      labelSelectedItemIndex === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Todas ({printOrderModal.items.length})
                  </button>
                  {printOrderModal.items.map((it, idx) => (
                    <button
                      key={it.id || idx}
                      type="button"
                      onClick={() => setLabelSelectedItemIndex(idx)}
                      className={`px-2 py-1 rounded-lg text-xs font-black cursor-pointer shrink-0 ${
                        labelSelectedItemIndex === idx
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Marmita {idx + 1} ({it.sizeName.toUpperCase()})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* LIVE THERMAL PREVIEW (High Contrast, Bold, Crisp Pure Black on White) */}
            <div className="bg-slate-200/70 p-3 sm:p-5 rounded-2xl flex items-center justify-center overflow-x-auto">
              <div
                className={`printable-receipt bg-white text-black border-2 border-black font-sans shadow-lg transition-all rounded-xs p-4 sm:p-5 space-y-3 ${
                  labelPaperWidth === '58mm' ? 'w-[290px]' : 'w-[370px]'
                }`}
              >
                {/* Header */}
                <div className="text-center border-b-2 border-black pb-2 space-y-0.5">
                  <h4 className="font-black text-lg uppercase tracking-wider text-black">
                    {settings.restaurantName || 'MARESIA MARMITARIA'}
                  </h4>
                  {settings.subtitle && <p className="text-xs font-bold text-black">{settings.subtitle}</p>}
                  <p className="text-xs font-black text-black">Tel/WhatsApp: {settings.phoneWhatsapp}</p>
                </div>

                {/* Big Order & Client Banner */}
                <div className="bg-black text-white p-2.5 rounded text-center space-y-0.5">
                  <div className="font-black text-xl tracking-wider">
                    PEDIDO #{printOrderModal.orderNumber}
                  </div>
                  <div className="font-black text-sm uppercase">
                    CLIENTE: {printOrderModal.customerName}
                  </div>
                  <div className="text-xs font-bold opacity-90">
                    {printOrderModal.deliveryType === 'entrega'
                      ? '🛵 ENTREGA (MOTOBOY)'
                      : printOrderModal.deliveryType === 'retirada'
                      ? '🏬 RETIRADA NO BALCÃO'
                      : '🍽️ CONSUMO NO LOCAL'}
                  </div>
                </div>

                {/* Delivery Address & Details (If Delivery Mode or has address) */}
                {printOrderModal.tableOrAddress && (
                  <div className="border-2 border-black rounded p-2.5 bg-slate-50 space-y-1">
                    <div className="text-xs font-black uppercase text-black">
                      📍 Endereço de Entrega:
                    </div>
                    <div className="text-sm font-black text-black leading-snug">
                      {printOrderModal.tableOrAddress.toUpperCase()}
                    </div>
                    {printOrderModal.customerPhone && (
                      <div className="text-xs font-bold text-black pt-0.5">
                        📞 Telefone: {printOrderModal.customerPhone}
                      </div>
                    )}
                  </div>
                )}

                {/* Marmitas Content (Filtered or All) */}
                <div className="space-y-3 border-y-2 border-black py-2.5">
                  {(labelMode === 'tampa' && typeof labelSelectedItemIndex === 'number' && printOrderModal.items[labelSelectedItemIndex]
                    ? [printOrderModal.items[labelSelectedItemIndex]]
                    : printOrderModal.items
                  ).map((i, idx) => {
                    const realIdx = typeof labelSelectedItemIndex === 'number' ? labelSelectedItemIndex : idx;
                    return (
                      <div
                        key={i.id || idx}
                        className="border-2 border-black rounded p-3 space-y-2 bg-white"
                      >
                        {/* Marmita Title */}
                        <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                          <span className="font-black text-base uppercase text-black">
                            🍱 {i.quantity}x {i.sizeName.toUpperCase()}
                          </span>
                          {printOrderModal.items.length > 1 && (
                            <span className="bg-black text-white px-2 py-0.5 rounded text-xs font-black">
                              {realIdx + 1} de {printOrderModal.items.length}
                            </span>
                          )}
                        </div>

                        {/* CARNES - DESTAQUE MÁXIMO */}
                        <div className="bg-slate-100 border-l-4 border-black p-2 rounded-xs">
                          <div className="text-[11px] font-black uppercase text-black">
                            🥩 CARNES / PROTEÍNAS:
                          </div>
                          <div className={`font-black uppercase text-black leading-tight ${labelFontSize === 'grande' ? 'text-base' : 'text-sm'}`}>
                            {i.proteinas.length > 0 ? i.proteinas.join(' + ') : 'Sem carnes especificadas'}
                          </div>
                        </div>

                        {/* Acompanhamentos */}
                        <div className={`space-y-1 text-black ${labelFontSize === 'grande' ? 'text-xs' : 'text-[11px]'}`}>
                          <div>
                            <strong>🍚 Base:</strong> {i.bases.join(', ')} | <strong>Feijão:</strong> {i.feijoes.join(', ')}
                          </div>
                          {i.guarnicoes.length > 0 && (
                            <div>
                              <strong>🥗 Guarnições:</strong> {i.guarnicoes.join(', ')}
                            </div>
                          )}
                          {i.saladas.length > 0 && (
                            <div>
                              <strong>🥬 Salada:</strong> {i.saladas.join(', ')}
                            </div>
                          )}
                          {i.adicionais.length > 0 && (
                            <div>
                              <strong>⭐ Extras:</strong> {i.adicionais.map((a) => a.name).join(', ')}
                            </div>
                          )}
                        </div>

                        {/* Observações da Marmita (Caixa de Alerta) */}
                        {i.notes && (
                          <div className="border-2 border-dashed border-black bg-amber-100/80 p-2 rounded text-xs font-black text-black">
                            ⚠️ OBS DA MARMITA: {i.notes.toUpperCase()}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Bebidas do Pedido */}
                  {printOrderModal.beverages.length > 0 && (
                    <div className="border-2 border-black rounded p-2.5 bg-slate-50 space-y-1">
                      <div className="text-xs font-black uppercase text-black">
                        🥤 Bebidas do Pedido:
                      </div>
                      <div className="text-sm font-black text-black">
                        {printOrderModal.beverages.map((b) => `${b.quantity}x ${b.name}`).join(', ')}
                      </div>
                    </div>
                  )}

                  {/* Observação Geral do Pedido */}
                  {printOrderModal.generalNotes && (
                    <div className="border-2 border-dashed border-black bg-amber-100/80 p-2.5 rounded text-xs font-black text-black">
                      ⚠️ OBSERVAÇÃO GERAL: {printOrderModal.generalNotes.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Financial Summary & Payment */}
                <div className="border-2 border-black rounded p-2.5 space-y-1.5 bg-slate-50 text-xs text-black">
                  <div className="flex justify-between font-bold">
                    <span>Subtotal:</span>
                    <span>R$ {printOrderModal.subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {printOrderModal.deliveryFee > 0 && (
                    <div className="flex justify-between font-bold">
                      <span>Taxa de Entrega:</span>
                      <span>R$ {printOrderModal.deliveryFee.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {printOrderModal.discount > 0 && (
                    <div className="flex justify-between font-bold">
                      <span>Desconto:</span>
                      <span>- R$ {printOrderModal.discount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-base border-t-2 border-black pt-1">
                    <span>TOTAL A PAGAR:</span>
                    <span>R$ {printOrderModal.total.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="bg-black text-white p-2 rounded text-center space-y-0.5 mt-1">
                    <div className="font-black text-xs uppercase tracking-wider">
                      FORMA: {printOrderModal.paymentMethod.toUpperCase()} ({printOrderModal.isPaid ? 'PAGO / LIQUIDADO' : 'PAGAR NA ENTREGA'})
                    </div>
                    {printOrderModal.changeFor && (
                      <div className="font-black text-xs text-amber-300">
                        LEVAR TROCO PARA R$ {printOrderModal.changeFor}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-1 border-t border-dashed border-black text-[10px] font-bold text-black">
                  🔥 Bom Apetite • Obrigado pela Preferência! 🔥
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handlePrintMarmitaLabel}
                disabled={isPrintingLabel}
                className="w-full sm:flex-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer shadow-md transition-all"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>{isPrintingLabel ? 'Enviando p/ Impressora...' : 'Imprimir Etiqueta Térmica'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareMarmitaWhatsApp}
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 cursor-pointer shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintOrderModal(null)}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Motoboy dispatch modal */}
      {motoboyModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-slate-200 space-y-4">
            <h4 className="font-black text-slate-900 text-base">Despachar Entrega p/ Motoboy</h4>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nome do Motoboy / Entregador:</label>
              <input
                type="text"
                value={motoboyInputName}
                onChange={(e) => setMotoboyInputName(e.target.value)}
                placeholder="Ex: Marcio / Carlos"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateOrderStatus(motoboyModalOrder.id, 'saiu_para_entrega', motoboyInputName || 'Motoboy');
                  setMotoboyModalOrder(null);
                  showToast(`🛵 Pedido #${motoboyModalOrder.orderNumber} despachado com motoboy ${motoboyInputName}!`);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-black text-xs cursor-pointer"
              >
                Confirmar Saída p/ Entrega
              </button>
              <button
                type="button"
                onClick={() => setMotoboyModalOrder(null)}
                className="px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
