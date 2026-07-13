import React, { useState } from 'react';
import { Client, ClientStatus, Tag } from '../types';
import { getClientAlerts } from '../lib/storage';
import { 
  Plus, 
  MessageSquare, 
  Calendar, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft,
  Settings,
  MoveRight,
  Eye
} from 'lucide-react';
import { motion } from 'motion/react';

interface KanbanProps {
  clients: Client[];
  tags: Tag[];
  onUpdateClientStatus: (clientId: string, newStatus: ClientStatus) => void;
  onSelectClient: (id: string) => void;
  onAddClient: (initialStatus?: ClientStatus) => void;
}

const COLUMNS: { id: ClientStatus; title: string; color: string; bg: string }[] = [
  { id: 'Lead Novo', title: 'Lead Novo', color: 'text-emerald-700 dark:text-emerald-400 border-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-950/20' },
  { id: 'Contato', title: 'Contato', color: 'text-blue-700 dark:text-blue-400 border-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-950/20' },
  { id: 'Em Atendimento', title: 'Em Atendimento', color: 'text-purple-700 dark:text-purple-400 border-purple-500', bg: 'bg-purple-50/50 dark:bg-purple-950/20' },
  { id: 'Retrabalho', title: 'Retrabalho', color: 'text-amber-700 dark:text-amber-400 border-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-950/20' },
  { id: 'Agendado', title: 'Agendado', color: 'text-violet-700 dark:text-violet-400 border-violet-500', bg: 'bg-violet-50/50 dark:bg-violet-950/20' },
  { id: 'Visitou', title: 'Visitou', color: 'text-sky-700 dark:text-sky-400 border-sky-500', bg: 'bg-sky-50/50 dark:bg-sky-950/20' },
  { id: 'Proposta', title: 'Proposta', color: 'text-yellow-700 dark:text-yellow-400 border-yellow-500', bg: 'bg-yellow-50/50 dark:bg-yellow-950/20' },
  { id: 'Documentação', title: 'Documentação', color: 'text-teal-700 dark:text-teal-400 border-teal-500', bg: 'bg-teal-50/50 dark:bg-teal-950/20' },
  { id: 'Venda Fechada', title: 'Venda Fechada', color: 'text-green-700 dark:text-green-400 border-green-500', bg: 'bg-green-50/50 dark:bg-green-950/20 font-bold' },
  { id: 'Perdido', title: 'Perdido', color: 'text-rose-700 dark:text-rose-400 border-rose-500', bg: 'bg-rose-50/50 dark:bg-rose-950/20' }
];

export default function Kanban({
  clients,
  tags,
  onUpdateClientStatus,
  onSelectClient,
  onAddClient
}: KanbanProps) {
  const [draggedClientId, setDraggedClientId] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<ClientStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    setDraggedClientId(clientId);
    e.dataTransfer.setData('text/plain', clientId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: ClientStatus) => {
    e.preventDefault();
    setHoveredColumn(columnId);
  };

  const handleDrop = (e: React.DragEvent, columnId: ClientStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedClientId;
    if (id) {
      onUpdateClientStatus(id, columnId);
    }
    setDraggedClientId(null);
    setHoveredColumn(null);
  };

  const moveColumn = (client: Client, direction: 'left' | 'right') => {
    const currentIdx = COLUMNS.findIndex(col => col.id === client.status);
    let targetIdx = currentIdx + (direction === 'right' ? 1 : -1);
    if (targetIdx >= 0 && targetIdx < COLUMNS.length) {
      onUpdateClientStatus(client.id, COLUMNS[targetIdx].id);
    }
  };

  return (
    <div className="space-y-4" id="kanban-panel">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Funil de Vendas Visual</h2>
          <p className="text-xs text-slate-500">Arraste os clientes para trocar de etapa ou use os botões rápidos de controle.</p>
        </div>
        <button
          onClick={() => onAddClient()}
          className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Horizontal scrolling container for boards */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {COLUMNS.map(column => {
          const columnClients = clients.filter(c => c.status === column.id);
          const isOver = hoveredColumn === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={() => setHoveredColumn(null)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border transition-all ${
                isOver 
                  ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/5 dark:bg-teal-950/10' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
              }`}
              id={`kanban-column-${column.id.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {/* Lane Header */}
              <div className="p-3.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    column.id === 'Venda Fechada' ? 'bg-green-500' : column.id === 'Perdido' ? 'bg-red-500' : 'bg-teal-500'
                  }`} />
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{column.title}</h3>
                </div>
                <span className="text-xs font-mono font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 h-5 px-1.5 rounded-md flex items-center justify-center">
                  {columnClients.length}
                </span>
              </div>

              {/* Lane body (cards list) */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[420px] max-h-[600px]">
                {columnClients.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-100 dark:border-slate-850 rounded-xl">
                    <Plus 
                      onClick={() => onAddClient(column.id)}
                      className="h-8 w-8 cursor-pointer hover:text-teal-500 transition-colors" 
                    />
                    <span className="text-[10px] mt-1 font-medium">Sem clientes aqui</span>
                  </div>
                ) : (
                  columnClients.map(client => {
                    const alerts = getClientAlerts(client);
                    return (
                      <div
                        key={client.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, client.id)}
                        className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-3 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-grab active:cursor-grabbing space-y-2.5 group relative"
                        id={`kanban-card-${client.id}`}
                      >
                        {/* Quick controls for mobile touch */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 pl-1.5 py-0.5 rounded-md shadow-xs border border-slate-100 dark:border-slate-800">
                          {COLUMNS.findIndex(col => col.id === client.status) > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); moveColumn(client, 'left'); }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-sm"
                              title="Recuar etapa"
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </button>
                          )}
                          {COLUMNS.findIndex(col => col.id === client.status) < COLUMNS.length - 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); moveColumn(client, 'right'); }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-sm"
                              title="Avançar etapa"
                            >
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="space-y-1 pr-6">
                          <h4 
                            onClick={() => onSelectClient(client.id)}
                            className="font-bold text-sm text-slate-800 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition-colors line-clamp-1"
                          >
                            {client.name}
                          </h4>
                          <p className="text-[10px] font-mono text-slate-500">{client.phone}</p>
                        </div>

                        {/* Description snippet */}
                        {client.notes && (
                          <p className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-2 italic bg-slate-50 dark:bg-slate-950 p-1.5 rounded-md border border-slate-100 dark:border-slate-850">
                            {client.notes}
                          </p>
                        )}

                        {/* Alerts & Warnings */}
                        <div className="space-y-1">
                          {alerts.isAtrasado && (
                            <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 px-1.5 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                              <AlertTriangle className="h-2.5 w-2.5 animate-pulse" />
                              <span>Retorno Atrasado</span>
                            </span>
                          )}
                          {alerts.isUrgente && (
                            <span className="text-[9px] font-extrabold text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-100 flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              <span>Urgente: Parado &gt;15 dias</span>
                            </span>
                          )}
                          {alerts.isSemRetorno && (
                            <span className="text-[9px] font-extrabold text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-100 flex items-center gap-1">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              <span>Sem retorno agendado</span>
                            </span>
                          )}
                        </div>

                        {/* Tags line */}
                        <div className="flex flex-wrap gap-1">
                          {client.tags.slice(0, 3).map(tagName => {
                            const tagColor = tags.find(t => t.name === tagName)?.color || 'bg-slate-100 text-slate-800';
                            return (
                              <span
                                key={tagName}
                                className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${tagColor}`}
                              >
                                {tagName}
                              </span>
                            );
                          })}
                          {client.tags.length > 3 && (
                            <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded-full border">
                              +{client.tags.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Footer details / action buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-850 text-[10px] text-slate-400">
                          <span>Conversas: <strong>{client.contactCount}</strong></span>
                          
                          <button
                            onClick={() => onSelectClient(client.id)}
                            className="text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Ver Ficha</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
