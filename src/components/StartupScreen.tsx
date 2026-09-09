import React from 'react';
import { SystemModule, AppUser, ROLE_CONFIG } from '../types';
import { 
  Flame, ChefHat, Sparkles, ArrowRight, 
  CheckCircle2, UtensilsCrossed, Package, 
  Clock, DollarSign, Users, LogOut, ChevronRight,
  ShieldCheck, Smartphone, Printer, Store
} from 'lucide-react';

interface StartupScreenProps {
  currentUser: AppUser;
  activeOrdersCount: number;
  marmitaOrdersCount: number;
  onSelectSystem: (module: SystemModule, rememberChoice: boolean) => void;
  onLogout?: () => void;
}

export const StartupScreen: React.FC<StartupScreenProps> = ({
  currentUser,
  activeOrdersCount,
  marmitaOrdersCount,
  onSelectSystem,
  onLogout
}) => {
  const [rememberChoice, setRememberChoice] = React.useState<boolean>(false);

  // Keyboard shortcuts (1 for Espetos, 2 for Marmitaria)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') {
        onSelectSystem('espetos', rememberChoice);
      } else if (e.key === '2') {
        onSelectSystem('marmitaria', rememberChoice);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectSystem, rememberChoice]);

  return (
    <div id="startup-screen-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar / Brand & Operator Info */}
      <header className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              Gastro<span className="text-amber-400">Pro</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Hub Multi-Sistemas
              </span>
            </h1>
            <p className="text-xs text-slate-400">Gestão Gastronômica Integrada</p>
          </div>
        </div>

        {/* Current Operator Badge & Logout */}
        <div className="flex items-center space-x-2.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-2xl backdrop-blur-md">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-white leading-tight">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400">{ROLE_CONFIG[currentUser.role]?.label || currentUser.role}</p>
          </div>
          {onLogout && (
            <button
              id="startup-logout-button"
              type="button"
              onClick={onLogout}
              title="Trocar operador / Sair"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Choice Section */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 z-10 flex flex-col items-center justify-center flex-1">
        {/* Intro heading */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inicialização do Ponto de Atendimento</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Qual sistema você deseja iniciar?
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Selecione o módulo de trabalho. Você pode alternar entre os sistemas a qualquer momento pela barra superior.
          </p>
        </div>

        {/* 2 Big Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 w-full">
          {/* Card 1: Sistema EspetoPro */}
          <div 
            id="card-select-espetos"
            onClick={() => onSelectSystem('espetos', rememberChoice)}
            className="group relative bg-slate-900/90 hover:bg-slate-900 border-2 border-slate-800 hover:border-red-500/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 hover:shadow-2xl hover:shadow-red-950/40 cursor-pointer active:scale-[0.99]"
          >
            {/* Shortcut chip */}
            <div className="absolute top-5 right-5 flex items-center space-x-1.5">
              <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-800 group-hover:bg-red-500/20 group-hover:text-red-300 text-slate-400 text-[11px] font-mono font-bold rounded-lg border border-slate-700 group-hover:border-red-500/40 transition">
                Atalho: [1]
              </span>
            </div>

            <div className="space-y-5">
              {/* Icon & Title */}
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-105 group-hover:bg-red-500 group-hover:text-white transition-all duration-200 shadow-md">
                  <Flame className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1">
                    Grelha & Bar
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-red-400 transition-colors">
                    Sistema EspetoPro
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Gestão completa de espetinhos na brasa, ponto da carne, controle de mesas e comandas, frente de caixa POS, estoque de insumos e relatórios de faturamento.
              </p>

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>Cardápio & Espetos</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                  <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span>KDS Grelha & Ponto</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Frente de Caixa (POS)</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                  <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Estoque & Comandas</span>
                </div>
              </div>
            </div>

            {/* Bottom Status & CTA */}
            <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                {activeOrdersCount > 0 ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    {activeOrdersCount} pedidos em aberto
                  </span>
                ) : (
                  <span className="text-slate-500">Pronto para operação</span>
                )}
              </div>

              <button
                id="btn-iniciar-espetos"
                type="button"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 group-hover:bg-red-500 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-red-600/30 group-hover:shadow-red-500/50 cursor-pointer"
              >
                <span>Iniciar EspetoPro</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Card 2: Sistema Marmitaria */}
          <div 
            id="card-select-marmitaria"
            onClick={() => onSelectSystem('marmitaria', rememberChoice)}
            className="group relative bg-slate-900/90 hover:bg-slate-900 border-2 border-slate-800 hover:border-orange-500/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 hover:shadow-2xl hover:shadow-orange-950/40 cursor-pointer active:scale-[0.99]"
          >
            {/* Shortcut chip */}
            <div className="absolute top-5 right-5 flex items-center space-x-1.5">
              <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-800 group-hover:bg-orange-500/20 group-hover:text-orange-300 text-slate-400 text-[11px] font-mono font-bold rounded-lg border border-slate-700 group-hover:border-orange-500/40 transition">
                Atalho: [2]
              </span>
            </div>

            <div className="space-y-5">
              {/* Icon & Title */}
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white transition-all duration-200 shadow-md">
                  <ChefHat className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1">
                    Marmitex & Delivery
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-orange-400 transition-colors">
                    Sistema Marmitaria
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                PDV ultrarrápido de montagem de marmitas (P, M, G, Executiva), carnes do dia, feijão, arroz, guarnições, KDS de linha de montagem, despacho e gestão de entregadores.
              </p>

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                  <ChefHat className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span>Montagem P, M, G & Exec.</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>KDS Cozinha & Expedição</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                  <Printer className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Comprovante Térmico 80/58</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Delivery, Balcão & Motoboy</span>
                </div>
              </div>
            </div>

            {/* Bottom Status & CTA */}
            <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                {marmitaOrdersCount > 0 ? (
                  <span className="text-orange-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    {marmitaOrdersCount} marmitas em produção
                  </span>
                ) : (
                  <span className="text-slate-500">Pronto para montagem</span>
                )}
              </div>

              <button
                id="btn-iniciar-marmitaria"
                type="button"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-orange-600 group-hover:bg-orange-500 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-orange-600/30 group-hover:shadow-orange-500/50 cursor-pointer"
              >
                <span>Iniciar Marmitaria</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Helper bottom options */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-2xl bg-slate-900/60 border border-slate-800/80 px-4 py-3 rounded-2xl text-xs text-slate-400">
          <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-300 transition">
            <input 
              id="chk-remember-system"
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 cursor-pointer"
            />
            <span>Lembrar minha escolha nas próximas inicializações</span>
          </label>

          <span className="flex items-center gap-1 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Alterne a qualquer momento pelo topo</span>
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-4 py-4 text-center text-xs text-slate-500 z-10 border-t border-slate-900">
        GastroPro Sistema Gastronômico Inteligente • Espetos, Marmitex, Delivery & Frente de Caixa Integrada
      </footer>
    </div>
  );
};
