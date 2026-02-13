import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

interface VoteButtonProps {
  suggestionId: string;
  isSelected: boolean;
  onVote: (id: string) => void;
  disabled: boolean;
}

export default function VoteButton({ suggestionId, isSelected, onVote, disabled }: VoteButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onVote(suggestionId)}
      disabled={disabled}
      className={`mt-5 w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-bold transition-all duration-300
        ${isSelected
          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/20'
          : 'bg-amber-50/50 text-amber-700 border border-amber-200 hover:border-amber-400 hover:bg-amber-50'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {isSelected ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      {isSelected ? 'Your Pick Tonight ✓' : 'Vote for this'}
    </motion.button>
  );
}
