import React, { useState } from 'react';
import { AppUser, SystemPermission, TabType, PERMISSION_DEFINITIONS, ROLE_CONFIG, hasPermission } from '../types';
import { ShieldAlert, Lock, ArrowLeft, KeyRound, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';

interface AccessDeniedViewProps {
  currentUser: AppUser;
  requiredPermission: SystemPermission;
  tabTitle: string;
  onNavigateToDefaultTab: () => void;
  onLogout: () => void;
  users: AppUser[];
  onAuthorizeSupervisor?: (adminUser: AppUser) => void;
}

export function AccessDeniedView({
  currentUser,
  requiredPermission,
  tabTitle,
  onNavigateToDefaultTab,
  onLogout,
  users,
  onAuthorizeSupervisor,
}: AccessDeniedViewProps) {
  const permDef = PERMISSION_DEFINITIONS.find((p) => p.key === requiredPermission);
  const roleCfg = ROLE_CONFIG[currentUser.role];

  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [supervisorPin, setSupervisorPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSupervisorAuth = () => {
    // Find any active admin or manager who has this permission
    const authorizedUser = users.find(
      (u) =>
        u.status === 'ativo' &&
        hasPermission(u, requiredPermission) &&
        (u.pin === supervisorPin || u.password === supervisorPin)
    );

    if (authorizedUser) {
      if (onAuthorizeSupervisor) {
        onAuthorizeSupervisor(authorizedUser);
      }
      setIsSupervisorModalOpen(false);
    } else {
      setErrorMsg('PIN incorreto ou usuário não possui autorização para esta função.');
      setSupervisorPin('');
    }
  };

  return (
    <div className="w-full py-8 sm:py-16 px-4 flex items-center justify-center">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-600/15 rounded-full blur-2xl pointer-events-none" />

        {/* Lock Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-5 text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider border border-rose-500/30 inline-block mb-3">
          Acesso Restrito
        </span>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          Permissão Necessária: {tabTitle}
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
          O operador atual não possui a credencial de segurança 
          <strong className="text-amber-400"> "{permDef?.label || requiredPermission}"</strong> para acessar este módulo.
        </p>

        {/* Current Operator Card */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-left mb-6 flex items-center space-x-3">
          <img
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={currentUser.name}
            className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white truncate">{currentUser.name}</span>
            </div>
            <p className="text-xs text-amber-400 font-semibold">{roleCfg?.label || currentUser.role}</p>
            <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onNavigateToDefaultTab}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Módulo Liberado</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsSupervisorModalOpen(true)}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-700"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Liberar com PIN</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-700"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Trocar Operador</span>
            </button>
          </div>
        </div>

        {/* Supervisor PIN Modal */}
        {isSupervisorModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-left">
              <div className="flex items-center space-x-2 mb-3">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Autorização de Supervisor</h3>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Digite o PIN de 4 dígitos de um <b>Administrador</b> ou <b>Gerente</b> para autorizar esta ação:
              </p>

              {errorMsg && (
                <div className="mb-3 p-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="mb-4">
                <input
                  type="password"
                  maxLength={6}
                  value={supervisorPin}
                  onChange={(e) => {
                    setSupervisorPin(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="PIN do Administrador"
                  className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSupervisorModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSupervisorAuth}
                  disabled={supervisorPin.length === 0}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase rounded-xl transition cursor-pointer disabled:opacity-40"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
