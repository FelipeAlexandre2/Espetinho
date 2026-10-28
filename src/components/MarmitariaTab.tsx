import React, { useState, useMemo, useEffect } from 'react';
import { 
  MarmitaSize, MarmitaSizeConfig, MarmitaOption, MarmitaItem, 
  MarmitaOrder, MarmitaOrderStatus, MarmitaDeliveryType, MarmitaSettings,
  PaymentMethod, AppUser
} from '../types';
import { 
  printMarmitaThermalDirect, formatMarmitaWhatsAppText
} from '../utils/printMarmita';
import { 
  Utensils, Plus, Minus, Trash2, CheckCircle2, Clock, 
  ShoppingBag, Printer, Search, DollarSign, Check, ArrowRight,
  ChefHat, Send, Sparkles, Share2, Edit2, X
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
  onUpdateSettings?: (settings: MarmitaSettings) => void;
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
  // Navigation: 3 tabs (Montar Marmita, Fila de Pedidos, Cadastrar Preço)
  const [activeTab, setActiveTab] = useState<'novo_pedido' | 'fila_kds' | 'precos'>('novo_pedido');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for registering price: strictly size and price
  const [registerSizeName, setRegisterSizeName] = useState<string>('Pequena (P)');
  const [registerPriceInput, setRegisterPriceInput] = useState<string>('16.00');
  const [inlinePriceInputs, setInlinePriceInputs] = useState<Record<string, number>>({});

  // Price Edit Modal for P, M, G (inline adjustment)
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [tempPrices, setTempPrices] = useState<Record<string, number>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  /* =========================================================================
   * SIZES: Marmita Sizes and Prices
   * ========================================================================= */
  const cleanSizes = useMemo(() => {
    if (propSizes && propSizes.length > 0) return propSizes;
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
   * AVAILABLE PROTEÍNAS & ACOMPANHAMENTOS (Permanent list, no day-of-week)
   * ========================================================================= */
  const defaultCarnes = useMemo(() => {
    const fromOptions = (options || [])
      .filter((o) => o.category === 'proteina' && o.isAvailableToday !== false)
      .map((o) => o.name);

    if (fromOptions.length > 0) return fromOptions;

    return [
      'Bife Bovino Acebolado',
      'Filé de Frango Grelhado',
      'Carne de Panela com Batatas',
      'Linguiça Toscana Grelhada',
      'Strogonoff de Frango',
      'Frango a Passarinho',
      'Bisteca Suína Douradinha',
      'Feijoada Completa',
      'Costelinha Suína'
    ];
  }, [options]);

  const defaultSides = useMemo(() => {
    const fromOptions = (options || [])
      .filter((o) => (o.category === 'guarnicao' || o.category === 'salada') && o.isAvailableToday !== false)
      .map((o) => o.name);

    if (fromOptions.length > 0) return fromOptions;

    return [
      'Farofa da Casa',
      'Macarrão Espaguete ao Sugo',
      'Purê de Batatas',
      'Batata Frita',
      'Vinagrete Fresco',
      'Couve Refogada no Alho',
      'Salada de Maionese',
      'Legumes no Vapor'
    ];
  }, [options]);

  const [availableCarnes, setAvailableCarnes] = useState<string[]>(defaultCarnes);
  const [availableSides, setAvailableSides] = useState<string[]>(defaultSides);
  const [newCarneInput, setNewCarneInput] = useState('');
  const [showAddCarne, setShowAddCarne] = useState(false);
  const [newSideInput, setNewSideInput] = useState('');
  const [showAddSide, setShowAddSide] = useState(false);

  useEffect(() => {
    if (defaultCarnes.length > 0 && availableCarnes.length === 0) {
      setAvailableCarnes(defaultCarnes);
    }
  }, [defaultCarnes, availableCarnes.length]);

  useEffect(() => {
    if (defaultSides.length > 0 && availableSides.length === 0) {
      setAvailableSides(defaultSides);
    }
  }, [defaultSides, availableSides.length]);

  const handleAddCustomCarne = () => {
    const trimmed = newCarneInput.trim();
    if (trimmed && !availableCarnes.includes(trimmed)) {
      setAvailableCarnes((prev) => [...prev, trimmed]);
      setSelectedProteinas((prev) => [...prev, trimmed]);
      setNewCarneInput('');
      setShowAddCarne(false);
      showToast(`Carne "${trimmed}" adicionada!`);
    }
  };

  const handleAddCustomSide = () => {
    const trimmed = newSideInput.trim();
    if (trimmed && !availableSides.includes(trimmed)) {
      setAvailableSides((prev) => [...prev, trimmed]);
      setSelectedSides((prev) => [...prev, trimmed]);
      setNewSideInput('');
      setShowAddSide(false);
      showToast(`Acompanhamento "${trimmed}" adicionado!`);
    }
  };

  /* =========================================================================
   * BUILDER / MONTAGEM RÁPIDA DE MARMITA (PDV ÁGIL)
   * ========================================================================= */
  const [selectedSize, setSelectedSize] = useState<MarmitaSize>('M');
  const [selectedProteinas, setSelectedProteinas] = useState<string[]>([]);
  const [selectedBases, setSelectedBases] = useState<string[]>(['Arroz Branco']);
  const [selectedFeijoes, setSelectedFeijoes] = useState<string[]>(['Feijão Carioca']);
  const [selectedSides, setSelectedSides] = useState<string[]>(['Farofa da Casa']);
  const [marmitaNotes, setMarmitaNotes] = useState('');
  const [marmitaQuantity, setMarmitaQuantity] = useState(1);

  // O que é a marmita e se é sem alguma coisa
  const [marmitaDishName, setMarmitaDishName] = useState('');
  const [marmitaDescription, setMarmitaDescription] = useState('');
  const [withoutTags, setWithoutTags] = useState<string[]>([]);
  const [customWithout, setCustomWithout] = useState('');

  const handleToggleWithoutTag = (tag: string) => {
    setWithoutTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

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

  // Active Size config
  const currentSizeConfig = useMemo(() => {
    return cleanSizes.find((s) => s.size === selectedSize) || cleanSizes[1] || cleanSizes[0];
  }, [cleanSizes, selectedSize]);

  // Set default protein if none selected
  useEffect(() => {
    if (selectedProteinas.length === 0 && availableCarnes.length > 0) {
      setSelectedProteinas([availableCarnes[0]]);
    }
  }, [availableCarnes, selectedProteinas.length]);

  // Calculate current marmita price
  const currentMarmitaPrice = useMemo(() => {
    let total = currentSizeConfig.price;
    // Extra meats beyond limit: +R$ 7,00 each
    if (selectedProteinas.length > currentSizeConfig.maxProteins) {
      const extraCount = selectedProteinas.length - currentSizeConfig.maxProteins;
      total += extraCount * 7.00;
    }
    return total;
  }, [currentSizeConfig, selectedProteinas]);

  // Subtotal of cart
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
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
    if (!marmitaDescription.trim() && !marmitaDishName.trim()) {
      showToast('⚠️ Descreva o que vai na marmita ou dê um nome ao prato!');
      return;
    }

    const allWithout = [...withoutTags];
    if (customWithout.trim() && !allWithout.includes(customWithout.trim())) {
      allWithout.push(customWithout.trim());
    }

    const titleOrFirst = marmitaDishName.trim() || marmitaDescription.trim().split(',')[0].trim() || 'Marmita';

    const newItem: MarmitaItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      size: selectedSize,
      sizeName: currentSizeConfig.label,
      dishName: marmitaDishName.trim() || undefined,
      description: marmitaDescription.trim() || undefined,
      without: allWithout.length > 0 ? allWithout : undefined,
      bases: [],
      feijoes: [],
      proteinas: [titleOrFirst],
      guarnicoes: [],
      saladas: [],
      adicionais: [],
      price: currentMarmitaPrice,
      quantity: marmitaQuantity,
      notes: marmitaNotes.trim() || undefined
    };

    setCartItems((prev) => [...prev, newItem]);
    setMarmitaDishName('');
    setMarmitaDescription('');
    setWithoutTags([]);
    setCustomWithout('');
    setMarmitaNotes('');
    setMarmitaQuantity(1);
    showToast(`✅ Marmita ${currentSizeConfig.label} adicionada!`);
  };

  // Finalize Order
  const handleFinalizeOrder = () => {
    const itemsToSave = [...cartItems];

    // If cart is empty, automatically add the current assembled marmita
    if (itemsToSave.length === 0) {
      if (!marmitaDescription.trim() && !marmitaDishName.trim()) {
        showToast('⚠️ Adicione ao menos uma marmita ou descreva os itens!');
        return;
      }
      const allWithout = [...withoutTags];
      if (customWithout.trim() && !allWithout.includes(customWithout.trim())) {
        allWithout.push(customWithout.trim());
      }
      const titleOrFirst = marmitaDishName.trim() || marmitaDescription.trim().split(',')[0].trim() || 'Marmita';
      itemsToSave.push({
        id: `item-${Date.now()}`,
        size: selectedSize,
        sizeName: currentSizeConfig.label,
        dishName: marmitaDishName.trim() || undefined,
        description: marmitaDescription.trim() || undefined,
        without: allWithout.length > 0 ? allWithout : undefined,
        bases: [],
        feijoes: [],
        proteinas: [titleOrFirst],
        guarnicoes: [],
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

    // Reset Form
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setAddressOrTable('');
    setMarmitaNotes('');
    setMarmitaQuantity(1);

    // Open Thermal Printing modal
    setPrintOrderModal(newOrder);
    showToast(`🎉 Pedido #${newOrder.orderNumber} lançado com sucesso!`);
  };

  // Print Thermal Label
  const handlePrint = async () => {
    if (!printOrderModal) return;
    setIsPrintingLabel(true);
    try {
      await printMarmitaThermalDirect(printOrderModal, settings, {
        mode: 'comanda',
        paperWidth: '58mm',
        fontSize: 'normal'
      });
      showToast('🖨️ Etiqueta enviada para impressão!');
    } catch {
      showToast('⚠️ Verifique a conexão com a impressora.');
    } finally {
      setIsPrintingLabel(false);
    }
  };

  // Share order on WhatsApp
  const handleShareWhatsApp = () => {
    if (!printOrderModal) return;
    const text = formatMarmitaWhatsAppText(printOrderModal, settings);
    const phone = (printOrderModal.customerPhone || '').replace(/\D/g, '');
    const url = phone
      ? `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Copy WhatsApp Formatted Marmitaria Menu
  const handleCopyWhatsAppMenu = () => {
    const priceP = cleanSizes.find((s) => s.size === 'P')?.price || 16.00;
    const priceM = cleanSizes.find((s) => s.size === 'M')?.price || 20.00;
    const priceG = cleanSizes.find((s) => s.size === 'G')?.price || 25.00;

    let text = `*🍱 CARDÁPIO DE MARMITAS & MARMITEX*\n`;
    text += `*${settings.restaurantName || 'Maresia Gastronomia'}*\n\n`;

    text += `📦 *TAMANHOS E VALORES:*\n`;
    text += `• *Pequena (P):* R$ ${priceP.toFixed(2).replace('.', ',')} (1 carne inclusa)\n`;
    text += `• *Média (M):* R$ ${priceM.toFixed(2).replace('.', ',')} (1 carne caprichada)\n`;
    text += `• *Grande (G):* R$ ${priceG.toFixed(2).replace('.', ',')} (até 2 carnes)\n\n`;

    text += `🥩 *OPÇÕES DE CARNES:*\n`;
    availableCarnes.slice(0, 8).forEach((c) => {
      text += `• ${c}\n`;
    });

    text += `\n🥗 *ACOMPANHAMENTOS & GUARNIÇÕES:*\n`;
    availableSides.slice(0, 8).forEach((a) => {
      text += `• ${a}\n`;
    });
    text += `_Acompanha arroz e feijão fresquinho._\n\n`;

    if (settings.phoneWhatsapp) {
      text += `🛵 *Peça pelo WhatsApp:*\n${settings.phoneWhatsapp}\n`;
    }
    text += `Entregamos quentinho na sua casa ou empresa!`;

    navigator.clipboard.writeText(text);
    showToast('📋 Cardápio copiado! Pronto para colar no WhatsApp!');
  };

  // Open price editor
  const handleOpenPriceEditor = () => {
    const initialMap: Record<string, number> = {};
    cleanSizes.forEach((s) => {
      initialMap[s.size] = s.price;
    });
    setTempPrices(initialMap);
    setIsEditingPrices(true);
  };

  const handleSavePrices = () => {
    const updated = cleanSizes.map((s) => {
      const p = tempPrices[s.size];
      return p && p > 0 ? { ...s, price: p } : s;
    });
    onUpdateSizes(updated);
    setIsEditingPrices(false);
    showToast('✅ Preços das marmitas atualizados com sucesso!');
  };

  // Handler: Register or update price for a size (only size and price)
  const handleSaveRegisteredPrice = (nameToSave: string, priceVal: number) => {
    if (!nameToSave.trim() || isNaN(priceVal) || priceVal <= 0) {
      showToast('⚠️ Informe o tamanho e um preço válido maior que R$ 0,00!');
      return;
    }

    const trimmed = nameToSave.trim();
    const isP = trimmed.toLowerCase().includes('pequena') || trimmed.toUpperCase() === 'P';
    const isM = trimmed.toLowerCase().includes('média') || trimmed.toLowerCase().includes('media') || trimmed.toUpperCase() === 'M';
    const isG = trimmed.toLowerCase().includes('grande') || trimmed.toUpperCase() === 'G';

    const targetKey = isP ? 'P' : isM ? 'M' : isG ? 'G' : null;

    const existingIndex = cleanSizes.findIndex(
      (s) => (targetKey && s.size === targetKey) ||
             s.label.toLowerCase() === trimmed.toLowerCase() ||
             s.name.toLowerCase() === trimmed.toLowerCase()
    );

    let updatedList: MarmitaSizeConfig[];
    if (existingIndex >= 0) {
      updatedList = cleanSizes.map((s, idx) =>
        idx === existingIndex ? { ...s, price: priceVal } : s
      );
    } else {
      const newConfig: MarmitaSizeConfig = {
        size: 'executiva' as MarmitaSize,
        label: trimmed,
        name: `Marmita ${trimmed}`,
        price: priceVal,
        maxProteins: 1,
        maxSides: 3,
        description: `Marmita ${trimmed}`,
        badgeColor: 'bg-orange-50 text-orange-800 border-orange-300'
      };
      updatedList = [...cleanSizes, newConfig];
    }

    onUpdateSizes(updatedList);
    showToast(`✅ Preço salvo: ${trimmed} -> R$ ${priceVal.toFixed(2).replace('.', ',')}`);
  };

  const handleSaveInlinePrice = (targetLabel: string, priceVal: number) => {
    if (isNaN(priceVal) || priceVal <= 0) {
      showToast('⚠️ Informe um valor válido!');
      return;
    }
    const updatedList = cleanSizes.map((s) => {
      if (s.label === targetLabel || s.name === targetLabel || s.size === targetLabel) {
        return { ...s, price: priceVal };
      }
      return s;
    });
    onUpdateSizes(updatedList);
    showToast(`✅ Preço atualizado: ${targetLabel} -> R$ ${priceVal.toFixed(2).replace('.', ',')}`);
  };

  const handleDeleteSize = (targetLabel: string) => {
    if (cleanSizes.length <= 1) {
      showToast('⚠️ Mantenha ao menos 1 tamanho de marmita cadastrado.');
      return;
    }
    const updatedList = cleanSizes.filter((s) => s.label !== targetLabel && s.name !== targetLabel);
    onUpdateSizes(updatedList);
    showToast(`Tamanho "${targetLabel}" removido.`);
  };

  const handleResetDefaultPrices = () => {
    const defaults: MarmitaSizeConfig[] = [
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
    onUpdateSizes(defaults);
    showToast('Valores restaurados: P R$ 16,00 • M R$ 20,00 • G R$ 25,00');
  };

  // Advance Order Status in KDS
  const handleAdvanceStatus = (order: MarmitaOrder) => {
    const nextStatus: Record<MarmitaOrderStatus, MarmitaOrderStatus> = {
      novo: 'em_montagem',
      em_montagem: 'pronto_embalado',
      pronto_embalado: order.deliveryType === 'entrega' ? 'saiu_para_entrega' : 'entregue',
      saiu_para_entrega: 'entregue',
      entregue: 'entregue',
      cancelado: 'cancelado'
    };
    onUpdateOrderStatus(order.id, nextStatus[order.status]);
    showToast(`Status do pedido #${order.orderNumber} atualizado!`);
  };

  // Filter KDS Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (statusFilter !== 'todos' && o.status !== statusFilter) return false;
        if (!orderSearch) return true;
        const q = orderSearch.toLowerCase();
        return (
          o.orderNumber.toString().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          (o.tableOrAddress && o.tableOrAddress.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, statusFilter, orderSearch]);

  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'entregue' && o.status !== 'cancelado');
  }, [orders]);

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center space-x-2 text-sm animate-in fade-in duration-200">
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
              Montagem Rápida • Marmitas Pequena, Média e Grande • Balcão & Delivery
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={handleCopyWhatsAppMenu}
            className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Copiar texto do cardápio para WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Copiar p/ WhatsApp</span>
          </button>

          {onSwitchToEspetos && (
            <button
              type="button"
              onClick={onSwitchToEspetos}
              className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <span>Ir para Espetos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation: Strictly 2 Clean Tabs */}
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
      </div>

      {/* =====================================================================
       * TAB 1: MONTAGEM RÁPIDA (PDV ÁGIL COM TIPOS PEQUENA, MÉDIA E GRANDE)
       * ===================================================================== */}
      {activeTab === 'novo_pedido' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Fast Assembly Form */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            
            {/* Step 1: Tipos de Marmita (Pequena, Média e Grande) + Ajuste de Preço */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  1. Tamanho da Marmita:
                </span>
                <button
                  type="button"
                  onClick={handleOpenPriceEditor}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Ajustar Preços</span>
                </button>
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
                      {s.label.includes('P') ? 'Individual' : s.label.includes('M') ? 'Média tradicional' : 'Grande reforçada'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. O Que Vai na Marmita (Composição e Descrição Manual) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
              {/* Identificação / Prato */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-orange-600" />
                    <span>2. O que é a Marmita? (Identificação / Nome do Prato):</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Ex: Bife Acebolado, Marmita Comercial</span>
                </div>
                <input
                  type="text"
                  value={marmitaDishName}
                  onChange={(e) => setMarmitaDishName(e.target.value)}
                  placeholder="Ex: Bife Bovino Acebolado, Marmita Executiva, Filé de Frango Grelhado..."
                  className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              {/* Descrição Manual dos Itens */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <span>📝 O que vai na Marmita? (Descrição dos Itens):</span>
                  </label>
                  <span className="text-[11px] text-orange-600 font-bold">Escreva o que o cliente pediu</span>
                </div>
                <textarea
                  rows={3}
                  value={marmitaDescription}
                  onChange={(e) => setMarmitaDescription(e.target.value)}
                  placeholder="Escreva livremente o que vai na marmita...&#10;Ex: Arroz branco, feijão carioca, bife acebolado, batata frita e farofa."
                  className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all resize-none"
                />

                {/* Atalhos rápidos com 1 clique */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">Inserir rápido:</span>
                  {[
                    '+ Arroz Branco',
                    '+ Arroz Integral',
                    '+ Feijão Carioca',
                    '+ Feijão Preto',
                    '+ Bife',
                    '+ Frango',
                    '+ Linguiça',
                    '+ Farofa',
                    '+ Batata Frita',
                    '+ Salada',
                    '+ Macarrão',
                    '+ Purê',
                    '+ Vinagrete'
                  ].map((itemText) => (
                    <button
                      key={itemText}
                      type="button"
                      onClick={() => {
                        const cleanText = itemText.replace('+', '').trim();
                        setMarmitaDescription((prev) => {
                          const trimmed = prev.trim();
                          if (!trimmed) return cleanText;
                          return `${trimmed}, ${cleanText}`;
                        });
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-orange-100 hover:text-orange-900 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      {itemText}
                    </button>
                  ))}
                </div>
              </div>

              {/* Se é sem alguma coisa */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-rose-700 tracking-wider flex items-center gap-1">
                    <span>🚫 É sem alguma coisa? (Retirar ingredientes):</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Clique para marcar</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Sem Cebola',
                    'Sem Feijão',
                    'Sem Salada',
                    'Sem Farofa',
                    'Sem Pimenta',
                    'Sem Alho',
                    'Sem Molho',
                    'Sem Cheiro-Verde',
                    'Sem Vinagrete',
                    'Sem Tomate'
                  ].map((tag) => {
                    const isSelected = withoutTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleWithoutTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                          isSelected
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="pt-1">
                  <input
                    type="text"
                    value={customWithout}
                    onChange={(e) => setCustomWithout(e.target.value)}
                    placeholder="Outra coisa a retirar? (Ex: sem vinagrete, sem sal)..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Notes & Add Button */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={marmitaNotes}
                  onChange={(e) => setMarmitaNotes(e.target.value)}
                  placeholder="Observação da marmita (Ex: 'Feijão por cima', 'Pouco arroz', 'Molho à parte')..."
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
                  <p className="text-[11px] text-slate-400 mt-0.5">Monte acima e clique em "+ Adicionar" ou "Confirmar Pedido"</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={item.id} className="bg-orange-50/70 p-2.5 rounded-xl border border-orange-200 text-xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-slate-900">
                          {item.quantity}x {item.sizeName}
                        </span>
                        {item.dishName && (
                          <span className="text-[11px] font-black text-orange-950 bg-orange-200/90 px-2 py-0.5 rounded-md">
                            🍲 {item.dishName}
                          </span>
                        )}
                        <span className="text-slate-500 font-bold">
                          — R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      {item.without && item.without.length > 0 && (
                        <div className="bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-black px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <span>🚫 SEM: {item.without.join(', ')}</span>
                        </div>
                      )}
                      {item.description && (
                        <span className="text-[11px] text-slate-700 font-medium block">
                          📝 {item.description}
                        </span>
                      )}
                      {!item.description && item.proteinas.length > 0 && (
                        <span className="text-[11px] text-slate-600 block">
                          🥩 {item.proteinas.join(', ')}
                        </span>
                      )}
                      {item.guarnicoes.length > 0 && (
                        <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                          + {item.guarnicoes.join(', ')}
                        </span>
                      )}
                      {item.notes && (
                        <span className="text-[10px] text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded block max-w-[220px] truncate">
                          Obs: {item.notes}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCartItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-500 p-1 cursor-pointer shrink-0"
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
                  placeholder="Ex: João / Mesa 04 / Balcão"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Telefone WhatsApp (Opcional):</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(67) 99999-9999"
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
                    placeholder="Rua, número e bairro de entrega..."
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
                        <div key={idx} className="border-b border-slate-200/60 pb-1.5 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="font-black text-slate-800 text-sm">
                              {item.quantity}x Marmita {item.sizeName}
                            </span>
                            {item.dishName && (
                              <span className="text-xs font-black text-orange-900 bg-orange-100 border border-orange-300 px-2 py-0.5 rounded-lg">
                                🍲 {item.dishName}
                              </span>
                            )}
                          </div>
                          {item.without && item.without.length > 0 && (
                            <div className="bg-rose-100 border border-rose-300 text-rose-900 text-xs font-black px-2 py-1 rounded-md mt-1 flex items-center gap-1 shadow-xs">
                              <span>⚠️ ATENÇÃO: SEM {item.without.join(' • ')}</span>
                            </div>
                          )}
                          {item.description ? (
                            <p className="text-xs text-slate-800 font-medium mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                              📝 <strong>Vai na marmita:</strong> {item.description}
                            </p>
                          ) : (
                            item.proteinas.length > 0 && (
                              <p className="text-[11px] text-slate-600 mt-0.5">
                                🥩 {item.proteinas.join(', ')}
                              </p>
                            )
                          )}
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
       * TAB 3: CADASTRAR / ALTERAR PREÇO DAS MARMITAS (SOMENTE TAMANHO E PREÇO)
       * ===================================================================== */}
      {activeTab === 'precos' && (
        <div className="space-y-5 max-w-4xl mx-auto">
          {/* Card: Cadastrar / Atualizar Preço (Apenas Tamanho e Preço) */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center space-x-3.5 pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-md shadow-orange-600/20">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Cadastrar Preço da Marmita
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Preencha apenas o tamanho e o preço. O valor é atualizado automaticamente no PDV e na comanda.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const priceNum = parseFloat(registerPriceInput.replace(',', '.'));
                handleSaveRegisteredPrice(registerSizeName, priceNum);
              }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 1. Tamanho da Marmita */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                    1. Tamanho da Marmita
                  </label>
                  
                  {/* Botões Rápidos */}
                  <div className="grid grid-cols-3 gap-2">
                    {['Pequena (P)', 'Média (M)', 'Grande (G)'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setRegisterSizeName(opt);
                          const isP = opt.includes('(P)');
                          const isM = opt.includes('(M)');
                          const isG = opt.includes('(G)');
                          const match = cleanSizes.find(
                            (s) => (isP && s.size === 'P') || (isM && s.size === 'M') || (isG && s.size === 'G') || s.label === opt
                          );
                          if (match) {
                            setRegisterPriceInput(match.price.toFixed(2));
                          }
                        }}
                        className={`py-2.5 px-2 text-xs font-black rounded-xl border text-center transition-all cursor-pointer ${
                          registerSizeName === opt
                            ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-600/20'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {/* Campo de Texto para outro tamanho */}
                  <input
                    type="text"
                    placeholder="Ou digite outro tamanho (ex: Marmita Família, Mini...)"
                    value={registerSizeName}
                    onChange={(e) => setRegisterSizeName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    required
                  />
                  <span className="block text-[11px] text-slate-400">
                    Escolha um dos botões ou digite um nome de tamanho personalizado.
                  </span>
                </div>

                {/* 2. Preço de Venda */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                    2. Preço (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.50"
                      min="0.50"
                      placeholder="0,00"
                      value={registerPriceInput}
                      onChange={(e) => setRegisterPriceInput(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required
                    />
                  </div>
                  <span className="block text-[11px] text-slate-400">
                    Exemplo: 16.00 (Pequena), 20.00 (Média), 25.00 (Grande).
                  </span>
                </div>
              </div>

              {/* Botão de Gravação */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sem complicações: cadastra e salva direto.</span>
                </p>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-7 py-3 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Preço</span>
                </button>
              </div>
            </form>
          </div>

          {/* Cards / Tabela de Preços Ativos */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Tabela de Preços Atuais
                </h4>
                <p className="text-xs text-slate-500">
                  Preços vigentes para cada tamanho de marmita no sistema
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaultPrices}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Restaurar Padrão
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {cleanSizes.map((s) => {
                const isCustom = s.size !== 'P' && s.size !== 'M' && s.size !== 'G';
                const currentInlineVal = inlinePriceInputs[s.label] ?? s.price;

                return (
                  <div
                    key={s.size + s.label}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-orange-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-sm font-black text-slate-900 block">
                          {s.label}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {s.description || 'Marmita Marmitaria'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-700">
                        {s.size}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          Preço Atual
                        </span>
                        <span className="text-xl font-black text-orange-600">
                          R$ {s.price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* Ajuste rápido inline de preço */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-xs font-bold text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.50"
                          min="0.50"
                          value={currentInlineVal}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setInlinePriceInputs((prev) => ({
                              ...prev,
                              [s.label]: val
                            }));
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = inlinePriceInputs[s.label] ?? s.price;
                            handleSaveInlinePrice(s.label, val);
                          }}
                          className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
                          title="Salvar novo preço para este tamanho"
                        >
                          Salvar
                        </button>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSize(s.label)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            title="Excluir tamanho"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Action Button to go back to PDV */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Os preços cadastrados atualizam os botões do PDV de montagem automaticamente.
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('novo_pedido')}
                className="inline-flex items-center space-x-1.5 text-xs font-black text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
              >
                <span>Ir para Montagem de Marmitas (PDV)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
      {isEditingPrices && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Ajustar Preços das Marmitas</h3>
                  <p className="text-[11px] text-slate-400">Valores cobrados nos 3 tamanhos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingPrices(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {cleanSizes.map((s) => (
                <div key={s.size} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-black text-sm text-slate-900 block">{s.label}</span>
                    <span className="text-[11px] text-slate-500">{s.description}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={tempPrices[s.size] !== undefined ? tempPrices[s.size] : s.price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTempPrices((prev) => ({ ...prev, [s.size]: val }));
                      }}
                      className="w-20 px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 font-black text-sm text-orange-600 text-right focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditingPrices(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePrices}
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black shadow-md transition cursor-pointer"
              >
                Salvar Preços
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * MODAL: IMPRESSÃO TÉRMICA DE COMANDA / ETIQUETA
       * ===================================================================== */}
      {printOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">
                Imprimir Comanda #{printOrderModal.orderNumber}
              </h3>
              <button
                type="button"
                onClick={() => setPrintOrderModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-black text-xs flex items-center justify-center cursor-pointer hover:bg-slate-200"
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
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>{isPrintingLabel ? 'Imprimindo...' : 'Imprimir Térmica'}</span>
              </button>
              {printOrderModal.customerPhone && (
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-1 cursor-pointer active:scale-95"
                  title="Enviar mensagem no WhatsApp"
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
