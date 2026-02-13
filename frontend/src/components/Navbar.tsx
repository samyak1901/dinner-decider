import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UtensilsCrossed, CalendarDays, History } from 'lucide-react';
import UserPicker from './UserPicker';

export default function Navbar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between glass-dark rounded-2xl px-5 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-xl text-white group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-amber-500/20">
              <UtensilsCrossed size={20} />
            </div>
            <span className="text-lg font-extrabold gradient-text hidden sm:inline">
              Dinner Decider
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <NavLink to="/" active={isActive('/')} icon={<CalendarDays size={16} />}>
              Today
            </NavLink>
            <NavLink to="/history" active={isActive('/history')} icon={<History size={16} />}>
              History
            </NavLink>
          </div>
        </div>

        <UserPicker />
      </div>
    </nav>
  );
}

function NavLink({ to, active, icon, children }: { to: string; active: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300
        ${active ? 'text-amber-400' : 'text-[var(--color-text-muted)] hover:text-amber-300'}`}
    >
      {icon}
      {children}
      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 bg-amber-500/10 rounded-xl border border-amber-500/20 -z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </Link>
  );
}
