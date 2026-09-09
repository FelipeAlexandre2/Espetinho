import React, { useState, useMemo } from 'react';
import { Order, Product } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Award, 
  PieChart as PieChartIcon, 
  Calendar, 
  Flame, 
  CreditCard, 
  Clock, 
  Printer, 
  ArrowUpRight,
  Sparkles,
  BarChart3,
  BarChart2,
  CheckCircle2,
  Download,
  FileText,
  X,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const CHART_COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'];

interface RelatoriosTabProps {
  orders: Order[];
  products: Product[];
}

type PeriodFilter = 'hoje' | 'semana' | 'mes' | 'tudo';

export const RelatoriosTab: React.FC<RelatoriosTabProps> = ({ orders, products }) => {
  const [period, setPeriod] = useState<PeriodFilter>('semana');
  const [rankingCategory, setRankingCategory] = useState<string>('todos');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filter orders by selected period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter((ord) => {
      // Ignore canceled orders in sales reports
      if (ord.status === 'cancelado') return false;

      const orderTime = new Date(ord.createdAt).getTime();

      if (period === 'hoje') {
        return orderTime >= todayStart;
      }
      if (period === 'semana') {
        return orderTime >= weekStart;
      }
      if (period === 'mes') {
        return orderTime >= monthStart;
      }
      return true; // 'tudo'
    });
  }, [orders, period]);

  // Overall Financial & Sales KPIs
  const metrics = useMemo(() => {
    const totalSales = filteredOrders.reduce((acc, curr) => acc + curr.total, 0);
    const paidOrders = filteredOrders.filter((o) => o.isPaid || o.status === 'entregue');
    const totalOrdersCount = filteredOrders.length;
    const avgTicket = totalOrdersCount > 0 ? totalSales / totalOrdersCount : 0;

    // Estimate total cost of items sold
    let estimatedCost = 0;
    let totalItemsQuantity = 0;

    filteredOrders.forEach((ord) => {
      ord.items.forEach((item) => {
        totalItemsQuantity += item.quantity;
        const matchingProduct = products.find((p) => p.id === item.productId || p.name === item.productName);
        const unitCost = matchingProduct ? matchingProduct.costPrice : item.price * 0.4;
        estimatedCost += unitCost * item.quantity;
      });
    });

    const estimatedProfit = Math.max(0, totalSales - estimatedCost);
    const profitMargin = totalSales > 0 ? ((estimatedProfit / totalSales) * 100).toFixed(1) : '0';

    return {
      totalSales,
      totalOrdersCount,
      paidOrdersCount: paidOrders.length,
      avgTicket,
      totalItemsQuantity,
      estimatedProfit,
      profitMargin,
    };
  }, [filteredOrders, products]);

  // "Qual Vende Mais" - Products ranking
  const productRanking = useMemo(() => {
    const salesMap: Record<string, { id: string; name: string; category: string; qty: number; revenue: number; unitPrice: number }> = {};

    filteredOrders.forEach((ord) => {
      ord.items.forEach((item) => {
        const prodMatch = products.find((p) => p.id === item.productId || p.name === item.productName);
        const category = prodMatch?.category || 'espetos_tradicionais';
        const prodId = prodMatch?.id || item.productId || item.productName;

        if (!salesMap[prodId]) {
          salesMap[prodId] = {
            id: prodId,
            name: item.productName,
            category,
            qty: 0,
            revenue: 0,
            unitPrice: item.price,
          };
        }

        salesMap[prodId].qty += item.quantity;
        salesMap[prodId].revenue += item.price * item.quantity;
      });
    });

    let list = Object.values(salesMap);

    // Apply category filter if set
    if (rankingCategory !== 'todos') {
      list = list.filter((item) => item.category === rankingCategory);
    }

    // Sort by quantity sold descending
    list.sort((a, b) => b.qty - a.qty);

    return list;
  }, [filteredOrders, products, rankingCategory]);

  // Breakdown by Payment Method
  const paymentBreakdown = useMemo(() => {
    const methods: Record<string, { label: string; amount: number; count: number; color: string }> = {
      pix: { label: 'PIX Instantâneo', amount: 0, count: 0, color: 'bg-emerald-500' },
      credito: { label: 'Cartão de Crédito', amount: 0, count: 0, color: 'bg-indigo-500' },
      debito: { label: 'Cartão de Débito', amount: 0, count: 0, color: 'bg-sky-500' },
      dinheiro: { label: 'Dinheiro', amount: 0, count: 0, color: 'bg-amber-500' },
    };

    filteredOrders.forEach((ord) => {
      const pm = ord.paymentMethod || 'pix';
      if (methods[pm]) {
        methods[pm].amount += ord.total;
        methods[pm].count += 1;
      } else {
        methods.pix.amount += ord.total;
        methods.pix.count += 1;
      }
    });

    const totalCalculated = Object.values(methods).reduce((a, b) => a + b.amount, 0);

    return Object.entries(methods).map(([key, val]) => ({
      key,
      ...val,
      percentage: totalCalculated > 0 ? ((val.amount / totalCalculated) * 100).toFixed(1) : '0',
    }));
  }, [filteredOrders]);

  // Sales by Day of Week / Hourly Peak
  const salesByHour = useMemo(() => {
    const hoursMap: Record<number, number> = {};
    for (let h = 11; h <= 23; h++) {
      hoursMap[h] = 0;
    }

    filteredOrders.forEach((ord) => {
      const d = new Date(ord.createdAt);
      const hour = d.getHours();
      if (hoursMap[hour] !== undefined) {
        hoursMap[hour] += ord.total;
      }
    });

    const maxVal = Math.max(...Object.values(hoursMap), 1);

    return Object.entries(hoursMap).map(([hourStr, revenue]) => {
      const hour = Number(hourStr);
      return {
        hourLabel: `${hour}h`,
        revenue,
        heightPercent: Math.round((revenue / maxVal) * 100),
      };
    });
  }, [filteredOrders]);

  // Daily Sales Volume & Revenue Data for AreaChart
  const dailySalesData = useMemo(() => {
    const map: Record<string, { date: string; displayDate: string; revenue: number; ordersCount: number }> = {};

    let daysCount = 7;
    if (period === 'hoje') daysCount = 1;
    else if (period === 'semana') daysCount = 7;
    else if (period === 'mes') daysCount = 30;
    else daysCount = 14;

    const now = new Date();

    if (period !== 'tudo') {
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const isoDate = d.toISOString().split('T')[0];
        const displayDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        map[isoDate] = {
          date: isoDate,
          displayDate,
          revenue: 0,
          ordersCount: 0,
        };
      }
    }

    filteredOrders.forEach(o => {
      const isoDate = o.createdAt.split('T')[0];
      if (map[isoDate]) {
        map[isoDate].revenue += o.total;
        map[isoDate].ordersCount += 1;
      } else {
        const d = new Date(o.createdAt);
        const displayDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        map[isoDate] = {
          date: isoDate,
          displayDate,
          revenue: o.total,
          ordersCount: 1,
        };
      }
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders, period]);

  // Payment method pie chart data
  const paymentPieData = useMemo(() => {
    return paymentBreakdown
      .filter(p => p.amount > 0)
      .map(p => ({
        name: p.label,
        value: p.amount,
      }));
  }, [paymentBreakdown]);

  // Top products bar chart data
  const topProductsChartData = useMemo(() => {
    return productRanking
      .slice(0, 7)
      .map(p => ({
        name: p.name.length > 18 ? p.name.substring(0, 16) + '...' : p.name,
        fullName: p.name,
        quantidade: p.qty,
        faturamento: p.revenue,
      }));
  }, [productRanking]);

  const handlePrintReport = () => {
    setIsPrintModalOpen(true);
  };

  const handleExportCSV = () => {
    const periodLabel = period === 'hoje' ? 'Hoje' : period === 'semana' ? 'Esta Semana' : period === 'mes' ? 'Este Mes' : 'Periodo Geral';
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += `RELATORIO DE VENDAS - ESPETINHO DO CHEFE\n`;
    csvContent += `Periodo: ${periodLabel}\n`;
    csvContent += `Data de Geracao: ${new Date().toLocaleString('pt-BR')}\n\n`;
    
    csvContent += `RESUMO FINANCEIRO\n`;
    csvContent += `Faturamento Total (R$);${metrics.totalSales.toFixed(2)}\n`;
    csvContent += `Qtd de Pedidos;${metrics.totalOrdersCount}\n`;
    csvContent += `Ticket Medio (R$);${metrics.avgTicket.toFixed(2)}\n`;
    csvContent += `Lucro Estimado (R$);${metrics.estimatedProfit.toFixed(2)}\n`;
    csvContent += `Margem Lucro (%);${metrics.profitMargin}\n\n`;
    
    csvContent += `VENDAS POR FORMA DE PAGAMENTO\n`;
    csvContent += `Forma;Qtd;Total (R$);%\n`;
    paymentBreakdown.forEach((pm) => {
      csvContent += `"${pm.label}";${pm.count};${pm.amount.toFixed(2)};${pm.percentage}%\n`;
    });
    csvContent += `\n`;

    csvContent += `RANKING DE PRODUTOS MAIS VENDIDOS\n`;
    csvContent += `Posicao;Produto;Categoria;Qtd Vendida;Faturamento (R$)\n`;
    productRanking.forEach((item, index) => {
      csvContent += `${index + 1};"${item.name}";"${item.category}";${item.qty};${item.revenue.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_vendas_${period}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner & Period Switcher */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              📊 Relatórios & Faturamento
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Faturamento diário, semanal, mensal e ranking dos espetos mais vendidos.
            </p>
          </div>
        </div>

        {/* Header Actions: Filter Period & Export Button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
            {(
              [
                { id: 'hoje', label: 'Hoje' },
                { id: 'semana', label: 'Esta Semana' },
                { id: 'mes', label: 'Este Mês' },
                { id: 'tudo', label: 'Geral' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                  period === p.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center justify-center space-x-1.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>Exportar / Imprimir</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1: Faturamento */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-3.5 sm:p-5 rounded-2xl text-white shadow-md border border-slate-800 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <DollarSign className="w-16 h-16 text-emerald-400" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
            Faturamento ({period.toUpperCase()})
          </span>
          <div className="mt-1 sm:mt-2 text-lg sm:text-3xl font-black text-emerald-400 tracking-tight truncate">
            R$ {metrics.totalSales.toFixed(2).replace('.', ',')}
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] sm:text-xs text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{metrics.paidOrdersCount} pedidos</span>
          </div>
        </div>

        {/* KPI 2: Total de Pedidos */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
              Qtd Pedidos
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-3 text-lg sm:text-3xl font-black text-slate-900 truncate">
            {metrics.totalOrdersCount} <span className="text-xs font-semibold text-slate-400">ped.</span>
          </div>
          <div className="mt-1.5 text-[10px] sm:text-xs text-slate-500 truncate">
            {metrics.totalItemsQuantity} itens vendidos
          </div>
        </div>

        {/* KPI 3: Ticket Médio */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
              Ticket Médio
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-3 text-lg sm:text-3xl font-black text-slate-900 truncate">
            R$ {metrics.avgTicket.toFixed(2).replace('.', ',')}
          </div>
          <div className="mt-1.5 text-[10px] sm:text-xs text-slate-500 truncate">
            Média por comanda
          </div>
        </div>

        {/* KPI 4: Lucro Estimado */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
              Lucro Est.
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-3 text-lg sm:text-3xl font-black text-emerald-600 truncate">
            R$ {metrics.estimatedProfit.toFixed(2).replace('.', ',')}
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block w-fit">
            Margem aprox. ~{metrics.profitMargin}%
          </div>
        </div>
      </div>

      {/* CHARTS SECTION (Transferred from Dashboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* CHART 1: Area Chart - Daily Sales Volume & Revenue */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-red-50 text-red-600">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base uppercase tracking-tight">
                  Evolução do Faturamento & Vendas Diárias
                </h3>
                <p className="text-xs text-slate-500">
                  Desempenho em Reais (R$) no período selecionado.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Gráfico Interativo
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            {dailySalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySalesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenueRelatorios" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="displayDate" 
                    tickLine={false} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '12px', 
                      border: 'none', 
                      color: '#ffffff',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' 
                    }}
                    formatter={(value: any) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, 'Faturamento']}
                    labelFormatter={(label: any) => `Data: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Faturamento"
                    stroke="#ef4444" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenueRelatorios)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <BarChart2 className="w-8 h-8 text-slate-300 mb-1" />
                <span>Nenhum dado de venda para o período selecionado</span>
              </div>
            )}
          </div>
        </div>

        {/* CHART 2: Payment Methods Breakdown Pie Chart */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base uppercase tracking-tight">
                Distribuição por Pagamento
              </h3>
              <p className="text-xs text-slate-500">
                Divisão percentual das formas de pagamento.
              </p>
            </div>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {paymentPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '12px', 
                      border: 'none', 
                      color: '#ffffff' 
                    }}
                    formatter={(val: any) => `R$ ${Number(val).toFixed(2).replace('.', ',')}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs text-center">
                Sem registros de pagamentos no período
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {paymentPieData.map((item, idx) => (
              <div key={item.name} className="flex items-center space-x-2 text-xs">
                <span 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} 
                />
                <div className="truncate">
                  <span className="text-slate-600 font-medium block truncate text-[11px]">{item.name}</span>
                  <strong className="font-extrabold text-slate-900 text-[11px]">
                    R$ {item.value.toFixed(2).replace('.', ',')}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHART 3: Bar Chart - Top Products Sold */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base uppercase tracking-tight">
                Ranking Visual dos Produtos Mais Vendidos
              </h3>
              <p className="text-xs text-slate-500">
                Itens com maior volume de vendas no período.
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          {topProductsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                  interval={0}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '12px', 
                    border: 'none', 
                    color: '#ffffff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' 
                  }}
                  formatter={(val: any, name: any) => [
                    name === 'quantidade' ? `${val} unidades` : `R$ ${Number(val).toFixed(2).replace('.', ',')}`,
                    name === 'quantidade' ? 'Unidades Vendidas' : 'Faturamento'
                  ]}
                  labelFormatter={(label: any, payload: any) => {
                    if (payload && payload.length > 0) {
                      return payload[0].payload.fullName || label;
                    }
                    return label;
                  }}
                />
                <Bar 
                  dataKey="quantidade" 
                  name="quantidade" 
                  fill="#f97316" 
                  radius={[8, 8, 0, 0]} 
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <Award className="w-8 h-8 text-slate-300 mb-1" />
              <span>Nenhum produto vendido registrado no período</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Bestsellers ("QUAL VENDE MAIS") & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: RANKING "QUAL VENDE MAIS" */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-tight">
                  🏆 Qual Vende Mais? (Ranking dos Produtos)
                </h3>
                <p className="text-xs text-slate-500">
                  Itens mais pedidos na churrasqueira e bar no período.
                </p>
              </div>
            </div>

            {/* Category Filter for Ranking */}
            <select
              value={rankingCategory}
              onChange={(e) => setRankingCategory(e.target.value)}
              className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/50 cursor-pointer"
            >
              <option value="todos">Todas as Categorias</option>
              <option value="espetos_tradicionais">Espetos Tradicionais</option>
              <option value="espetos_especiais">Espetos Especiais</option>
              <option value="acompanhamentos">Acompanhamentos</option>
              <option value="bebidas">Bebidas</option>
              <option value="sobremesas">Sobremesas</option>
            </select>
          </div>

          {/* Ranking List */}
          {productRanking.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma venda registrada no período selecionado.
            </div>
          ) : (
            <div className="space-y-3">
              {productRanking.map((item, index) => {
                const totalUnitsSold = metrics.totalItemsQuantity || 1;
                const sharePercent = ((item.qty / totalUnitsSold) * 100).toFixed(1);

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      index === 0
                        ? 'bg-amber-500/10 border-amber-300 shadow-sm'
                        : index === 1
                        ? 'bg-slate-100/80 border-slate-300'
                        : index === 2
                        ? 'bg-amber-700/5 border-amber-200'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                      {/* Rank Position Badge */}
                      <div
                        className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                          index === 0
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                            : index === 1
                            ? 'bg-slate-300 text-slate-800'
                            : index === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                            {item.name}
                          </h4>
                          {index === 0 && (
                            <span className="bg-amber-500 text-slate-950 font-black text-[9px] uppercase px-1.5 py-0.5 rounded shrink-0">
                              Mais Vendido!
                            </span>
                          )}
                        </div>
                        {/* Progress Bar for share */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              index === 0 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(10, Number(sharePercent) * 2))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Revenue */}
                    <div className="text-right shrink-0 ml-3">
                      <div className="font-black text-slate-900 text-xs sm:text-sm">
                        {item.qty} <span className="text-[10px] text-slate-500 font-semibold">unid.</span>
                      </div>
                      <div className="text-[11px] font-bold text-emerald-600">
                        R$ {item.revenue.toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT 1 COL: FORMAS DE PAGAMENTO & RESUMO DE PICO */}
        <div className="space-y-6">
          {/* Payment Methods Breakdown */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-tight">
                Vendas por Forma de Pagamento
              </h3>
            </div>

            <div className="space-y-3.5">
              {paymentBreakdown.map((pm) => (
                <div key={pm.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${pm.color}`} />
                      {pm.label} ({pm.count})
                    </span>
                    <span>R$ {pm.amount.toFixed(2).replace('.', ',')} ({pm.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pm.color}`}
                      style={{ width: `${pm.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours Chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-tight">
                Horários de Maior Movimento
              </h3>
            </div>

            <div className="h-32 flex items-end justify-between gap-1 pt-4 px-1 border-b border-slate-100">
              {salesByHour.map((item) => (
                <div key={item.hourLabel} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div
                    className="w-full bg-gradient-to-t from-red-600 to-amber-500 rounded-t transition-all group-hover:brightness-110"
                    style={{ height: `${Math.max(8, item.heightPercent)}%` }}
                    title={`${item.hourLabel}: R$ ${item.revenue.toFixed(2)}`}
                  />
                  <span className="text-[9px] font-bold text-slate-500">{item.hourLabel}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Pico habitual das 19h às 22h (Horário do Jantar na Churrasqueira).
            </p>
          </div>

          {/* Export / Print Button */}
          <button
            onClick={handlePrintReport}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Imprimir Resumo Executivo</span>
          </button>
        </div>
      </div>

      {/* MODAL: RELATÓRIO SIMPLIFICADO PARA IMPRESSÃO */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 print-container">
            {/* Modal Header Actions (Hidden when printing) */}
            <div className="no-print flex items-center justify-between p-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  Pré-visualização do Relatório Simplificado
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Baixar em formato de planilha (CSV)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">Baixar CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Content */}
            <div className="printable-report p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 font-sans print:p-4 print:space-y-4">
              {/* Report Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🍖</span>
                    <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                      Espetinho do Chefe
                    </h1>
                  </div>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">
                    Relatório Simplificado de Vendas
                  </p>
                </div>
                <div className="text-right text-xs space-y-0.5">
                  <div className="font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md inline-block uppercase tracking-wider text-[11px]">
                    Período: {period === 'hoje' ? 'Hoje' : period === 'semana' ? 'Esta Semana' : period === 'mes' ? 'Este Mês' : 'Período Geral'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium pt-1">
                    Emitido em: {new Date().toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Section 1: Financial Overview */}
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-3">
                  1. Resumo Executivo & Financeiro
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Faturamento Total</span>
                    <span className="text-base font-black text-emerald-600 block mt-0.5">
                      R$ {metrics.totalSales.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Pedidos</span>
                    <span className="text-base font-black text-slate-900 block mt-0.5">
                      {metrics.totalOrdersCount} ({metrics.totalItemsQuantity} itens)
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Ticket Médio</span>
                    <span className="text-base font-black text-slate-900 block mt-0.5">
                      R$ {metrics.avgTicket.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Lucro Estimado</span>
                    <span className="text-base font-black text-emerald-700 block mt-0.5">
                      R$ {metrics.estimatedProfit.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Payments Breakdown */}
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-2">
                  2. Recebimentos por Forma de Pagamento
                </h2>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase text-[10px]">
                      <th className="py-1.5">Forma</th>
                      <th className="py-1.5 text-center">Transações</th>
                      <th className="py-1.5 text-right">Valor Total</th>
                      <th className="py-1.5 text-right">% do Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentBreakdown.map((pm) => (
                      <tr key={pm.key} className="text-slate-800">
                        <td className="py-1.5 font-bold">{pm.label}</td>
                        <td className="py-1.5 text-center font-medium">{pm.count}</td>
                        <td className="py-1.5 text-right font-black">R$ {pm.amount.toFixed(2).replace('.', ',')}</td>
                        <td className="py-1.5 text-right font-bold text-slate-500">{pm.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section 3: Bestsellers Top Products */}
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-2">
                  3. Produtos & Espetos Mais Vendidos
                </h2>
                {productRanking.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 italic text-center">Nenhuma venda registrada no período.</p>
                ) : (
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase text-[10px]">
                        <th className="py-1.5 w-8">#</th>
                        <th className="py-1.5">Produto</th>
                        <th className="py-1.5 text-center">Qtd Vendida</th>
                        <th className="py-1.5 text-right">Faturamento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productRanking.slice(0, 10).map((prod, idx) => (
                        <tr key={prod.id} className="text-slate-800">
                          <td className="py-1.5 font-black text-slate-500">{idx + 1}º</td>
                          <td className="py-1.5 font-extrabold text-slate-900">{prod.name}</td>
                          <td className="py-1.5 text-center font-black">{prod.qty} unid.</td>
                          <td className="py-1.5 text-right font-black text-emerald-600">
                            R$ {prod.revenue.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Printable Document Footer */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Espetinho do Chefe — Sistema de Gestão</span>
                <span>Documento Impresso / Exportado para Conferência</span>
              </div>
            </div>

            {/* Modal Bottom Action Bar (Hidden when printing) */}
            <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Pronto para enviar para impressora ou salvar como PDF.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Agora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
