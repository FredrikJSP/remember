export type Priority = 'hog' | 'lag';

export type OrderCategory = 'hog' | 'lag' | 'avklarat';

export interface OrderItem {
  id: string;
  orderNumber: string;
  action: string; // Åtgärd
  note: string;   // Anteckning
  category: OrderCategory;
  priority: Priority; // Original/intended priority (hog/lag)
  createdAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp when completed
  reminderMinutes: number; // In minutes, default 60 (1 hour)
  reminderTriggered?: boolean;
  snoozedUntil?: string | null; // ISO timestamp if snoozed
  lastReminderPlayedAt?: number; // Timestamp ms when chime was last played
}

export interface AppSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  defaultReminderMinutes: number; // e.g. 60
  browserNotifications: boolean;
  compactCompleted: boolean;
  viewMode: 'columns' | 'document'; // Column Kanban view or Document listing view
  companyName?: string;
}
