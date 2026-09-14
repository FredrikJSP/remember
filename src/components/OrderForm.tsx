import React, { useState, useEffect } from 'react';
import { PlusCircle, Zap, Shield, Clock, Sparkles } from 'lucide-react';
import { Priority, OrderItem } from '../types';
import { formatSwedishTime } from '../utils/dateUtils';

interface OrderFormProps {
  onAddOrder: (order: Omit<OrderItem, 'id' | 'createdAt'>) => void;
  defaultReminderMinutes: number;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  onAddOrder,
  defaultReminderMinutes,
}) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [action, setAction] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<Priority>('hog');
  const [reminderMinutes, setReminderMinutes] = useState(defaultReminderMinutes || 60);
  const [isOpen, setIsOpen] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTimeStr(formatSwedishTime(new Date().toISOString()));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !action.trim()) return;

    onAddOrder({
      orderNumber: orderNumber.trim(),
      action: action.trim(),
      note: note.trim(),
      priority,
      category: priority,
      reminderMinutes: priority === 'hog' ? reminderMinutes : 60,
    });

    // Reset form fields
    setOrderNumber('');
    setAction('');
    setNote('');
  };

  return (
    <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs">
            <PlusCircle className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              Mata in ny arbetsorder
            </h2>
            <p className="text-xs text-slate-500">
              Kortet sparas med aktuell tidsstämpel: <strong className="text-slate-700 font-mono">kl. {currentTimeStr}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium sm:hidden"
        >
          {isOpen ? 'Dölj formulär' : 'Visa formulär'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            {/* Ordernummer */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Ordernummer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="t.ex. ORD-4921 eller 1042"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-mono font-semibold text-slate-900 placeholder:font-sans placeholder:text-xs placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 transition shadow-2xs"
                />
              </div>
            </div>

            {/* Åtgärd */}
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Åtgärd <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Vad ska göras? t.ex. Byta styrventil och trycktesta krets"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-xs placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 transition shadow-2xs"
              />
            </div>
          </div>

          {/* Anteckning */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Anteckning <span className="text-slate-400 font-normal lowercase">(valfritt)</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ytterligare information, telefonnummer, detaljer eller önskemål..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-xs placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 transition shadow-2xs"
            />
          </div>

          {/* Prioritet Selector + Reminder Settings */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Välj Prioritet
              </div>
              <div className="inline-flex rounded-xl bg-slate-200/70 p-1 shadow-inner">
                {/* Hög Prioritet Button */}
                <button
                  type="button"
                  onClick={() => setPriority('hog')}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    priority === 'hog'
                      ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400/40'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className={`h-3.5 w-3.5 ${priority === 'hog' ? 'text-amber-200 fill-amber-200' : 'text-slate-400'}`} />
                  <span>⚡ Hög (Slutför idag)</span>
                </button>

                {/* Låg Prioritet Button */}
                <button
                  type="button"
                  onClick={() => setPriority('lag')}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    priority === 'lag'
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className={`h-3.5 w-3.5 ${priority === 'lag' ? 'text-blue-200' : 'text-slate-400'}`} />
                  <span>🔵 Låg prioritet</span>
                </button>
              </div>
            </div>

            {/* Reminder Setting if Hög is selected */}
            {priority === 'hog' ? (
              <div className="flex flex-col sm:items-end">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Påminnelse för Hög prio:</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-900 focus:outline-none focus:ring-1 focus:ring-red-500 shadow-2xs"
                  >
                    <option value={15}>Efter 15 minuter</option>
                    <option value={30}>Efter 30 minuter</option>
                    <option value={60}>Efter 1 timme (rekommenderat)</option>
                    <option value={90}>Efter 1,5 timmar</option>
                    <option value={120}>Efter 2 timmar</option>
                    <option value={1}>Testläge (1 minut)</option>
                  </select>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Spelar ljud och visar påminnelse-ruta
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Låg prioritet sparas i att-göra listan utan akut påminnelse.
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-1">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Sorteras automatiskt med nyast längst upp</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setOrderNumber(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
                  setAction('Akut kontroll och åtgärd före dagens slut');
                  setNote('Kund behöver snabb återkoppling via telefon.');
                  setPriority('hog');
                }}
                className="hidden md:inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                title="Fyll formuläret med ett exempel"
              >
                <span>Fyll i exempel</span>
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Lägg till kort</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
