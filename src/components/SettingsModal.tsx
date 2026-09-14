import React, { useRef } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Play, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Bell, 
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { AppSettings, OrderItem } from '../types';
import { playReminderSound, playSuccessSound } from '../utils/soundEffects';
import { fireCompletionConfetti } from '../utils/confetti';
import { exportOrdersToJson, exportOrdersToCsv } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  orders: OrderItem[];
  onImportOrders: (imported: OrderItem[]) => void;
  onResetToSampleData: () => void;
  onClearAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  orders,
  onImportOrders,
  onResetToSampleData,
  onClearAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleSoundToggle = () => {
    onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled });
  };

  const handleVolumeChange = (vol: number) => {
    onUpdateSettings({ ...settings, soundVolume: vol });
  };

  const handleTestReminder = () => {
    playReminderSound(settings.soundVolume);
  };

  const handleTestSuccess = () => {
    playSuccessSound(settings.soundVolume);
    fireCompletionConfetti();
  };

  const handleRequestBrowserNotification = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        onUpdateSettings({ ...settings, browserNotifications: true });
        new Notification('Orderprioritering aktiverad', {
          body: 'Webbläsarnotiser för högprioriterade påminnelser är nu aktiva!',
          icon: '/favicon.ico',
        });
      } else {
        onUpdateSettings({ ...settings, browserNotifications: false });
      }
    } else {
      alert('Din webbläsare stöder inte systemnotiser.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportOrders(parsed);
          alert(`Lyckades importera ${parsed.length} ordrar!`);
        } else {
          alert('Filen verkar inte innehålla giltig orderdata.');
        }
      } catch (err) {
        alert('Kunde inte läsa JSON-filen: ' + String(err));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-pop">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Inställningar & Ljud
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Ljudinställningar & Provlyssning */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <VolumeX className="h-4 w-4 text-slate-400" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Ljudeffekter
                </span>
              </div>
              <button
                type="button"
                onClick={handleSoundToggle}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  settings.soundEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {settings.soundEnabled ? 'Ljud På' : 'Ljud Av'}
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Volym</span>
                    <span className="font-mono">{Math.round(settings.soundVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={settings.soundVolume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full accent-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleTestReminder}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 transition"
                  >
                    <Play className="h-3.5 w-3.5 text-red-600" />
                    <span>Testa påminnelseljud 🔔</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestSuccess}
                    className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    <Play className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Testa klart-ljud & konfetti 🎉</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Standard Påminnelsetid */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Standard påminnelsetid för Hög prioritet
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Hur lång tid efter skapandet en högprioriterad order ska larma ifall den inte är avklarad.
            </p>
            <div className="flex flex-wrap gap-2">
              {[15, 30, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, defaultReminderMinutes: mins })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    settings.defaultReminderMinutes === mins
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {mins >= 60 ? `${mins / 60} ${mins === 60 ? 'timme' : 'timmar'}` : `${mins} minuter`}
                </button>
              ))}
            </div>

            {/* Browser notification toggle */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800">Webbläsarnotiser</span>
                <p className="text-[11px] text-slate-500">Få en systemnotis även om fliken inte är aktiv</p>
              </div>
              <button
                type="button"
                onClick={handleRequestBrowserNotification}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  settings.browserNotifications
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {settings.browserNotifications ? 'Aktiverat' : 'Aktivera'}
              </button>
            </div>
          </div>

          {/* Säkerhetskopiering & Export */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-2">
              Säkerhetskopia & Export
            </span>
            <p className="text-xs text-slate-500 mb-3">
              Dina ordrar sparas automatiskt lokalt i din webbläsare ({orders.length} ordrar sparade). Du kan även exportera en fil till datorn.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => exportOrdersToJson(orders)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Exportera backup (.JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => exportOrdersToCsv(orders)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Exportera till Excel (.CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Återställ från fil</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={onResetToSampleData}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Ladda om exempeldata</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500">Rensa all lokal data:</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Är du säker på att du vill rensa alla ordrar?')) {
                    onClearAll();
                  }
                }}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Töm dokumentet</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
