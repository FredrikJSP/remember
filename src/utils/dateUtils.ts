const SWEDISH_MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december'
];

const SWEDISH_MONTHS_SHORT = [
  'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec'
];

const SWEDISH_DAYS = [
  'Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'
];

/**
 * Format full Swedish date and time: e.g., "14 maj 2025 kl. 14:35"
 */
export function formatSwedishDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const day = d.getDate();
    const month = SWEDISH_MONTHS_SHORT[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year} kl. ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

/**
 * Format Swedish time only: "14:35"
 */
export function formatSwedishTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '';
  }
}

/**
 * Format today's header date: "Onsdag, 14 maj 2025"
 */
export function formatTodayHeader(date: Date = new Date()): string {
  const dayName = SWEDISH_DAYS[date.getDay()];
  const day = date.getDate();
  const month = SWEDISH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

/**
 * Friendly relative time in Swedish:
 * "alldeles nyss", "för 12 min sedan", "för 1 tim 15 min sedan"
 */
export function getRelativeTimeString(isoString: string, now: Date = new Date()): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';

    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'precis nu';

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'alldeles nyss';
    if (diffMinutes === 1) return 'för 1 min sedan';
    if (diffMinutes < 60) return `för ${diffMinutes} min sedan`;

    if (diffHours === 1) {
      const remMins = diffMinutes % 60;
      return remMins > 0 ? `för 1 tim ${remMins} min sedan` : 'för 1 timme sedan';
    }
    if (diffHours < 24) {
      const remMins = diffMinutes % 60;
      return remMins > 0 ? `för ${diffHours} tim ${remMins} min sedan` : `för ${diffHours} timmar sedan`;
    }
    if (diffDays === 1) return 'i går';
    return `för ${diffDays} dagar sedan`;
  } catch {
    return '';
  }
}

/**
 * Calculate reminder status for a high priority card
 */
export function calculateReminderStatus(
  createdAtIso: string,
  reminderMinutes: number,
  snoozedUntilIso?: string | null,
  now: Date = new Date()
) {
  const createdDate = new Date(createdAtIso);
  const nowMs = now.getTime();

  // If snoozed, check snooze expiry
  if (snoozedUntilIso) {
    const snoozeDate = new Date(snoozedUntilIso);
    if (snoozeDate.getTime() > nowMs) {
      const remainingMinutes = Math.ceil((snoozeDate.getTime() - nowMs) / (1000 * 60));
      return {
        isDue: false,
        isSnoozed: true,
        remainingMinutes,
        message: `Pausad (påminnelse om ${remainingMinutes} min)`,
        elapsedMinutes: Math.floor((nowMs - createdDate.getTime()) / (1000 * 60)),
      };
    }
  }

  const elapsedMinutes = Math.floor((nowMs - createdDate.getTime()) / (1000 * 60));
  const diff = elapsedMinutes - reminderMinutes;

  if (diff >= 0) {
    const overdueMinutes = diff;
    return {
      isDue: true,
      isSnoozed: false,
      overdueMinutes,
      elapsedMinutes,
      message: overdueMinutes === 0
        ? 'Dags för påminnelse!'
        : overdueMinutes < 60
          ? `Påmindes för ${overdueMinutes} min sedan`
          : `Försenad med ${Math.floor(overdueMinutes / 60)}h ${overdueMinutes % 60}m`,
    };
  } else {
    const remainingMinutes = Math.abs(diff);
    return {
      isDue: false,
      isSnoozed: false,
      remainingMinutes,
      elapsedMinutes,
      message: remainingMinutes < 60
        ? `Påminnelse om ${remainingMinutes} min`
        : `Påminnelse om ${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m`,
    };
  }
}
