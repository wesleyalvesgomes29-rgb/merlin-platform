import React, { useState } from 'react';
import { Sale, Client } from '../types';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Calendar, 
  Award, 
  Activity, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface CommissionsProps {
  sales: Sale[];
  clients: Client[];
  onAddSale: (sale: Omit<Sale, 'id'>) => void;
  onDeleteSale: (id: string) => void;
}

export default function Commissions({
  sales,
  clients,
  onAddSale,
  onDeleteSale
}: CommissionsProps) {
  const [clientSelectionType, setClientSelectionType] = useState<'existing' | 'custom'>('existing');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [commissionValue, setCommissionValue] = useState('');
  const [saleDate, setSaleDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const referenceDate = new Date();
  const currentMonth = referenceDate.getMonth(); // 0-indexed
  const currentYear = referenceDate.getFullYear();

  // Metric Calculations
  // Month Commission
  const monthlySales = sales.filter(s => {
    const sDate = new Date(s.saleDate);
    // Be careful with timezone differences, checking ISO month/year is safer
    return sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
  });
  const monthCommissionTotal = monthlySales.reduce((sum, s) => sum + s.commissionValue, 0);

  // Year Commission
  const annualSales = sales.filter(s => {
    const sDate = new Date(s.saleDate);
    return sDate.getFullYear() === currentYear;
  });
  const yearCommissionTotal = annualSales.reduce((sum, s) => sum + s.commissionValue, 0);

  // Total Sales
  const totalSalesCount = sales.length;

  // Ticket Médio (Average commission value per sale)
  const ticketMedio = totalSalesCount > 0 
    ? Math.round(sales.reduce((sum, s) => sum + s.commissionValue, 0) / totalSalesCount)
    : 0;

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    let clientName = '';
    let clientId: string | undefined = undefined;

    if (clientSelectionType === 'existing') {
      const foundClient = clients.find(c => c.id === selectedClientId);
      if (!foundClient) {
        alert('Selecione um cliente válido ou digite um nome avulso.');
        return;
      }
      clientName = foundClient.name;
      clientId = foundClient.id;
    } else {
      if (!customClientName.trim()) {
        alert('Digite o nome do comprador.');
        return;
      }
      clientName = customClientName.trim();
    }

    const value = parseFloat(commissionValue);
    if (isNaN(value) || value <= 0) {
      alert('Digite um valor de comissão válido.');
      return;
    }

    onAddSale({
      clientId,
      clientName,
      commissionValue: value,
      saleDate
    });

    // Reset Form
    setSelectedClientId('');
    setCustomClientName('');
    setCommissionValue('');
    setShowAddForm(false);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6" id="commissions-panel">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Controle Financeiro &amp; Comissões</h2>
          <p className="text-xs text-slate-500 font-medium">Acompanhe seu rendimento mensal, faturamento anual e resultados acumulados</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all self-start md:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Registrar Nova Venda</span>
        </button>
      </div>

      {/* Commissions Metric Bento Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Card 1: Month Commission */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Comissão do Mês</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(monthCommissionTotal)}</h4>
            <p className="text-[10px] text-slate-400">Arrecadado em Julho/2026</p>
          </div>
        </div>

        {/* Metric Card 2: Year Commission */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Comissão do Ano</span>
            <div className="p-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-lg">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(yearCommissionTotal)}</h4>
            <p className="text-[10px] text-slate-400">Acumulado em {currentYear}</p>
          </div>
        </div>

        {/* Metric Card 3: Total Sales */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Número de Vendas</span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalSalesCount}</h4>
            <p className="text-[10px] text-slate-400">Escrituras fechadas totais</p>
          </div>
        </div>

        {/* Metric Card 4: Ticket Médio */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ticket Médio</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(ticketMedio)}</h4>
            <p className="text-[10px] text-slate-400">Média por intermediação</p>
          </div>
        </div>
      </div>

      {/* Sale Registration Card Dropdown */}
      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
        >
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-teal-500" />
              <span>Registrar Venda &amp; Recebimento de Comissão</span>
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <form onSubmit={handleSubmitSale} className="space-y-4">
            {/* Choose whether to grab an existing client or write down a direct name */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 w-fit">
              <span className="text-xs font-semibold text-slate-500 pl-1">Vendido para:</span>
              <button
                type="button"
                onClick={() => setClientSelectionType('existing')}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                  clientSelectionType === 'existing'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs border border-slate-100 dark:border-slate-800'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Cliente do CRM
              </button>
              <button
                type="button"
                onClick={() => setClientSelectionType('custom')}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                  clientSelectionType === 'custom'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs border border-slate-100 dark:border-slate-800'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Nome Avulso
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Buyer selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome do Comprador</label>
                {clientSelectionType === 'existing' ? (
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                    required
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Ex: Carlos Albuquerque"
                    value={customClientName}
                    onChange={(e) => setCustomClientName(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                    required
                  />
                )}
              </div>

              {/* Commission value */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Valor da Comissão (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="12500"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 p-2.5 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                    required
                  />
                </div>
              </div>

              {/* Date of sale */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Data da Venda</label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-850 pt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-500 font-semibold px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="text-xs bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm"
              >
                Salvar Lançamento
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Sales Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Histórico de Lançamentos</h3>
          <span className="text-xs font-semibold text-slate-400">Mostrando {sales.length} vendas</span>
        </div>

        {sales.length === 0 ? (
          <div className="p-16 text-center text-slate-400 dark:text-slate-600">
            <AlertCircle className="h-10 w-10 mx-auto text-slate-350 mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhuma venda cadastrada</p>
            <p className="text-xs max-w-sm mx-auto mt-1">Insira seu primeiro recebimento de comissão para preencher a tabela financeira.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Cliente Comprador</th>
                  <th className="p-4">Data da Venda</th>
                  <th className="p-4 text-right">Comissão Recebida</th>
                  <th className="p-4 pr-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {sales
                  .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
                  .map(sale => {
                    return (
                      <tr 
                        key={sale.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all"
                        id={`sale-row-${sale.id}`}
                      >
                        <td className="p-4 pl-6 font-bold text-slate-800 dark:text-slate-100">
                          {sale.clientName}
                          {sale.clientId && (
                            <span className="text-[9px] text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900 px-1.5 py-0.2 rounded-sm ml-2 font-medium">
                              Cliente CRM
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-slate-500 font-semibold">
                          {new Date(sale.saleDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                          {formatCurrency(sale.commissionValue)}
                        </td>
                        <td className="p-4 text-center pr-6">
                          <button
                            onClick={() => {
                              if (confirm(`Remover permanentemente o registro de comissão de ${sale.clientName}?`)) {
                                onDeleteSale(sale.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                            title="Remover Registro"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple X icon helper replacement if it fails
function X({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={2} 
      stroke="currentColor" 
      className={className}
      onClick={onClick}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
