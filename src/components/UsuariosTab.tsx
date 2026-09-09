import React, { useState, useMemo } from 'react';
import { 
  AppUser, UserRole, SystemPermission, 
  ROLE_CONFIG, DEFAULT_ROLE_PERMISSIONS, PERMISSION_DEFINITIONS, hasPermission 
} from '../types';
import { 
  Users, UserPlus, Shield, ShieldCheck, ShieldAlert, Key, 
  Search, Filter, Edit3, Trash2, Check, X, Eye, EyeOff, 
  Sparkles, CheckCircle2, XCircle, RefreshCw, UserCheck, 
  Lock, Unlock, Phone, Mail, Clock, HelpCircle, AlertTriangle,
  Flame, DollarSign, Package, BarChart3, UtensilsCrossed,
  ToggleLeft, ToggleRight, CheckSquare, Square, ChevronRight, Zap,
  FileText, Info, Award
} from 'lucide-react';

interface UsuariosTabProps {
  users: AppUser[];
  currentUser: AppUser;
  onAddUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => void;
  onUpdateUser: (user: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchCurrentUser: (user: AppUser) => void;
}

const AVATAR_SUGGESTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'
];

export const UsuariosTab: React.FC<UsuariosTabProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchCurrentUser,
}) => {
  // Check if current user has permission to manage users
  const isAdmin = currentUser.role === 'admin' || hasPermission(currentUser, 'manage_users');

  const [subTab, setSubTab] = useState<'colaboradores' | 'matriz' | 'seguranca'>('colaboradores');
  const [matrixMode, setMatrixMode] = useState<'colaboradores' | 'cargos'>('colaboradores');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  
  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Read-only Viewing Modal state
  const [viewingUser, setViewingUser] = useState<AppUser | null>(null);

  // Quick Permission Manager Modal for a single user (Admin only)
  const [quickPermUser, setQuickPermUser] = useState<AppUser | null>(null);
  
  // Quick switch PIN modal state
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [switchTargetUser, setSwitchTargetUser] = useState<AppUser | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    pin: string;
    avatar: string;
    status: 'ativo' | 'inativo';
    permissions: Record<SystemPermission, boolean>;
    customPermissionsEnabled: boolean;
  }>({
    name: '',
    email: '',
    phone: '',
    role: 'garcom',
    pin: '1234',
    avatar: AVATAR_SUGGESTIONS[0],
    status: 'ativo',
    permissions: { ...DEFAULT_ROLE_PERMISSIONS.garcom },
    customPermissionsEnabled: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  // Toggle PIN visibility for an item
  const togglePinVisibility = (userId: string) => {
    setVisiblePins((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Direct toggle permission for any user in real-time (Admin only)
  const handleDirectTogglePermission = (user: AppUser, permKey: SystemPermission) => {
    if (!isAdmin) {
      showToast('⚠️ Acesso restrito: Somente usuários Administradores podem alterar permissões.', 'warning');
      return;
    }

    const isCurrentlyActive = hasPermission(user, permKey);
    const permDef = PERMISSION_DEFINITIONS.find((p) => p.key === permKey);
    const basePerms = {
      ...(DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS.garcom),
      ...(user.permissions || {}),
    };

    const updatedPermissions = {
      ...basePerms,
      [permKey]: !isCurrentlyActive,
    };

    const updatedUser: AppUser = {
      ...user,
      permissions: updatedPermissions,
    };

    onUpdateUser(updatedUser);

    if (currentUser.id === user.id) {
      onSwitchCurrentUser(updatedUser);
    }

    if (!isCurrentlyActive) {
      showToast(`Permissão "${permDef?.label || permKey}" ATIVADA para ${user.name}!`, 'success');
    } else {
      showToast(`Permissão "${permDef?.label || permKey}" desativada para ${user.name}.`, 'info');
    }
  };

  // Direct bulk toggle all permissions for a user (Admin only)
  const handleBulkToggleUserPermissions = (user: AppUser, enableAll: boolean) => {
    if (!isAdmin) {
      showToast('⚠️ Acesso restrito: Somente usuários Administradores podem alterar permissões.', 'warning');
      return;
    }

    const basePerms = {
      ...(DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS.garcom),
      ...(user.permissions || {}),
    };
    const newPerms: Record<SystemPermission, boolean> = { ...basePerms };
    PERMISSION_DEFINITIONS.forEach((p) => {
      newPerms[p.key] = enableAll;
    });

    const updatedUser: AppUser = {
      ...user,
      permissions: newPerms,
    };

    onUpdateUser(updatedUser);

    if (currentUser.id === user.id) {
      onSwitchCurrentUser(updatedUser);
    }

    if (enableAll) {
      showToast(`Todas as permissões foram ATIVADAS para ${user.name}!`, 'success');
    } else {
      showToast(`Todas as permissões foram desativadas para ${user.name}.`, 'warning');
    }
  };

  // Restore default role permissions for a user (Admin only)
  const handleResetUserToRoleDefault = (user: AppUser) => {
    if (!isAdmin) {
      showToast('⚠️ Acesso restrito: Somente usuários Administradores podem restaurar permissões.', 'warning');
      return;
    }

    const updatedUser: AppUser = {
      ...user,
      permissions: { ...DEFAULT_ROLE_PERMISSIONS[user.role] },
    };

    onUpdateUser(updatedUser);

    if (currentUser.id === user.id) {
      onSwitchCurrentUser(updatedUser);
    }

    showToast(`Permissões de ${user.name} restauradas para o padrão de ${ROLE_CONFIG[user.role].label}.`, 'info');
  };

  // Open modal for Read-Only viewing
  const handleOpenViewUser = (user: AppUser) => {
    setViewingUser(user);
  };

  // Open modal for new user (Admin only)
  const handleOpenNewUser = () => {
    if (!isAdmin) {
      showToast('⚠️ Acesso restrito: Somente usuários Administradores podem cadastrar novos colaboradores.', 'warning');
      return;
    }

    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'garcom',
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      avatar: AVATAR_SUGGESTIONS[Math.floor(Math.random() * AVATAR_SUGGESTIONS.length)],
      status: 'ativo',
      permissions: { ...DEFAULT_ROLE_PERMISSIONS.garcom },
      customPermissionsEnabled: false,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open modal for editing user (Admin only, non-admin redirects to view mode)
  const handleOpenEditUser = (user: AppUser) => {
    if (!isAdmin) {
      showToast('ℹ️ Apenas Administradores podem editar. Abrindo ficha em modo de visualização...', 'info');
      handleOpenViewUser(user);
      return;
    }

    const basePerms: Record<SystemPermission, boolean> = {
      ...(DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS.garcom),
      ...(user.permissions || {}),
    };
    if (user.role === 'admin') {
      (Object.keys(DEFAULT_ROLE_PERMISSIONS.admin) as SystemPermission[]).forEach((k) => {
        basePerms[k] = true;
      });
    }

    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      pin: user.pin,
      avatar: user.avatar || AVATAR_SUGGESTIONS[0],
      status: user.status,
      permissions: basePerms,
      customPermissionsEnabled: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle role change in form
  const handleRoleChange = (newRole: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      permissions: { ...(DEFAULT_ROLE_PERMISSIONS[newRole] || DEFAULT_ROLE_PERMISSIONS.garcom) },
      customPermissionsEnabled: false,
    }));
  };

  // Handle individual permission toggle in form
  const handleFormPermissionToggle = (key: SystemPermission) => {
    setFormData((prev) => ({
      ...prev,
      customPermissionsEnabled: true,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  // Handle form bulk permissions
  const handleFormBulkPermissions = (enableAll: boolean) => {
    setFormData((prev) => {
      const newPerms: Record<SystemPermission, boolean> = { ...prev.permissions };
      PERMISSION_DEFINITIONS.forEach((p) => {
        newPerms[p.key] = enableAll;
      });
      return {
        ...prev,
        customPermissionsEnabled: true,
        permissions: newPerms,
      };
    });
  };

  // Generate random 4-digit PIN
  const generateRandomPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormData((prev) => ({ ...prev, pin: randomPin }));
  };

  // Validate and submit form (Admin only)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('⚠️ Acesso restrito: Somente administradores podem salvar alterações.', 'warning');
      setIsModalOpen(false);
      return;
    }

    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'O nome do colaborador é obrigatório.';
    }

    if (!formData.email.trim()) {
      errors.email = 'O e-mail é obrigatório.';
    } else if (!formData.email.includes('@')) {
      errors.email = 'Insira um e-mail válido.';
    }

    if (!formData.pin || formData.pin.length < 4) {
      errors.pin = 'O PIN deve ter no mínimo 4 dígitos numéricos.';
    }

    // Check duplicate PIN for active users
    const duplicatePinUser = users.find(
      (u) => u.pin === formData.pin && u.id !== editingUser?.id && u.status === 'ativo'
    );
    if (duplicatePinUser) {
      errors.pin = `Este PIN já está sendo usado por "${duplicatePinUser.name}". Escolha outro PIN.`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingUser) {
      // Update
      const updatedUser: AppUser = {
        ...editingUser,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        pin: formData.pin.trim(),
        avatar: formData.avatar,
        status: formData.status,
        permissions: formData.permissions,
      };
      onUpdateUser(updatedUser);
      if (currentUser.id === updatedUser.id) {
        onSwitchCurrentUser(updatedUser);
      }
      showToast(`Colaborador "${updatedUser.name}" atualizado com sucesso!`, 'success');
    } else {
      // Create
      onAddUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        pin: formData.pin.trim(),
        avatar: formData.avatar,
        status: formData.status,
        permissions: formData.permissions,
        lastLogin: 'Nunca acessou',
      });
      showToast(`Novo colaborador "${formData.name.trim()}" criado com sucesso!`, 'success');
    }

    setIsModalOpen(false);
  };

  // Toggle user status active/inactive (Admin only)
  const handleToggleUserStatus = (user: AppUser) => {
    if (!isAdmin) {
      showToast('⚠️ Acesso restrito: Somente usuários Administradores podem ativar ou inativar contas.', 'warning');
      return;
    }

    if (user.id === currentUser.id && user.status === 'ativo') {
      alert('Você não pode inativar o usuário que está atualmente conectado.');
      return;
    }

    const updated = {
      ...user,
      status: user.status === 'ativo' ? ('inativo' as const) : ('ativo' as const),
    };
    onUpdateUser(updated);
    showToast(`Status de ${user.name} alterado para ${updated.status === 'ativo' ? 'Ativo' : 'Inativo'}.`, 'info');
  };

  // Delete user with safety checks (Admin only)
  const handleDelete = (user: AppUser) => {
    if (!isAdmin) {
      showToast('⚠️ Acesso restrito: Somente usuários Administradores podem excluir colaboradores.', 'warning');
      return;
    }

    if (user.id === currentUser.id) {
      alert('Você não pode excluir o usuário que está conectado no momento.');
      return;
    }
    const adminCount = users.filter((u) => u.role === 'admin' && u.status === 'ativo').length;
    if (user.role === 'admin' && adminCount <= 1) {
      alert('O sistema precisa ter pelo menos 1 Administrador ativo.');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o colaborador "${user.name}"?`)) {
      onDeleteUser(user.id);
      showToast(`Colaborador "${user.name}" foi excluído.`, 'warning');
    }
  };

  // Switch operator PIN verification
  const handleVerifyAndSwitchUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchTargetUser) return;

    if (enteredPin === switchTargetUser.pin) {
      onSwitchCurrentUser(switchTargetUser);
      setIsSwitchModalOpen(false);
      setSwitchTargetUser(null);
      setEnteredPin('');
      setPinError('');
      showToast(`Sessão iniciada como ${switchTargetUser.name}!`, 'success');
    } else {
      setPinError('PIN incorreto. Tente novamente.');
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone && user.phone.includes(searchQuery)) ||
        ROLE_CONFIG[user.role].label.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole =
        selectedRoleFilter === 'todos' || user.role === selectedRoleFilter;

      const matchStatus =
        selectedStatusFilter === 'todos' || user.status === selectedStatusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Metric counts
  const totalUsers = users.length;
  const activeUsersCount = users.filter((u) => u.status === 'ativo').length;
  const adminManagersCount = users.filter((u) => u.role === 'admin' || u.role === 'gerente').length;
  const posOperatorsCount = users.filter((u) => u.permissions.access_caixa && u.status === 'ativo').length;

  return (
    <div className="space-y-6 pb-16 relative">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center space-x-3 text-xs sm:text-sm font-bold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-500/50'
              : toastMessage.type === 'warning'
              ? 'bg-amber-900 text-amber-100 border-amber-500/50'
              : 'bg-slate-900 text-slate-100 border-purple-500/50'
          }`}>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Banner - Standardized Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                👥 Gestão de Usuários & Permissões
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                {activeUsersCount} Ativos
              </span>
              {isAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Administrador (Edição Liberada)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Modo Consulta (Somente Administrador Altera)
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isAdmin 
                ? 'Você possui permissão de Administrador para alterar dados, cadastrar membros e definir permissões.'
                : 'Você está no modo de visualização. Somente usuários com perfil Administrador podem editar dados e permissões.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setSwitchTargetUser(null);
              setEnteredPin('');
              setPinError('');
              setIsSwitchModalOpen(true);
            }}
            className="inline-flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <Key className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Trocar Operador</span>
            <span className="sm:hidden">Trocar</span>
          </button>

          {isAdmin ? (
            <button
              onClick={handleOpenNewUser}
              className="inline-flex items-center justify-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-purple-500/20 transition-all cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Colaborador</span>
            </button>
          ) : (
            <button
              onClick={() => showToast('⚠️ Somente administradores podem cadastrar novos colaboradores.', 'warning')}
              title="Apenas usuários administradores podem criar novos cadastros"
              className="inline-flex items-center justify-center space-x-1.5 bg-slate-100 text-slate-400 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Novo Colaborador (Admin)</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Session Callout Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-purple-950 rounded-2xl p-4 text-white shadow-md border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <img
            src={currentUser.avatar || AVATAR_SUGGESTIONS[0]}
            alt={currentUser.name}
            className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-400/50 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operador Conectado:</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${ROLE_CONFIG[currentUser.role].badgeClass}`}>
                {ROLE_CONFIG[currentUser.role].label}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">{currentUser.name}</h3>
            <p className="text-xs text-purple-200/80">
              {currentUser.email} • PIN: <strong className="text-amber-300 font-mono tracking-widest">{currentUser.pin}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => handleOpenViewUser(currentUser)}
            className="bg-slate-800/90 hover:bg-slate-700 text-purple-200 hover:text-white px-3.5 py-2 rounded-xl border border-purple-500/30 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-purple-400" />
            <span>Ver Minha Ficha</span>
          </button>

          <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Permissões Habilitadas</span>
            <span className="font-extrabold text-emerald-400 text-sm">
              {Object.values(currentUser.permissions).filter(Boolean).length} de {PERMISSION_DEFINITIONS.length} Funções
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Equipe Cadastrada</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">{totalUsers}</span>
          </div>
        </div>

        {/* Card 2: Ativos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Usuários Ativos</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600">{activeUsersCount}</span>
          </div>
        </div>

        {/* Card 3: Admins */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Gestores & Admins</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">{adminManagersCount}</span>
          </div>
        </div>

        {/* Card 4: Operadores de Caixa */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Acesso ao Caixa POS</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">{posOperatorsCount}</span>
          </div>
        </div>
      </div>

      {/* Internal Sub Tabs Navigation */}
      <div className="flex items-center space-x-1.5 bg-slate-200/70 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => setSubTab('colaboradores')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            subTab === 'colaboradores'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Users className="w-4 h-4 text-purple-600" />
          <span>Colaboradores & Acessos ({users.length})</span>
        </button>

        <button
          onClick={() => setSubTab('matriz')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            subTab === 'matriz'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Matriz de Permissões</span>
        </button>

        <button
          onClick={() => setSubTab('seguranca')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            subTab === 'seguranca'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Key className="w-4 h-4 text-amber-600" />
          <span>Segurança & PINs</span>
        </button>
      </div>

      {/* SUB TAB 1: LIST OF USERS */}
      {subTab === 'colaboradores' && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou cargo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 px-2 uppercase">Cargo:</span>
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="bg-white text-xs font-bold text-slate-700 py-1 px-2.5 rounded-lg border border-slate-200 focus:outline-none"
                >
                  <option value="todos">Todos os Cargos</option>
                  <option value="admin">Administrador</option>
                  <option value="gerente">Gerente</option>
                  <option value="caixa">Operador Caixa</option>
                  <option value="churrasqueiro">Churrasqueiro</option>
                  <option value="garcom">Garçom</option>
                </select>
              </div>

              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 px-2 uppercase">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-white text-xs font-bold text-slate-700 py-1 px-2.5 rounded-lg border border-slate-200 focus:outline-none"
                >
                  <option value="todos">Todos</option>
                  <option value="ativo">Apenas Ativos</option>
                  <option value="inativo">Inativos</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const isCurrentUser = currentUser.id === user.id;
              const isPinShown = visiblePins[user.id];
              const activePermCount = PERMISSION_DEFINITIONS.filter((p) => hasPermission(user, p.key)).length;

              return (
                <div
                  key={user.id}
                  className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-xs hover:shadow-md relative overflow-hidden ${
                    user.status === 'inativo' 
                      ? 'opacity-70 border-slate-200 bg-slate-50/50' 
                      : isCurrentUser 
                        ? 'border-purple-300 ring-2 ring-purple-500/20' 
                        : 'border-slate-200'
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div
                    className={`absolute top-0 inset-x-0 h-1.5 ${
                      user.status === 'inativo'
                        ? 'bg-slate-300'
                        : user.role === 'admin'
                        ? 'bg-purple-500'
                        : user.role === 'gerente'
                        ? 'bg-blue-500'
                        : user.role === 'caixa'
                        ? 'bg-emerald-500'
                        : user.role === 'churrasqueiro'
                        ? 'bg-orange-500'
                        : 'bg-amber-500'
                    }`}
                  />

                  <div>
                    {/* Header with Avatar and Badges */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={user.avatar || AVATAR_SUGGESTIONS[0]}
                            alt={user.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          />
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              user.status === 'ativo' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                            title={user.status === 'ativo' ? 'Usuário Ativo' : 'Usuário Inativo'}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                              {user.name}
                            </h3>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-600 text-white uppercase">
                                Você
                              </span>
                            )}
                          </div>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              ROLE_CONFIG[user.role].badgeClass
                            }`}
                          >
                            {ROLE_CONFIG[user.role].label}
                          </span>
                        </div>
                      </div>

                      {/* Status Toggle Switch (Admin only) */}
                      {isAdmin ? (
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          title={user.status === 'ativo' ? 'Clique para inativar' : 'Clique para ativar'}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                            user.status === 'ativo'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </button>
                      ) : (
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                            user.status === 'ativo'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      )}
                    </div>

                    {/* Contact & Meta Info */}
                    <div className="space-y-1 text-xs text-slate-600 py-2 border-y border-slate-100">
                      <div className="flex items-center space-x-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Último acesso: {user.lastLogin || 'Recente'}</span>
                      </div>
                    </div>

                    {/* PIN and Permissions summary */}
                    <div className="py-3 space-y-2">
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <div className="flex items-center space-x-2">
                          <Key className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-700">PIN de Acesso:</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-xs font-black tracking-widest text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {isPinShown ? user.pin : '••••'}
                          </span>
                          <button
                            onClick={() => togglePinVisibility(user.id)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
                            title={isPinShown ? 'Ocultar PIN' : 'Ver PIN'}
                          >
                            {isPinShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Permissions Chips with Admin Direct Toggle or Read-Only Mode */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            Permissões ({activePermCount}/{PERMISSION_DEFINITIONS.length})
                            {!isAdmin && <Lock className="w-2.5 h-2.5 text-amber-500" />}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {isAdmin && (
                              <button
                                onClick={() => setQuickPermUser(user)}
                                className="text-[10px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-0.5 cursor-pointer"
                              >
                                <Zap className="w-3 h-3 text-amber-500" />
                                <span>Gerenciar</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenViewUser(user)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Eye className="w-3 h-3 text-blue-500" />
                              <span>Visualizar</span>
                            </button>
                          </div>
                        </div>

                        {/* Clickable or Read-Only Permission Chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {PERMISSION_DEFINITIONS.map((perm) => {
                            const isGranted = hasPermission(user, perm.key);
                            
                            if (isAdmin) {
                              return (
                                <button
                                  key={perm.key}
                                  onClick={() => handleDirectTogglePermission(user, perm.key)}
                                  title={`${isGranted ? '✅ ATIVADA - Clique para desativar' : '⭕ DESATIVADA - Clique para ATIVAR'} a permissão "${perm.label}"`}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition-all flex items-center space-x-1 cursor-pointer active:scale-95 ${
                                    isGranted
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs hover:bg-emerald-100 hover:border-emerald-400'
                                      : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300'
                                  }`}
                                >
                                  {isGranted ? (
                                    <Check className="w-3 h-3 text-emerald-600 shrink-0 stroke-[3]" />
                                  ) : (
                                    <X className="w-3 h-3 text-slate-400 shrink-0" />
                                  )}
                                  <span className="truncate max-w-[130px]">{perm.label}</span>
                                </button>
                              );
                            }

                            // Read-only chip for non-admin
                            return (
                              <div
                                key={perm.key}
                                onClick={() => handleOpenViewUser(user)}
                                title={`Permissão: "${perm.label}" - ${isGranted ? 'Concedida' : 'Bloqueada'} (Somente Administrador pode alterar)`}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center space-x-1 cursor-pointer ${
                                  isGranted
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                                }`}
                              >
                                {isGranted ? (
                                  <Check className="w-3 h-3 text-emerald-600 shrink-0 stroke-[3]" />
                                ) : (
                                  <X className="w-3 h-3 text-slate-400 shrink-0" />
                                )}
                                <span className="truncate max-w-[130px]">{perm.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {!isCurrentUser ? (
                      <button
                        onClick={() => {
                          setSwitchTargetUser(user);
                          setEnteredPin('');
                          setPinError('');
                          setIsSwitchModalOpen(true);
                        }}
                        className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Logar como</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sessão Ativa
                      </span>
                    )}

                    <div className="flex items-center space-x-1">
                      {/* Visualizar Ficha (Always available to everyone) */}
                      <button
                        onClick={() => handleOpenViewUser(user)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Visualizar Detalhes & Permissões (Sem Editar)"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Visualizar</span>
                      </button>

                      {/* Admin-only quick edit & permission controls */}
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => setQuickPermUser(user)}
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                            title="Ativar/Desativar Permissões Rápidas"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditUser(user)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Editar Dados do Colaborador"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={isCurrentUser}
                            className={`p-1.5 rounded-lg transition-all ${
                              isCurrentUser
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                            }`}
                            title="Excluir Colaborador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span 
                          className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md flex items-center gap-1"
                          title="Somente usuários administradores podem editar ou excluir"
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Leitura</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">Nenhum colaborador encontrado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tente ajustar os termos da sua busca ou filtros selecionados.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRoleFilter('todos');
                  setSelectedStatusFilter('todos');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: INTERACTIVE PERMISSION MATRIX */}
      {subTab === 'matriz' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          {/* Matrix Controls & Mode Selector */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Matriz de Permissões
                </h3>
                {!isAdmin && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Somente Leitura
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? 'Clique diretamente em qualquer botão de permissão para ATIVAR ou DESATIVAR o acesso imediatamente.'
                  : 'Visualização da matriz de acessos do sistema. Apenas usuários Administradores podem alternar permissões.'}
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-xl shrink-0 self-start md:self-auto">
              <button
                onClick={() => setMatrixMode('colaboradores')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  matrixMode === 'colaboradores'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👤 Por Colaborador ({users.length})
              </button>
              <button
                onClick={() => setMatrixMode('cargos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  matrixMode === 'cargos'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🛡️ Por Modelo de Cargo
              </button>
            </div>
          </div>

          {/* MODE 1: MATRIX BY INDIVIDUAL COLLABORATOR */}
          {matrixMode === 'colaboradores' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 min-w-[240px] sticky left-0 bg-slate-100 z-10">
                      Funcionalidade do Sistema
                    </th>
                    {users.map((u) => (
                      <th key={u.id} className="py-3.5 px-3 text-center min-w-[130px]">
                        <div className="flex flex-col items-center">
                          <div className="relative mb-1">
                            <img
                              src={u.avatar || AVATAR_SUGGESTIONS[0]}
                              alt={u.name}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                            />
                            {currentUser.id === u.id && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-600 ring-1 ring-white" />
                            )}
                          </div>
                          <span className="font-extrabold text-slate-900 text-[11px] truncate max-w-[120px]">
                            {u.name.split(' ')[0]} {u.name.split(' ')[1] || ''}
                          </span>
                          <span className="text-[9px] text-slate-500 font-semibold">
                            {ROLE_CONFIG[u.role].label}
                          </span>
                          
                          {/* Bulk actions for admin only */}
                          {isAdmin ? (
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                onClick={() => handleBulkToggleUserPermissions(u, true)}
                                className="text-[9px] text-emerald-700 hover:underline font-bold cursor-pointer"
                                title="Ativar todas as permissões para este usuário"
                              >
                                +Todas
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                onClick={() => handleBulkToggleUserPermissions(u, false)}
                                className="text-[9px] text-rose-600 hover:underline font-bold cursor-pointer"
                                title="Desativar todas as permissões para este usuário"
                              >
                                -Todas
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenViewUser(u)}
                              className="text-[9px] text-blue-600 hover:underline font-bold mt-1 cursor-pointer"
                            >
                              Ver Ficha
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {PERMISSION_DEFINITIONS.map((perm) => (
                    <tr key={perm.key} className="hover:bg-purple-50/30 transition-colors">
                      {/* Permission Name and Description */}
                      <td className="py-3.5 px-4 sticky left-0 bg-white shadow-xs z-10">
                        <span className="font-extrabold text-slate-900 block text-xs">
                          {perm.label}
                        </span>
                        <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                          {perm.description}
                        </span>
                      </td>

                      {/* Interactive Cells for Admin, Read-only badges for Non-Admin */}
                      {users.map((u) => {
                        const isGranted = hasPermission(u, perm.key);
                        return (
                          <td key={u.id} className="py-3 px-3 text-center">
                            {isAdmin ? (
                              <button
                                onClick={() => handleDirectTogglePermission(u, perm.key)}
                                title={`Clique para ${isGranted ? 'DESATIVAR' : 'ATIVAR'} "${perm.label}" para ${u.name}`}
                                className={`w-full py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 ${
                                  isGranted
                                    ? 'bg-emerald-500 text-white shadow-xs hover:bg-emerald-600'
                                    : 'bg-slate-100 text-slate-400 hover:bg-purple-100 hover:text-purple-700 border border-slate-200'
                                }`}
                              >
                                {isGranted ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span className="text-[10px] uppercase tracking-wider">Ativo</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3.5 h-3.5" />
                                    <span className="text-[10px] uppercase tracking-wider">Inativo</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <div
                                onClick={() => handleOpenViewUser(u)}
                                title={`Permissão ${isGranted ? 'Ativa' : 'Inativa'} (Somente Administrador pode alterar)`}
                                className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer ${
                                  isGranted
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-50 text-slate-400 border border-slate-200 opacity-60'
                                }`}
                              >
                                {isGranted ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                    <span className="text-[10px] uppercase tracking-wider">Ativo</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3 text-slate-400" />
                                    <span className="text-[10px] uppercase tracking-wider">Inativo</span>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MODE 2: MATRIX BY ROLE TEMPLATE */}
          {matrixMode === 'cargos' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 min-w-[220px]">Funcionalidade do Sistema</th>
                    <th className="py-3.5 px-3 text-center min-w-[110px] text-purple-900">Administrador</th>
                    <th className="py-3.5 px-3 text-center min-w-[110px] text-blue-900">Gerente</th>
                    <th className="py-3.5 px-3 text-center min-w-[110px] text-emerald-900">Caixa (POS)</th>
                    <th className="py-3.5 px-3 text-center min-w-[110px] text-orange-900">Churrasqueiro</th>
                    <th className="py-3.5 px-3 text-center min-w-[110px] text-amber-900">Garçom</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {PERMISSION_DEFINITIONS.map((perm) => (
                    <tr key={perm.key} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 block text-xs">{perm.label}</span>
                        <span className="text-[11px] text-slate-500">{perm.description}</span>
                      </td>

                      {/* Admin */}
                      <td className="py-3 px-3 text-center bg-purple-50/20">
                        {DEFAULT_ROLE_PERMISSIONS.admin[perm.key] ? (
                          <span className="inline-flex items-center justify-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 font-bold text-[10px]">
                            <X className="w-3.5 h-3.5" />
                            <span>Inativo</span>
                          </span>
                        )}
                      </td>

                      {/* Gerente */}
                      <td className="py-3 px-3 text-center bg-blue-50/20">
                        {DEFAULT_ROLE_PERMISSIONS.gerente[perm.key] ? (
                          <span className="inline-flex items-center justify-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 font-bold text-[10px]">
                            <X className="w-3.5 h-3.5" />
                            <span>Inativo</span>
                          </span>
                        )}
                      </td>

                      {/* Caixa */}
                      <td className="py-3 px-3 text-center bg-emerald-50/20">
                        {DEFAULT_ROLE_PERMISSIONS.caixa[perm.key] ? (
                          <span className="inline-flex items-center justify-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 font-bold text-[10px]">
                            <X className="w-3.5 h-3.5" />
                            <span>Inativo</span>
                          </span>
                        )}
                      </td>

                      {/* Churrasqueiro */}
                      <td className="py-3 px-3 text-center bg-orange-50/20">
                        {DEFAULT_ROLE_PERMISSIONS.churrasqueiro[perm.key] ? (
                          <span className="inline-flex items-center justify-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 font-bold text-[10px]">
                            <X className="w-3.5 h-3.5" />
                            <span>Inativo</span>
                          </span>
                        )}
                      </td>

                      {/* Garçom */}
                      <td className="py-3 px-3 text-center bg-amber-50/20">
                        {DEFAULT_ROLE_PERMISSIONS.garcom[perm.key] ? (
                          <span className="inline-flex items-center justify-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 font-bold text-[10px]">
                            <X className="w-3.5 h-3.5" />
                            <span>Inativo</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 3: SECURITY & PINS INFO */}
      {subTab === 'seguranca' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Como funciona o PIN no PDV?</h3>
                <p className="text-xs text-slate-500">Agilidade no atendimento e auditoria de vendas.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O PIN numérico de 4 a 6 dígitos substitui senhas longas para que a equipe de salão e caixa consiga autenticar lançamentos e cancelamentos em segundos na tela touch do computador ou tablet.
            </p>

            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-2 text-xs text-amber-900">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Dica de Segurança:</strong> Não compartilhe o PIN de Administrador com operadores de salão. Cada garçom e operador deve ter seu próprio PIN individual.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Boas Práticas de Permissões</h3>
                <p className="text-xs text-slate-500">Prevenção contra erros de caixa e desperdício.</p>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Descontos Controlados:</strong> Limite a concessão de descontos e cortesias apenas a gerentes e administradores.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Visão da Cozinha:</strong> O churrasqueiro foca apenas na fila da grelha (KDS), evitando poluição visual de valores financeiros.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Fechamento de Caixa:</strong> Apenas o operador responsável pelo turno deve realizar a contagem física do dinheiro no final do dia.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: READ-ONLY VIEW USER DETAILS (OPÇÃO DE VISUALIZAR SEM EDITAR) */}
      {/* ========================================================================= */}
      {viewingUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-white">
                      Ficha do Colaborador
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-400/40">
                      Somente Visualização
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Consulta protegida de dados cadastrais e permissões sem possibilidade de edição acidental.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg cursor-pointer transition-colors"
                title="Fechar visualização"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
              {/* Profile Card Summary */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <img
                  src={viewingUser.avatar || AVATAR_SUGGESTIONS[0]}
                  alt={viewingUser.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-purple-500/30 shadow-md shrink-0"
                />

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="text-lg sm:text-xl font-black text-slate-900">
                      {viewingUser.name}
                    </h4>
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black uppercase border ${
                      viewingUser.status === 'ativo' 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {viewingUser.status === 'ativo' ? '🟢 Conta Ativa' : '🔴 Conta Inativa'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${ROLE_CONFIG[viewingUser.role].badgeClass}`}>
                      Cargo: {ROLE_CONFIG[viewingUser.role].label}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {ROLE_CONFIG[viewingUser.role].description}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">{viewingUser.email}</span>
                    </div>
                    {viewingUser.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{viewingUser.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Key className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>PIN: </span>
                      <strong className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900">
                        {visiblePins[viewingUser.id] ? viewingUser.pin : '••••'}
                      </strong>
                      <button
                        type="button"
                        onClick={() => togglePinVisibility(viewingUser.id)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        title={visiblePins[viewingUser.id] ? 'Ocultar' : 'Revelar'}
                      >
                        {visiblePins[viewingUser.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Último Acesso: <strong>{viewingUser.lastLogin || 'Recente'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge Info */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-blue-950 font-bold">Modo de Leitura Ativo</strong>
                  <span>
                    Todas as informações nesta tela estão protegidas. {isAdmin 
                      ? 'Como Administrador, você pode clicar no botão "Editar Informações" abaixo para fazer alterações.'
                      : 'Somente usuários Administradores podem fazer alterações no cadastro ou permissões.'}
                  </span>
                </div>
              </div>

              {/* Permissions Read-Only List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Permissões Atribuídas ({PERMISSION_DEFINITIONS.filter((p) => hasPermission(viewingUser, p.key)).length} de {PERMISSION_DEFINITIONS.length})
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  {PERMISSION_DEFINITIONS.map((perm) => {
                    const isGranted = hasPermission(viewingUser, perm.key);
                    return (
                      <div
                        key={perm.key}
                        className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                          isGranted 
                            ? 'bg-white border-emerald-300 shadow-2xs' 
                            : 'bg-slate-100/60 border-slate-200/80 opacity-60'
                        }`}
                      >
                        <div className="flex items-start space-x-2.5 pr-2">
                          <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                            isGranted ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                          }`}>
                            {isGranted ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3" />}
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                              {perm.label}
                            </span>
                            <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                              {perm.description}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                          isGranted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isGranted ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer"
              >
                Fechar Visualização
              </button>

              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      const userToEdit = viewingUser;
                      setViewingUser(null);
                      handleOpenEditUser(userToEdit);
                    }}
                    className="px-4 py-2.5 text-xs font-black text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Informações</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold italic flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    Edição restrita a Administradores
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PERMISSION MANAGER MODAL (ADMIN ONLY) */}
      {quickPermUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={quickPermUser.avatar || AVATAR_SUGGESTIONS[0]}
                  alt={quickPermUser.name}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-400"
                />
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Permissões de {quickPermUser.name}
                  </h3>
                  <p className="text-xs text-purple-200">
                    Cargo: <strong>{ROLE_CONFIG[quickPermUser.role].label}</strong> • Clique para ativar ou desativar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickPermUser(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Bulk Actions */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">Ações Rápidas:</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleBulkToggleUserPermissions(quickPermUser, true)}
                  className="px-2.5 py-1 text-xs font-extrabold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg cursor-pointer"
                >
                  ✅ Ativar Todas
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkToggleUserPermissions(quickPermUser, false)}
                  className="px-2.5 py-1 text-xs font-extrabold bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg cursor-pointer"
                >
                  ❌ Desativar Todas
                </button>
                <button
                  type="button"
                  onClick={() => handleResetUserToRoleDefault(quickPermUser)}
                  className="px-2.5 py-1 text-xs font-extrabold bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg cursor-pointer"
                >
                  Restaurar Cargo
                </button>
              </div>
            </div>

            {/* Permissions List */}
            <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-2.5">
              {PERMISSION_DEFINITIONS.map((perm) => {
                // Find latest state of quickPermUser from users array
                const latestUser = users.find((u) => u.id === quickPermUser.id) || quickPermUser;
                const isGranted = hasPermission(latestUser, perm.key);

                return (
                  <div
                    key={perm.key}
                    onClick={() => handleDirectTogglePermission(latestUser, perm.key)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none active:scale-[0.99] ${
                      isGranted
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/20 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                          {perm.label}
                        </span>
                        <span className={`px-2 py-0.2 rounded text-[9px] font-black uppercase ${
                          isGranted ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isGranted ? 'Ativado' : 'Desativado'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        {perm.description}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <div className={`w-12 h-6 rounded-full transition-colors flex items-center p-1 shrink-0 ${
                      isGranted ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}>
                      <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setQuickPermUser(null)}
                className="px-5 py-2 text-xs font-black text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md cursor-pointer"
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT USER (ADMIN ONLY) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <UserPlus className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">
                    {editingUser ? 'Editar Colaborador' : 'Cadastrar Novo Colaborador'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina dados de acesso, cargo e permissões personalizadas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmitForm} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  {formErrors.name && <p className="text-xs text-rose-600 font-bold">{formErrors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    E-mail <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="joao@espetopro.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  {formErrors.email && <p className="text-xs text-rose-600 font-bold">{formErrors.email}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-8888"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* PIN and Generator */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      PIN de Acesso Rápido (4 Dígitos) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPin}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Gerar PIN
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Ex: 1234"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  {formErrors.pin && <p className="text-xs text-rose-600 font-bold">{formErrors.pin}</p>}
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Status da Conta
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    <option value="ativo">🟢 Ativo (Acesso Liberado)</option>
                    <option value="inativo">🔴 Inativo (Acesso Bloqueado)</option>
                  </select>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Selecione o Cargo / Função:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(['admin', 'gerente', 'caixa', 'churrasqueiro', 'garcom'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleChange(role)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.role === role
                          ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">
                          {ROLE_CONFIG[role].label}
                        </span>
                        {formData.role === role && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                        {ROLE_CONFIG[role].description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Foto de Perfil / Avatar:
                </label>
                <div className="flex items-center space-x-2 overflow-x-auto py-1">
                  {AVATAR_SUGGESTIONS.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: imgUrl })}
                      className={`w-11 h-11 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        formData.avatar === imgUrl ? 'border-purple-600 scale-105 ring-2 ring-purple-500/20' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Permissions Checklist with Instant Activation Toggles */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Permissões Granulares (Ativar / Desativar)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Personalize individualmente o que este colaborador pode fazer no sistema.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleFormBulkPermissions(true)}
                      className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg hover:bg-emerald-100 cursor-pointer"
                    >
                      + Ativar Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormBulkPermissions(false)}
                      className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg hover:bg-rose-100 cursor-pointer"
                    >
                      - Desativar Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          customPermissionsEnabled: false,
                          permissions: { ...DEFAULT_ROLE_PERMISSIONS[prev.role] },
                        }));
                      }}
                      className="text-[10px] font-bold text-purple-600 hover:text-purple-800 cursor-pointer"
                    >
                      Padrão do Cargo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  {PERMISSION_DEFINITIONS.map((perm) => {
                    const isChecked = !!formData.permissions[perm.key];
                    return (
                      <div
                        key={perm.key}
                        onClick={() => handleFormPermissionToggle(perm.key)}
                        className={`flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked 
                            ? 'bg-white border-emerald-400 ring-2 ring-emerald-500/20 shadow-2xs' 
                            : 'bg-slate-100/60 border-slate-200/80 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-start space-x-2.5 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleFormPermissionToggle(perm.key)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                              {perm.label}
                            </span>
                            <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                              {perm.description}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                          isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isChecked ? 'Ativo' : 'Desativado'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md shadow-purple-500/20 transition-all cursor-pointer active:scale-95"
                >
                  {editingUser ? 'Salvar Alterações' : 'Criar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SWITCH ACTIVE OPERATOR BY PIN */}
      {isSwitchModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Trocar Operador Ativo</h3>
              </div>
              <button
                onClick={() => setIsSwitchModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyAndSwitchUser} className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Selecione o seu perfil de colaborador e digite seu PIN de acesso para assumir as operações do sistema.
              </p>

              {/* User Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Colaborador:
                </label>
                <select
                  value={switchTargetUser?.id || ''}
                  onChange={(e) => {
                    const found = users.find((u) => u.id === e.target.value);
                    setSwitchTargetUser(found || null);
                    setPinError('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none"
                  required
                >
                  <option value="">Selecione quem está operando...</option>
                  {users.filter((u) => u.status === 'ativo').map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({ROLE_CONFIG[u.role].label})
                    </option>
                  ))}
                </select>
              </div>

              {/* PIN input */}
              {switchTargetUser && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Digite seu PIN de 4 dígitos:
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    placeholder="••••"
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      setPinError('');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-mono tracking-widest font-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    required
                  />
                  {pinError && <p className="text-xs text-rose-600 font-bold">{pinError}</p>}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSwitchModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!switchTargetUser || !enteredPin}
                  className="px-4 py-2 text-xs font-black text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Entrar no Sistema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
