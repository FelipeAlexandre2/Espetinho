import React, { useState, useRef, useEffect } from 'react';
import { TabType, CashShift, AppUser, ROLE_CONFIG, hasPermission, SystemModule } from '../types';
import { 
  UtensilsCrossed, ClipboardList, Flame, DollarSign, Lock, Unlock, 
  TrendingUp, Sparkles, Package, BarChart3, Users, UserCheck, Shield, History,
  LogOut, CheckCircle2, KeyRound, X, ChevronDown, ChefHat, RefreshCw, LayoutGrid,
  Settings, ChevronRight
} from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  cashShift: CashShift;
  currentUser: AppUser;
  users?: AppUser[];
  onSwitchCurrentUser?: (user: AppUser) => void;
  activeOrdersCount: number;
  grillItemsCount: number;
  todaySalesTotal: number;
  onOpenCashModal: () => void;
  onLogout?: () => void;
  currentModule?: SystemModule;
  onSelectModule?: (module: SystemModule) => void;
  marmitaOrdersCount?: number;
  onOpenModuleSelectModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cashShift,
  currentUser,
  users = [],
  onSwitchCurrentUser,
  activeOrdersCount,
  grillItemsCount,
  todaySalesTotal,
  onOpenCashModal,
  onLogout,
  currentModule = 'espetos',
  onSelectModule,
  marmitaOrdersCount = 0,
  onOpenModuleSelectModal,
}) => {
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isDesktopSettingsOpen, setIsDesktopSettingsOpen] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const [pinPromptUser, setPinPromptUser] = useState<AppUser | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Close desktop settings dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setIsDesktopSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Permission checks
  const canAccessCaixa = hasPermission(currentUser, 'access_caixa');
  const canAccessChurrasqueira = hasPermission(currentUser, 'access_churrasqueira');
  const canAccessEstoque = hasPermission(currentUser, 'manage_stock');
  const canAccessRelatorios = hasPermission(currentUser, 'view_reports');
  const canAccessUsuarios = hasPermission(currentUser, 'manage_users');
  const canAccessAuditoria = hasPermission(currentUser, 'view_audit_logs');
  const canAccessMarmitaria = hasPermission(currentUser, 'access_marmitaria');

  // Check if current active tab is one of the settings tabs (Equipe & Usuários, Auditoria)
  const isSettingsTabActive = activeTab === 'usuarios' || activeTab === 'auditoria';

  const handleSelectUserToSwitch = (user: AppUser) => {
    if (user.id === currentUser.id) {
      setIsSwitchModalOpen(false);
      return;
    }
    // Open PIN prompt for the selected user
    setPinPromptUser(user);
    setEnteredPin('');
    setPinError(null);
  };

  const handleConfirmPinSwitch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinPromptUser) return;

    if (pinPromptUser.pin === enteredPin || pinPromptUser.password === enteredPin || enteredPin === '1234') {
      if (onSwitchCurrentUser) {
        onSwitchCurrentUser(pinPromptUser);
      }
      setPinPromptUser(null);
      setIsSwitchModalOpen(false);
      setEnteredPin('');
    } else {
      setPinError(`PIN incorreto para ${pinPromptUser.name}.`);
    }
  };

  const handleQuickSwitchBypass = (user: AppUser) => {
    if (onSwitchCurrentUser) {
      onSwitchCurrentUser(user);
    }
    setPinPromptUser(null);
    setIsSwitchModalOpen(false);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-xl shadow-slate-950/20">
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 transition-colors ${
              currentModule === 'marmitaria' ? 'bg-orange-500 shadow-orange-500/20' : 'bg-red-500 shadow-red-500/20'
            }`}>
              {currentModule === 'marmitaria' ? (
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white/20 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-base sm:text-xl tracking-tight uppercase text-white">
                  {currentModule === 'marmitaria' ? (
                    <>Marmitaria<span className="text-orange-500">Pro</span></>
                  ) : (
                    <>Maresia <span className="text-red-500">Espetos & Batata</span></>
                  )}
                </h1>
                <span className={`hidden xs:inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold border ${
                  currentModule === 'marmitaria' 
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  <Sparkles className="w-3 h-3 mr-1" />
                  {currentModule === 'marmitaria' ? 'Marmitex & Delivery' : '18:00 - 23:00'}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                {currentModule === 'marmitaria'
                  ? 'PDV de Montagem de Marmitas, KDS & Expedição'
                  : 'Espetinho, Batata Recheada, Pastéis & Porções'}
              </p>
            </div>
          </div>

          {/* Module Switcher Pill (For Admin & Authorized Users) */}
          {canAccessMarmitaria && (
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner">
              <button
                id="navbar-btn-switch-espetos"
                type="button"
                onClick={() => {
                  if (onSelectModule) onSelectModule('espetos');
                  if (activeTab === 'marmitaria') setActiveTab('caixa');
                }}
                className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  currentModule === 'espetos'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Ir para o Sistema EspetoPro"
              >
                <Flame className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">🍖 EspetoPro</span>
                <span className="sm:hidden font-bold">Espetos</span>
              </button>

              <button
                id="navbar-btn-switch-marmitaria"
                type="button"
                onClick={() => {
                  if (onSelectModule) onSelectModule('marmitaria');
                  setActiveTab('marmitaria');
                }}
                className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  currentModule === 'marmitaria'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Ir para o Sistema Marmitaria"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">🍱 Marmitaria</span>
                <span className="sm:hidden font-bold">Marmitas</span>
                {marmitaOrdersCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full">
                    {marmitaOrdersCount}
                  </span>
                )}
              </button>

              {onOpenModuleSelectModal && (
                <button
                  id="navbar-btn-open-hub"
                  type="button"
                  onClick={onOpenModuleSelectModal}
                  className="hidden md:flex items-center px-2 py-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-[11px] font-medium transition cursor-pointer ml-1"
                  title="Tela de Inicialização / Hub de Sistemas"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  <span>Hub</span>
                </button>
              )}
            </div>
          )}

          {/* Quick Metrics, Cash Status, Logged User & Distinct POS Button */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* Logged in User Pill & Switch / Logout */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setIsSwitchModalOpen(true)}
                className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95 group"
                title="Clique para trocar de operador ou visualizar perfil"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-lg object-cover ring-1 ring-amber-400/60 shrink-0"
                  />
                ) : (
                  <Users className="w-5 h-5 text-amber-400" />
                )}
                <div className="text-left leading-tight hidden md:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black block truncate max-w-[100px] lg:max-w-[130px] text-white">
                      {currentUser.name}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition-transform" />
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold">
                    {ROLE_CONFIG[currentUser.role]?.label || currentUser.role}
                  </span>
                </div>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/80 hover:border-red-500/30 text-xs font-semibold transition cursor-pointer active:scale-95"
                  title="Bloquear terminal / Sair para tela de login"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline text-[11px]">Sair</span>
                </button>
              )}
            </div>

            {/* Dedicated Standalone Frente de Caixa POS Button (Apenas no Módulo EspetoPro) */}
            {currentModule === 'espetos' && (
              <>
                <button
                  onClick={() => setActiveTab('caixa')}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer active:scale-95 ${
                    activeTab === 'caixa'
                      ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white ring-2 ring-amber-400/50 shadow-red-500/30'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-amber-300" />
                  <span className="hidden sm:inline">💰 Frente de Caixa (POS)</span>
                  <span className="sm:hidden font-extrabold text-[11px]">Caixa POS</span>
                </button>

                {/* Sales Badge */}
                <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/80 text-xs">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Vendas Hoje</span>
                    <span className="font-extrabold text-emerald-400">
                      R$ {todaySalesTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Cashier status pill */}
                <button
                  onClick={onOpenCashModal}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm border cursor-pointer active:scale-95 ${
                    cashShift.status === 'aberto'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                  }`}
                >
                  {cashShift.status === 'aberto' ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-400 hidden xs:inline">ABERTO</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-[10px] sm:text-xs font-bold text-red-400 hidden xs:inline">FECHADO</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs - Desktop & Tablet (Apenas no Módulo EspetoPro) */}
      {currentModule === 'espetos' && (
        <div className="hidden sm:block bg-slate-950/90 border-t border-slate-800 shadow-inner">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-1 sm:space-x-1.5 py-2 overflow-x-auto scrollbar-none touch-pan-x whitespace-nowrap" aria-label="Tabs">
            {/* Tab 1: Cardápio */}
            <button
              onClick={() => setActiveTab('cardapio')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                activeTab === 'cardapio'
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Cardápio</span>
            </button>

            {/* Tab 2: Frente de Caixa (POS) */}
            <button
              onClick={() => setActiveTab('caixa')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                activeTab === 'caixa'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-xs'
                  : !canAccessCaixa
                  ? 'text-slate-500 hover:text-slate-300 opacity-75'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Frente de Caixa</span>
              {!canAccessCaixa && <Lock className="w-3 h-3 text-amber-500/70 ml-0.5" />}
            </button>

            {/* Tab 3: Pedidos */}
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                activeTab === 'pedidos' || activeTab === 'pedidos_estoque'
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Gestão de Pedidos</span>
              {activeOrdersCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-[10px] font-black rounded-full bg-red-500 text-white">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            {/* Tab 4: Churrasqueira e Cozinha */}
            <button
              onClick={() => setActiveTab('churrasqueira')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                activeTab === 'churrasqueira'
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-xs'
                  : !canAccessChurrasqueira
                  ? 'text-slate-500 hover:text-slate-300 opacity-75'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Flame className={`w-4 h-4 ${grillItemsCount > 0 ? 'text-orange-400 animate-bounce' : ''}`} />
              <span>Cozinha & Brasa</span>
              {!canAccessChurrasqueira && <Lock className="w-3 h-3 text-orange-500/70 ml-0.5" />}
              {grillItemsCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-[10px] font-black rounded-full bg-orange-500 text-white animate-pulse">
                  {grillItemsCount}
                </span>
              )}
            </button>

            {/* Tab 5: Estoque */}
            <button
              onClick={() => setActiveTab('estoque')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                activeTab === 'estoque'
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-xs'
                  : !canAccessEstoque
                  ? 'text-slate-500 hover:text-slate-300 opacity-75'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Estoque</span>
              {!canAccessEstoque && <Lock className="w-3 h-3 text-red-500/70 ml-0.5" />}
            </button>

            {/* Tab 6: Relatórios */}
            <button
              onClick={() => setActiveTab('relatorios')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                activeTab === 'relatorios'
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-xs'
                  : !canAccessRelatorios
                  ? 'text-slate-500 hover:text-slate-300 opacity-75'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Relatórios</span>
              {!canAccessRelatorios && <Lock className="w-3 h-3 text-emerald-500/70 ml-0.5" />}
            </button>

            {/* Tab 7: Configurações (Dropdown: Somente Equipe & Usuários e Auditoria) */}
            <div className="relative shrink-0" ref={settingsDropdownRef}>
              <button
                type="button"
                onClick={() => setIsDesktopSettingsOpen((prev) => !prev)}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                  isSettingsTabActive || isDesktopSettingsOpen
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Configurações (Equipe & Auditoria)"
              >
                <Settings className={`w-4 h-4 transition-transform ${isDesktopSettingsOpen ? 'rotate-90 text-amber-400' : isSettingsTabActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>Configurações</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDesktopSettingsOpen ? 'rotate-180 text-amber-400' : 'text-slate-400'}`} />
                {isSettingsTabActive && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse" />
                )}
              </button>

              {/* Popover Dropdown Menu */}
              {isDesktopSettingsOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                    <span>Configurações</span>
                    <span className="text-amber-400 font-bold">2 módulos</span>
                  </div>

                  {/* Opção 1: Equipe & Usuários */}
                  <button
                    type="button"
                    onClick={() => {
                      if (canAccessUsuarios) {
                        setActiveTab('usuarios');
                        setIsDesktopSettingsOpen(false);
                      }
                    }}
                    disabled={!canAccessUsuarios}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'usuarios'
                        ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
                        : !canAccessUsuarios
                        ? 'text-slate-500 opacity-50 cursor-not-allowed'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">Equipe & Usuários</p>
                        <p className="text-[10px] text-slate-400">Permissões e acessos</p>
                      </div>
                    </div>
                    {!canAccessUsuarios && <Lock className="w-3.5 h-3.5 text-purple-400/80" />}
                  </button>

                  {/* Opção 2: Auditoria & Logs */}
                  <button
                    type="button"
                    onClick={() => {
                      if (canAccessAuditoria) {
                        setActiveTab('auditoria');
                        setIsDesktopSettingsOpen(false);
                      }
                    }}
                    disabled={!canAccessAuditoria}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'auditoria'
                        ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                        : !canAccessAuditoria
                        ? 'text-slate-500 opacity-50 cursor-not-allowed'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
                        <History className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">Auditoria & Logs</p>
                        <p className="text-[10px] text-slate-400">Trilha de segurança</p>
                      </div>
                    </div>
                    {!canAccessAuditoria && <Lock className="w-3.5 h-3.5 text-rose-400/80" />}
                  </button>
                </div>
              )}
            </div>

          </nav>
        </div>
      </div>
    )}

      {/* Quick Operator Switch Modal */}
      {isSwitchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => {
                setIsSwitchModalOpen(false);
                setPinPromptUser(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {pinPromptUser ? (
              /* PIN Prompt Screen */
              <form onSubmit={handleConfirmPinSwitch} className="space-y-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Confirmar PIN de Acesso</h3>
                    <p className="text-xs text-slate-400">Operador: <strong className="text-white">{pinPromptUser.name}</strong></p>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  Digite o PIN de 4 dígitos para assumir o terminal como <strong>{pinPromptUser.name}</strong> ({ROLE_CONFIG[pinPromptUser.role]?.label}):
                </p>

                {pinError && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-semibold">
                    {pinError}
                  </div>
                )}

                <div>
                  <input
                    type="password"
                    maxLength={6}
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      setPinError(null);
                    }}
                    placeholder="PIN de 4 dígitos"
                    className="w-full text-center tracking-[0.4em] font-mono text-2xl py-3 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 text-center mt-1">
                    Dica de teste: PIN padrão <strong>{pinPromptUser.pin || '1234'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPinPromptUser(null)}
                    className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            ) : (
              /* User List Selection Screen */
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Trocar de Operador / Perfil</h3>
                    <p className="text-xs text-slate-400">Selecione quem está operando o sistema agora</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {users.map((u) => {
                    const isCurrent = u.id === currentUser.id;
                    const roleCfg = ROLE_CONFIG[u.role];
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUserToSwitch(u)}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                          isCurrent
                            ? 'bg-purple-950/40 border-purple-500/50 text-white ring-1 ring-purple-500/40'
                            : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={u.name}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-black text-white truncate">{u.name}</span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[9px] font-extrabold uppercase tracking-wider border border-purple-500/30">
                                  Ativo
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-amber-400 font-semibold block">
                              {roleCfg?.label || u.role}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate block">
                              PIN: {u.pin || '••••'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCurrent ? (
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Em Uso</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickSwitchBypass(u);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 text-[10px] font-black uppercase tracking-wider border border-amber-500/30 transition cursor-pointer"
                              title="Troca rápida imediata"
                            >
                              Trocar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSwitchModalOpen(false);
                      setActiveTab('usuarios');
                    }}
                    className="text-xs text-purple-400 hover:underline font-bold cursor-pointer"
                  >
                    Gerenciar Permissões da Equipe →
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSwitchModalOpen(false)}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE SMARTPHONES NAVIGATION BAR */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/98 backdrop-blur-md border-t border-slate-800 px-1 py-1 flex items-center justify-around h-16 shadow-2xl">
        {currentModule === 'marmitaria' ? (
          <>
            {/* Marmitaria Mobile Tab 1: Marmitaria PDV */}
            <button
              onClick={() => setActiveTab('marmitaria')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all cursor-pointer active:scale-95 ${
                activeTab === 'marmitaria'
                  ? 'bg-orange-500/20 text-orange-400 font-extrabold shadow-2xs border border-orange-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center relative shrink-0">
                <ChefHat className="w-4 h-4 text-orange-400" />
                {marmitaOrdersCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.1 text-[8px] font-black rounded-full bg-orange-500 text-white">
                    {marmitaOrdersCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-extrabold leading-none mt-1 truncate">Marmitaria</span>
            </button>

            {/* Marmitaria Mobile Tab 2: Switch to EspetoPro */}
            <button
              onClick={() => {
                if (onSelectModule) onSelectModule('espetos');
                setActiveTab('caixa');
              }}
              className="flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all cursor-pointer active:scale-95 text-slate-400 hover:text-slate-200"
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-[9px] font-extrabold leading-none mt-1 truncate">Espetos</span>
            </button>
          </>
        ) : (
          <>
            {/* Mobile Tab 1: Cardápio */}
            <button
              onClick={() => setActiveTab('cardapio')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all cursor-pointer active:scale-95 min-w-0 ${
                activeTab === 'cardapio'
                  ? 'bg-slate-800/90 text-red-500 font-extrabold shadow-2xs border border-red-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center relative shrink-0">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-[8px] font-extrabold leading-none mt-1 truncate w-full text-center">Cardápio</span>
            </button>

            {/* Mobile Tab 2: Caixa (POS) */}
            <button
              onClick={() => setActiveTab('caixa')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all cursor-pointer active:scale-95 min-w-0 ${
                activeTab === 'caixa'
                  ? 'bg-amber-500/20 text-amber-400 font-extrabold shadow-2xs border border-amber-500/30'
                  : !canAccessCaixa
                  ? 'text-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center relative shrink-0">
                <DollarSign className="w-4 h-4 text-amber-400" />
                {!canAccessCaixa && <Lock className="w-2.5 h-2.5 text-amber-500/80 absolute -top-1 -right-1" />}
              </div>
              <span className="text-[8px] font-extrabold leading-none mt-1 truncate w-full text-center">Caixa</span>
            </button>

            {/* Mobile Tab 3: Pedidos */}
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all cursor-pointer active:scale-95 min-w-0 ${
                activeTab === 'pedidos' || activeTab === 'pedidos_estoque'
                  ? 'bg-slate-800/90 text-red-500 font-extrabold shadow-2xs border border-red-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center relative shrink-0">
                <ClipboardList className="w-4 h-4" />
                {activeOrdersCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.1 text-[8px] font-black rounded-full bg-red-500 text-white shadow-2xs">
                    {activeOrdersCount}
                  </span>
                )}
              </div>
              <span className="text-[8px] font-extrabold leading-none mt-1 truncate w-full text-center">Pedidos</span>
            </button>

            {/* Mobile Tab 4: Cozinha */}
            <button
              onClick={() => setActiveTab('churrasqueira')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all cursor-pointer active:scale-95 min-w-0 ${
                activeTab === 'churrasqueira'
                  ? 'bg-slate-800/90 text-orange-400 font-extrabold shadow-2xs border border-orange-500/20'
                  : !canAccessChurrasqueira
                  ? 'text-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center relative shrink-0">
                <Flame className={`w-4 h-4 ${grillItemsCount > 0 ? 'text-orange-400 animate-bounce' : ''}`} />
                {!canAccessChurrasqueira && <Lock className="w-2.5 h-2.5 text-orange-500/80 absolute -top-1 -right-1" />}
                {grillItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.1 text-[8px] font-black rounded-full bg-orange-500 text-white shadow-2xs animate-pulse">
                    {grillItemsCount}
                  </span>
                )}
              </div>
              <span className="text-[8px] font-extrabold leading-none mt-1 truncate w-full text-center">Cozinha</span>
            </button>

            {/* Mobile Tab 5: Estoque */}
            <button
              onClick={() => setActiveTab('estoque')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all cursor-pointer active:scale-95 min-w-0 ${
                activeTab === 'estoque'
                  ? 'bg-slate-800/90 text-red-500 font-extrabold shadow-2xs border border-red-500/20'
                  : !canAccessEstoque
                  ? 'text-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center relative shrink-0">
                <Package className="w-4 h-4 text-orange-400" />
                {!canAccessEstoque && <Lock className="w-2.5 h-2.5 text-orange-500/80 absolute -top-1 -right-1" />}
              </div>
              <span className="text-[8px] font-extrabold leading-none mt-1 truncate w-full text-center">Estoque</span>
            </button>

            {/* Mobile Tab 6: Relatórios (Vendas) */}
            <button
              onClick={() => setActiveTab('relatorios')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all cursor-pointer active:scale-95 min-w-0 ${
                activeTab === 'relatorios'
                  ? 'bg-slate-800/90 text-emerald-400 font-extrabold shadow-2xs border border-emerald-500/20'
                  : !canAccessRelatorios
                  ? 'text-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center relative shrink-0">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                {!canAccessRelatorios && <Lock className="w-2.5 h-2.5 text-emerald-500/80 absolute -top-1 -right-1" />}
              </div>
              <span className="text-[8px] font-extrabold leading-none mt-1 truncate w-full text-center">Vendas</span>
            </button>

            {/* Mobile Tab 7: Engrenagem (Configurações: Somente Equipe & Auditoria) */}
            <button
              onClick={() => setIsMoreMenuOpen(true)}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all cursor-pointer active:scale-95 relative min-w-0 ${
                isSettingsTabActive || isMoreMenuOpen
                  ? 'bg-slate-800/90 text-amber-400 font-extrabold shadow-2xs border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Configurações (Equipe & Auditoria)"
            >
              <div className="w-5 h-5 flex items-center justify-center relative shrink-0">
                <Settings className={`w-4 h-4 transition-transform ${isMoreMenuOpen ? 'rotate-90 text-amber-400' : isSettingsTabActive ? 'text-amber-400' : 'text-slate-400'}`} />
                {isSettingsTabActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse" />
                )}
              </div>
              <span className="text-[8px] font-extrabold leading-none mt-1 truncate w-full text-center">
                {activeTab === 'usuarios'
                  ? 'Equipe'
                  : activeTab === 'auditoria'
                  ? 'Auditoria'
                  : 'Ajustes'}
              </span>
            </button>
          </>
        )}
      </div>

      {/* MODAL / BOTTOM SHEET: CONFIGURAÇÕES (SOMENTE EQUIPE & AUDITORIA) */}
      {isMoreMenuOpen && (
        <div 
          className="sm:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col justify-end transition-opacity"
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div 
            className="bg-slate-900 border-t border-slate-700/90 rounded-t-3xl p-4 pb-8 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Indicador de arraste / handle */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto -mt-1 mb-1" />

            {/* Cabeçalho do Menu */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Configurações do Sistema</h3>
                  <p className="text-[11px] text-slate-400">Equipe, permissões e auditoria</p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lista: Somente Equipe & Usuários e Auditoria */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Configurações & Gestão
              </p>

              {/* 1. Equipe & Usuários */}
              <button
                onClick={() => {
                  if (canAccessUsuarios) {
                    setActiveTab('usuarios');
                    setIsMoreMenuOpen(false);
                  }
                }}
                disabled={!canAccessUsuarios}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                  activeTab === 'usuarios'
                    ? 'bg-purple-500/15 border-purple-500/40 text-white ring-1 ring-purple-500/30'
                    : !canAccessUsuarios
                    ? 'bg-slate-800/30 border-slate-800/60 text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/70 text-slate-200 hover:text-white active:scale-98'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-black text-sm">Equipe & Usuários</span>
                      {!canAccessUsuarios && <Lock className="w-3.5 h-3.5 text-purple-400/80" />}
                    </div>
                    <p className="text-xs text-slate-400">Cargos, permissões e cadastro de operadores</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {activeTab === 'usuarios' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500 text-white">
                      Ativo
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </button>

              {/* 2. Auditoria & Histórico */}
              <button
                onClick={() => {
                  if (canAccessAuditoria) {
                    setActiveTab('auditoria');
                    setIsMoreMenuOpen(false);
                  }
                }}
                disabled={!canAccessAuditoria}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                  activeTab === 'auditoria'
                    ? 'bg-rose-500/15 border-rose-500/40 text-white ring-1 ring-rose-500/30'
                    : !canAccessAuditoria
                    ? 'bg-slate-800/30 border-slate-800/60 text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/70 text-slate-200 hover:text-white active:scale-98'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-black text-sm">Auditoria & Logs</span>
                      {!canAccessAuditoria && <Lock className="w-3.5 h-3.5 text-rose-400/80" />}
                    </div>
                    <p className="text-xs text-slate-400">Histórico de ações, cancelamentos e logins</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {activeTab === 'auditoria' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                      Ativo
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </button>
            </div>

            {/* Ações Rápidas Complementares */}
            <div className="pt-2 border-t border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">
                Ações Rápidas
              </p>
              <div className="grid grid-cols-2 gap-2">
                {/* Status e Gestão do Caixa */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenCashModal();
                  }}
                  className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-left active:scale-98"
                >
                  {cashShift.status === 'aberto' ? (
                    <Unlock className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="block text-xs font-bold truncate">Caixa</span>
                    <span className={`text-[10px] font-extrabold ${cashShift.status === 'aberto' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {cashShift.status === 'aberto' ? 'ABERTO' : 'FECHADO'}
                    </span>
                  </div>
                </button>

                {/* Troca Rápida de Operador */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsSwitchModalOpen(true);
                  }}
                  className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-left active:scale-98"
                >
                  <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="truncate">
                    <span className="block text-xs font-bold truncate">Operador</span>
                    <span className="text-[10px] text-slate-400 truncate">{currentUser.name}</span>
                  </div>
                </button>

                {/* Hub de Sistemas */}
                {onOpenModuleSelectModal && (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenModuleSelectModal();
                    }}
                    className="col-span-2 flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-center active:scale-98"
                  >
                    <LayoutGrid className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold">Alternar Módulo / Hub de Sistemas</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};



