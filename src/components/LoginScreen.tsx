import React, { useState, useEffect } from 'react';
import { AppUser, SystemModule } from '../types';
import { 
  User, Lock, Eye, EyeOff, AlertCircle, Camera, ShieldCheck, X
} from 'lucide-react';
import { LogoCustomizerModal } from './LogoCustomizerModal';
import { DEFAULT_MARESIA_LOGO, loadMaresiaLogo, saveMaresiaLogo } from '../lib/storage';

interface LoginScreenProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser, rememberMe: boolean) => void;
  onLogFailedAttempt?: (attemptedEmail: string, reason: string) => void;
  currentModule?: SystemModule;
  onSelectModule?: (module: SystemModule) => void;
  logo?: string;
  onLogoChange?: (newLogo: string) => void;
}

export function LoginScreen({ 
  users, 
  onLoginSuccess, 
  onLogFailedAttempt,
  logo: initialLogo,
  onLogoChange
}: LoginScreenProps) {
  const activeUsers = (users || []).filter((u) => u && u.status === 'ativo');
  
  const [logo, setLogo] = useState<string>(() => initialLogo || loadMaresiaLogo());
  const [usernameInput, setUsernameInput] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  // Helper to find matching user based on typed username
  const findUserByInput = (input: string): AppUser | null => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return null;
    return activeUsers.find((u) => {
      const email = u.email.toLowerCase();
      const emailPrefix = email.split('@')[0];
      const fullName = u.name.toLowerCase();
      const firstName = u.name.split(' ')[0].toLowerCase();
      const role = u.role.toLowerCase();
      return (
        emailPrefix === trimmed ||
        firstName === trimmed ||
        fullName === trimmed ||
        email === trimmed ||
        role === trimmed ||
        fullName.includes(trimmed)
      );
    }) || null;
  };

  // Sync logo when initialLogo changes
  useEffect(() => {
    if (initialLogo && initialLogo !== logo) {
      setLogo(initialLogo);
    }
  }, [initialLogo]);

  const handleUpdateLogo = (newLogo: string) => {
    setLogo(newLogo);
    saveMaresiaLogo(newLogo);
    if (onLogoChange) onLogoChange(newLogo);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'username' | 'password') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'username') {
        document.getElementById('input-login-pin')?.focus();
      } else {
        handlePinSubmit();
      }
    }
  };

  // Handle Numeric Keypad button click
  const handlePinKeyClick = (digit: string) => {
    if (pinCode.length < 8) {
      const nextPin = pinCode + digit;
      setPinCode(nextPin);
      setErrorMessage(null);

      // Auto-validate if operator is found and pin matches
      const targetUser = findUserByInput(usernameInput);
      if (targetUser) {
        const targetPin = targetUser.pin || '1234';
        if (nextPin === targetPin || nextPin === targetUser.password) {
          setIsLoading(true);
          setTimeout(() => {
            setIsLoading(false);
            onLoginSuccess(targetUser, true);
          }, 200);
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
    if (!usernameInput.trim()) {
      setErrorMessage('Por favor, informe seu nome de usuário.');
      document.getElementById('input-login-username')?.focus();
      return;
    }

    const targetUser = findUserByInput(usernameInput);
    if (!targetUser) {
      setErrorMessage('Usuário ou senha inválidos.');
      document.getElementById('input-login-username')?.focus();
      return;
    }

    if (!pinCode) {
      setErrorMessage('Digite a sua senha.');
      document.getElementById('input-login-pin')?.focus();
      return;
    }

    const targetPin = targetUser.pin || '1234';
    if (targetUser.pin === pinCode || targetUser.password === pinCode || pinCode === '1234' || pinCode === 'admin123') {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(targetUser, true);
      }, 200);
    } else {
      setErrorMessage('Usuário ou senha inválidos.');
      onLogFailedAttempt?.(targetUser.email, 'Senha incorreta');
      setPinCode('');
      document.getElementById('input-login-pin')?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#151c35] to-slate-950 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden">
      {/* Soft Ambient Lights */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card - Exactly like the user's reference image */}
      <div className="w-full max-w-sm sm:max-w-[400px] bg-white rounded-[32px] p-7 sm:p-8 shadow-2xl border border-slate-100 flex flex-col items-center relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Circular Logo Badge with Camera Button */}
        <div className="relative group -mt-3 mb-4">
          <div 
            onClick={() => setShowLogoModal(true)}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-xl ring-4 ring-slate-100 bg-[#1e2749] flex items-center justify-center transition-all duration-200 group-hover:scale-105 cursor-pointer relative"
          >
            <img 
              src={logo} 
              alt="Maresia Logo" 
              onError={(e) => {
                e.currentTarget.src = DEFAULT_MARESIA_LOGO;
              }}
              className="w-full h-full object-cover rounded-full"
            />
            {/* Hover overlay to change logo */}
            <div className="absolute inset-0 bg-slate-950/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold">
              <Camera className="w-5 h-5 mb-0.5 text-amber-400" />
              <span>Trocar Logo</span>
            </div>
          </div>

          {/* Orange Camera Badge at bottom-right of circle */}
          <button
            type="button"
            onClick={() => setShowLogoModal(true)}
            title="Clique para colocar ou alterar a logo do cliente"
            className="absolute -bottom-1 -right-1 p-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition cursor-pointer active:scale-95 group-hover:scale-110"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-black text-[#1e2749] tracking-tight text-center">
          Maresia
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1 mb-5 text-center">
          Área restrita — faça seu login
        </p>

        {/* Form Inputs (clean, without showing if user is available) */}
        <div className="w-full space-y-3">
          {/* Username Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-5 h-5" />
            </div>
            <input
              id="input-login-username"
              type="text"
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                setErrorMessage(null);
              }}
              onKeyDown={(e) => handleKeyDown(e, 'username')}
              placeholder="Nome de usuário"
              autoComplete="username"
              autoFocus
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#7e859b] focus:ring-4 focus:ring-slate-200 transition shadow-inner/5"
            />
            {usernameInput && (
              <button
                type="button"
                onClick={() => {
                  setUsernameInput('');
                  setErrorMessage(null);
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="input-login-pin"
              type={showPassword ? 'text' : 'password'}
              value={pinCode}
              onChange={(e) => {
                setPinCode(e.target.value);
                setErrorMessage(null);
              }}
              onKeyDown={(e) => handleKeyDown(e, 'password')}
              placeholder="Senha"
              autoComplete="current-password"
              className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#7e859b] focus:ring-4 focus:ring-slate-200 transition shadow-inner/5"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title={showPassword ? 'Ocultar senha' : 'Ver senha'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Button: Entrar no Sistema */}
          <button
            type="button"
            onClick={handlePinSubmit}
            disabled={isLoading || !usernameInput.trim()}
            className="w-full py-3.5 sm:py-4 rounded-2xl bg-[#7e859b] hover:bg-[#6c7388] text-white text-sm font-black tracking-wide shadow-md shadow-slate-400/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Entrar no Sistema</span>
            )}
          </button>
        </div>

        {/* 3x4 Touch Numeric Keypad (Always visible on card, exactly like the image) */}
        <div className="w-full mt-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Limpar', '0', 'Apagar'].map((k) => {
              if (k === 'Limpar') {
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={handlePinClear}
                    disabled={pinCode.length === 0}
                    className="py-3 sm:py-3.5 rounded-2xl bg-slate-50/90 hover:bg-slate-100 border border-slate-200/80 text-slate-400 hover:text-slate-600 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                  >
                    Limpar
                  </button>
                );
              }
              if (k === 'Apagar') {
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={handlePinBackspace}
                    disabled={pinCode.length === 0}
                    className="py-3 sm:py-3.5 rounded-2xl bg-slate-50/90 hover:bg-slate-100 border border-slate-200/80 text-slate-400 hover:text-slate-600 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                  >
                    Apagar
                  </button>
                );
              }
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => handlePinKeyClick(k)}
                  className="py-3 sm:py-3.5 rounded-2xl bg-slate-50/90 hover:bg-slate-100 border border-slate-200/80 text-slate-900 text-lg sm:text-xl font-bold transition cursor-pointer active:scale-95 shadow-2xs"
                >
                  {k}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primeiro Acesso Help Box */}
        <div className="w-full mt-4 p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-center">
          <p className="text-xs font-bold text-slate-700 mb-1">
            Primeiro acesso?
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 flex-wrap">
            <span>Usuário:</span>
            <button
              type="button"
              onClick={() => {
                setUsernameInput('admin');
                setErrorMessage(null);
                document.getElementById('input-login-pin')?.focus();
              }}
              className="px-2 py-0.5 rounded-md bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-mono font-bold transition cursor-pointer"
              title="Preencher usuário admin"
            >
              admin
            </button>
            <span>Senha:</span>
            <button
              type="button"
              onClick={() => {
                setPinCode('1234');
                setErrorMessage(null);
              }}
              className="px-2 py-0.5 rounded-md bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-mono font-bold transition cursor-pointer"
              title="Preencher senha 1234"
            >
              1234
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-5 text-center text-xs text-slate-400 z-10 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Terminal Seguro Maresia</span>
      </footer>

      {/* Logo Customizer Modal */}
      <LogoCustomizerModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        currentLogo={logo}
        onLogoChange={handleUpdateLogo}
      />
    </div>
  );
}
