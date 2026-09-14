import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRightLeft, 
  Trash2, 
  Edit3, 
  Bell, 
  BellRing,
  FileText,
  Calendar
} from 'lucide-react';
import { OrderItem } from '../types';
import { formatSwedishDateTime, getRelativeTimeString, calculateReminderStatus } from '../utils/dateUtils';

interface OrderCardProps {
  order: OrderItem;
  onMoveToCategory: (id: string, newCategory: 'hog' | 'lag' | 'avklarat') => void;
  onEdit: (order: OrderItem) => void;
  onDelete: (id: string) => void;
  onSnooze?: (id: string, minutes: number) => void;
  currentTime: Date;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onMoveToCategory,
  onEdit,
  onDelete,
  onSnooze,
  currentTime,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isHigh = order.category === 'hog';
  const isLow = order.category === 'lag';
  const isCompleted = order.category === 'avklarat';

  const reminderStatus = isHigh 
    ? calculateReminderStatus(order.createdAt, order.reminderMinutes, order.snoozedUntil, currentTime)
    : null;

  const handleCopyOrderNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Color classes according to priority/status
  const containerClasses = isHigh
    ? reminderStatus?.isDue
      ? 'border-red-500 bg-gradient-to-b from-red-50/70 to-white shadow-md shadow-red-200/50 ring-2 ring-red-400 animate-urgent-pulse'
      : 'border-red-200/90 bg-gradient-to-b from-red-50/40 via-white to-white hover:border-red-300 hover:shadow-md hover:shadow-red-100/50'
    : isLow
    ? 'border-blue-200/90 bg-gradient-to-b from-blue-50/40 via-white to-white hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/50'
    : 'border-emerald-200/70 bg-emerald-50/20 opacity-80 hover:opacity-100 transition-opacity';

  return (
    <div
      id={`order-card-${order.id}`}
      className={`group relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${containerClasses}`}
    >
      {/* Top Header: Priority Badge + Order Number + Copy Button */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Order Number Monospace pill with copy */}
          <button
            onClick={handleCopyOrderNumber}
            className="group/btn inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold font-mono tracking-wider text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition"
            title="Klicka för att kopiera ordernummer"
          >
            <span>{order.orderNumber}</span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3 text-slate-400 group-hover/btn:text-slate-600" />
            )}
          </button>

          {/* Priority / Status Badge */}
          {isHigh && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></span>
              ⚡ Hög prioritet – Idag!
            </span>
          )}

          {isLow && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
              Låg prioritet
            </span>
          )}

          {isCompleted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Avklarad
            </span>
          )}
        </div>

        {/* Date and Time Created */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span title={`Skapad: ${formatSwedishDateTime(order.createdAt)}`}>
            {formatSwedishDateTime(order.createdAt)}
          </span>
          <span className="text-slate-400 font-light">
            ({getRelativeTimeString(order.createdAt, currentTime)})
          </span>
        </div>
      </div>

      {/* Reminder Status Alert for High Priority */}
      {isHigh && reminderStatus && (
        <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl p-2.5 text-xs font-medium border ${
          reminderStatus.isDue
            ? 'bg-red-100/90 text-red-900 border-red-300'
            : reminderStatus.isSnoozed
            ? 'bg-amber-50 text-amber-900 border-amber-200'
            : 'bg-orange-50 text-orange-800 border-orange-200/80'
        }`}>
          <div className="flex items-center gap-1.5">
            {reminderStatus.isDue ? (
              <BellRing className="h-3.5 w-3.5 text-red-600 animate-bounce" />
            ) : (
              <Bell className="h-3.5 w-3.5 text-orange-500" />
            )}
            <span>
              {reminderStatus.message}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {!reminderStatus.isDue && (
              <button
                onClick={() => {
                  if (onSnooze) {
                    // Set creation to 65 min ago to test reminder trigger
                    onSnooze(order.id, -1);
                  }
                }}
                className="rounded px-2 py-0.5 text-[11px] font-semibold bg-white/90 hover:bg-white text-red-700 border border-red-200 transition"
                title="Aktivera larm för att testa påminnelsen direkt"
              >
                Testa larm nu
              </button>
            )}
            {onSnooze && (
              <>
                <button
                  onClick={() => onSnooze(order.id, 15)}
                  className="rounded px-2 py-0.5 text-[11px] font-semibold bg-white/80 hover:bg-white text-slate-700 border border-slate-200 transition"
                  title="Pausa påminnelse i 15 minuter"
                >
                  Pausa 15m
                </button>
                <button
                  onClick={() => onSnooze(order.id, 60)}
                  className="rounded px-2 py-0.5 text-[11px] font-semibold bg-white/80 hover:bg-white text-slate-700 border border-slate-200 transition"
                  title="Pausa påminnelse i 1 timme"
                >
                  Pausa 1h
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content: Åtgärd (Action) */}
      <div className="mt-3.5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          Åtgärd
        </div>
        <div className={`text-base font-semibold leading-snug text-slate-900 ${
          isCompleted ? 'line-through text-slate-500 font-normal' : ''
        }`}>
          {order.action}
        </div>
      </div>

      {/* Note (Anteckning) */}
      {order.note && (
        <div className="mt-3 rounded-xl bg-slate-50/80 p-3 border border-slate-100">
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            <FileText className="h-3 w-3" />
            Anteckning
          </div>
          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
            {order.note}
          </p>
        </div>
      )}

      {/* If Completed, show timestamp */}
      {isCompleted && order.completedAt && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>Slutförd {formatSwedishDateTime(order.completedAt)} ({getRelativeTimeString(order.completedAt, currentTime)})</span>
        </div>
      )}

      {/* Action Footer Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        {/* Category Move Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {!isCompleted && (
            <button
              onClick={() => onMoveToCategory(order.id, 'avklarat')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
              title="Klarmarkera ordern (Spelar ljud och skjuter konfetti!)"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Avklarat</span>
            </button>
          )}

          {isHigh && (
            <button
              onClick={() => onMoveToCategory(order.id, 'lag')}
              className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/80 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
              title="Sänk prioritet till Låg"
            >
              <ArrowRightLeft className="h-3 w-3" />
              <span>Flytta till Låg</span>
            </button>
          )}

          {isLow && (
            <button
              onClick={() => onMoveToCategory(order.id, 'hog')}
              className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
              title="Höj prioritet till Hög (Slutför idag med påminnelse)"
            >
              <ArrowRightLeft className="h-3 w-3" />
              <span>Höj till Hög ⚡</span>
            </button>
          )}

          {isCompleted && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onMoveToCategory(order.id, 'hog')}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition"
              >
                <span>Återaktivera Hög</span>
              </button>
              <button
                onClick={() => onMoveToCategory(order.id, 'lag')}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
              >
                <span>Återaktivera Låg</span>
              </button>
            </div>
          )}
        </div>

        {/* Edit and Delete Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(order)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Redigera kort"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>

          {isDeleting ? (
            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 text-xs">
              <span className="text-[10px] text-red-700 font-medium">Ta bort?</span>
              <button
                onClick={() => onDelete(order.id)}
                className="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold hover:bg-red-700"
              >
                Ja
              </button>
              <button
                onClick={() => setIsDeleting(false)}
                className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
              >
                Nej
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsDeleting(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Radera order"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
