import { motion } from 'framer-motion';
import { ChefHat, Timer, Leaf, Flame } from 'lucide-react';
import VoteButton from './VoteButton';
import { Suggestion } from '../types';

interface MealCardProps {
  suggestion: Suggestion;
  userVoteId?: string;
  onVote: (id: string) => void;
  onShowRecipe: (meal: any) => void;
  canVote: boolean;
  index?: number;
}

const ACCENT_COLORS = [
  { from: 'from-amber-500', to: 'to-orange-500', shadow: 'shadow-amber-500/10' },
  { from: 'from-rose-500', to: 'to-pink-500', shadow: 'shadow-rose-500/10' },
  { from: 'from-violet-500', to: 'to-indigo-500', shadow: 'shadow-violet-500/10' },
];

export default function MealCard({ suggestion, userVoteId, onVote, onShowRecipe, canVote, index = 0 }: MealCardProps) {
  const meal = (suggestion as any).meal;
  const vegAlt = (suggestion as any).veg_alternative;
  const isSelected = userVoteId === suggestion.id;
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className={`relative group rounded-2xl overflow-hidden glass-card transition-all duration-300
        ${isSelected ? 'glow-ring-amber' : ''}`}
    >
      {/* Accent strip */}
      <div className={`h-1 bg-gradient-to-r ${accent.from} ${accent.to}`} />

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-400/70 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/10 mb-2">
              Option {index + 1}
            </span>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] leading-tight">
              {meal.name}
            </h3>
          </div>
          <div className={`p-2.5 rounded-xl ${meal.is_vegetarian ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {meal.is_vegetarian ? <Leaf size={22} /> : <Flame size={22} />}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {meal.cuisine && (
            <span className="chip">
              <ChefHat size={12} />
              {meal.is_vegetarian ? 'Vegetarian' : meal.cuisine}
            </span>
          )}
          {meal.estimated_time_minutes && (
            <span className="chip">
              <Timer size={12} />
              {meal.estimated_time_minutes}m
            </span>
          )}
        </div>

        {meal.recipe_summary && (
          <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 leading-relaxed mb-4 italic">
            "{meal.recipe_summary}"
          </p>
        )}

        <button
          onClick={() => onShowRecipe(meal)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/5 bg-white/[0.02] text-amber-400/80 hover:text-amber-400 hover:bg-white/5 transition-all text-sm font-bold mb-4"
        >
          <ChefHat size={16} />
          View Ingredients & Steps
        </button>

        {vegAlt && (
          <div className="mt-5 p-4 rounded-xl bg-green-500/5 border border-green-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Leaf size={14} className="text-green-600" />
              <span className="text-[10px] font-black uppercase text-green-600 tracking-wider">Veggie Alternative</span>
            </div>
            <h4 className="text-sm font-bold text-green-800 mb-2">{vegAlt.name}</h4>
            <button
              onClick={() => onShowRecipe(vegAlt)}
              className="w-full py-1.5 rounded-lg bg-green-600/10 text-green-700 hover:bg-green-600/20 transition-all text-xs font-bold"
            >
              Alternative Details
            </button>
          </div>
        )}

        {canVote && (
          <VoteButton
            suggestionId={suggestion.id}
            isSelected={isSelected}
            onVote={onVote}
            disabled={!canVote}
          />
        )}
      </div>
    </motion.div>
  );
}
