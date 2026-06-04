import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, ListChecks, Play, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import VideoEmbed from './VideoEmbed';
import { Meal } from '../types';

interface RecipeDetailProps {
  meal: Meal;
  isExpandedByDefault?: boolean;
}

function parseJson(str: string | null | undefined): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => (typeof item === 'string' ? item : JSON.stringify(item)));
    }
    return [String(parsed)];
  } catch {
    return [str];
  }
}

export default function RecipeDetail({ meal, isExpandedByDefault = false }: RecipeDetailProps) {
  const [open, setOpen] = useState(isExpandedByDefault);

  const ingredients = parseJson(meal.ingredients);
  const steps = parseJson(meal.prep_steps);

  return (
    <div className="mt-4">
      {!isExpandedByDefault && (
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer group"
        >
          <ChefHat size={16} className="group-hover:rotate-12 transition-transform" />
          {open ? 'Hide recipe' : 'View recipe'}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-5 pt-4 border-t border-white/5">
              {ingredients.length > 0 && (
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)] mb-3">
                    <ListChecks size={16} className="text-amber-400" />
                    Ingredients
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                    {ingredients.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {steps.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)] mb-3">
                    <Play size={16} className="text-amber-400" />
                    Steps
                  </h4>
                  <ol className="space-y-3">
                    {steps.map((step: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-[var(--color-text-secondary)]">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs shrink-0 border border-amber-500/15">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {meal.youtube_video_url && (
                <div className="pt-1">
                  <VideoEmbed url={meal.youtube_video_url} title={meal.youtube_video_title} />
                </div>
              )}

              {meal.source_url && (
                <a
                  href={meal.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-amber-400 transition-colors"
                >
                  <ExternalLink size={12} />
                  Original recipe source
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
