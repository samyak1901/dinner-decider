import { useCallback, useEffect, useState } from 'react';
import {
  CalendarRange, X, ShoppingCart, Star, AlertCircle, Loader2,
  ChevronLeft, ChevronRight, Pin,
} from 'lucide-react';
import {
  getWeek, getMeals, pinMeal, unpinMeal, getShoppingList, getFavourites,
} from '../api';
import { Favourite, Meal, PlanDay, ShoppingItem } from '../types';

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Monday-based start of the week, shifted by `offsetWeeks`.
function weekStart(offsetWeeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offsetWeeks * 7);
  return isoLocal(d);
}

function fmtDay(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const SOURCE_LABEL: Record<PlanDay['source'], string> = {
  planned: 'Pinned',
  history: 'Cooked',
  none: 'Open',
};

export default function PlanPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const start = weekStart(weekOffset);
  const today = isoLocal(new Date());

  const [days, setDays] = useState<PlanDay[]>([]);
  const [pool, setPool] = useState<Meal[]>([]);
  const [favs, setFavs] = useState<Favourite[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[] | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, m, f] = await Promise.all([getWeek(start), getMeals(), getFavourites()]);
      setDays(w.days);
      setPool(m);
      setFavs(f);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [start]);

  useEffect(() => { load(); }, [load]);

  async function handlePin(date: string, mealId: number) {
    try { await pinMeal(date, mealId); await load(); } catch (e: any) { setError(e.message); }
  }
  async function handleUnpin(date: string) {
    try { await unpinMeal(date); await load(); } catch (e: any) { setError(e.message); }
  }
  async function handleShopping() {
    try {
      const r = await getShoppingList(start, 7);
      setShopping(r.items);
      setChecked({});
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400/70 mb-2">
            <CalendarRange size={18} />
            <span className="font-bold uppercase tracking-widest text-xs">Weekly Plan</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Meal <span className="gradient-text">Plan</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week" className="btn-ghost p-2 rounded-lg"><ChevronLeft size={18} /></button>
          <span className="text-sm font-bold text-[var(--color-text-muted)] min-w-28 text-center">Week of {fmtDay(start)}</span>
          <button onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week" className="btn-ghost p-2 rounded-lg"><ChevronRight size={18} /></button>
        </div>
      </header>

      {error && (
        <div role="alert" className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/15 text-red-500 text-sm font-medium flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-400" size={28} /></div>
      ) : (
        <div className="grid gap-3">
          {days.map((d) => (
            <div key={d.date} className={`glass-card rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 ${d.date === today ? 'glow-ring-amber' : ''}`}>
              <div className="w-28 shrink-0">
                <div className="text-sm font-bold text-[var(--color-text-primary)]">{fmtDay(d.date)}</div>
                <span className={`text-[10px] font-black uppercase tracking-wider ${d.source === 'planned' ? 'text-amber-500' : d.source === 'history' ? 'text-green-600' : 'text-[var(--color-text-muted)]'}`}>{SOURCE_LABEL[d.source]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[var(--color-text-secondary)] font-semibold truncate">
                  {d.meal ? d.meal.name : (d.note || '— nothing planned —')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="sr-only" htmlFor={`pin-${d.date}`}>Pin a meal for {d.date}</label>
                <select
                  id={`pin-${d.date}`}
                  value=""
                  onChange={(e) => { if (e.target.value) handlePin(d.date, Number(e.target.value)); }}
                  className="bg-slate-100 border border-[var(--color-border-subtle)] text-sm font-semibold rounded-lg px-3 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                >
                  <option value="">{d.is_pinned ? 'Change…' : 'Pin a meal…'}</option>
                  {pool.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {d.is_pinned && (
                  <button onClick={() => handleUnpin(d.date)} aria-label="Remove pin" className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-500"><X size={16} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shopping list */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart size={20} className="text-amber-500" /> Shopping List</h2>
          <button onClick={handleShopping} className="btn-primary py-2 px-4 text-sm">Generate for this week</button>
        </div>
        {shopping && (
          shopping.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">Nothing to buy — no planned or cooked meals this week.</p>
          ) : (
            <ul className="glass-card rounded-xl p-4 grid sm:grid-cols-2 gap-x-6 gap-y-2">
              {shopping.map((it) => (
                <li key={it.item}>
                  <label className="flex items-start gap-2.5 text-sm cursor-pointer">
                    <input type="checkbox" checked={!!checked[it.item]} onChange={() => setChecked((c) => ({ ...c, [it.item]: !c[it.item] }))} className="mt-1 accent-amber-500" />
                    <span className={checked[it.item] ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-secondary)]'}>
                      {it.item}
                      <span className="text-[var(--color-text-muted)] text-xs"> · {it.meals.join(', ')}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )
        )}
      </section>

      {/* Favourites */}
      <section className="mt-10">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Star size={20} className="text-amber-500" /> Favourites</h2>
        {favs.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">Top-rated meals appear here once you rate cooked dinners 4★ or above.</p>
        ) : (
          <div className="grid gap-3">
            {favs.map((f) => (
              <div key={f.meal.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-[var(--color-text-primary)] truncate">{f.meal.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">★ {f.avg_rating} · cooked {f.times_cooked}× · {f.meal.cuisine || 'meal'}</div>
                </div>
                <button onClick={() => handlePin(today, f.meal.id)} className="btn-ghost py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 shrink-0">
                  <Pin size={14} /> Cook again today
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
