import React, { useState, useMemo } from 'react';
import { Client, Sale, Tag } from '../../../types';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  CheckCircle, 
  MessageSquare, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Lightbulb, 
  Send, 
  Check, 
  Layers, 
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface IntelligenceDashboardProps {
  clients: Client[];
  sales: Sale[];
  tags: Tag[];
  onSelectClient: (id: string) => void;
}

export default function IntelligenceDashboard({
  clients,
  sales,
  tags,
  onSelectClient
}: IntelligenceDashboardProps) {
  // 1. STATE MANAGEMENT
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [messageGoal, setMessageGoal] = useState<string>('contact_initial');
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState<boolean>(false);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);

  // AI Strategic Recommendations States
  const [aiRecommendations, setAiRecommendations] = useState<string>('');
  const [isAnalyzingLeads, setIsAnalyzingLeads] = useState<boolean>(false);

  // 2. STATISTICS AND CALCULATIONS (CRM DATA ANALYSIS)
  const totalLeads = clients.length;
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return counts;
  }, [clients]);

  // Clients without future action
  const noNextContactCount = useMemo(() => {
    return clients.filter(c => !c.nextContactDate && c.status !== 'Venda Fechada' && c.status !== 'Perdido').length;
  }, [clients]);

  // Stale leads: no comments, history, or updates in 15 days
  const staleLeads = useMemo(() => {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    return clients.filter(c => {
      if (c.status === 'Venda Fechada' || c.status === 'Perdido') return false;
      const lastUpdateStr = c.lastContactDate || c.createdAt;
      const lastUpdateDate = new Date(lastUpdateStr);
      return lastUpdateDate < fifteenDaysAgo;
    });
  }, [clients]);

  // Sales calculations
  const totalSalesCount = sales.length;
  const totalCommission = useMemo(() => {
    return sales.reduce((sum, sale) => sum + sale.commissionValue, 0);
  }, [sales]);

  // Client dropdown options
  const sortedClientsForMessage = useMemo(() => {
    return [...clients].sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  // Selected client details for preview
  const activeClientObj = useMemo(() => {
    return clients.find(c => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  // Lead Sources (Origem) Distribution for chart
  const leadSourceData = useMemo(() => {
    const sources: Record<string, number> = {};
    clients.forEach(c => {
      const src = c.origem || 'Desconhecida/Outro';
      sources[src] = (sources[src] || 0) + 1;
    });
    return Object.entries(sources).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [clients]);

  // Real estate development interest distribution for chart
  const developmentInterestData = useMemo(() => {
    const interests: Record<string, number> = {};
    clients.forEach(c => {
      if (c.empreendimento) {
        interests[c.empreendimento] = (interests[c.empreendimento] || 0) + 1;
      }
    });
    return Object.entries(interests).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [clients]);

  // Recharts Chart Colors
  const COLORS = ['#0d9488', '#0f766e', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1'];

  const funnelChartData = useMemo(() => {
    const statuses = [
      'Lead Novo', 'Contato', 'Em Atendimento', 'Retrabalho', 'Agendado',
      'Visitou', 'Proposta', 'Documentação', 'Venda Fechada', 'Perdido'
    ];
    return statuses.map(status => ({
      name: status,
      leads: stageCounts[status] || 0
    }));
  }, [stageCounts]);

  // 3. COPYWRITING AND RECOMENDATIONS TRIGGERS
  const handleGenerateMessage = async () => {
    if (!selectedClientId || !activeClientObj) return;

    setIsGeneratingMessage(true);
    setGeneratedMessage('');
    try {
      const response = await fetch('/api/gemini/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: activeClientObj.name,
          clientInterest: activeClientObj.empreendimento,
          clientNotes: activeClientObj.notes,
          clientStatus: activeClientObj.status,
          goal: getGoalLabel(messageGoal)
        })
      });

      const data = await response.json();
      if (response.ok) {
        setGeneratedMessage(data.text || '');
      } else {
        setGeneratedMessage(`Erro: ${data.error || 'Erro ao conectar ao assistente Merlin IA.'}`);
      }
    } catch (err) {
      console.error(err);
      setGeneratedMessage('Erro de conexão ao servidor. Verifique se o backend está sendo executado corretamente.');
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  const handleCopyMessage = () => {
    if (!generatedMessage) return;
    navigator.clipboard.writeText(generatedMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleSendWhatsApp = () => {
    if (!activeClientObj || !generatedMessage) return;
    const cleanPhone = activeClientObj.phone.replace(/\D/g, '');
    const encodedText = encodeURIComponent(generatedMessage);
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  const handleAnalyzeLeads = async () => {
    setIsAnalyzingLeads(true);
    setAiRecommendations('');
    try {
      const summary = {
        totalCount: totalLeads,
        noNextContactCount,
        staleCount: staleLeads.length,
        stageCounts
      };

      const response = await fetch('/api/gemini/analyze-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientsSummary: summary,
          salesCount: totalSalesCount,
          totalCommission
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAiRecommendations(data.text || '');
      } else {
        setAiRecommendations(`Incapaz de auditar a base neste momento: ${data.error || 'Erro na API'}`);
      }
    } catch (err) {
      console.error(err);
      setAiRecommendations('Não foi possível se conectar ao servidor Merlin Intelligence.');
    } finally {
      setIsAnalyzingLeads(false);
    }
  };

  // Predefined message objective labels
  const getGoalLabel = (key: string): string => {
    switch (key) {
      case 'contact_initial': return 'Fazer um primeiro contato amigável após o recebimento do lead.';
      case 'schedule_visit': return 'Agendar uma visita presencial ao empreendimento de interesse do cliente.';
      case 'follow_up': return 'Fazer follow-up após uma visita realizada para saber o feedback e o que acharam.';
      case 'request_docs': return 'Solicitar documentação ou dados para realizar a proposta formal de compra.';
      case 'reactivate': return 'Reativar um contato antigo que parou de responder, oferecendo uma novidade ou perguntando se ainda busca imóvel.';
      case 'gratitude': return 'Agradecer pela confiança após o fechamento da venda ou envio de proposta.';
      default: return 'Iniciar uma conversa natural de vendas.';
    }
  };

  // Simple Markdown to HTML-like parser for rendering recommendations nicely
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return <h4 key={idx} className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2">{trimmed.replace('###', '').trim()}</h4>;
      }
      if (trimmed.startsWith('##')) {
        return <h3 key={idx} className="text-base font-bold text-slate-800 dark:text-slate-100 mt-5 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">{trimmed.replace('##', '').trim()}</h3>;
      }
      if (trimmed.startsWith('#')) {
        return <h2 key={idx} className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-6 mb-3">{trimmed.replace('#', '').trim()}</h2>;
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        // bold parser
        const bulletText = trimmed.substring(1).trim();
        return (
          <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 ml-4 list-disc mb-1 leading-relaxed">
            {parseBoldText(bulletText)}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">{parseBoldText(trimmed)}</p>;
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-slate-800 dark:text-slate-200">{part}</strong> : part);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* HEADER SECTION */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-2xl -ml-20 -mb-20"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-full text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-teal-400" />
              <span>Plataforma Merlin &bull; Inteligência Ativa</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display text-white">
              Merlin Intelligence
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed">
              Análise tática integrada à sua base de leads. Identifique gargalos no seu funil de vendas, avalie a temperatura de leads e crie scripts persuasivos de WhatsApp personalizados em segundos via IA.
            </p>
          </div>

          <button
            onClick={handleAnalyzeLeads}
            disabled={isAnalyzingLeads || totalLeads === 0}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isAnalyzingLeads 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 active:scale-95'
            }`}
          >
            {isAnalyzingLeads ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Auditando Base de Dados...</span>
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 text-slate-950 animate-bounce" />
                <span>Gerar Auditoria de Negócios via Merlin IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* LEAD QUALITY INDICATORS AND CRITICAL BOTTLENECKS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Total Leads */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Leads Ativos no CRM</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-display">
              {totalLeads}
            </span>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* KPI: No Agendamento */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sem Retorno Agendado</span>
            <span className={`text-2xl font-black font-display ${noNextContactCount > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'}`}>
              {noNextContactCount}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${noNextContactCount > 0 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500' : 'bg-slate-50 dark:bg-slate-800/80 text-slate-500'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* KPI: Inactive / Stale Leads */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estagnados (Sem contato +15d)</span>
            <span className={`text-2xl font-black font-display ${staleLeads.length > 0 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100'}`}>
              {staleLeads.length}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${staleLeads.length > 0 ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500' : 'bg-slate-50 dark:bg-slate-800/80 text-slate-500'}`}>
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>

        {/* KPI: Accumulative Commissions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vendas e Comissões</span>
            <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-display truncate max-w-[150px]" title={`R$ ${totalCommission.toLocaleString('pt-BR')}`}>
              R$ {totalCommission.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* AI RECOMMENDATIONS CONTAINER */}
      {aiRecommendations && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-teal-50/50 dark:bg-slate-900 border-2 border-teal-500/20 dark:border-teal-500/10 rounded-2xl p-6 shadow-md"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-teal-500 text-slate-950 rounded-xl">
              <Sparkles className="h-5 w-5 text-slate-950 animate-spin" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-950 dark:text-slate-100">Auditoria Tática Merlin IA</h2>
              <p className="text-[10px] text-slate-500 font-medium">Recomendações e Plano de Ação Estratégico</p>
            </div>
          </div>
          
          <div className="space-y-3 pl-1 pr-1">
            {renderMarkdown(aiRecommendations)}
          </div>
        </motion.div>
      )}

      {/* LOWER GRID: IA COPYWRITER (LEFT) AND GRAPH DISTRIBUTIONS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: IA MESSAGE GENERATOR (8 COLUMNS) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-teal-500" />
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Abordagem Inteligente via IA</h2>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Crie copys de WhatsApp extremamente naturais e adaptados ao perfil do lead para reativar contatos ou acelerar propostas de compra.
            </p>
          </div>

          <div className="space-y-4">
            {/* Lead Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Selecione o Lead do CRM</label>
              {totalLeads === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center text-xs text-slate-400">
                  Nenhum cliente disponível no CRM. Cadastre um cliente primeiro.
                </div>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    setGeneratedMessage('');
                  }}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="">-- Selecione o Lead para o Script --</option>
                  {sortedClientsForMessage.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.empreendimento ? `(${c.empreendimento})` : ''} - {c.status}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selected Lead Profile Overview */}
            {activeClientObj && (
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-xl p-3 text-xs space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Resumo do Lead</span>
                  <button 
                    onClick={() => onSelectClient(activeClientObj.id)}
                    className="text-[10px] text-teal-500 hover:text-teal-600 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    Ver Ficha Completa <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-medium">Nome:</span> <strong className="text-slate-700 dark:text-slate-300 font-semibold">{activeClientObj.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Imóvel:</span> <strong className="text-slate-700 dark:text-slate-300 font-semibold">{activeClientObj.empreendimento || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Origem do Lead:</span> <strong className="text-slate-700 dark:text-slate-300 font-semibold">{activeClientObj.origem || 'Não preenchida'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Contatos realizados:</span> <strong className="text-slate-700 dark:text-slate-300 font-semibold">{activeClientObj.contactCount} vezes</strong>
                  </div>
                </div>
                {activeClientObj.notes && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                    <span className="text-slate-400 font-medium block">Notas / Perfil:</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed italic text-[11px]">"{activeClientObj.notes}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Abordagem Predefined Goal Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Objetivo da Abordagem</label>
              <select
                value={messageGoal}
                onChange={(e) => setMessageGoal(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="contact_initial">Apresentação / Contato Inicial</option>
                <option value="schedule_visit">Agendamento de Visita no Imóvel</option>
                <option value="follow_up">Feedback Pós-Visita Recente</option>
                <option value="request_docs">Solicitar Documentos para Proposta</option>
                <option value="reactivate">Reativar Lead Antigo Inativo</option>
                <option value="gratitude">Agradecimento e Próximos Passos</option>
              </select>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handleGenerateMessage}
            disabled={isGeneratingMessage || !selectedClientId}
            className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
              !selectedClientId 
                ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-800' 
                : isGeneratingMessage 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-bold active:scale-98'
            }`}
          >
            {isGeneratingMessage ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Merlin está redigindo o script de venda...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Gerar Roteiro Personalizado via IA</span>
              </>
            )}
          </button>

          {/* GENERATED TEXT AREA OUTLET */}
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase block">Script Sugerido</label>
            <div className="relative">
              <textarea
                value={generatedMessage}
                readOnly
                placeholder="O script gerado por Merlin IA aparecerá aqui..."
                className="w-full h-40 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden leading-relaxed resize-none font-mono"
              />
              
              {generatedMessage && (
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button
                    onClick={handleCopyMessage}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-xs cursor-pointer active:scale-90 transition-all flex items-center gap-1.5 text-[10px] font-bold"
                    title="Copiar para a área de transferência"
                  >
                    {copiedMessage ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSendWhatsApp}
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-xs cursor-pointer active:scale-90 transition-all flex items-center gap-1.5 text-[10px] font-bold"
                    title="Enviar diretamente via WhatsApp"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LEAD STATS / CHARTS (5 COLUMNS) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Funnel distribution chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs">
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-teal-500" />
                <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Carga do Funil de Vendas</h2>
              </div>
              <p className="text-[10px] text-slate-400">Distribuição total de leads ativos por etapa</p>
            </div>

            <div className="h-56">
              {totalLeads === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                  Sem dados para exibição do gráfico de funil.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={funnelChartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.1} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 'bold' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#94a3b8', fontSize: 9 }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                      labelStyle={{ fontWeight: 'bold', color: '#14b8a6' }}
                    />
                    <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                      {funnelChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Venda Fechada' ? '#10b981' : entry.name === 'Perdido' ? '#f43f5e' : '#0d9488'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Development Interest Rank & Lead Source Rank */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-teal-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Top Origens de Lead</h3>
              </div>
              
              {leadSourceData.length === 0 || totalLeads === 0 ? (
                <span className="text-xs text-slate-400 italic block">Nenhum dado cadastrado.</span>
              ) : (
                <div className="space-y-2 pt-1">
                  {leadSourceData.slice(0, 3).map((item, index) => {
                    const percentage = totalLeads > 0 ? Math.round((item.value / totalLeads) * 100) : 0;
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 font-medium">
                          <span>{item.name}</span>
                          <span className="font-bold text-slate-500">{item.value} ({percentage}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Empreendimentos Populares</h3>
              </div>
              
              {developmentInterestData.length === 0 || totalLeads === 0 ? (
                <span className="text-xs text-slate-400 italic block">Nenhum empreendimento de interesse preenchido.</span>
              ) : (
                <div className="space-y-2 pt-1">
                  {developmentInterestData.map((item, index) => {
                    const percentage = totalLeads > 0 ? Math.round((item.value / totalLeads) * 100) : 0;
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 font-medium">
                          <span className="truncate max-w-[200px]">{item.name}</span>
                          <span className="font-bold text-slate-500">{item.value} ({percentage}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
