import React, { useState, useEffect } from 'react';
import { AppUser, ROLE_CONFIG, SystemModule } from '../types';
import { 
  Flame, KeyRound, ShieldCheck, 
  AlertCircle, Sparkles, ArrowRight, 
  HelpCircle, UtensilsCrossed, ChevronRight, Fingerprint,
  UserCheck, Delete, RefreshCw, ChefHat, ArrowLeft
} from 'lucide-react';

interface LoginScreenProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser, rememberMe: boolean) => void;
  onLogFailedAttempt?: (attemptedEmail: string, reason: string) => void;
  currentModule?: SystemModule;
  onSelectModule?: (module: SystemModule) => void;
  onBackToStartup?: () => void;
}

export function LoginScreen({ 
  users, 
  onLoginSuccess, 
  onLogFailedAttempt,
  currentModule = 'espetos',
  onSelectModule,
  onBackToStartup
}: LoginScreenProps) {
  const activeUsers = users.filter((u) => u.status === 'ativo');
  
  // Default to first active user or null
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(() => activeUsers[0] || null);
  const [pinCode, setPinCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Allow physical keyboard typing of numbers & backspace/enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading || showHelpModal) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handlePinKeyClick(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handlePinBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handlePinClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handlePinSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinCode, selectedUser, isLoading, showHelpModal]);

  // Handle Numeric Key Click
  const handlePinKeyClick = (digit: string) => {
    if (pinCode.length < 6) {
      const nextPin = pinCode + digit;
      setPinCode(nextPin);
      setErrorMessage(null);

      // Auto-validate if operator is selected and pin reaches their pin length (usually 4 digits)
      if (selectedUser) {
        const targetPin = selectedUser.pin || '1234';
        if (nextPin === targetPin || nextPin === selectedUser.password) {
          setIsLoading(true);
          setTimeout(() => {
            setIsLoading(false);
            onLoginSuccess(selectedUser, rememberMe);
          }, 220);
        } else if (nextPin.length >= targetPin.length) {
          setErrorMessage(`PIN incorreto para ${selectedUser.name.split(' ')[0]}. Tente novamente.`);
          onLogFailedAttempt?.(selectedUser.email, 'PIN incorreto digitado');
          // Clear pin after brief shake
          setTimeout(() => {
            setPinCode('');
          }, 600);
        }
      }
    }
  };

  const handlePinBackspace = () => {
    setPinCode((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handlePinClear = () => {
    setPinCode('');
    setErrorMessage(null);
  };

  const handlePinSubmit = () => {
    if (!selectedUser) {
      setErrorMessage('Selecione um operador antes de digitar o PIN.');
      return;
    }
    if (!pinCode) {
      setErrorMessage('Digite o PIN de 4 dígitos do operador.');
      return;
    }

    const targetPin = selectedUser.pin || '1234';
    if (selectedUser.pin === pinCode || selectedUser.password === pinCode) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(selectedUser, rememberMe);
      }, 200);
    } else {
      setErrorMessage(`PIN incorreto para ${selectedUser.name}.`);
      onLogFailedAttempt?.(selectedUser.email, 'PIN incorreto');
      setPinCode('');
    }
  };

  // Direct 1-click fast login for demonstration
  const handleQuickLogin = (user: AppUser) => {
    setSelectedUser(user);
    setPinCode(user.pin);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(user, rememberMe);
    }, 250);
  };

  const currentRoleCfg = selectedUser ? ROLE_CONFIG[selectedUser.role] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          {onBackToStartup && (
            <button
              id="login-btn-back-startup"
              type="button"
              onClick={onBackToStartup}
              className="mr-1 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center gap-1.5 text-xs font-bold transition cursor-pointer"
              title="Voltar para seleção de sistemas"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Sistemas</span>
            </button>
          )}

          <div className={`w-10 h-10 rounded-xl p-0.5 shadow-lg flex items-center justify-center ${
            currentModule === 'marmitaria'
              ? 'bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 shadow-orange-900/30'
              : 'bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 shadow-red-900/30'
          }`}>
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              {currentModule === 'marmitaria' ? (
                <ChefHat className="w-5 h-5 text-orange-400" />
              ) : (
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-lg font-black tracking-tight bg-clip-text text-transparent ${
                currentModule === 'marmitaria'
                  ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300'
                  : 'bg-gradient-to-r from-red-400 via-orange-400 to-amber-300'
              }`}>
                {currentModule === 'marmitaria' ? 'MARMITARIAPRO' : 'ESPETOPRO'}
              </span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase border ${
                currentModule === 'marmitaria'
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                {currentModule === 'marmitaria' ? 'MARMITEX & KDS' : 'POS TOUCH v2.5'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              {currentModule === 'marmitaria' 
                ? 'Acesso Rápido ao Sistema de Marmitas'
                : 'Acesso Rápido por PIN de Terminal'}
            </p>
          </div>
        </div>

        {/* System Selector Switch & Help */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {onSelectModule && (
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => onSelectModule('espetos')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  currentModule === 'espetos'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Espetos</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectModule('marmitaria')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  currentModule === 'marmitaria'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Marmitaria</span>
              </button>
            </div>
          )}

          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Terminal Seguro</span>
          </div>
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Ver PINs Padrão</span>
          </button>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          
          {/* Left Column: Operator Selection & PIN Keypad */}
          <div className="lg:col-span-7 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Operator Carousel / Grid */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Selecione o Operador</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Toque para trocar</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeUsers.map((user) => {
                    const isChosen = selectedUser?.id === user.id;
                    const roleLabel = ROLE_CONFIG[user.role]?.label.split(' ')[0] || user.role;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setPinCode('');
                          setErrorMessage(null);
                        }}
                        className={`p-2.5 rounded-2xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                          isChosen
                            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/70 ring-2 ring-amber-500/40 shadow-lg shadow-amber-950/30'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={user.name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                          />
                          {isChosen && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full ring-2 ring-slate-900 flex items-center justify-center">
                              <span className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{user.name.split(' ')[0]}</p>
                          <p className="text-[10px] text-amber-400 font-semibold truncate capitalize">{roleLabel}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PIN Keypad Section */}
              <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-4 sm:p-5">
                {/* Active Operator Banner */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs border border-amber-500/30">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {selectedUser ? selectedUser.name : 'Selecione um Operador'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {currentRoleCfg?.label || 'Aguardando seleção'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    PIN (4 Dígitos)
                  </span>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-3 p-2.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-semibold">{errorMessage}</span>
                  </div>
                )}

                {/* PIN Dots Display */}
                <div className="py-2 mb-3 flex items-center justify-center space-x-3.5 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = idx < pinCode.length;
                    return (
                      <div
                        key={idx}
                        className={`transition-all duration-200 ${
                          isFilled
                            ? 'w-4 h-4 rounded-full bg-amber-400 ring-4 ring-amber-400/25 scale-110'
                            : 'w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-700'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Touch Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Limpar', '0', '⌫'].map((key) => {
                    if (key === 'Limpar') {
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={handlePinClear}
                          disabled={isLoading || pinCode.length === 0}
                          className="py-3 sm:py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-40"
                        >
                          Limpar
                        </button>
                      );
                    }
                    if (key === '⌫') {
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={handlePinBackspace}
                          disabled={isLoading || pinCode.length === 0}
                          className="py-3 sm:py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-40 flex items-center justify-center"
                        >
                          Apagar
                        </button>
                      );
                    }
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handlePinKeyClick(key)}
                        disabled={isLoading}
                        className="py-3 sm:py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-lg sm:text-xl font-black text-white transition cursor-pointer active:scale-95 shadow-xs"
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handlePinSubmit}
                  disabled={isLoading || !selectedUser || pinCode.length === 0}
                  className="w-full py-3.5 mt-3 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-950/40 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 active:scale-[0.99]"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Acessar Terminal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom info */}
            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Auditoria e controle de acesso ativo</span>
              </span>
              <span>Suporte a teclado numérico físico</span>
            </div>
          </div>

          {/* Right Column: Quick Demo Access Cards & Team Selector */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            {/* Quick Demo Operators Panel */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">
                    Acesso Rápido de Teste
                  </h2>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  PIN 4 Dígitos
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Clique em <b>Entrar</b> para autenticar instantaneamente com o perfil selecionado:
              </p>

              <div className="space-y-2.5">
                {users.map((user) => {
                  const roleCfg = ROLE_CONFIG[user.role];
                  const isSelected = selectedUser?.id === user.id;
                  return (
                    <div
                      key={user.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                        isSelected 
                          ? 'bg-slate-950 border-amber-500/40 ring-1 ring-amber-500/20' 
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={user.name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 shrink-0 group-hover:ring-amber-400 transition"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-white truncate">{user.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="text-amber-400 font-medium">{roleCfg?.label.split(' ')[0]}</span>
                            <span>•</span>
                            <span className="font-mono text-emerald-400 font-bold">PIN: {user.pin}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickLogin(user)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-gradient-to-r hover:from-red-600 hover:to-amber-600 text-slate-200 hover:text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center space-x-1 active:scale-95"
                      >
                        <span>Entrar</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Highlights card */}
            <div className="bg-gradient-to-br from-red-950/40 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl p-5 text-xs text-slate-300">
              <div className="flex items-center space-x-2 text-amber-400 font-bold mb-1.5">
                <UtensilsCrossed className="w-4 h-4" />
                <span>EspetoPro PDV & Gestão</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Frente de Caixa (POS), Cardápio, Cozinha KDS, Controle de Estoque, Caixa e Auditoria de Operadores.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-xs text-slate-500 border-t border-slate-900">
        <p>© 2026 EspetoPro - Sistema de Ponto de Venda & Gestão. Todos os direitos reservados.</p>
      </footer>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <span>PINs dos Operadores</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Digite o PIN numérico correspondente ao seu operador para liberar o terminal:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-purple-400 block">👑 Felipe Silva (Administrador)</span>
                  <p className="text-slate-400 text-[11px]">Acesso irrestrito a todos os módulos</p>
                </div>
                <span className="font-mono text-base font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                  1234
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-400 block">💼 Mariana Santos (Gerente Geral)</span>
                  <p className="text-slate-400 text-[11px]">Gestão de cardápio, relatórios e estoque</p>
                </div>
                <span className="font-mono text-base font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                  4321
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-400 block">💰 Carlos Eduardo (Operador de Caixa)</span>
                  <p className="text-slate-400 text-[11px]">Frente de caixa, pedidos e recebimentos</p>
                </div>
                <span className="font-mono text-base font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                  2580
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-orange-400 block">🔥 Zeca da Parrilla (Churrasqueiro)</span>
                  <p className="text-slate-400 text-[11px]">Visualização e despacho na Cozinha KDS</p>
                </div>
                <span className="font-mono text-base font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                  9988
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-yellow-400 block">🍽️ Lucas Atendente (Garçom / Salão)</span>
                  <p className="text-slate-400 text-[11px]">Abertura de comandas e mesas</p>
                </div>
                <span className="font-mono text-base font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                  1122
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full mt-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
