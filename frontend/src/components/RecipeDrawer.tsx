import { motion, AnimatePresence } from 'framer-motion';
import { X, ChefHat, Leaf, Flame, Timer } from 'lucide-react';
import RecipeDetail from './RecipeDetail';

interface RecipeDrawerProps {
  meal: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RecipeDrawer({ meal, isOpen, onClose }: RecipeDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && meal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white border-l border-black/5 shadow-2xl z-[101] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 border-b border-black/5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 p-2 rounded-xl text-amber-400">
                  <ChefHat size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)] leading-tight">
                    {meal.name}
                  </h2>
                  <div className="flex gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-muted)]">
                      <Timer size={12} />
                      {meal.estimated_time_minutes}m
                    </span>
                    <span className={`flex items-center gap-1 text-xs font-bold ${meal.is_vegetarian ? 'text-green-400' : 'text-red-400'}`}>
                      {meal.is_vegetarian ? <Leaf size={12} /> : <Flame size={12} />}
                      {meal.is_vegetarian ? 'Vegetarian' : meal.cuisine || 'Classic'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 pb-20">
              {meal.recipe_summary && (
                <div className="mb-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-400/70 mb-3">Overview</h3>
                  <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed italic">
                    "{meal.recipe_summary}"
                  </p>
                </div>
              )}

              <RecipeDetail meal={meal} isExpandedByDefault={true} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
