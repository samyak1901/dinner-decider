import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, AlertCircle, CalendarDays } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { castVote, getTodaySuggestions, refreshSuggestions } from '../api';
import MealCard from '../components/MealCard';
import VoteResults from '../components/VoteResults';
import { DaySuggestions } from '../types';
import RecipeDrawer from '../components/RecipeDrawer';

function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="h-1 bg-slate-100" />
      <div className="p-6 space-y-4">
        <div className="h-4 w-20 bg-slate-100 rounded-full animate-shimmer" />
        <div className="h-6 w-3/4 bg-slate-100 rounded-lg animate-shimmer" />
        <div className="flex gap-2">
          <div className="h-7 w-24 bg-slate-100 rounded-full animate-shimmer" />
          <div className="h-7 w-16 bg-slate-100 rounded-full animate-shimmer" />
        </div>
        <div className="h-4 w-full bg-slate-100 rounded animate-shimmer" />
        <div className="h-4 w-2/3 bg-slate-100 rounded animate-shimmer" />
        <div className="h-10 w-full bg-slate-100 rounded-xl animate-shimmer" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { currentUser } = useUser();
  const [data, setData] = useState<DaySuggestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchSuggestions = useCallback(() => {
    setLoading(true);
    setError(null);
    getTodaySuggestions(currentUser?.id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  useEffect(() => {
    fetchSuggestions();
    const interval = setInterval(() => {
      getTodaySuggestions(currentUser?.id)
        .then(setData)
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchSuggestions, currentUser?.id]);

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      const result = await refreshSuggestions(currentUser?.id);
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleVote(suggestionId: string) {
    if (!currentUser) return;
    try {
      await castVote(currentUser.id, suggestionId);
      const result = await getTodaySuggestions(currentUser.id);
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  }

  function handleShowRecipe(meal: any) {
    setSelectedMeal(meal);
    setIsDrawerOpen(true);
  }

  const formattedDate = data?.date ? new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }) : '';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {formattedDate && (
            <div className="flex items-center gap-2 text-amber-400/70 mb-2">
              <CalendarDays size={16} />
              <span className="font-bold uppercase tracking-widest text-xs">{formattedDate}</span>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Tonight's <span className="gradient-text">Dinner</span>
          </h1>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-primary flex items-center gap-2"
        >
          {refreshing ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <Sparkles size={18} />
          )}
          {refreshing ? 'Generating...' : 'New Suggestions'}
        </motion.button>
      </header>

      <AnimatePresence>
        {!currentUser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/15 text-amber-300 text-sm font-medium"
          >
            <AlertCircle size={18} className="shrink-0" />
            Pick your name from the dropdown to cast your vote!
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/15 text-red-400 text-sm font-medium flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : data?.suggestions?.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-dashed border-white/10 py-20 text-center glass-card"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 animate-float">
            <Sparkles size={32} />
          </div>
          <p className="text-xl font-bold text-[var(--color-text-primary)]">No suggestions yet</p>
          <p className="mt-2 text-[var(--color-text-muted)] max-w-sm mx-auto text-sm">
            Click "New Suggestions" to generate meal ideas, or wait for the 5 PM auto-generation.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-10">
          <div className="grid gap-6 md:grid-cols-3">
            {data?.suggestions?.map((s, idx) => (
              <MealCard
                key={s.id}
                suggestion={s}
                userVoteId={data.user_vote_id}
                onVote={handleVote}
                onShowRecipe={handleShowRecipe}
                canVote={!!currentUser}
                index={idx}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {data?.suggestions && <VoteResults suggestions={data.suggestions} />}
          </motion.div>
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
