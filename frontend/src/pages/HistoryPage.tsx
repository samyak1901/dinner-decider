import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Star, MessageSquare, ChevronLeft, ChevronRight, Calendar, ChefHat, AlertCircle } from 'lucide-react';
import RecipeDrawer from '../components/RecipeDrawer';
import { getHistory, rateMeal } from '../api';
import { HistoryResponse, Meal } from '../types';

export default function HistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingFor, setRatingFor] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingNotes, setRatingNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getHistory(page)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  async function handleRate(date: string) {
    setSaving(true);
    setError(null);
    try {
      await rateMeal(date, ratingValue, ratingNotes || '');
      setRatingFor(null);
      setRatingValue(5);
      setRatingNotes('');
      const result = await getHistory(page);
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-10 w-10 rounded-full border-2 border-white/10 border-t-amber-500"
        />
        <p className="text-[var(--color-text-muted)] font-medium text-sm">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-10">
        <div className="flex items-center gap-2 text-amber-400/70 mb-2">
          <History size={18} />
          <span className="font-bold uppercase tracking-widest text-xs">Past Meals</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Meal <span className="gradient-text">History</span>
        </h1>
      </header>

      {error && (
        <div role="alert" className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/15 text-red-400 text-sm font-medium flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {!data?.items?.length ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center glass-card">
          <History size={40} className="mx-auto text-[var(--color-text-muted)] mb-4" />
          <p className="text-xl font-bold text-[var(--color-text-primary)]">No meal history yet</p>
          <p className="mt-1 text-[var(--color-text-muted)] text-sm">
            History is recorded after votes are finalized each day.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="glass-card rounded-2xl p-5 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center w-12 h-12 bg-amber-500/10 rounded-xl border border-amber-500/10 shrink-0">
                    <span className="text-[9px] uppercase font-black text-amber-400/70">
                      {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-black text-amber-400 leading-none">
                      {new Date(item.date + 'T00:00:00').getDate()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest flex items-center gap-1 mb-0.5">
                      <Calendar size={9} />
                      {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
                    </span>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-[var(--color-text-primary)] group-hover:text-amber-400 transition-colors">
                        {item.winning_meal.name}
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedMeal(item.winning_meal);
                          setIsDrawerOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 text-amber-400/60 hover:text-amber-400 hover:bg-white/10 transition-all"
                        title="View Recipe Details"
                        aria-label={`View recipe for ${item.winning_meal.name}`}
                      >
                        <ChefHat size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {item.rating ? (
                    <div className="bg-amber-500/10 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-amber-500/10">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < Math.round(item.rating ?? 0) ? 'fill-amber-500 text-amber-500' : 'text-white/10'}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-amber-400">{item.rating}/5</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRatingFor(item.date)}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors bg-amber-500/10 px-3 py-1.5 rounded-lg border border-transparent hover:border-amber-500/20"
                    >
                      Rate
                    </button>
                  )}
                  <span className="bg-white/5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]">
                    {item.total_votes} {item.total_votes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
              </div>

              {item.notes && (
                <div className="mt-3 flex gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/5 italic text-sm text-[var(--color-text-muted)]">
                  <MessageSquare size={14} className="shrink-0 text-white/10 mt-0.5" />
                  "{item.notes}"
                </div>
              )}

              <AnimatePresence>
                {ratingFor === item.date && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 pt-5 border-t border-white/5 space-y-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="shrink-0">
                          <label className="block text-[10px] font-black uppercase text-[var(--color-text-muted)] mb-2">Rating</label>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((v) => (
                              <button
                                key={v}
                                onClick={() => setRatingValue(v)}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                                  ratingValue === v
                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                    : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 border border-[var(--color-border-subtle)]'
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-black uppercase text-[var(--color-text-muted)] mb-2">Thoughts</label>
                          <input
                            type="text"
                            placeholder="How was it?"
                            value={ratingNotes}
                            onChange={(e) => setRatingNotes(e.target.value)}
                            className="w-full bg-white/5 border border-[var(--color-border-subtle)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setRatingFor(null)}
                          className="btn-ghost py-2 px-4 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRate(item.date)}
                          disabled={saving}
                          className="btn-primary py-2 px-5 text-sm disabled:opacity-50"
                        >
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 p-2 rounded-lg bg-white/5 border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-amber-400 hover:border-amber-500/20 disabled:opacity-30 transition-all group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="pr-1.5 font-bold text-sm">Prev</span>
          </button>
          <span className="text-sm font-bold text-[var(--color-text-muted)]">
            <span className="text-[var(--color-text-primary)]">{data.page}</span> / <span className="text-[var(--color-text-primary)]">{data.total_pages}</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
            disabled={page >= data.total_pages}
            className="flex items-center gap-1 p-2 rounded-lg bg-white/5 border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-amber-400 hover:border-amber-500/20 disabled:opacity-30 transition-all group"
          >
            <span className="pl-1.5 font-bold text-sm">Next</span>
            <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      <RecipeDrawer
        meal={selectedMeal}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
