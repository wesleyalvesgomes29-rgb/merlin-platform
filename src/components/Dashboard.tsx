import React from 'react';
import { Client, Sale } from '../types';
import { getClientAlerts, getDaysSinceContact } from '../lib/storage';
import { 
  Users, 
  UserCheck, 
  Activity, 
  Calendar, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  RotateCw,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  CartesianGrid
} from 'recharts';

interface DashboardProps {
  clients: Client[];
  sales: Sale[];
  onSelectClient: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ clients, sales, onSelectClient, onNavigate }: DashboardProps) {
  const referenceDate = new Date();
  const currentMonth = referenceDate.getMonth(); // 0-indexed
  const currentYear = referenceDate.getFullYear();

  // Metrics Calculations
  const totalClients = clients.length;

  const leadsNovosCount = clients.filter(c => c.status === 'Lead Novo').length;

  const atrasadosCount = clients.filter(c => {
    const alerts = getClientAlerts(c);
    return alerts.isAtrasado;
  }).length;

  const retornarHojeCount = clients.filter(c => {
    if (!c.nextContactDate) return false;
    const d = new Date(c.nextContactDate);
    return (
      d.getFullYear() === referenceDate.getFullYear() &&
      d.getMonth() === referenceDate.getMonth() &&
      d.getDate() === referenceDate.getDate() &&
      c.status !== 'Venda Fechada' &&
      c.status !== 'Perdido'
    );
  }).length;

  // Clientes para retrabalho = suggested (days since contact > 7) or has status/tag Retrabalho
  const retrabalhoSugeridosCount = clients.filter(c => {
    const alerts = getClientAlerts(c);
    return (alerts.isRetrabalhoSugerido || c.status === 'Retrabalho' || c.tags.includes('Retrabalho')) &&
      c.status !== 'Venda Fechada' && c.status !== 'Perdido';
  }).length;

  // Sum of contactCount across all clients
  const totalRetrabalhosFeitos = clients.reduce((sum, c) => sum + (c.contactCount || 0), 0);

  // Sales and commissions metrics
  const monthlySales = sales.filter(s => {
    const sDate = new Date(s.saleDate);
    return sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
  });

  const monthlyCommissionSum = monthlySales.reduce((sum, s) => sum + s.commissionValue, 0);

  // Conversion rate: Venda Fechada / (Venda Fechada + Perdido)
  const totalFechadas = clients.filter(c => c.status === 'Venda Fechada').length;
  const totalPerdidos = clients.filter(c => c.status === 'Perdido').length;
  const conversionRate = totalFechadas + totalPerdidos > 0 
    ? Math.round((totalFechadas / (totalFechadas + totalPerdidos)) * 100) 
    : 0;

  // CHART DATA 1: Funnel distribution
  const funnelStages: { name: string; value: number; color: string }[] = [
    { name: 'Lead Novo', value: clients.filter(c => c.status === 'Lead Novo').length, color: '#10b981' },
    { name: 'Contato', value: clients.filter(c => c.status === 'Contato').length, color: '#3b82f6' },
    { name: 'Em Atendimento', value: clients.filter(c => c.status === 'Em Atendimento').length, color: '#8b5cf6' },
    { name: 'Retrabalho', value: clients.filter(c => c.status === 'Retrabalho').length, color: '#f59e0b' },
    { name: 'Agendado', value: clients.filter(c => c.status === 'Agendado').length, color: '#a855f7' },
    { name: 'Visitou', value: clients.filter(c => c.status === 'Visitou').length, color: '#06b6d4' },
    { name: 'Proposta', value: clients.filter(c => c.status === 'Proposta').length, color: '#eab308' },
    { name: 'Documentação', value: clients.filter(c => c.status === 'Documentação').length, color: '#14b8a6' },
    { name: 'Venda Fechada', value: clients.filter(c => c.status === 'Venda Fechada').length, color: '#22c55e' },
    { name: 'Perdido', value: clients.filter(c => c.status === 'Perdido').length, color: '#ef4444' }
  ];

  // CHART DATA 2: Commission by Month in 2026
  // Generate list of months
  const monthsBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const commissionChartData = monthsBR.map((monthName, idx) => {
    const monthSales = sales.filter(s => {
      const sDate = new Date(s.saleDate);
      return sDate.getMonth() === idx && sDate.getFullYear() === 2026;
    });
    const totalVal = monthSales.reduce((sum, s) => sum + s.commissionValue, 0);
    return {
      name: monthName,
      Comissao: totalVal
    };
  });

  // CHART DATA 3: Ranking dos Esquecidos (Days without contact, for warm clients, sorted descending)
  const warmClientsEsquecidos = clients
    .filter(c => c.status !== 'Venda Fechada' && c.status !== 'Perdido')
    .map(c => ({
      name: c.name,
      diasSemContato: getDaysSinceContact(c),
      id: c.id
    }))
    .sort((a, b) => b.diasSemContato - a.diasSemContato)
    .slice(0, 5); // top 5 neglected clients

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-8" id="dashboard-panel">
      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Total Clientes */}
        <div 
          onClick={() => onNavigate('clientes')}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-teal-300 dark:hover:border-teal-800 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Clientes</span>
            <div className="p-2 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{totalClients}</h4>
            <p className="text-[10px] text-slate-400">Ativos no banco de dados</p>
          </div>
        </div>

        {/* KPI: Leads Novos */}
        <div 
          onClick={() => onNavigate('clientes')}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leads Novos</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{leadsNovosCount}</h4>
            <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium">Aguardando atendimento</p>
          </div>
        </div>

        {/* KPI: Retrabalhos / Seguidos */}
        <div 
          onClick={() => onNavigate('meu_dia')}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Para Retrabalho</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
              <RotateCw className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{retrabalhoSugeridosCount}</h4>
            <p className="text-[10px] text-slate-400">
              {totalRetrabalhosFeitos} contatos já realizados
            </p>
          </div>
        </div>

        {/* KPI: Clientes para Retornar Hoje */}
        <div 
          onClick={() => onNavigate('meu_dia')}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Retornar Hoje</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {retornarHojeCount}
            </h4>
            <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold flex items-center gap-1">
              {atrasadosCount > 0 && (
                <>
                  <AlertTriangle className="h-3 w-3 animate-pulse" />
                  <span>{atrasadosCount} atrasados!</span>
                </>
              )}
              {atrasadosCount === 0 && <span>Tudo em dia</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Commission Highlights */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-xl">
            <DollarSign className="h-8 w-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Comissão de Julho/2026</span>
            <h2 className="text-3xl font-black mt-1 text-emerald-400">{formatCurrency(monthlyCommissionSum)}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Refere-se a <strong>{monthlySales.length}</strong> venda{monthlySales.length > 1 ? 's fechadas' : ' fechada'} no mês corrente.
            </p>
          </div>
        </div>

        <div className="flex flex-row md:flex-col lg:flex-row gap-6 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
          <div className="flex-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Taxa de Conversão</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{conversionRate}%</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-[10px] text-slate-500">De propostas ganhas vs perdidas</p>
          </div>

          <div className="w-px bg-slate-800 hidden lg:block" />

          <div className="flex-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Conversas Totais</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{totalRetrabalhosFeitos}</span>
              <Activity className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="text-[10px] text-slate-500">Toques de relacionamento</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Funnel chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 lg:col-span-7">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Funil de Vendas Imobiliário</h3>
            <p className="text-xs text-slate-500">Distribuição de clientes por etapa de atendimento</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelStages.filter(f => f.value > 0)}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '8px', 
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px'
                  }} 
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {funnelStages.filter(f => f.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Neglected Clients list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 lg:col-span-5">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Ranking dos Esquecidos</h3>
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200">
                Ação Requerida
              </span>
            </div>
            <p className="text-xs text-slate-500">Clientes quentes sem contato há mais tempo</p>
          </div>

          <div className="space-y-3">
            {warmClientsEsquecidos.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Nenhum cliente quente pendente.</p>
            ) : (
              warmClientsEsquecidos.map((item, idx) => {
                const clientObj = clients.find(c => c.id === item.id);
                const isUrgente = item.diasSemContato > 15;
                const isRetrabalho = item.diasSemContato > 7;

                return (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                        <h4 
                          onClick={() => onSelectClient(item.id)}
                          className="font-bold text-sm text-slate-800 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
                        >
                          {item.name}
                        </h4>
                      </div>
                      <p className="text-[10px] font-mono text-slate-500">
                        Último toque: {clientObj?.lastContactDate ? new Date(clientObj.lastContactDate).toLocaleDateString() : 'Nenhum'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2 py-1 rounded-md ${
                        isUrgente 
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200' 
                          : isRetrabalho 
                            ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border border-orange-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {item.diasSemContato} dias sem contato
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Commissions Area Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
        <div className="mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Evolução de Comissões (2026)</h3>
          <p className="text-xs text-slate-500">Histórico de rendimento acumulado por mês em Reais (R$)</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={commissionChartData}>
              <defs>
                <linearGradient id="colorCom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 10 }} 
                tickFormatter={(val) => `R$ ${val / 1000}k`}
              />
              <Tooltip 
                formatter={(val: number) => [formatCurrency(val), 'Comissão']}
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  borderRadius: '8px', 
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px'
                }} 
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:hidden" />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" className="hidden dark:block" />
              <Area type="monotone" dataKey="Comissao" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCom)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
