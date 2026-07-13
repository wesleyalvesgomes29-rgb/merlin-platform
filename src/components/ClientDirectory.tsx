import React, { useState, useMemo, useRef } from 'react';
import { Client, Tag, ClientStatus } from '../types';
import { getClientAlerts, getDaysSinceContact } from '../lib/storage';
import { 
  Search, 
  Plus, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Tag as TagIcon, 
  Filter, 
  UserPlus, 
  Trash2, 
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  FolderMinus,
  Edit2,
  Upload,
  Download,
  Check,
  AlertCircle,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

interface ImportedRow {
  name: string;
  phone: string;
  email?: string;
  empreendimento?: string;
  origem?: string;
  status: ClientStatus;
  notes: string;
  valid: boolean;
}

interface ClientDirectoryProps {
  clients: Client[];
  tags: Tag[];
  onSelectClient: (id: string) => void;
  onAddClient: () => void;
  onDeleteClient: (id: string) => void;
  onCreateTag: (name: string, color: string) => void;
  onImportClients: (importedList: {
    name: string;
    phone: string;
    email?: string;
    empreendimento?: string;
    origem?: string;
    status: ClientStatus;
    notes: string;
  }[]) => void;
}

export default function ClientDirectory({
  clients,
  tags,
  onSelectClient,
  onAddClient,
  onDeleteClient,
  onCreateTag,
  onImportClients
}: ClientDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [showTagCreator, setShowTagCreator] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('bg-teal-100 text-teal-800 border-teal-300');

  // Excel Import / Export States
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewRows, setPreviewRows] = useState<ImportedRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp-style soft colors list for selection
  const TAG_COLOR_PRESETS = [
    { name: 'Teal/Verde', value: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' },
    { name: 'Azul', value: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800' },
    { name: 'Cinza Escuro', value: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700' },
    { name: 'Vermelho/Rosa', value: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800' },
    { name: 'Laranja', value: 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800' },
    { name: 'Indigo/Roxo', value: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800' },
    { name: 'Amarelo/Ouro', value: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' }
  ];

  const handleCreateTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    onCreateTag(newTagName.trim(), newTagColor);
    setNewTagName('');
    setShowTagCreator(false);
  };

  // EXCEL IMPORT & EXPORT HANDLERS
  const handleExportExcel = () => {
    try {
      const dataToExport = clients.map(c => ({
        'Nome': c.name,
        'Telefone': c.phone,
        'Email': c.email || '',
        'Empreendimento': c.empreendimento || '',
        'Origem': c.origem || '',
        'Status': c.status,
        'Observações': c.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');
      XLSX.writeFile(wb, 'Leads_Merlin_Data.xlsx');
    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ao exportar os dados para Excel.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData = XLSX.utils.sheet_to_json<any>(worksheet);

        if (rawData.length === 0) {
          alert('A planilha importada está vazia.');
          return;
        }

        const parsedRows: ImportedRow[] = rawData.map((row: any) => {
          // Robust mapping of column headers in Portuguese or English
          const name = row['Nome'] || row['nome'] || row['Name'] || row['name'] || '';
          const phone = row['Telefone'] || row['telefone'] || row['Phone'] || row['phone'] || '';
          const email = row['Email'] || row['email'] || row['Mail'] || row['mail'] || '';
          const empreendimento = row['Empreendimento'] || row['empreendimento'] || row['Imóvel'] || row['imovel'] || '';
          const origem = row['Origem'] || row['origem'] || row['Source'] || row['source'] || '';
          const statusRaw = row['Status'] || row['status'] || 'Lead Novo';
          const notes = row['Observações'] || row['observações'] || row['Notes'] || row['notes'] || '';

          const validStatuses: ClientStatus[] = [
            'Lead Novo', 'Contato', 'Em Atendimento', 'Retrabalho', 'Agendado',
            'Visitou', 'Proposta', 'Documentação', 'Venda Fechada', 'Perdido'
          ];
          const status = validStatuses.includes(statusRaw) ? statusRaw as ClientStatus : 'Lead Novo';

          return {
            name: String(name).trim(),
            phone: String(phone).trim(),
            email: email ? String(email).trim() : undefined,
            empreendimento: empreendimento ? String(empreendimento).trim() : undefined,
            origem: origem ? String(origem).trim() : undefined,
            status,
            notes: notes ? String(notes).trim() : '',
            valid: !!String(name).trim() && !!String(phone).trim()
          };
        });

        setPreviewRows(parsedRows);
        setShowPreviewModal(true);
      } catch (err) {
        console.error(err);
        alert('Erro ao processar o arquivo Excel. Certifique-se de que é uma planilha válida.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // clear input
  };

  const handleConfirmImport = () => {
    const validRows = previewRows.filter(r => r.valid);
    if (validRows.length === 0) {
      alert('Nenhum lead válido para importação. O Nome e Telefone são campos obrigatórios.');
      return;
    }

    onImportClients(validRows.map(r => ({
      name: r.name,
      phone: r.phone,
      email: r.email,
      empreendimento: r.empreendimento,
      origem: r.origem,
      status: r.status,
      notes: r.notes
    })));

    setShowPreviewModal(false);
    alert(`${validRows.length} leads importados com sucesso!`);
  };

  // Instant filtering
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // 1. Search term (Name, Phone, or tags)
      const matchesSearch = 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, '')) ||
        client.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Tag filter
      const matchesTag = selectedTagFilter === 'all' || client.tags.includes(selectedTagFilter);

      // 3. Status filter
      const matchesStatus = selectedStatusFilter === 'all' || client.status === selectedStatusFilter;

      return matchesSearch && matchesTag && matchesStatus;
    });
  }, [clients, searchTerm, selectedTagFilter, selectedStatusFilter]);

  return (
    <div className="space-y-6" id="client-directory-panel">
      {/* Header and Add Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Fichas de Clientes</h2>
          <p className="text-xs text-slate-500">Gerenciamento completo, filtros e histórico individual dos compradores e proprietários</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input for Excel Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />

          {/* Importar Excel */}
          <button
            onClick={handleImportClick}
            className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            title="Importar Leads de planilha Excel"
          >
            <Upload className="h-4 w-4 text-emerald-500" />
            <span>Importar Excel</span>
          </button>

          {/* Exportar Excel */}
          <button
            onClick={handleExportExcel}
            className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            title="Exportar todos os Leads para planilha Excel"
          >
            <Download className="h-4 w-4 text-teal-500" />
            <span>Exportar Excel</span>
          </button>

          {/* Custom tag manager trigger */}
          <button
            onClick={() => setShowTagCreator(!showTagCreator)}
            className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <TagIcon className="h-4 w-4" />
            <span>Criar Nova Etiqueta</span>
          </button>

          <button
            onClick={() => onAddClient()}
            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Tag Creator Dropdown Card */}
      {showTagCreator && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-lg max-w-md space-y-3"
        >
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Adicionar Etiqueta Personalizada</h3>
          <form onSubmit={handleCreateTagSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome da Etiqueta</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Ex: Urgência Residencial"
                className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Escolha a Cor (Estilo WhatsApp)</label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-lg">
                {TAG_COLOR_PRESETS.map(preset => (
                  <button
                    type="button"
                    key={preset.value}
                    onClick={() => setNewTagColor(preset.value)}
                    className={`p-2 text-[10px] rounded-md border text-left transition-all ${
                      newTagColor === preset.value 
                        ? 'border-teal-500 ring-2 ring-teal-500/10 font-bold' 
                        : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950'
                    }`}
                  >
                    <span className={`px-2 py-0.5 rounded-sm ${preset.value}`}>
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowTagCreator(false)}
                className="text-xs text-slate-500 font-semibold px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-850"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="text-xs bg-teal-500 hover:bg-teal-600 text-white font-semibold px-3 py-1.5 rounded-md"
              >
                Salvar Etiqueta
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Search and Filters Hub */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Pesquisar por nome, telefone ou etiquetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            id="search-client-input"
          />
        </div>

        {/* Filters Selects */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tag Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
              id="filter-tag-select"
            >
              <option value="all">Todas Etiquetas</option>
              {tags.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
              id="filter-status-select"
            >
              <option value="all">Todas as Etapas</option>
              <option value="Lead Novo">Lead Novo</option>
              <option value="Contato">Contato</option>
              <option value="Em Atendimento">Em Atendimento</option>
              <option value="Retrabalho">Retrabalho</option>
              <option value="Agendado">Agendado</option>
              <option value="Visitou">Visitou</option>
              <option value="Proposta">Proposta</option>
              <option value="Documentação">Documentação</option>
              <option value="Venda Fechada">Venda Fechada</option>
              <option value="Perdido">Perdido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Listing */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {filteredClients.length === 0 ? (
          <div className="p-16 text-center text-slate-400 dark:text-slate-600">
            <FolderMinus className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600 dark:text-slate-400">Nenhum cliente encontrado</p>
            <p className="text-xs max-w-sm mx-auto mt-1">Experimente alterar os filtros de pesquisa ou cadastrar um novo cliente para esta seção.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-850">
            {filteredClients.map(client => {
              const alerts = getClientAlerts(client);
              const days = getDaysSinceContact(client);

              return (
                <div
                  key={client.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-all group"
                  id={`client-row-${client.id}`}
                >
                  {/* Avatar and Main Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 
                        onClick={() => onSelectClient(client.id)}
                        className="font-bold text-base text-slate-800 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition-colors"
                      >
                        {client.name}
                      </h3>

                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </span>

                      {/* Display Status tag */}
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {client.status}
                      </span>

                      {/* Client Rules Warning Badges */}
                      {alerts.isAtrasado && (
                        <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 px-1.5 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 animate-pulse" />
                          <span>Retorno Atrasado</span>
                        </span>
                      )}
                      {alerts.isUrgente && (
                        <span className="text-[9px] font-extrabold text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-100 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Urgente: &gt;15 dias parado</span>
                        </span>
                      )}
                      {alerts.isSemRetorno && (
                        <span className="text-[9px] font-extrabold text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-100 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Sem retorno agendado</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="font-mono">{client.phone}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>Sem contato há: <strong className="text-slate-700 dark:text-slate-300">{days} dias</strong></span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>Retrabalhos: <strong className="text-slate-700 dark:text-slate-300">{client.contactCount} contatos</strong></span>
                    </div>

                    {/* Tags WhatsApp style */}
                    <div className="flex flex-wrap gap-1">
                      {client.tags.map(tagName => {
                        const tagColor = tags.find(t => t.name === tagName)?.color || 'bg-slate-100 text-slate-800';
                        return (
                          <span
                            key={tagName}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${tagColor}`}
                          >
                            {tagName}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                    <button
                      onClick={() => onSelectClient(client.id)}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-semibold text-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Ficha e Edição</span>
                    </button>

                    <a
                      href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all shadow-xs"
                      title="WhatsApp"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </a>

                    <a
                      href={`tel:${client.phone.replace(/\D/g, '')}`}
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
                      title="Ligar"
                    >
                      <Phone className="h-4 w-4" />
                    </a>

                    <button
                      onClick={() => {
                        if (confirm(`Excluir permanentemente o cliente ${client.name}?`)) {
                          onDeleteClient(client.id);
                        }
                      }}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 rounded-xl transition-all"
                      title="Excluir Cliente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Excel Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreviewModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl animate-pulse">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Prévia da Importação Excel</h2>
                    <p className="text-xs text-slate-500">Confira abaixo os dados lidos da planilha antes de salvar no CRM</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Grid / Table Container */}
              <div className="flex-1 overflow-auto p-6 space-y-4">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500">
                        <th className="p-3">Status</th>
                        <th className="p-3">Nome</th>
                        <th className="p-3">Telefone</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Empreendimento</th>
                        <th className="p-3">Origem</th>
                        <th className="p-3">Etapa do Funil</th>
                        <th className="p-3">Observações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                      {previewRows.map((row, index) => (
                        <tr 
                          key={index}
                          className={`${row.valid ? 'hover:bg-slate-50/50 dark:hover:bg-slate-950/20' : 'bg-red-50/30 dark:bg-red-950/10'}`}
                        >
                          <td className="p-3 font-semibold">
                            {row.valid ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="h-3.5 w-3.5" /> Válido
                              </span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400 flex items-center gap-1" title="Nome e Telefone são obrigatórios">
                                <AlertCircle className="h-3.5 w-3.5 animate-bounce" /> Inválido
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-medium text-slate-800 dark:text-slate-200 max-w-[120px] truncate">{row.name || <span className="italic text-red-400">Ausente</span>}</td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300 max-w-[120px] truncate">{row.phone || <span className="italic text-red-400">Ausente</span>}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[120px] truncate">{row.email || <span className="text-slate-400 dark:text-slate-600">-</span>}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[120px] truncate">{row.empreendimento || <span className="text-slate-400 dark:text-slate-600">-</span>}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[120px] truncate">{row.origem || <span className="text-slate-400 dark:text-slate-600">-</span>}</td>
                          <td className="p-3">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase">
                              {row.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-500 max-w-[180px] truncate" title={row.notes}>{row.notes || <span className="text-slate-400 dark:text-slate-600">-</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {previewRows.some(r => !r.valid) && (
                  <p className="text-xs text-red-500 mt-3 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Atenção: Linhas marcadas como "Inválido" não serão importadas por falta de Nome ou Telefone.
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                <span className="text-xs text-slate-500">
                  Total de leads válidos para importar: <strong>{previewRows.filter(r => r.valid).length}</strong> de {previewRows.length}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    <Check className="h-4 w-4" />
                    <span>Confirmar Importação</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
