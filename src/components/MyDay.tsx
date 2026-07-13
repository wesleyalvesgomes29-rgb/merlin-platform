import React, { useState } from 'react';
import { Client, Tag } from '../types';
import { getClientAlerts, isToday, getDaysSinceContact } from '../lib/storage';
import { 
  Phone, 
  MessageSquare, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  UserPlus, 
  ArrowRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { motion } from 'motion/react';

interface MyDayProps {
  clients: Client[];
  tags: Tag[];
  onSelectClient: (id: string) => void;
  onQuickContact: (id: string) => void;
  onQuickReschedule: (id: string, dateStr: string) => void;
}

export default function MyDay({
  clients,
  tags,
  onSelectClient,
  onQuickContact,
  onQuickReschedule
}: MyDayProps) {
  const [activeTab, setActiveTab] = useState<'meu_dia' | 'prioridade_hoje'>('meu_dia');
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  // Current reference details
  const todayClients = clients.filter(c => {
    const alerts = getClientAlerts(c);
    return isToday(c.nextContactDate) && c.status !== 'Venda Fechada' && c.status !== 'Perdido';
  });

  const overdueClients = clients.filter(c => {
    const alerts = getClientAlerts(c);
    return alerts.isAtrasado;
  });

  const retrabalhoClients = clients.filter(c => {
    const alerts = getClientAlerts(c);
    return (alerts.isRetrabalhoSugerido || c.status === 'Retrabalho' || c.tags.includes('Retrabalho')) &&
      c.status !== 'Venda Fechada' && c.status !== 'Perdido';
  });

  const newLeads = clients.filter(c => {
    return (c.status === 'Lead Novo' || c.tags.includes('Lead Novo')) &&
      c.status !== 'Venda Fechada' && c.status !== 'Perdido';
  });

  // Today's total count of work to do
  const totalTasksCount = todayClients.length + overdueClients.length;

  // Let's build a prioritized list for "Meu Dia"
  // Priority: 
  // 1. Atrasados (Overdue)
  // 2. Retornar Hoje (Today)
  // 3. Leads Novos (New)
  // 4. Retrabalho Sugerido / Clientes Esquecidos (suggested follow-ups)
  const getPrioritizedClients = () => {
    const list: { client: Client; reason: string; priorityScore: number; color: string }[] = [];

    // Overdue
    overdueClients.forEach(c => {
      list.push({
        client: c,
        reason: 'Lembrete Atrasado!',
        priorityScore: 10,
        color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
      });
    });

    // Today
    todayClients.forEach(c => {
      // Avoid duplication if already marked overdue
      if (!list.some(item => item.client.id === c.id)) {
        list.push({
          client: c,
          reason: 'Retorno Agendado para Hoje',
          priorityScore: 8,
          color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
        });
      }
    });

    // New Leads (who don't have overdue/today already)
    newLeads.forEach(c => {
      if (!list.some(item => item.client.id === c.id)) {
        list.push({
          client: c,
          reason: 'Lead Novo pendente de contato',
          priorityScore: 6,
          color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
        });
      }
    });

    // Retrabalho / Esquecidos (who are not in the list yet)
    retrabalhoClients.forEach(c => {
      if (!list.some(item => item.client.id === c.id)) {
        const days = getDaysSinceContact(c);
        list.push({
          client: c,
          reason: `Sem contato há ${days} dias (Sugerido Retrabalho)`,
          priorityScore: 4,
          color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900'
        });
      }
    });

    // Sort by priorityScore descending, then by client name
    return list.sort((a, b) => b.priorityScore - a.priorityScore);
  };

  const prioritizedList = getPrioritizedClients();

  // "Prioridade de Hoje" list: Strictly clients scheduled for today + overdue ones that MUST be handled today
  const getTodayPriorityList = () => {
    const list: { client: Client; reason: string; isOverdue: boolean }[] = [];
    overdueClients.forEach(c => {
      list.push({ client: c, reason: 'Atrasado', isOverdue: true });
    });
    todayClients.forEach(c => {
      if (!list.some(item => item.client.id === c.id)) {
        list.push({ client: c, reason: 'Agendado para Hoje', isOverdue: false });
      }
    });
    return list;
  };

  const todayPriorityList = getTodayPriorityList();

  const handleRescheduleSubmit = (clientId: string) => {
    if (!rescheduleDate) return;
    onQuickReschedule(clientId, rescheduleDate);
    setReschedulingId(null);
    setRescheduleDate('');
  };

  return (
    <div className="space-y-6" id="my-day-panel">
      {/* Welcome Banner & Daily Status Alert */}
      <div className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 dark:from-teal-500/20 dark:to-emerald-500/20 border border-teal-500/20 rounded-2xl p-6 relative overflow-hidden shadow-sm">
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 tracking-widest uppercase">
            Assistente Pessoal Merlin
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Bom dia, Corretor!
          </h1>
          
          <div className="pt-2 flex items-center gap-3">
            {totalTasksCount > 0 ? (
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium text-lg">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
                <span>
                  Você possui <strong>{totalTasksCount}</strong> cliente{totalTasksCount > 1 ? 's' : ''} para atender hoje.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-lg">
                <CheckCircle className="h-5 w-5" />
                <span>Parabéns! Sua agenda de contatos para hoje está em dia.</span>
              </div>
            )}
          </div>
          
          {overdueClients.length > 0 && (
            <p className="text-sm text-rose-500 dark:text-rose-300">
              Atenção: <strong>{overdueClients.length}</strong> atendimento{overdueClients.length > 1 ? 's estão' : ' está'} em atraso. Retorne a eles o quanto antes!
            </p>
          )}
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-transparent to-teal-500/5 pointer-events-none" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('meu_dia')}
          className={`pb-3 text-sm font-semibold relative transition-colors ${
            activeTab === 'meu_dia'
              ? 'text-teal-600 dark:text-teal-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          id="tab-meu-dia"
        >
          Meu Dia
          {activeTab === 'meu_dia' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('prioridade_hoje')}
          className={`pb-3 text-sm font-semibold relative transition-colors flex items-center gap-2 ${
            activeTab === 'prioridade_hoje'
              ? 'text-teal-600 dark:text-teal-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          id="tab-prioridade-hoje"
        >
          <span>Prioridade de Hoje</span>
          {totalTasksCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] h-5 px-1.5 rounded-full flex items-center justify-center font-bold">
              {totalTasksCount}
            </span>
          )}
          {activeTab === 'prioridade_hoje' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"
            />
          )}
        </button>
      </div>

      {/* Content Panels */}
      {activeTab === 'meu_dia' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Contatos Sugeridos por Prioridade</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ordenação inteligente para maximizar o seu tempo</p>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Atrasados
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block ml-2" /> Hoje
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ml-2" /> Novos
            </div>
          </div>

          {prioritizedList.length === 0 ? (
            <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400">
              <CheckCircle className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhuma prioridade pendente!</p>
              <p className="text-xs max-w-sm mx-auto mt-1">Todos os seus leads estão organizados, sem atrasos e com retornos agendados. Adicione novos clientes para aquecer o funil.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {prioritizedList.map(({ client, reason, color }) => {
                const alerts = getClientAlerts(client);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4"
                    key={client.id}
                    id={`prioritized-client-${client.id}`}
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${color}`}>
                          {reason}
                        </span>
                        
                        {alerts.isUrgente && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-red-300 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 animate-pulse">
                            URGENTE (Parado &gt; 15 dias)
                          </span>
                        )}
                        
                        {alerts.isSemRetorno && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400">
                            Sem retorno marcado!
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h3 
                          onClick={() => onSelectClient(client.id)}
                          className="font-bold text-lg text-slate-800 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition-colors inline-block"
                        >
                          {client.name}
                        </h3>
                        <p className="text-sm font-mono text-slate-500 dark:text-slate-400">{client.phone}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          &ldquo;{client.notes || 'Sem observações iniciais.'}&rdquo;
                        </p>
                      </div>

                      {/* Display WhatsApp style tags */}
                      <div className="flex flex-wrap gap-1">
                        {client.tags.map(tagName => {
                          const tagColor = tags.find(t => t.name === tagName)?.color || 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300';
                          return (
                            <span 
                              key={tagName} 
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${tagColor}`}
                            >
                              {tagName}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Hub */}
                    <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                      <button
                        onClick={() => onSelectClient(client.id)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold"
                        title="Ver Perfil Completo"
                      >
                        <span>Perfil</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>

                      {/* WhatsApp Fast Link */}
                      <a
                        href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="p-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all flex items-center justify-center gap-1.5 text-xs font-semibold shadow-xs"
                        title="Chamar no WhatsApp"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Chamar</span>
                      </a>

                      {/* Phone call */}
                      <a
                        href={`tel:${client.phone.replace(/\D/g, '')}`}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center"
                        title="Ligar"
                      >
                        <Phone className="h-4 w-4" />
                      </a>

                      {/* Registrar Contato */}
                      <button
                        onClick={() => onQuickContact(client.id)}
                        className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white transition-all flex items-center justify-center gap-1 text-xs font-semibold shadow-xs"
                        title="Registrar Contato (Adiciona +1 no contador de conversas)"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Falei</span>
                        <span className="bg-white/20 px-1 py-0.2 rounded text-[9px]">
                          {client.contactCount}
                        </span>
                      </button>

                      {/* Quick reschedule button */}
                      <div className="relative">
                        {reschedulingId === client.id ? (
                          <div className="absolute right-0 bottom-full mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl z-30 flex flex-col gap-2 w-56">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Definir Próximo Retorno</label>
                            <input
                              type="datetime-local"
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                              required
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setReschedulingId(null)}
                                className="text-[10px] text-slate-500 font-semibold px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleRescheduleSubmit(client.id)}
                                className="text-[10px] bg-teal-500 hover:bg-teal-600 text-white font-semibold px-2 py-1 rounded-md"
                              >
                                Agendar
                              </button>
                            </div>
                          </div>
                        ) : null}
                        
                        <button
                          onClick={() => {
                            setReschedulingId(client.id);
                            // Set rescheduleDate to today plus a few hours as a helper
                            const d = new Date();
                            d.setHours(d.getHours() + 2);
                            const pad = (n: number) => n.toString().padStart(2, '0');
                            const formatted = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
                            setRescheduleDate(formatted);
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
                          title="Agendar Retorno"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* PRIORIDADE DE HOJE EXCLUSIVE VIEW */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
                <span>Atendimento Obrigatório de Hoje</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Clientes com retorno para hoje e atendimentos que ficaram atrasados</p>
            </div>
            <span className="text-xs font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-3 py-1 rounded-full">
              {todayPriorityList.length} Foco{todayPriorityList.length > 1 ? 's' : ''} Hoje
            </span>
          </div>

          {todayPriorityList.length === 0 ? (
            <div className="border border-dashed border-rose-200 dark:border-rose-900 bg-rose-50/10 dark:bg-rose-950/10 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400">
              <CheckCircle className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">Sem prioridades agendadas para hoje!</p>
              <p className="text-xs max-w-sm mx-auto mt-1">Ótimo! Não existem clientes com datas vencidas ou agendamentos ativos para a data de hoje.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {todayPriorityList.map(({ client, reason, isOverdue }) => {
                const formattedTime = client.nextContactDate 
                  ? new Date(client.nextContactDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';
                const formattedDate = client.nextContactDate 
                  ? new Date(client.nextContactDate).toLocaleDateString([], { day: '2-digit', month: '2-digit' })
                  : '';

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      isOverdue 
                        ? 'border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20' 
                        : 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/10'
                    }`}
                    key={client.id}
                    id={`priority-today-${client.id}`}
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          isOverdue 
                            ? 'bg-rose-500 text-white' 
                            : 'bg-amber-500 text-slate-900'
                        }`}>
                          {reason}
                        </span>
                        
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400 font-semibold">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {isOverdue ? `${formattedDate} às ${formattedTime}` : `Hoje às ${formattedTime}`}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 
                          onClick={() => onSelectClient(client.id)}
                          className="font-bold text-lg text-slate-800 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer inline-block"
                        >
                          {client.name}
                        </h3>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{client.phone}</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 p-2.5 bg-white/70 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-850 rounded-lg">
                          {client.notes}
                        </p>
                      </div>

                      {/* Display current status and count */}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Etapa: <strong className="text-slate-700 dark:text-slate-300">{client.status}</strong></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span>Conversas: <strong className="text-slate-700 dark:text-slate-300">{client.contactCount} vezes</strong></span>
                      </div>
                    </div>

                    {/* Quick actions for Today Priority */}
                    <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                      <a
                        href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="p-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all flex items-center justify-center gap-1.5 text-xs font-semibold shadow-xs"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Enviar Whats</span>
                      </a>

                      <button
                        onClick={() => onQuickContact(client.id)}
                        className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white transition-all flex items-center justify-center gap-1.5 text-xs font-semibold shadow-xs"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Falar e Registrar</span>
                      </button>

                      {/* Quick postponement button */}
                      <button
                        onClick={() => {
                          // Postpone to tomorrow same time
                          if (client.nextContactDate) {
                            const current = new Date(client.nextContactDate);
                            current.setDate(current.getDate() + 1);
                            const pad = (n: number) => n.toString().padStart(2, '0');
                            const formatted = `${current.getFullYear()}-${pad(current.getMonth()+1)}-${pad(current.getDate())}T${pad(current.getHours())}:${pad(current.getMinutes())}`;
                            onQuickReschedule(client.id, formatted);
                          } else {
                            const d = new Date();
                            d.setDate(d.getDate() + 1);
                            const pad = (n: number) => n.toString().padStart(2, '0');
                            const formatted = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T10:00`;
                            onQuickReschedule(client.id, formatted);
                          }
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold"
                        title="Adiar para Amanhã"
                      >
                        <Clock className="h-4 w-4" />
                        <span>Adiar +24h</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
