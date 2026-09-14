import React, { useState } from 'react';
import { X, Check, Zap, Shield } from 'lucide-react';
import { OrderItem, Priority } from '../types';

interface EditOrderModalProps {
  order: OrderItem | null;
  onSave: (updated: OrderItem) => void;
  onClose: () => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  onSave,
  onClose,
}) => {
  if (!order) return null;

  const [orderNumber, setOrderNumber] = useState(order.orderNumber);
  const [action, setAction] = useState(order.action);
  const [note, setNote] = useState(order.note || '');
  const [priority, setPriority] = useState<Priority>(order.priority);
  const [reminderMinutes, setReminderMinutes] = useState(order.reminderMinutes || 60);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !action.trim()) return;

    onSave({
      ...order,
      orderNumber: orderNumber.trim(),
      action: action.trim(),
      note: note.trim(),
      priority,
      reminderMinutes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-pop">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Redigera arbetsorder
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Ordernummer
            </label>
            <input
              type="text"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Åtgärd
            </label>
            <input
              type="text"
              required
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Anteckning
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Prioritet
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPriority('hog')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold border transition ${
                  priority === 'hog'
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-red-600" />
                <span>Hög prioritet (Idag)</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority('lag')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold border transition ${
                  priority === 'lag'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                <span>Låg prioritet</span>
              </button>
            </div>
          </div>

          {priority === 'hog' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Påminnelseintervall
              </label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800"
              >
                <option value={15}>15 minuter</option>
                <option value={30}>30 minuter</option>
                <option value={60}>1 timme</option>
                <option value={90}>1,5 timmar</option>
                <option value={120}>2 timmar</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              <Check className="h-4 w-4" />
              <span>Spara ändringar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
