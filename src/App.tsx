import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Zap, 
  Shield, 
  CheckCircle2, 
  Clock, 
  Search, 
  SlidersHorizontal, 
  Volume2, 
  VolumeX, 
  Printer, 
  ArrowUpDown, 
  Sparkles,
  Calendar,
  Layers,
  Info
} from 'lucide-react';
import { OrderItem, AppSettings, Priority, OrderCategory } from './types';
import { 
  loadOrdersFromStorage, 
  saveOrdersToStorage, 
  loadSettingsFromStorage, 
  saveSettingsToStorage, 
  getSampleOrders 
} from './utils/storage';
import { formatTodayHeader, calculateReminderStatus } from './utils/dateUtils';
import { playReminderSound, playSuccessSound } from './utils/soundEffects';
import { fireCompletionConfetti } from './utils/confetti';
import { OrderForm } from './components/OrderForm';
import { OrderCard } from './components/OrderCard';
import { ReminderBanner } from './components/ReminderBanner';
import { CompletedOrdersDrawer } from './components/CompletedOrdersDrawer';
import { SettingsModal } from './components/SettingsModal';
import { EditOrderModal } from './components/EditOrderModal';

export default function App() {
  const [orders, setOrders] = useState<OrderItem[]>(() => loadOrdersFromStorage());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettingsFromStorage());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<'newest' | 'oldest'>('newest');
  const [celebrationToast, setCelebrationToast] = useState<{ visible: boolean; orderNumber: string } | null>(null);

  // Keep track of which orders have played sound recently to avoid audio loops
  const playedReminderMap = useRef<{ [orderId: string]: number }>({});

  // Save orders to local storage whenever they change
  useEffect(() => {
    saveOrdersToStorage(orders);
  }, [orders]);

  // Save settings whenever changed
  useEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings]);

  // Live clock tick every second for crisp UI & accurate timer calculation
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Reminder Engine: Check high priority orders every 10 seconds
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const nowMs = now.getTime();

      orders.forEach((order) => {
        if (order.category === 'hog') {
          const status = calculateReminderStatus(
            order.createdAt,
            order.reminderMinutes,
            order.snoozedUntil,
            now
          );

          if (status.isDue) {
            const lastPlayed = playedReminderMap.current[order.id] || 0;
            // Play sound if not played in the last 15 minutes for this order
            if (nowMs - lastPlayed > 15 * 60 * 1000) {
              if (settings.soundEnabled) {
                playReminderSound(settings.soundVolume);
              }

              // Also trigger browser notification if enabled
              if (settings.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(`⏰ Påminnelse: Order ${order.orderNumber}`, {
                  body: `${order.action} – Borde åtgärdas snarast idag!`,
                  tag: `order-${order.id}`,
                });
              }

              playedReminderMap.current[order.id] = nowMs;
            }
          }
        }
      });
    };

    checkReminders();
    const reminderInterval = setInterval(checkReminders, 10000);
    return () => clearInterval(reminderInterval);
  }, [orders, settings.soundEnabled, settings.soundVolume, settings.browserNotifications]);

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = orders;
    if (q) {
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.action.toLowerCase().includes(q) ||
          (o.note && o.note.toLowerCase().includes(q))
      );
    }

    // Default sorting: nyast längst upp (newest first)
    return [...result].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortDirection === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [orders, searchQuery, sortDirection]);

  // Separate active categories
  const highPriorityOrders = useMemo(
    () => filteredOrders.filter((o) => o.category === 'hog'),
    [filteredOrders]
  );

  const lowPriorityOrders = useMemo(
    () => filteredOrders.filter((o) => o.category === 'lag'),
    [filteredOrders]
  );

  const completedOrders = useMemo(
    () => filteredOrders.filter((o) => o.category === 'avklarat'),
    [filteredOrders]
  );

  // Urgent orders for the top reminder banner
  const urgentOrders = useMemo(() => {
    return highPriorityOrders.filter((o) => {
      const status = calculateReminderStatus(o.createdAt, o.reminderMinutes, o.snoozedUntil, currentTime);
      return status.isDue;
    });
  }, [highPriorityOrders, currentTime]);

  // Handlers
  const handleAddOrder = (newOrderData: Omit<OrderItem, 'id' | 'createdAt'>) => {
    const newOrder: OrderItem = {
      ...newOrderData,
      id: `order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    // Always put newest at top
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleMoveToCategory = (id: string, newCategory: OrderCategory) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;

        const isNowCompleted = newCategory === 'avklarat';
        return {
          ...o,
          category: newCategory,
          priority: newCategory === 'avklarat' ? o.priority : (newCategory as Priority),
          completedAt: isNowCompleted ? new Date().toISOString() : undefined,
        };
      })
    );

    // If marked as completed: play triumphant chime & burst confetti!
    if (newCategory === 'avklarat') {
      const completedItem = orders.find((o) => o.id === id);
      if (settings.soundEnabled) {
        playSuccessSound(settings.soundVolume);
      }
      fireCompletionConfetti();

      // Show temporary joyful toast
      setCelebrationToast({
        visible: true,
        orderNumber: completedItem?.orderNumber || 'Order',
      });
      setTimeout(() => setCelebrationToast(null), 4000);
    }
  };

  const handleSnooze = (id: string, minutes: number) => {
    if (minutes === -1) {
      // Instant test trigger: set creation time to 75 minutes ago and clear snooze
      const pastTime = new Date(Date.now() - 75 * 60 * 1000).toISOString();
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, createdAt: pastTime, snoozedUntil: null } : o))
      );
      delete playedReminderMap.current[id];
      if (settings.soundEnabled) {
        playReminderSound(settings.soundVolume);
      }
      return;
    }

    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, snoozedUntil: snoozeUntil } : o))
    );
    // Reset audio timestamp so it will alert again after snooze expires
    delete playedReminderMap.current[id];
  };

  const handleDelete = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    delete playedReminderMap.current[id];
  };

  const handleClearAllCompleted = () => {
    setOrders((prev) => prev.filter((o) => o.category !== 'avklarat'));
  };

  const handleScrollToOrder = (id: string) => {
    const el = document.getElementById(`order-card-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-red-500');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-red-500');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-16">
      {/* Celebration micro-toast */}
      {celebrationToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-white px-5 py-3.5 shadow-2xl animate-pop text-emerald-950">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Snyggt jobbat! 🎉
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {celebrationToast.orderNumber} är nu avklarad!
            </div>
          </div>
        </div>
      )}

      {/* Top Header / Document Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
            {/* Title & Document Badge */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 text-white shadow-md">
                <Layers className="h-5 w-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
                    Orderprioritering
                  </h1>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
                    Arbetsdokument
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formatTodayHeader(currentTime)}</span>
                  <span className="text-slate-300">•</span>
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-mono text-slate-700">
                    {currentTime.toLocaleTimeString('sv-SE')}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Statistics Summary Bar */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium">
              {/* High Priority count */}
              <div 
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 transition ${
                  highPriorityOrders.length > 0
                    ? 'border-red-200 bg-red-50 text-red-700 font-semibold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-red-600" />
                <span>Hög:</span>
                <span className="rounded-full bg-red-600 px-1.5 py-0.2 text-[11px] font-bold text-white">
                  {highPriorityOrders.length}
                </span>
                {urgentOrders.length > 0 && (
                  <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white animate-pulse" title="Larmar!">
                    {urgentOrders.length} larm
                  </span>
                )}
              </div>

              {/* Low Priority count */}
              <div className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-blue-700 shadow-2xs">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                <span>Låg:</span>
                <span className="rounded-full bg-blue-600 px-1.5 py-0.2 text-[11px] font-bold text-white">
                  {lowPriorityOrders.length}
                </span>
              </div>

              {/* Completed count */}
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800 shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Avklarade:</span>
                <span className="rounded-full bg-emerald-600 px-1.5 py-0.2 text-[11px] font-bold text-white">
                  {completedOrders.length}
                </span>
              </div>

              {/* Sound Toggle quick button */}
              <button
                onClick={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                title={settings.soundEnabled ? 'Ljud är på (klicka för att stänga av)' : 'Ljud är av (klicka för att slå på)'}
              >
                {settings.soundEnabled ? (
                  <Volume2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                )}
                <span className="hidden sm:inline">
                  {settings.soundEnabled ? 'Ljud på' : 'Ljud av'}
                </span>
              </button>

              {/* Settings / Gear button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                title="Öppna inställningar & export"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">Verktyg</span>
              </button>

              {/* Print view button */}
              <button
                onClick={() => window.print()}
                className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs"
                title="Skriv ut arbetsdokument"
              >
                <Printer className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        {/* Quick reminder box if any high-priority item is overdue */}
        <ReminderBanner
          urgentOrders={urgentOrders}
          onComplete={(id) => handleMoveToCategory(id, 'avklarat')}
          onSnooze={handleSnooze}
          onScrollToOrder={handleScrollToOrder}
          soundEnabled={settings.soundEnabled}
          soundVolume={settings.soundVolume}
        />

        {/* Input Form for adding orders */}
        <OrderForm
          onAddOrder={handleAddOrder}
          defaultReminderMinutes={settings.defaultReminderMinutes}
        />

        {/* Toolbar: Search, Sort toggle & View Info */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök ordernummer, åtgärd eller anteckning..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 shadow-2xs transition"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Toggle Button: Nyast först */}
            <button
              onClick={() => setSortDirection(sortDirection === 'newest' ? 'oldest' : 'newest')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              title="Växla sorteringsordning"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              <span>
                Sortering: {sortDirection === 'newest' ? 'Nyast längst upp' : 'Äldst först'}
              </span>
            </button>
          </div>
        </div>

        {/* Workspace Columns: High Priority & Low Priority */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* COLUMN 1: HÖG PRIORITET (Slutför idag!) */}
          <div className="space-y-4">
            {/* Column Header */}
            <div className="flex items-center justify-between rounded-2xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 px-4 py-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
                  <Zap className="h-4 w-4 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold tracking-wide uppercase text-red-900">
                      Hög Prioritet
                    </h2>
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                      {highPriorityOrders.length}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-red-700">
                    Ska slutföras idag • Larmar efter {settings.defaultReminderMinutes >= 60 ? `${settings.defaultReminderMinutes / 60} tim` : `${settings.defaultReminderMinutes} min`}
                  </p>
                </div>
              </div>

              {urgentOrders.length > 0 && (
                <div className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs animate-bounce">
                  <span>{urgentOrders.length} larmar nu</span>
                </div>
              )}
            </div>

            {/* List of High Priority Cards */}
            {highPriorityOrders.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-red-200/80 bg-red-50/20 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100/70 text-red-600 mb-2">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Inga högprioriterade ordrar just nu
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Bra jobbat! Lägg till nya akuta ordrar ovan eller flytta över från låg prioritet vid behov.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {highPriorityOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onMoveToCategory={handleMoveToCategory}
                    onEdit={(o) => setEditingOrder(o)}
                    onDelete={handleDelete}
                    onSnooze={handleSnooze}
                    currentTime={currentTime}
                  />
                ))}
              </div>
            )}
          </div>

          {/* COLUMN 2: LÅG PRIORITET (Tas efterhand) */}
          <div className="space-y-4">
            {/* Column Header */}
            <div className="flex items-center justify-between rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold tracking-wide uppercase text-blue-900">
                      Låg Prioritet
                    </h2>
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                      {lowPriorityOrders.length}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-blue-700">
                    Tas i tur och ordning • Kan enkelt höjas till hög prio
                  </p>
                </div>
              </div>
            </div>

            {/* List of Low Priority Cards */}
            {lowPriorityOrders.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-blue-200/80 bg-blue-50/20 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-2">
                  <Shield className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Inga ordrar med låg prioritet
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Alla pågående ärenden är antingen slutförda eller ligger i den akuta kön.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {lowPriorityOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onMoveToCategory={handleMoveToCategory}
                    onEdit={(o) => setEditingOrder(o)}
                    onDelete={handleDelete}
                    currentTime={currentTime}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COMPLETED ORDERS SECTION:
            "När det hamnar i avklarat ska det inte längre ta upp viktig plats på skärmen men ändå finnas kvar."
            Handled by our space-saving collapsible drawer with search and restore! */}
        <CompletedOrdersDrawer
          completedOrders={completedOrders}
          onRestoreToHigh={(id) => handleMoveToCategory(id, 'hog')}
          onRestoreToLow={(id) => handleMoveToCategory(id, 'lag')}
          onDelete={handleDelete}
          onClearAllCompleted={handleClearAllCompleted}
          currentTime={currentTime}
        />

        {/* Helpful hints and keyboard shortcuts at bottom */}
        <div className="mt-8 rounded-xl border border-slate-200/60 bg-white/60 p-4 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              All data sparas automatiskt i din webbläsare. Högprioriterade ordrar larmar efter vald tid.
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Sortering: <strong className="text-slate-600">Nyast längst upp</strong></span>
            <span>•</span>
            <span>Konfetti & ljud vid avklarat</span>
          </div>
        </div>
      </main>

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onSave={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          }}
          onClose={() => setEditingOrder(null)}
        />
      )}

      {/* Settings & Tools Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        orders={orders}
        onImportOrders={(imported) => setOrders(imported)}
        onResetToSampleData={() => {
          const sample = getSampleOrders();
          setOrders(sample);
          saveOrdersToStorage(sample);
        }}
        onClearAll={() => {
          setOrders([]);
          saveOrdersToStorage([]);
        }}
      />
    </div>
  );
}
