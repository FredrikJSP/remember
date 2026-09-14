import React from 'react';
import { Clock, CheckCircle2, BellRing, Volume2, ArrowRight } from 'lucide-react';
import { OrderItem } from '../types';
import { calculateReminderStatus, formatSwedishTime } from '../utils/dateUtils';
import { playReminderSound } from '../utils/soundEffects';

interface ReminderBannerProps {
  urgentOrders: OrderItem[];
  onComplete: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onScrollToOrder: (id: string) => void;
  soundEnabled: boolean;
  soundVolume: number;
}

export const ReminderBanner: React.FC<ReminderBannerProps> = ({
  urgentOrders,
  onComplete,
  onSnooze,
  onScrollToOrder,
  soundEnabled,
  soundVolume,
}) => {
  if (urgentOrders.length === 0) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border-2 border-red-300 bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 shadow-lg shadow-red-100/60 transition-all">
      {/* Top Banner Alert Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-200/80 bg-red-600 px-5 py-3 text-white">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner animate-urgent-pulse">
            <BellRing className="h-4 w-4 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide uppercase sm:text-base">
              Påminnelse: {urgentOrders.length} {urgentOrders.length === 1 ? 'högprioriterad order väntar' : 'högprioriterade ordrar väntar'}
            </h3>
            <p className="text-xs text-red-100">
              Dessa ordrar är markerade med hög prioritet och har legat i över en timme. Avslutas idag!
            </p>
          </div>
        </div>

        {/* Quick sound test or replay */}
        {soundEnabled && (
          <button
            onClick={() => playReminderSound(soundVolume)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-700/80 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 transition"
            title="Spela upp påminnelseljudet igen"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Spela ljud</span>
          </button>
        )}
      </div>

      {/* List of Urgent Orders needing immediate attention */}
      <div className="divide-y divide-red-200/60 p-2 sm:p-3">
        {urgentOrders.map((order) => {
          const status = calculateReminderStatus(order.createdAt, order.reminderMinutes, order.snoozedUntil);
          return (
            <div
              key={order.id}
              className="group flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between hover:bg-white/70 transition"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700 font-bold text-xs">
                  ⚡
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-red-950 bg-red-100/80 px-2 py-0.5 rounded border border-red-200">
                      {order.orderNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100/50 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" />
                      Skapad kl. {formatSwedishTime(order.createdAt)} ({status.elapsedMinutes} min sedan)
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-800 line-clamp-1">
                    {order.action}
                  </p>
                  {order.note && (
                    <p className="text-xs text-slate-600 line-clamp-1 italic mt-0.5">
                      Anteckning: {order.note}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => onScrollToOrder(order.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
                >
                  <span>Gå till kort</span>
                  <ArrowRight className="h-3 w-3" />
                </button>

                <button
                  onClick={() => onSnooze(order.id, 30)}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition shadow-xs"
                  title="Snooza påminnelse i 30 minuter"
                >
                  <Clock className="h-3 w-3" />
                  <span>Snooza 30m</span>
                </button>

                <button
                  onClick={() => onComplete(order.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs active:scale-95"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Markera som klar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
