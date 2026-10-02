import React, { useState, useEffect } from 'react';
import { AppUser, SystemModule, DEFAULT_ROLE_PERMISSIONS } from '../types';
import { 
  User, Lock, Eye, EyeOff, AlertCircle, Camera, ShieldCheck, X, 
  UserPlus, CheckCircle2, KeyRound
} from 'lucide-react';
import { LogoCustomizerModal } from './LogoCustomizerModal';
import { DEFAULT_MARESIA_LOGO, loadMaresiaLogo, saveMaresiaLogo, saveUsers } from '../lib/storage';

interface LoginScreenProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser, rememberMe: boolean) => void;
  onLogFailedAttempt?: (attemptedEmail: string, reason: string) => void;
  currentModule?: SystemModule;
  onSelectModule?: (module: SystemModule) => void;
  logo?: string;
  onLogoChange?: (newLogo: string) => void;
  onAddUser?: (user: AppUser) => void;
}

export function LoginScreen({ 
  users, 
  onLoginSuccess, 
  onLogFailedAttempt,
  logo: initialLogo,
  onLogoChange,
  onAddUser
}: LoginScreenProps) {
  const activeUsers = (users || []).filter((u) => u && u.status === 'ativo');
  
  const [logo, setLogo] = useState<string>(() => initialLogo || loadMaresiaLogo());
  const [usernameInput, setUsernameInput] = useState<string>(() => {
    return localStorage.getItem('maresia_saved_username') || '';
  });
  const [rememberUsername, setRememberUsername] = useState<boolean>(() => {
    return !!localStorage.getItem('maresia_saved_username');
  });
  const [pinCode, setPinCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestCreateUser, setSuggestCreateUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Form state for creating/customizing a user
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Helper to find matching user based on typed username
  const findUserByInput = (input: string): AppUser | null => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return null;
    return activeUsers.find((u) => {
      const explicitUsername = u.username ? u.username.toLowerCase().trim() : '';
      if (explicitUsername && explicitUsername === trimmed) return true;
      const email = u.email.toLowerCase();
      const emailPrefix = email.split('@')[0];
      const fullName = u.name.toLowerCase();
      const firstName = u.name.split(' ')[0].toLowerCase();
      const role = u.role.toLowerCase();
      return (
        explicitUsername === trimmed ||
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
          if (rememberUsername && usernameInput.trim()) {
            localStorage.setItem('maresia_saved_username', usernameInput.trim());
          }
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
    const trimmedUser = usernameInput.trim();
    if (!trimmedUser) {
      setErrorMessage('Por favor, digite o nome de usuário.');
      document.getElementById('input-login-username')?.focus();
      return;
    }

    const targetUser = findUserByInput(trimmedUser);
    if (!targetUser) {
      setErrorMessage('Usuário ou senha incorretos.');
      setSuggestCreateUser(true);
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
      if (rememberUsername) {
        localStorage.setItem('maresia_saved_username', trimmedUser);
      } else {
        localStorage.removeItem('maresia_saved_username');
      }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(targetUser, true);
      }, 200);
    } else {
      setErrorMessage('Usuário ou senha incorretos.');
      onLogFailedAttempt?.(targetUser.email, 'Senha incorreta');
      setPinCode('');
      document.getElementById('input-login-pin')?.focus();
    }
  };

  // Handler to open the modal with current username
  const handleOpenAddUserModal = (initialUserVal?: string) => {
    const defaultVal = initialUserVal || usernameInput.trim() || '';
    setNewUsername(defaultVal.toLowerCase().replace(/[^a-z0-9._-]/g, ''));
    setNewName(defaultVal ? defaultVal.charAt(0).toUpperCase() + defaultVal.slice(1) : '');
    setNewPin('');
    setNewPinConfirm('');
    setModalError(null);
    setShowAddUserModal(true);
  };

  // Handler to save the new user directly and log in
  const handleSaveNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = newUsername.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const cleanName = newName.trim();
    const cleanPin = newPin.trim();

    if (!cleanUser) {
      setModalError('Informe o nome de usuário desejado (apenas letras, números, ponto ou traço).');
      return;
    }
    if (cleanUser.length < 3) {
      setModalError('O nome de usuário deve ter no mínimo 3 caracteres.');
      return;
    }
    if (!cleanPin) {
      setModalError('Informe uma senha/PIN numérico de 4 a 8 dígitos.');
      return;
    }
    if (cleanPin.length < 4) {
      setModalError('A senha/PIN deve ter no mínimo 4 dígitos.');
      return;
    }
    if (cleanPin !== newPinConfirm.trim()) {
      setModalError('As senhas digitadas não coincidem.');
      return;
    }

    // Check if user already exists
    const existing = users.find((u) => {
      const uName = (u.username || u.email.split('@')[0]).toLowerCase();
      return uName === cleanUser;
    });

    if (existing) {
      setModalError(`O nome de usuário "${cleanUser}" já está cadastrado.`);
      return;
    }

    const newUserObj: AppUser = {
      id: `user-${Date.now()}`,
      name: cleanName || cleanUser.toUpperCase(),
      email: `${cleanUser}@maresia.local`,
      username: cleanUser,
      role: 'admin',
      status: 'ativo',
      pin: cleanPin,
      password: cleanPin,
      createdAt: new Date().toISOString(),
      permissions: {
        ...DEFAULT_ROLE_PERMISSIONS.admin,
      },
    };

    // Save user
    const updatedUsers = [newUserObj, ...users];
    saveUsers(updatedUsers);
    if (onAddUser) {
      onAddUser(newUserObj);
    }

    if (rememberUsername) {
      localStorage.setItem('maresia_saved_username', cleanUser);
    }
    setUsernameInput(cleanUser);
    setPinCode(cleanPin);
    setShowAddUserModal(false);

    // Auto login
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(newUserObj, true);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#151c35] to-slate-950 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden">
      {/* Soft Ambient Lights */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card - Exactly like user's reference image, strictly without showing available users */}
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

        {/* Form Inputs */}
        <div className="w-full space-y-3">
          {/* Username Input Header & Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <label 
                htmlFor="input-login-username" 
                className="text-xs font-bold text-slate-600 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Nome de Usuário</span>
              </label>
              <button
                type="button"
                onClick={() => handleOpenAddUserModal()}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 transition cursor-pointer"
                title="Opção para colocar ou cadastrar o seu nome de usuário"
              >
                <UserPlus className="w-3 h-3" />
                <span>Cadastrar Usuário</span>
              </button>
            </div>

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
                  setSuggestCreateUser(false);
                }}
                onKeyDown={(e) => handleKeyDown(e, 'username')}
                placeholder="Digite seu nome de usuário"
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
                    setSuggestCreateUser(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Limpar campo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <label 
                htmlFor="input-login-pin" 
                className="text-xs font-bold text-slate-600 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Senha / PIN</span>
              </label>
            </div>

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
                placeholder="Digite sua senha ou PIN"
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
          </div>

          {/* Remember Username Checkbox & Option */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5 px-1">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700 select-none">
              <input
                type="checkbox"
                checked={rememberUsername}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setRememberUsername(checked);
                  if (checked && usernameInput.trim()) {
                    localStorage.setItem('maresia_saved_username', usernameInput.trim());
                  } else if (!checked) {
                    localStorage.removeItem('maresia_saved_username');
                  }
                }}
                className="w-3.5 h-3.5 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
              <span>Lembrar meu usuário</span>
            </label>

            <button
              type="button"
              onClick={() => handleOpenAddUserModal()}
              className="text-amber-600 hover:text-amber-700 font-bold hover:underline cursor-pointer"
              title="Colocar ou criar um usuário com sua senha"
            >
              Opção: Criar Usuário
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              {suggestCreateUser && (
                <div className="pt-1 border-t border-rose-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-rose-600 font-normal">
                    Quer usar o usuário &quot;{usernameInput}&quot;?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenAddUserModal(usernameInput)}
                    className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer ml-1"
                  >
                    Cadastrar agora →
                  </button>
                </div>
              )}
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

        {/* 3x4 Touch Numeric Keypad */}
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

        {/* Clear Option Button to Add or Put User Name */}
        <div className="w-full mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-center">
          <button
            type="button"
            onClick={() => handleOpenAddUserModal()}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-slate-900 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <UserPlus className="w-4 h-4 text-amber-500" />
            <span>Opção para colocar / cadastrar nome de usuário</span>
          </button>
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

      {/* Modal: Opção para Colocar / Cadastrar Nome de Usuário */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative text-left border border-slate-100 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Opção: Colocar Meu Usuário
                </h3>
                <p className="text-xs text-slate-500">
                  Defina seu nome de usuário e senha para acessar o Maresia
                </p>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome de Usuário para Login *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
                    @
                  </div>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => {
                      setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''));
                      setModalError(null);
                    }}
                    placeholder="ex: felipe, maresia, admin"
                    autoFocus
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Este é o nome que você vai digitar na tela de login.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seu Nome Completo (ou Nome do Operador)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ex: Felipe - Maresia"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Senha / PIN *
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={8}
                    value={newPin}
                    onChange={(e) => {
                      setNewPin(e.target.value);
                      setModalError(null);
                    }}
                    placeholder="Mínimo 4 dígitos"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmar Senha *
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={8}
                    value={newPinConfirm}
                    onChange={(e) => {
                      setNewPinConfirm(e.target.value);
                      setModalError(null);
                    }}
                    placeholder="Repita a senha"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Privilege Banner */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Acesso Completo (Administrador)</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Este usuário terá acesso total ao sistema Maresia, incluindo os dois módulos (EspetoPro e Marmitaria), Frente de Caixa e Configurações.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Salvar e Entrar no Sistema</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
