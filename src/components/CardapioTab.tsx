import React, { useState } from 'react';
import { Product, Category, Order, MeatPoint, TABLES, AppUser, hasPermission, canUserCreateOrder } from '../types';
import { Plus, Minus, Search, Edit2, Trash2, Check, X, Flame, Package, Zap, Tag, DollarSign, Image as ImageIcon, Utensils, CheckCircle2, Lock, QrCode } from 'lucide-react';
import { QrCodeModal } from './QrCodeModal';

interface CardapioTabProps {
  products: Product[];
  currentUser?: AppUser;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onCreateOrder?: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => void;
  onOpenCustomerView?: (tableName: string) => void;
}

const CATEGORIES: { id: Category | 'todos'; label: string; icon: string }[] = [
  { id: 'todos', label: 'Todos os Itens', icon: '🍽️' },
  { id: 'espetos', label: 'Espetos & Jantinha', icon: '🍢' },
  { id: 'pratos_executivos', label: 'Pratos Executivos', icon: '🍛' },
  { id: 'batatas_recheadas', label: 'Batata Recheada', icon: '🥔' },
  { id: 'pasteis', label: 'Pastéis', icon: '🥟' },
  { id: 'lanches', label: 'Lanches & Dogs', icon: '🍔' },
  { id: 'porcoes', label: 'Porções', icon: '🍟' },
  { id: 'caldos', label: 'Caldos', icon: '🥣' },
  { id: 'bebidas', label: 'Bebidas', icon: '🍺' },
  { id: 'adicionais', label: 'Adicionais', icon: '➕' },
];

export const CardapioTab: React.FC<CardapioTabProps> = ({
  products,
  currentUser,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onCreateOrder,
  onOpenCustomerView,
}) => {
  const canManageMenu = hasPermission(currentUser, 'manage_menu');
  const canCreateOrder = canUserCreateOrder(currentUser);

  const [selectedCategory, setSelectedCategory] = useState<Category | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Add to Table Modal state
  const [tableModalProduct, setTableModalProduct] = useState<Product | null>(null);
  const [targetTable, setTargetTable] = useState<string>('Mesa 01');
  const [tableQuantity, setTableQuantity] = useState<number>(1);
  const [tableMeatPoint, setTableMeatPoint] = useState<MeatPoint>('ao_ponto');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'espetos_tradicionais' as Category,
    price: 15.00,
    costPrice: 6.00,
    description: '',
    photoUrl: '',
    requiresMeatPoint: false,
    isAvailable: true,
    isQuickPos: true,
    stockQty: 50,
    unit: 'unid',
  });

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'todos' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'espetos_tradicionais',
      price: 15.00,
      costPrice: 6.00,
      description: '',
      photoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
      requiresMeatPoint: true,
      isAvailable: true,
      isQuickPos: true,
      stockQty: 30,
      unit: 'unid',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      costPrice: product.costPrice,
      description: product.description,
      photoUrl: product.photoUrl,
      requiresMeatPoint: product.requiresMeatPoint,
      isAvailable: product.isAvailable,
      isQuickPos: product.isQuickPos,
      stockQty: product.stockQty,
      unit: product.unit,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...formData,
      });
    } else {
      onAddProduct(formData);
    }
    setIsModalOpen(false);
  };

  const toggleAvailability = (product: Product) => {
    onUpdateProduct({
      ...product,
      isAvailable: !product.isAvailable,
    });
  };

  const toggleQuickPos = (product: Product) => {
    onUpdateProduct({
      ...product,
      isQuickPos: !product.isQuickPos,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
            <Utensils className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              📋 Cardápio Digital & Produtos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Gerencie catálogo, preços, fotos, disponibilidade e atalhos do caixa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 border border-slate-750"
            title="Gerar e imprimir QR Code das mesas para autoatendimento dos clientes"
          >
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span>QR Code das Mesas</span>
          </button>

          {canManageMenu ? (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 sm:py-3 rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Novo Produto</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-500 px-3 py-2 rounded-xl text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Modo Consulta</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="🔍 Pesquisar produto pelo nome ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                title="Limpar pesquisa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Result Counter Badge when searching */}
          {searchQuery && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl self-start sm:self-auto">
              <span>Resultados:</span>
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full font-black text-[10px]">
                {filteredProducts.length}
              </span>
            </div>
          )}
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Nenhum produto encontrado {searchQuery ? `para "${searchQuery}"` : ''}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Tente buscar com outro nome ou limpar os filtros de categoria.
          </p>
          {(searchQuery || selectedCategory !== 'todos') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('todos');
              }}
              className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Limpar busca e filtros</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredProducts.map((product) => {
            const margin = product.price - product.costPrice;
            const marginPercent = ((margin / product.price) * 100).toFixed(0);

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-lg flex flex-col overflow-hidden relative group ${
                  !product.isAvailable ? 'opacity-60 border-slate-200 grayscale-[30%]' : 'border-slate-200 hover:border-red-300'
                }`}
              >
                {/* Product Image Header */}
                <div className="relative h-32 sm:h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={product.photoUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80';
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  {/* Price Tag */}
                  <div className="absolute top-2.5 right-2.5 bg-red-500 text-white font-black px-2.5 py-1 rounded-xl text-xs sm:text-sm shadow-md border border-red-400/30">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </div>

                  {/* Meat Point badge if applicable */}
                  {product.requiresMeatPoint && (
                    <div className="absolute top-2.5 left-2.5 bg-slate-900/90 text-red-400 font-bold px-2 py-0.5 rounded-lg text-[10px] backdrop-blur-sm border border-slate-800 flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-red-400" />
                      <span>Escolhe Ponto</span>
                    </div>
                  )}

                  {/* Stock Level Badge */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold backdrop-blur-sm shadow-sm ${
                      product.stockQty <= 5
                        ? 'bg-red-500/90 text-white'
                        : product.stockQty <= 15
                        ? 'bg-amber-500/90 text-slate-950'
                        : 'bg-emerald-500/90 text-white'
                    }`}>
                      <Package className="w-3 h-3 inline mr-1" />
                      {product.stockQty} {product.unit} em estoque
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base line-clamp-1 group-hover:text-red-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
                      {product.description || 'Sem descrição cadastrada.'}
                    </p>
                  </div>

                  {/* Margin & Quick POS Info */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md">
                      Lucro: R$ {margin.toFixed(2)} ({marginPercent}%)
                    </span>
                    {product.isQuickPos && (
                      <span className="text-red-600 font-bold flex items-center gap-0.5" title="Atalho rápido no Caixa POS">
                        <Zap className="w-3 h-3 fill-red-500" />
                        Atalho POS
                      </span>
                    )}
                  </div>

                  {/* Add to Table Button */}
                  <div className="pt-2">
                    <button
                      disabled={!canCreateOrder || !product.isAvailable || product.stockQty <= 0}
                      onClick={() => {
                        if (!canCreateOrder) return;
                        setTableModalProduct(product);
                        setTableQuantity(1);
                        setTableMeatPoint('ao_ponto');
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 shadow-xs ${
                        !canCreateOrder
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : product.isAvailable && product.stockQty > 0
                          ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-500/20'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {!canCreateOrder ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
                      <span>{canCreateOrder ? 'Adicionar à Mesa' : 'Sem Permissão (Lançar)'}</span>
                    </button>
                  </div>

                  {/* Actions & Toggles */}
                  <div className="pt-2 flex items-center justify-between gap-1.5">
                    <button
                      disabled={!canManageMenu}
                      onClick={() => {
                        if (!canManageMenu) return;
                        toggleAvailability(product);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-colors border ${
                        !canManageMenu
                          ? 'opacity-60 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
                          : product.isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer active:scale-95'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 cursor-pointer active:scale-95'
                      }`}
                    >
                      {product.isAvailable ? '🟢 Em Estoque' : '🔴 Esgotado'}
                    </button>

                    <button
                      disabled={!canManageMenu}
                      onClick={() => {
                        if (!canManageMenu) return;
                        toggleQuickPos(product);
                      }}
                      className={`p-2 rounded-xl border text-xs transition-colors ${
                        !canManageMenu
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-300'
                          : product.isQuickPos
                          ? 'bg-red-50 border-red-200 text-red-600 cursor-pointer active:scale-95'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer active:scale-95'
                      }`}
                      title={!canManageMenu ? 'Requer permissão de gerência' : product.isQuickPos ? 'Remover do painel rápido do Caixa' : 'Adicionar ao painel rápido do Caixa'}
                    >
                      <Zap className="w-4 h-4" />
                    </button>

                    {canManageMenu && (
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer active:scale-95"
                        title="Editar Produto"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {canManageMenu && (
                      <button
                        onClick={() => {
                          if (confirm(`Deseja excluir "${product.name}"?`)) {
                            onDeleteProduct(product.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer active:scale-95"
                        title="Excluir Produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg">
                  {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Espeto de Picanha Nobre"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="espetos">Espetos & Jantinha</option>
                    <option value="pratos_executivos">Pratos Executivos</option>
                    <option value="batatas_recheadas">Batatas Recheadas</option>
                    <option value="pasteis">Pastéis</option>
                    <option value="lanches">Lanches & Hot Dogs</option>
                    <option value="porcoes">Porções</option>
                    <option value="caldos">Caldos</option>
                    <option value="bebidas">Bebidas</option>
                    <option value="adicionais">Adicionais</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Unidade
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="unid">Unidade (unid)</option>
                    <option value="porção">Porção</option>
                    <option value="lata">Lata</option>
                    <option value="garrafa">Garrafa</option>
                    <option value="fatia">Fatia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Preço Venda (R$)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Estoque Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockQty}
                    onChange={(e) => setFormData({ ...formData, stockQty: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  URL da Foto do Produto
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                {formData.photoUrl && (
                  <div className="mt-2 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative">
                    <img
                      src={formData.photoUrl}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Descrição do Item
                </label>
                <textarea
                  rows={2}
                  placeholder="Descreva os ingredientes e detalhes do produto..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresMeatPoint}
                    onChange={(e) => setFormData({ ...formData, requiresMeatPoint: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    🥩 Requer escolha de Ponto da Carne (Mal passada / Ao Ponto / Bem passada)
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isQuickPos}
                    onChange={(e) => setFormData({ ...formData, isQuickPos: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    ⚡ Exibir como Atalho Rápido na Frente de Caixa (POS)
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md transition-all"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add To Table Modal */}
      {tableModalProduct && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-red-950 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white">Lançar Produto na Mesa</h3>
                  <p className="text-xs text-slate-400">{tableModalProduct.name}</p>
                </div>
              </div>
              <button
                onClick={() => setTableModalProduct(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Product Info Banner */}
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <img
                  src={tableModalProduct.photoUrl}
                  alt={tableModalProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 object-cover rounded-lg shrink-0 border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-900 text-sm truncate">{tableModalProduct.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{tableModalProduct.description}</p>
                  <span className="text-xs font-black text-red-600 block mt-0.5">
                    R$ {tableModalProduct.price.toFixed(2).replace('.', ',')} / unid
                  </span>
                </div>
              </div>

              {/* Table Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                  Selecione a Mesa ou Comanda:
                </label>
                <select
                  value={targetTable}
                  onChange={(e) => setTargetTable(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none shadow-xs"
                >
                  {TABLES.map((tbl) => (
                    <option key={tbl} value={tbl}>
                      {tbl}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                  Quantidade:
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setTableQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-extrabold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-lg font-black text-slate-900">
                    {tableQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTableQuantity((q) => q + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-extrabold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Meat Point selection if applicable */}
              {tableModalProduct.requiresMeatPoint && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span>Ponto da Carne:</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'mal_passada', label: '🔴 Mal Passada' },
                      { id: 'ao_ponto', label: '🟠 Ao Ponto' },
                      { id: 'bem_passada', label: '🟤 Bem Passada' },
                    ].map((pt) => (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => setTableMeatPoint(pt.id as MeatPoint)}
                        className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                          tableMeatPoint === pt.id
                            ? 'bg-red-500 text-white border-red-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Total Calculation */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-slate-900">
                <span className="text-xs font-extrabold uppercase text-slate-500">Valor Total do Pedido:</span>
                <span className="text-xl font-black text-red-600">
                  R$ {(tableModalProduct.price * tableQuantity).toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => {
                  if (!tableModalProduct || !onCreateOrder) return;
                  const itemSubtotal = tableModalProduct.price * tableQuantity;
                  const itemServiceFee = Number((itemSubtotal * 0.1).toFixed(2));
                  const itemTotal = Number((itemSubtotal + itemServiceFee).toFixed(2));

                  onCreateOrder({
                    tableOrCustomer: targetTable,
                    status: 'novo',
                    subtotal: itemSubtotal,
                    discount: 0,
                    serviceFee: itemServiceFee,
                    total: itemTotal,
                    paymentMethod: 'pix',
                    isPaid: false,
                    items: [
                      {
                        id: `item-${Date.now()}`,
                        productId: tableModalProduct.id,
                        productName: tableModalProduct.name,
                        quantity: tableQuantity,
                        price: tableModalProduct.price,
                        meatPoint: tableModalProduct.requiresMeatPoint ? tableMeatPoint : undefined,
                        requiresMeatPoint: tableModalProduct.requiresMeatPoint,
                        status: 'aguardando',
                      },
                    ],
                  });

                  const msg = `🔥 ${tableQuantity}x "${tableModalProduct.name}" enviado com sucesso para ${targetTable}!`;
                  setToastMessage(msg);
                  setTableModalProduct(null);
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                className="w-full py-3 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98 mt-2"
              >
                <Flame className="w-5 h-5 text-amber-300" />
                <span>Confirmar & Enviar para {targetTable}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-extrabold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* QR Code & Tables Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onOpenCustomerView={onOpenCustomerView}
      />
    </div>
  );
};
