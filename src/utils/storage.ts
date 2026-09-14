import { OrderItem, AppSettings } from '../types';

const STORAGE_KEY = 'arbetsorder_dokument_data_v2';
const SETTINGS_KEY = 'arbetsorder_dokument_settings_v2';

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  soundVolume: 0.6,
  defaultReminderMinutes: 60,
  browserNotifications: false,
  compactCompleted: true,
  viewMode: 'columns',
  companyName: 'Min Arbetslista',
};

export function getSampleOrders(): OrderItem[] {
  const now = new Date();
  
  // 75 minutes ago (High priority - reminder active)
  const time75minAgo = new Date(now.getTime() - 75 * 60 * 1000).toISOString();
  // 25 minutes ago (High priority - pending)
  const time25minAgo = new Date(now.getTime() - 25 * 60 * 1000).toISOString();
  // 3 hours ago (Low priority)
  const time3hAgo = new Date(now.getTime() - 180 * 60 * 1000).toISOString();
  // 5 hours ago (Low priority)
  const time5hAgo = new Date(now.getTime() - 300 * 60 * 1000).toISOString();
  // Completed earlier
  const timeCompleted = new Date(now.getTime() - 45 * 60 * 1000).toISOString();
  const timeCreatedComp = new Date(now.getTime() - 200 * 60 * 1000).toISOString();

  return [
    {
      id: 'demo-1',
      orderNumber: 'ORD-9428',
      action: 'Felsöka hydraulläckage och beställa reservpackning',
      note: 'Kunden väntar på besked innan kl 16:00. Prioriterad kund.',
      category: 'hog',
      priority: 'hog',
      createdAt: time75minAgo,
      reminderMinutes: 60,
      reminderTriggered: true,
    },
    {
      id: 'demo-2',
      orderNumber: 'ORD-9435',
      action: 'Slutföra montering & utföra slutbesiktning',
      note: 'Verktygssats B finns på arbetsbänk 4. Ska levereras i eftermiddag.',
      category: 'hog',
      priority: 'hog',
      createdAt: time25minAgo,
      reminderMinutes: 60,
    },
    {
      id: 'demo-3',
      orderNumber: 'ORD-9411',
      action: 'Arkivera leveranssedlar och uppdatera lagersaldo',
      note: 'Kan göras när akuta ordrar är klara.',
      category: 'lag',
      priority: 'lag',
      createdAt: time3hAgo,
      reminderMinutes: 60,
    },
    {
      id: 'demo-4',
      orderNumber: 'ORD-9402',
      action: 'Beställa förbrukningsmaterial till station 2',
      note: 'Kontrollera även handskar och rengöringssprit.',
      category: 'lag',
      priority: 'lag',
      createdAt: time5hAgo,
      reminderMinutes: 60,
    },
    {
      id: 'demo-5',
      orderNumber: 'ORD-9390',
      action: 'Byta säkringspanel och kalibrera sensor',
      note: 'Klart och godkänt av arbetsledare.',
      category: 'avklarat',
      priority: 'hog',
      createdAt: timeCreatedComp,
      completedAt: timeCompleted,
      reminderMinutes: 60,
    },
  ];
}

export function loadOrdersFromStorage(): OrderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getSampleOrders();
      saveOrdersToStorage(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load orders:', e);
  }
  return getSampleOrders();
}

export function saveOrdersToStorage(orders: OrderItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders to localStorage:', e);
  }
}

export function loadSettingsFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettingsToStorage(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

/**
 * Export all orders to a formatted JSON file for backup
 */
export function exportOrdersToJson(orders: OrderItem[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(orders, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `arbetsorder-backup-${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Export orders to Excel-compatible CSV (Swedish semicolon-separated with UTF-8 BOM)
 */
export function exportOrdersToCsv(orders: OrderItem[]): void {
  const header = ['Ordernummer', 'Prioritet', 'Status', 'Åtgärd', 'Anteckning', 'Skapad', 'Avklarad'];
  const rows = orders.map((o) => [
    `"${(o.orderNumber || '').replace(/"/g, '""')}"`,
    `"${o.priority === 'hog' ? 'Hög' : 'Låg'}"`,
    `"${o.category === 'hog' ? 'Hög prioritet' : o.category === 'lag' ? 'Låg prioritet' : 'Avklarat'}"`,
    `"${(o.action || '').replace(/"/g, '""')}"`,
    `"${(o.note || '').replace(/"/g, '""')}"`,
    `"${o.createdAt}"`,
    `"${o.completedAt || ''}"`,
  ]);

  const csvContent = '\uFEFF' + [header.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `arbetsorder-export-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
