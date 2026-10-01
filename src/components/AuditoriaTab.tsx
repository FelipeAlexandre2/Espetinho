import React, { useState, useMemo } from 'react';
import { 
  SystemLog, 
  LogCategory, 
  AppUser, 
  ROLE_CONFIG 
} from '../types';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  UtensilsCrossed, 
  LogIn, 
  DollarSign, 
  Package, 
  ClipboardList, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle, 
  Eye, 
  PlusCircle, 
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  Shield
} from 'lucide-react';

interface AuditoriaTabProps {
  logs: SystemLog[];
  currentUser: AppUser;
  onClearLogs: () => void;
  onAddCustomLog?: (logData: Partial<SystemLog>) => void;
  onRefreshLogs?: () => void;
}

export const AuditoriaTab: React.FC<AuditoriaTabProps> = ({
  logs,
  currentUser,
  onClearLogs,
  onAddCustomLog,
  onRefreshLogs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<SystemLog | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Test log creation state
  const [testCategory, setTestCategory] = useState<LogCategory>('cardapio');
  const [testTitle, setTestTitle] = useState('Alteração de Teste no Cardápio');
  const [testDescription, setTestDescription] = useState('Reajuste de preço promocional para validação de auditoria.');
  const [testSeverity, setTestSeverity] = useState<'info' | 'warning' | 'success' | 'danger'>('warning');

  const isAdmin = currentUser.role === 'admin';

  // Filter logs
  const filteredLogs = useMemo(() => {
    return (logs || []).filter((log) => {
      if (!log) return false;
      // Search match
      const query = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (log.title && log.title.toLowerCase().includes(query)) ||
        (log.description && log.description.toLowerCase().includes(query)) ||
        (log.userName && log.userName.toLowerCase().includes(query)) ||
        (log.details?.targetName && String(log.details.targetName).toLowerCase().includes(query)) ||
        (log.details?.table && String(log.details.table).toLowerCase().includes(query)) ||
        (log.ipAddress && log.ipAddress.toLowerCase().includes(query));

      // Category match
      const matchCategory = selectedCategory === 'all' || log.category === selectedCategory;

      // Severity match
      const matchSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;

      // Timeframe match
      let matchTime = true;
      if (selectedTimeframe === 'today') {
        const logDate = new Date(log.timestamp);
        const today = new Date();
        matchTime = logDate.toDateString() === today.toDateString();
      } else if (selectedTimeframe === '24h') {
        const logTime = new Date(log.timestamp).getTime();
        const past24h = Date.now() - 24 * 60 * 60 * 1000;
        matchTime = logTime >= past24h;
      } else if (selectedTimeframe === '7d') {
        const logTime = new Date(log.timestamp).getTime();
        const past7d = Date.now() - 7 * 24 * 60 * 60 * 1000;
        matchTime = logTime >= past7d;
      }

      return matchSearch && matchCategory && matchSeverity && matchTime;
    });
  }, [logs, searchTerm, selectedCategory, selectedSeverity, selectedTimeframe]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const list = logs || [];
    const total = list.length;
    const loginsCount = list.filter((l) => l && l.category === 'login').length;
    const menuChangesCount = list.filter((l) => l && l.category === 'cardapio').length;
    const stockChangesCount = list.filter((l) => l && l.category === 'estoque').length;
    const alertsCount = list.filter((l) => l && (l.severity === 'warning' || l.severity === 'danger')).length;

    return { total, loginsCount, menuChangesCount, stockChangesCount, alertsCount };
  }, [logs]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Data/Hora', 'Categoria', 'Acao', 'Titulo', 'Descricao', 'Operador', 'Cargo', 'Gravidade', 'IP/Terminal'];
    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.timestamp).toLocaleString('pt-BR'),
      l.category,
      l.actionType,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.description.replace(/"/g, '""')}"`,
      `"${l.userName.replace(/"/g, '""')}"`,
      l.userRole,
      l.severity,
      `"${(l.ipAddress || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_espetopro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for Category Icons & Styling
  const getCategoryConfig = (category: LogCategory) => {
    switch (category) {
      case 'cardapio':
        return {
          icon: <UtensilsCrossed className="w-4 h-4 text-orange-400" />,
          label: 'Cardápio',
          bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        };
      case 'login':
        return {
          icon: <LogIn className="w-4 h-4 text-blue-400" />,
          label: 'Login / Acesso',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        };
      case 'caixa':
        return {
          icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
          label: 'Caixa & Vendas',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      case 'estoque':
        return {
          icon: <Package className="w-4 h-4 text-amber-400" />,
          label: 'Estoque',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      case 'pedidos':
        return {
          icon: <ClipboardList className="w-4 h-4 text-red-400" />,
          label: 'Pedidos',
          bg: 'bg-red-500/10 text-red-400 border-red-500/20',
        };
      case 'usuarios':
        return {
          icon: <Users className="w-4 h-4 text-purple-400" />,
          label: 'Usuários & Permissões',
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        };
      default:
        return {
          icon: <Layers className="w-4 h-4 text-slate-400" />,
          label: 'Sistema',
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        };
    }
  };

  const getSeverityBadge = (severity: SystemLog['severity']) => {
    switch (severity) {
      case 'success':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-400" />
            Sucesso
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 mr-0.5 text-amber-400" />
            Atenção
          </span>
        );
      case 'danger':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3 h-3 mr-0.5 text-red-400" />
            Crítico
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Info className="w-3 h-3 mr-0.5 text-blue-400" />
            Informativo
          </span>
        );
    }
  };

  const handleCreateTestLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddCustomLog) {
      onAddCustomLog({
        category: testCategory,
        title: testTitle,
        description: testDescription,
        severity: testSeverity,
        actionType: testCategory === 'cardapio' ? 'produto_editado' : 'sistema_backup',
        details: {
          testGenerated: true,
          timestampLocal: new Date().toLocaleTimeString(),
        },
      });
    }
    setIsTestModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Auditoria & Histórico do Sistema
                  <span className="text-xs px-2.5 py-0.5 font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    Live Feed
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Rastreamento completo de logins, modificações no cardápio, movimentações de estoque e operações financeiras.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {onRefreshLogs && (
              <button
                onClick={onRefreshLogs}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                title="Recarregar logs do servidor"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
                <span>Atualizar</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer active:scale-95"
              title="Baixar planilha CSV de auditoria"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setIsTestModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Simular Evento</span>
                </button>

                <button
                  onClick={() => setIsClearModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Limpar Logs</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Total de Registros</span>
              <History className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold text-white mt-1 block">
              {metrics.total}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Acessos & Logins</span>
              <LogIn className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold text-blue-400 mt-1 block">
              {metrics.loginsCount}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Cardápio & Preços</span>
              <UtensilsCrossed className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold text-orange-400 mt-1 block">
              {metrics.menuChangesCount}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Movim. Estoque</span>
              <Package className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold text-amber-400 mt-1 block">
              {metrics.stockChangesCount}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Alertas / Atenção</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold text-red-400 mt-1 block">
              {metrics.alertsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição, produto, operador, mesa ou terminal..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Período:</span>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-slate-950/80 border border-slate-700/80 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500"
            >
              <option value="all">Todo o Histórico</option>
              <option value="today">Somente Hoje</option>
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 dias</option>
            </select>
          </div>

          {/* Severity selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Gravidade:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-950/80 border border-slate-700/80 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500"
            >
              <option value="all">Todas</option>
              <option value="success">Sucesso</option>
              <option value="info">Informativo</option>
              <option value="warning">Atenção</option>
              <option value="danger">Crítico</option>
            </select>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium flex items-center space-x-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Categoria:</span>
          </span>

          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            Todas ({logs.length})
          </button>

          <button
            onClick={() => setSelectedCategory('cardapio')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'cardapio'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-800/80 text-orange-400 hover:bg-slate-700'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Cardápio ({(logs || []).filter((l) => l && l.category === 'cardapio').length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('login')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'login'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-800/80 text-blue-400 hover:bg-slate-700'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Logins ({(logs || []).filter((l) => l && l.category === 'login').length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('caixa')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'caixa'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-emerald-400 hover:bg-slate-700'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Caixa & Vendas ({(logs || []).filter((l) => l && l.category === 'caixa').length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('estoque')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'estoque'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-amber-400 hover:bg-slate-700'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Estoque ({(logs || []).filter((l) => l && l.category === 'estoque').length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('pedidos')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'pedidos'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'bg-slate-800/80 text-red-400 hover:bg-slate-700'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Pedidos ({(logs || []).filter((l) => l && l.category === 'pedidos').length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('usuarios')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'usuarios'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-800/80 text-purple-400 hover:bg-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuários & Permissões ({(logs || []).filter((l) => l && l.category === 'usuarios').length})</span>
          </button>
        </div>
      </div>

      {/* Logs Timeline List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span>Registros de Atividade</span>
            <span className="text-xs text-slate-400 font-normal">
              (Mostrando {filteredLogs.length} de {logs.length} eventos)
            </span>
          </h3>

          {filteredLogs.length > 0 && (
            <span className="text-[11px] text-slate-500 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Ordem cronológica reversa</span>
            </span>
          )}
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-300">Nenhum registro encontrado</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {searchTerm || selectedCategory !== 'all' || selectedSeverity !== 'all' || selectedTimeframe !== 'all'
                ? 'Tente ajustar os filtros de busca, categoria ou período selecionado.'
                : 'O histórico de atividades está vazio. Novas ações serão gravadas automaticamente aqui.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const catConfig = getCategoryConfig(log.category);
              const logDateObj = new Date(log.timestamp);
              const formattedTime = !isNaN(logDateObj.getTime())
                ? logDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '';
              const formattedDate = !isNaN(logDateObj.getTime())
                ? logDateObj.toLocaleDateString('pt-BR')
                : '';

              return (
                <div
                  key={log.id}
                  className="group bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 sm:p-4 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left Side: Category Icon + Content */}
                  <div className="flex items-start space-x-3.5 min-w-0">
                    {/* Icon Badge */}
                    <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${catConfig.bg}`}>
                      {catConfig.icon}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catConfig.bg}`}>
                          {catConfig.label}
                        </span>
                        {getSeverityBadge(log.severity)}
                        <span className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{log.formattedDate || `${formattedDate} às ${formattedTime}`}</span>
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-red-400 transition-colors">
                        {log.title}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed break-words">
                        {log.description}
                      </p>

                      {/* Value Comparison / Details Preview Tag if present */}
                      {log.details && (log.details.previousValue || log.details.newValue) && (
                        <div className="inline-flex items-center space-x-2 text-[11px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg mt-1 text-slate-300">
                          <span className="text-slate-400">Antes:</span>
                          <span className="font-semibold text-rose-400 line-through">
                            {String(log.details.previousValue)}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-400">Depois:</span>
                          <span className="font-bold text-emerald-400">
                            {String(log.details.newValue)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Responsible User & Inspect Button */}
                  <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                    <div className="flex items-center space-x-2 text-right">
                      {log.userAvatar ? (
                        <img
                          src={log.userAvatar}
                          alt={log.userName}
                          className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                          {log.userName.charAt(0)}
                        </div>
                      )}
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-200 block truncate max-w-[130px]">
                          {log.userName}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {ROLE_CONFIG[log.userRole]?.label.split(' ')[0] || log.userRole}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedLogForDetails(log)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                      title="Inspecionar detalhes do log"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span className="hidden xs:inline">Inspecionar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLogForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl border ${getCategoryConfig(selectedLogForDetails.category).bg}`}>
                  {getCategoryConfig(selectedLogForDetails.category).icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Inspeção Detalhada do Log</h3>
                  <span className="text-xs text-slate-400">ID: {selectedLogForDetails.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Evento:</span>
                  <span className="font-bold text-white">{selectedLogForDetails.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Categoria:</span>
                  <span className="font-semibold text-slate-200 capitalize">{selectedLogForDetails.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tipo de Ação:</span>
                  <span className="font-mono text-slate-300">{selectedLogForDetails.actionType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="font-mono text-slate-300">
                    {new Date(selectedLogForDetails.timestamp).toISOString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Terminal / IP:</span>
                  <span className="text-slate-300">{selectedLogForDetails.ipAddress || 'Terminal Local'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold mb-1">Descrição:</span>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 leading-relaxed">
                  {selectedLogForDetails.description}
                </div>
              </div>

              {selectedLogForDetails.details && Object.keys(selectedLogForDetails.details).length > 0 && (
                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Payload / Metadados Técnicos:</span>
                  <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-40 scrollbar-none">
                    {JSON.stringify(selectedLogForDetails.details, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {selectedLogForDetails.userAvatar ? (
                  <img
                    src={selectedLogForDetails.userAvatar}
                    alt={selectedLogForDetails.userName}
                    className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-700"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                    {selectedLogForDetails.userName.charAt(0)}
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-white block">{selectedLogForDetails.userName}</span>
                  <span className="text-[10px] text-slate-400">
                    Cargo: {ROLE_CONFIG[selectedLogForDetails.userRole]?.label || selectedLogForDetails.userRole}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fechar Inspeção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Limpar Histórico de Auditoria?</h3>
              <p className="text-xs text-slate-400">
                Esta ação removerá todos os logs gravados no banco de dados e na memória. Esta operação é irreversível.
              </p>
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onClearLogs();
                  setIsClearModalOpen(false);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Confirmar Limpeza
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom/Test Log Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Simular Novo Evento de Auditoria
              </h3>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTestLog} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block font-semibold mb-1">Categoria:</label>
                <select
                  value={testCategory}
                  onChange={(e) => setTestCategory(e.target.value as LogCategory)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="cardapio">🍽️ Cardápio & Preços</option>
                  <option value="login">🔑 Login / Autenticação</option>
                  <option value="caixa">💰 Caixa & Vendas</option>
                  <option value="estoque">📦 Estoque & Insumos</option>
                  <option value="pedidos">📋 Pedidos & Comandas</option>
                  <option value="usuarios">👥 Usuários & Permissões</option>
                  <option value="sistema">⚙️ Sistema / Backup</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block font-semibold mb-1">Título do Evento:</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block font-semibold mb-1">Descrição Detalhada:</label>
                <textarea
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block font-semibold mb-1">Gravidade / Nível:</label>
                <select
                  value={testSeverity}
                  onChange={(e) => setTestSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="info">Info (Informativo)</option>
                  <option value="warning">Warning (Atenção/Aviso)</option>
                  <option value="success">Success (Sucesso)</option>
                  <option value="danger">Danger (Crítico)</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Gravar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
