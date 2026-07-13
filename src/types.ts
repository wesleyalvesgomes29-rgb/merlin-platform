export type ClientStatus =
  | 'Lead Novo'
  | 'Contato'
  | 'Em Atendimento'
  | 'Retrabalho'
  | 'Agendado'
  | 'Visitou'
  | 'Proposta'
  | 'Documentação'
  | 'Venda Fechada'
  | 'Perdido';

export interface HistoryEntry {
  id: string;
  date: string;
  action: string;
}

export interface CommentEntry {
  id: string;
  date: string;
  text: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  notes: string;
  tags: string[]; // names of the tags
  status: ClientStatus;
  nextContactDate: string | null; // ISO DateTime format or YYYY-MM-DDThh:mm
  contactCount: number;
  lastContactDate: string | null; // ISO DateTime
  history: HistoryEntry[];
  comments: CommentEntry[];
  email?: string;
  empreendimento?: string;
  origem?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string; // Tailwind color e.g. "bg-emerald-500 text-white" or border colors
}

export interface Sale {
  id: string;
  clientId?: string;
  clientName: string;
  commissionValue: number;
  saleDate: string; // YYYY-MM-DD
}
