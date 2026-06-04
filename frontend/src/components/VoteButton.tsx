import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface VoteButtonProps {
  suggestionId: number;
  isSelected: boolean;
  onVote: (id: number) => void;
  disabled: boolean;
  voting?: boolean;
}

export default function VoteButton({ suggestionId, isSelected, onVote, disabled, voting = false }: VoteButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={() => onVote(suggestionId)}
      disabled={disabled || voting}
      aria-pressed={isSelected}
      aria-label={isSelected ? 'Your pick tonight' : 'Vote for this meal'}
      className={`mt-5 w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-bold transition-all duration-300
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2
        ${isSelected
          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/20'
          : 'bg-amber-50/50 text-amber-700 border border-amber-200 hover:border-amber-400 hover:bg-amber-50'
        } ${(disabled || voting) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {voting ? <Loader2 size={18} className="animate-spin" /> : isSelected ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      {voting ? 'Saving…' : isSelected ? 'Your Pick Tonight ✓' : 'Vote for this'}
    </motion.button>
  );
}
