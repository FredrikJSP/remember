import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ChevronUp, 
  ChevronDown, 
  RotateCcw, 
  Trash2, 
  Clock, 
  Calendar, 
  Search,
  Sparkles
} from 'lucide-react';
import { OrderItem } from '../types';
import { formatSwedishDateTime, getRelativeTimeString } from '../utils/dateUtils';

interface CompletedOrdersDrawerProps {
  completedOrders: OrderItem[];
  onRestoreToHigh: (id: string) => void;
  onRestoreToLow: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAllCompleted: () => void;
  currentTime: Date;
}

export const CompletedOrdersDrawer: React.FC<CompletedOrdersDrawerProps> = ({
  completedOrders,
  onRestoreToHigh,
  onRestoreToLow,
  onDelete,
  onClearAllCompleted,
  currentTime,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  if (completedOrders.length === 0) {
    return null;
  }

  const filteredOrders = completedOrders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.note.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-8 border-t border-slate-200/80 pt-4">
      {/* Sleek, Space-Saving Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 px-4 py-3 shadow-xs">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 text-left focus:outline-none flex-1"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">
                Avklarade ordrar
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                {completedOrders.length} st
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-md">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                Frigör skärmyta för dagens prioriteringar
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isOpen
                ? 'Klicka för att fälla ihop och dölja'
                : 'Klicka för att visa eller återaktivera avklarade ordrar'}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {isOpen && completedOrders.length > 0 && (
            confirmClear ? (
              <div className="flex items-center gap-1.5 text-xs bg-red-50 p-1 rounded-lg border border-red-200">
                <span className="text-red-700 font-medium">Rensa alla?</span>
                <button
                  onClick={() => {
                    onClearAllCompleted();
                    setConfirmClear(false);
                  }}
                  className="rounded bg-red-600 px-2 py-0.5 font-bold text-white hover:bg-red-700"
                >
                  Ja
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="rounded bg-slate-200 px-2 py-0.5 text-slate-700 hover:bg-slate-300"
                >
                  Avbryt
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition"
                title="Rensa alla avklarade ordrar ur historiken"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Rensa avklarade</span>
              </button>
            )
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition shadow-2xs"
            aria-label="Visa/Dölj avklarade ordrar"
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Compact Archive View */}
      {isOpen && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pop">
          {/* Search inside completed */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Sök bland avklarade..."
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Visar {filteredOrders.length} av {completedOrders.length}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Inga matchande avklarade ordrar hittades.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3">Ordernr</th>
                    <th className="py-2.5 px-3">Åtgärd & Anteckning</th>
                    <th className="py-2.5 px-3 hidden md:table-cell">Skapad</th>
                    <th className="py-2.5 px-3">Avklarad</th>
                    <th className="py-2.5 px-3 text-right">Åtgärder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-emerald-50/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-800">
                        <span className="rounded bg-slate-100 px-2 py-0.5 border border-slate-200">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-700 line-through">
                          {order.action}
                        </div>
                        {order.note && (
                          <div className="text-[11px] text-slate-400 italic line-clamp-1">
                            {order.note}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{formatSwedishDateTime(order.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-emerald-700 font-medium">
                        {order.completedAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-emerald-600" />
                            <span>{getRelativeTimeString(order.completedAt, currentTime)}</span>
                          </div>
                        ) : (
                          '–'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onRestoreToHigh(order.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition"
                            title="Återaktivera till Hög prioritet"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Till Hög ⚡</span>
                          </button>
                          <button
                            onClick={() => onRestoreToLow(order.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition"
                            title="Återaktivera till Låg prioritet"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Till Låg</span>
                          </button>
                          <button
                            onClick={() => onDelete(order.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Ta bort helt"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
