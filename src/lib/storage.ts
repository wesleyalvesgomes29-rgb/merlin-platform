import { Client, Tag, Sale, ClientStatus } from '../types';
import { DEFAULT_TAGS, INITIAL_CLIENTS, INITIAL_SALES } from '../data/seed';

// LocalStorage Keys
const KEYS = {
  CLIENTS: 'merlin_clients_v1',
  TAGS: 'merlin_tags_v1',
  SALES: 'merlin_sales_v1',
  THEME: 'merlin_theme_v1'
};

export function getStoredClients(): Client[] {
  if (typeof window === 'undefined') return INITIAL_CLIENTS;
  const stored = localStorage.getItem(KEYS.CLIENTS);
  if (!stored) {
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
    return INITIAL_CLIENTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_CLIENTS;
  }
}

export function saveStoredClients(clients: Client[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  }
}

export function getStoredTags(): Tag[] {
  if (typeof window === 'undefined') return DEFAULT_TAGS;
  const stored = localStorage.getItem(KEYS.TAGS);
  if (!stored) {
    localStorage.setItem(KEYS.TAGS, JSON.stringify(DEFAULT_TAGS));
    return DEFAULT_TAGS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_TAGS;
  }
}

export function saveStoredTags(tags: Tag[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.TAGS, JSON.stringify(tags));
  }
}

export function getStoredSales(): Sale[] {
  if (typeof window === 'undefined') return INITIAL_SALES;
  const stored = localStorage.getItem(KEYS.SALES);
  if (!stored) {
    localStorage.setItem(KEYS.SALES, JSON.stringify(INITIAL_SALES));
    return INITIAL_SALES;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_SALES;
  }
}

export function saveStoredSales(sales: Sale[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
  }
}

export function getStoredTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(KEYS.THEME);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  return 'light';
}

export function saveStoredTheme(theme: 'light' | 'dark') {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.THEME, theme);
  }
}

// Helper date functions
export function getDaysSinceContact(client: Client): number {
  const referenceDate = new Date(); // Current local time
  const contactStr = client.lastContactDate || client.createdAt;
  const contactDate = new Date(contactStr);
  
  const diffTime = Math.abs(referenceDate.getTime() - contactDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Rules Intelligence
export interface ClientAlerts {
  isRetrabalhoSugerido: boolean; // sem contato há mais de 7 dias
  isUrgente: boolean;            // sem contato há mais de 15 dias
  isSemRetorno: boolean;         // sem próximo retorno marcado
  isAtrasado: boolean;           // data de retorno está no passado
}

export function getClientAlerts(client: Client): ClientAlerts {
  const days = getDaysSinceContact(client);
  const now = new Date();
  
  let isAtrasado = false;
  if (client.nextContactDate) {
    const nextDate = new Date(client.nextContactDate);
    // If nextDate is less than now (and not on the exact same minute/hour range or is strictly in the past day)
    isAtrasado = nextDate.getTime() < now.getTime() && !isSameDay(nextDate, now);
  }

  return {
    isRetrabalhoSugerido: days > 7 && client.status !== 'Venda Fechada' && client.status !== 'Perdido',
    isUrgente: days > 15 && client.status !== 'Venda Fechada' && client.status !== 'Perdido',
    isSemRetorno: !client.nextContactDate && client.status !== 'Venda Fechada' && client.status !== 'Perdido',
    isAtrasado: isAtrasado && client.status !== 'Venda Fechada' && client.status !== 'Perdido'
  };
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return isSameDay(d, now);
}

export function isTomorrow(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(d, tomorrow);
}
