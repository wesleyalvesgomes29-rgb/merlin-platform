import React, { useState } from 'react';
import { Client, ClientStatus, Tag } from '../types';
import { X, Plus, UserPlus, Save } from 'lucide-react';
import { motion } from 'motion/react';

interface AddClientModalProps {
  tags: Tag[];
  initialStatus?: ClientStatus;
  onClose: () => void;
  onSave: (clientData: {
    name: string;
    phone: string;
    notes: string;
    status: ClientStatus;
    tags: string[];
    email?: string;
    empreendimento?: string;
    origem?: string;
  }) => void;
}

export default function AddClientModal({
  tags,
  initialStatus = 'Lead Novo',
  onClose,
  onSave
}: AddClientModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ClientStatus>(initialStatus);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [empreendimento, setEmpreendimento] = useState('');
  const [origem, setOrigem] = useState('');

  const handleToggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Por favor, preencha o Nome e Telefone do cliente.');
      return;
    }

    onSave({
      name: name.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      status,
      tags: selectedTags,
      email: email.trim() || undefined,
      empreendimento: empreendimento.trim() || undefined,
      origem: origem.trim() || undefined
    });
  };

  const STATUS_LIST: ClientStatus[] = [
    'Lead Novo',
    'Contato',
    'Em Atendimento',
    'Retrabalho',
    'Agendado',
    'Visitou',
    'Proposta',
    'Documentação',
    'Venda Fechada',
    'Perdido'
  ];

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all"
      onClick={onClose}
      id="add-client-modal-backdrop"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl relative overflow-hidden border border-slate-150 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
        id="add-client-modal-body"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Cadastrar Novo Cliente</h3>
              <p className="text-[10px] text-slate-500">Sem campos desnecessários. Rápido e prático</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome do Cliente *</label>
              <input
                type="text"
                placeholder="Ex: Roberto Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                required
                autoFocus
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telefone / WhatsApp *</label>
              <input
                type="text"
                placeholder="Ex: (11) 98123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email</label>
              <input
                type="email"
                placeholder="Ex: roberto@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Empreendimento */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Empreendimento de Interesse</label>
              <input
                type="text"
                placeholder="Ex: Residencial Bela Vista"
                value={empreendimento}
                onChange={(e) => setEmpreendimento(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Etapa Inicial</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ClientStatus)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
              >
                {STATUS_LIST.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Origem */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Origem do Lead</label>
              <input
                type="text"
                placeholder="Ex: Instagram, Placa"
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Registration Date (Info display, default to today) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data de Cadastro</label>
              <input
                type="text"
                value={new Date().toLocaleDateString('pt-BR')}
                disabled
                className="w-full text-xs bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-500 dark:text-slate-400 font-semibold cursor-not-allowed"
              />
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Observações do Lead</label>
            <textarea
              placeholder="Ex: Busca casa de R$ 900k em condomínio fechado. Perfil investidor..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Quick initial tags selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Etiquetas Rápidas</label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950/40">
              {tags.map(tag => {
                const isSelected = selectedTags.includes(tag.name);
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.name)}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? tag.color
                        : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex gap-2 justify-end pt-4 border-t border-slate-150 dark:border-slate-800 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 font-semibold px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="text-xs bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Criar Cliente</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
