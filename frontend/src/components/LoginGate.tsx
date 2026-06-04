import { FormEvent, ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { ApiError } from '../api';

export default function LoginGate({ children }: { children: ReactNode }) {
  const { loading, authenticated, authRequired, login } = useUser();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-400" size={32} aria-label="Loading" />
      </div>
    );
  }

  // Open mode (no passcode configured) or already authenticated.
  if (authenticated || !authRequired) {
    return <>{children}</>;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(passcode);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Incorrect passcode' : 'Could not log in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl p-8 w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Lock size={26} />
          </div>
          <h1 className="text-2xl font-black">
            Dinner <span className="gradient-text">Decider</span>
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">Enter the household passcode to continue.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="passcode" className="sr-only">Household passcode</label>
          <input
            id="passcode"
            type="password"
            autoFocus
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          {error && (
            <p role="alert" className="text-sm text-red-400 font-medium">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !passcode}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
          {submitting ? 'Checking…' : 'Enter'}
        </button>
      </motion.form>
    </div>
  );
}
