import React from 'react';
import { SystemModule, AppUser, ROLE_CONFIG } from '../types';
import { Flame, ChefHat, Sparkles, CheckCircle2, ArrowRight, X, ShieldCheck } from 'lucide-react';

interface ModuleSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  activeModule: SystemModule;
  onSelectModule: (module: SystemModule) => void;
  marmitaOrdersCount?: number;
  espetoOrdersCount?: number;
}

export const ModuleSelectModal: React.FC<ModuleSelectModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeModule,
  onSelectModule,
  marmitaOrdersCount = 0,
  espetoOrdersCount = 0
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative text-left text-white space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seleção de Sistema & Módulo</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Qual sistema deseja operar agora?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Operador logado: <strong className="text-amber-400">{currentUser.name}</strong> ({ROLE_CONFIG[currentUser.role]?.label || currentUser.role})
          </p>
        </div>

        {/* Cards Option Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Espetos */}
          <button
            type="button"
            onClick={() => {
              onSelectModule('espetos');
              onClose();
            }}
            className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between group cursor-pointer active:scale-[0.98] ${
              activeModule === 'espetos'
                ? 'bg-gradient-to-b from-red-950/40 to-slate-900 border-red-500 ring-2 ring-red-500/40 shadow-xl shadow-red-950/30'
                : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            {activeModule === 'espetos' && (
              <div className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-1 shadow-md">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6 fill-red-500/20" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-white group-hover:text-red-400 transition-colors">
                  Sistema EspetoPro
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Gestão completa de espetinhos na brasa, ponto da carne, comanda de mesas, frente de caixa POS, estoque e relatórios.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="text-slate-400">
                {espetoOrdersCount > 0 ? `${espetoOrdersCount} pedidos ativos` : 'Pronto para uso'}
              </span>
              <span className="flex items-center space-x-1 text-red-400 group-hover:translate-x-1 transition-transform">
                <span>Entrar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>

          {/* Card 2: Marmitaria */}
          <button
            type="button"
            onClick={() => {
              onSelectModule('marmitaria');
              onClose();
            }}
            className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between group cursor-pointer active:scale-[0.98] ${
              activeModule === 'marmitaria'
                ? 'bg-gradient-to-b from-orange-950/40 to-slate-900 border-orange-500 ring-2 ring-orange-500/40 shadow-xl shadow-orange-950/30'
                : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            {activeModule === 'marmitaria' && (
              <div className="absolute top-4 right-4 bg-orange-500 text-white rounded-full p-1 shadow-md">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                <ChefHat className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-white group-hover:text-orange-400 transition-colors">
                  Sistema Marmitaria
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  PDV ágil de montagem de marmitas (P, M, G, Executiva), carnes do dia, feijão, arroz, guarnições, delivery & KDS.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="text-slate-400">
                {marmitaOrdersCount > 0 ? `${marmitaOrdersCount} marmitas em preparo` : 'Pronto para uso'}
              </span>
              <span className="flex items-center space-x-1 text-orange-400 group-hover:translate-x-1 transition-transform">
                <span>Entrar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>
        </div>

        {/* Footer info */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Você pode alternar entre os sistemas a qualquer momento pelo topo da barra.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
