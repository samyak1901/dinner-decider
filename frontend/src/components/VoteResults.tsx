import { Suggestion } from '../types';
import { Trophy, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoteResultsProps {
  suggestions: Suggestion[];
}

export default function VoteResults({ suggestions }: VoteResultsProps) {
  const processedSuggestions = suggestions.map(s => ({
    ...s,
    voters: (s as any).voters || [],
  }));

  const totalVotes = processedSuggestions.reduce((sum, s) => sum + s.vote_count, 0);
  if (totalVotes === 0) return null;

  const maxVotes = Math.max(...processedSuggestions.map((s) => s.vote_count));
  const leaders = processedSuggestions.filter((s) => s.vote_count === maxVotes);
  const isTie = leaders.length > 1 && maxVotes > 0;

  return (
    <div className="mt-10 glass-card rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-amber-400" size={22} />
        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Vote Progress</h3>
      </div>

      <div className="grid gap-5">
        {processedSuggestions.map((s) => {
          const pct = totalVotes > 0 ? Math.round((s.vote_count / totalVotes) * 100) : 0;
          const isLeader = s.vote_count === maxVotes && maxVotes > 0;

          return (
            <div key={s.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${isLeader ? 'text-amber-400' : 'text-[var(--color-text-secondary)]'}`}>
                    {s.title || (s as any).meal?.name}
                  </span>
                  {isLeader && <Trophy size={14} className="text-amber-500" />}
                </div>
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                  {s.vote_count} {s.vote_count === 1 ? 'vote' : 'votes'} · {pct}%
                </span>
              </div>

              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    isLeader ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-white/10'
                  }`}
                />
              </div>

              {s.voters.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {s.voters.map((voter: string, i: number) => (
                      <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border border-[var(--color-bg-card)] flex items-center justify-center text-[9px] font-bold text-slate-300 uppercase">
                        {voter.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {s.voters.join(', ')}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-5 border-t border-white/5 text-center">
        {isTie ? (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-xl text-sm font-bold border border-amber-500/15">
            🤝 It's a tie!
          </span>
        ) : maxVotes > 0 ? (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-xl text-sm font-bold border border-green-500/15">
            🎉 Leading: {leaders[0].title || (leaders[0] as any).meal?.name}
          </span>
        ) : null}
      </div>
    </div>
  );
}
