import React, { useState, useEffect } from 'react';
import { Client, ClientStatus, Tag, Sale } from './types';
import { 
  getStoredClients, 
  saveStoredClients, 
  getStoredTags, 
  saveStoredTags, 
  getStoredSales, 
  saveStoredSales, 
  getStoredTheme, 
  saveStoredTheme,
  getClientAlerts,
  isToday
} from './lib/storage';
import { 
  Sparkles, 
  Calendar, 
  LayoutDashboard, 
  Trello, 
  Users, 
  DollarSign, 
  Sun, 
  Moon, 
  Plus,
  Compass,
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import MyDay from './components/MyDay';
import Dashboard from './components/Dashboard';
import Kanban from './components/Kanban';
import ClientDirectory from './components/ClientDirectory';
import ClientDetails from './components/ClientDetails';
import Commissions from './components/Commissions';
import AddClientModal from './components/AddClientModal';
import { motion, AnimatePresence } from 'motion/react';
import IntelligenceDashboard from './modules/intelligence/components/IntelligenceDashboard';

export default function App() {
  // Global States
  const [clients, setClients] = useState<Client[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('meu_dia');

  // Modal / Detail States
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [initialStatusForAdd, setInitialStatusForAdd] = useState<ClientStatus>('Lead Novo');

  // Initialize data on component mount
  useEffect(() => {
    const loadedClients = getStoredClients();
    const loadedTags = getStoredTags();
    const loadedSales = getStoredSales();
    const loadedTheme = getStoredTheme();

    setClients(loadedClients);
    setTags(loadedTags);
    setSales(loadedSales);
    setTheme(loadedTheme);

    // Apply class to HTML tag for dark mode
    if (loadedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Theme Toggle Handler
  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    saveStoredTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // CLIENT CRUD HANDLERS
  const handleAddClient = (clientData: {
    name: string;
    phone: string;
    notes: string;
    status: ClientStatus;
    tags: string[];
    email?: string;
    empreendimento?: string;
    origem?: string;
  }) => {
    const newClient: Client = {
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      name: clientData.name,
      phone: clientData.phone,
      createdAt: new Date().toISOString(),
      notes: clientData.notes,
      status: clientData.status,
      tags: clientData.tags,
      nextContactDate: null,
      contactCount: 0,
      lastContactDate: null,
      email: clientData.email,
      empreendimento: clientData.empreendimento,
      origem: clientData.origem,
      history: [
        {
          id: 'h_init_' + Math.random().toString(),
          date: new Date().toISOString(),
          action: `Cliente cadastrado na etapa "${clientData.status}"`
        }
      ],
      comments: []
    };

    const updatedClients = [newClient, ...clients];
    setClients(updatedClients);
    saveStoredClients(updatedClients);
    setIsAddingClient(false);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    const updated = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    setClients(updated);
    saveStoredClients(updated);
  };

  const handleDeleteClient = (clientId: string) => {
    const updated = clients.filter(c => c.id !== clientId);
    setClients(updated);
    saveStoredClients(updated);
    if (selectedClientId === clientId) {
      setSelectedClientId(null);
    }
  };

  const handleUpdateClientStatus = (clientId: string, newStatus: ClientStatus) => {
    const target = clients.find(c => c.id === clientId);
    if (!target) return;

    const oldStatus = target.status;
    if (oldStatus === newStatus) return;

    const updatedClient: Client = {
      ...target,
      status: newStatus,
      history: [
        {
          id: 'h_status_' + Math.random().toString(),
          date: new Date().toISOString(),
          action: `Etapa do funil alterada de "${oldStatus}" para "${newStatus}"`
        },
        ...target.history
      ]
    };

    handleUpdateClient(updatedClient);
  };

  const handleQuickContact = (clientId: string) => {
    const target = clients.find(c => c.id === clientId);
    if (!target) return;

    const newCount = target.contactCount + 1;
    const updatedClient: Client = {
      ...target,
      contactCount: newCount,
      lastContactDate: new Date().toISOString(),
      history: [
        {
          id: 'h_contact_' + Math.random().toString(),
          date: new Date().toISOString(),
          action: `Contato rápido registrado por telefone/whats (Total de toques: ${newCount})`
        },
        ...target.history
      ]
    };

    handleUpdateClient(updatedClient);
  };

  const handleQuickReschedule = (clientId: string, dateStr: string) => {
    const target = clients.find(c => c.id === clientId);
    if (!target) return;

    const updatedClient: Client = {
      ...target,
      nextContactDate: dateStr,
      history: [
        {
          id: 'h_resched_' + Math.random().toString(),
          date: new Date().toISOString(),
          action: `Reagendamento rápido realizado para o dia ${new Date(dateStr).toLocaleString('pt-BR')}`
        },
        ...target.history
      ]
    };

    handleUpdateClient(updatedClient);
  };

  // EXCEL IMPORT CLIENTS HANDLER
  const handleImportClients = (importedList: {
    name: string;
    phone: string;
    email?: string;
    empreendimento?: string;
    origem?: string;
    status: ClientStatus;
    notes: string;
  }[]) => {
    const newClients: Client[] = importedList.map(item => ({
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      name: item.name,
      phone: item.phone,
      createdAt: new Date().toISOString(),
      notes: item.notes,
      status: item.status,
      tags: [],
      nextContactDate: null,
      contactCount: 0,
      lastContactDate: null,
      email: item.email,
      empreendimento: item.empreendimento,
      origem: item.origem,
      history: [
        {
          id: 'h_init_' + Math.random().toString(),
          date: new Date().toISOString(),
          action: `Cliente importado via planilha Excel na etapa "${item.status}"`
        }
      ],
      comments: []
    }));

    const updated = [...newClients, ...clients];
    setClients(updated);
    saveStoredClients(updated);
  };

  // TAG CREATION HANDLER
  const handleCreateTag = (name: string, color: string) => {
    const newTag: Tag = {
      id: 'tag_' + Math.random().toString(36).substr(2, 9),
      name,
      color
    };
    const updated = [...tags, newTag];
    setTags(updated);
    saveStoredTags(updated);
  };

  // SALE CRUD HANDLERS
  const handleAddSale = (saleData: Omit<Sale, 'id'>) => {
    const newSale: Sale = {
      id: 'sale_' + Math.random().toString(36).substr(2, 9),
      ...saleData
    };

    // If linked to a client, update client status to Venda Fechada automatically
    if (saleData.clientId) {
      handleUpdateClientStatus(saleData.clientId, 'Venda Fechada');
    }

    const updated = [newSale, ...sales];
    setSales(updated);
    saveStoredSales(updated);
  };

  const handleDeleteSale = (saleId: string) => {
    const updated = sales.filter(s => s.id !== saleId);
    setSales(updated);
    saveStoredSales(updated);
  };

  // Calculate current alerts count for active notification badges
  const todayAlertsCount = clients.filter(c => {
    const alerts = getClientAlerts(c);
    return (isToday(c.nextContactDate) || alerts.isAtrasado) && c.status !== 'Venda Fechada' && c.status !== 'Perdido';
  }).length;

  // Selected client helper object
  const activeClientObj = clients.find(c => c.id === selectedClientId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      
      {/* 1. SIDEBAR (DESKTOP / CHROMEOOK VIEW) */}
      <aside className="hidden md:flex w-64 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 flex-col h-screen sticky top-0 p-5 text-white justify-between">
        <div className="space-y-8">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="p-2 bg-teal-500 rounded-xl shadow-lg shadow-teal-500/20">
              <Sparkles className="h-5 w-5 text-slate-900 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight font-display">Merlin</h1>
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">CRM Pessoal</span>
            </div>
          </div>

          {/* Quick Stats Panel in Sidebar */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Hoje</span>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Tarefas de Hoje:</span>
              <span className={`font-mono font-bold px-1.5 py-0.2 rounded-md ${
                todayAlertsCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-teal-500/20 text-teal-400'
              }`}>
                {todayAlertsCount}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('meu_dia')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'meu_dia'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-4.5 w-4.5" />
                <span>Meu Dia</span>
              </div>
              {todayAlertsCount > 0 && (
                <span className={`text-[10px] font-extrabold h-5 px-1.5 rounded-md flex items-center justify-center ${
                  activeTab === 'meu_dia' ? 'bg-slate-950 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {todayAlertsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('funil')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'funil'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Trello className="h-4.5 w-4.5" />
              <span>Funil de Vendas</span>
            </button>

            <button
              onClick={() => setActiveTab('clientes')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'clientes'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              <span>Clientes</span>
            </button>

            <button
              onClick={() => setActiveTab('comissoes')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'comissoes'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <DollarSign className="h-4.5 w-4.5" />
              <span>Comissões</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5" />
              <span>Resultados</span>
            </button>

            <button
              onClick={() => setActiveTab('intelligence')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'intelligence'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
              <span className="flex items-center gap-1.5">
                <span>Merlin Intelligence</span>
                <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded-sm uppercase font-black">AI</span>
              </span>
            </button>
          </nav>
        </div>

        {/* Footer controls & theme switcher */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <button
            onClick={handleToggleTheme}
            className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer border border-slate-800"
          >
            <span className="flex items-center gap-2">
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
            </span>
            <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded uppercase font-semibold">Tema</span>
          </button>
          
          <div className="text-[10px] text-slate-500 text-center">
            Merlin CRM &copy; 2026
          </div>
        </div>
      </aside>

      {/* 2. MOBILE HEADER (IPHONE VIEW) */}
      <header className="md:hidden bg-slate-900 text-white p-4 sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-500 rounded-lg">
            <Sparkles className="h-4.5 w-4.5 text-slate-900" />
          </div>
          <span className="font-extrabold text-lg font-display tracking-tight">Merlin</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleTheme}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          </button>
          <button
            onClick={() => setIsAddingClient(true)}
            className="bg-teal-500 text-slate-900 h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo</span>
          </button>
        </div>
      </header>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden min-h-[calc(100vh-120px)] md:h-screen md:overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'meu_dia' && (
            <MyDay
              clients={clients}
              tags={tags}
              onSelectClient={setSelectedClientId}
              onQuickContact={handleQuickContact}
              onQuickReschedule={handleQuickReschedule}
            />
          )}

          {activeTab === 'funil' && (
            <Kanban
              clients={clients}
              tags={tags}
              onUpdateClientStatus={handleUpdateClientStatus}
              onSelectClient={setSelectedClientId}
              onAddClient={(initialCol) => {
                if (initialCol) setInitialStatusForAdd(initialCol);
                setIsAddingClient(true);
              }}
            />
          )}

          {activeTab === 'clientes' && (
            <ClientDirectory
              clients={clients}
              tags={tags}
              onSelectClient={setSelectedClientId}
              onAddClient={() => {
                setInitialStatusForAdd('Lead Novo');
                setIsAddingClient(true);
              }}
              onDeleteClient={handleDeleteClient}
              onCreateTag={handleCreateTag}
              onImportClients={handleImportClients}
            />
          )}

          {activeTab === 'comissoes' && (
            <Commissions
              sales={sales}
              clients={clients}
              onAddSale={handleAddSale}
              onDeleteSale={handleDeleteSale}
            />
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              clients={clients}
              sales={sales}
              onSelectClient={setSelectedClientId}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'intelligence' && (
            <IntelligenceDashboard
              clients={clients}
              sales={sales}
              tags={tags}
              onSelectClient={setSelectedClientId}
            />
          )}
        </div>
      </main>

      {/* 4. MOBILE BOTTOM BAR NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-400 border-t border-slate-800 z-40 flex items-center justify-around h-16 shadow-2xl">
        <button
          onClick={() => setActiveTab('meu_dia')}
          className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
            activeTab === 'meu_dia' ? 'text-teal-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-[9px] font-bold mt-1">Meu Dia</span>
          {todayAlertsCount > 0 && (
            <span className="absolute top-2 right-6 bg-rose-500 text-white text-[8px] font-black h-4 px-1 rounded-full flex items-center justify-center">
              {todayAlertsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('funil')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'funil' ? 'text-teal-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trello className="h-5 w-5" />
          <span className="text-[9px] font-bold mt-1">Funil</span>
        </button>

        <button
          onClick={() => setActiveTab('clientes')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'clientes' ? 'text-teal-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="text-[9px] font-bold mt-1">Clientes</span>
        </button>

        <button
          onClick={() => setActiveTab('comissoes')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'comissoes' ? 'text-teal-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="h-5 w-5" />
          <span className="text-[9px] font-bold mt-1">Comissões</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'dashboard' ? 'text-teal-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[9px] font-bold mt-1">Resultados</span>
        </button>

        <button
          onClick={() => setActiveTab('intelligence')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'intelligence' ? 'text-teal-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="h-5 w-5 text-amber-400" />
          <span className="text-[9px] font-bold mt-1">Inteligência</span>
        </button>
      </nav>

      {/* 5. SIDEWAYS DETAILS DRAWER (CLIENT PROFILE SCREEN) */}
      <AnimatePresence>
        {selectedClientId && activeClientObj && (
          <ClientDetails
            client={activeClientObj}
            tags={tags}
            onClose={() => setSelectedClientId(null)}
            onUpdateClient={handleUpdateClient}
          />
        )}
      </AnimatePresence>

      {/* 6. CREATE CLIENT DIALOG MODAL */}
      <AnimatePresence>
        {isAddingClient && (
          <AddClientModal
            tags={tags}
            initialStatus={initialStatusForAdd}
            onClose={() => setIsAddingClient(false)}
            onSave={handleAddClient}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
