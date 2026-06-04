import { useUser } from '../context/UserContext';
import { UserCircle } from 'lucide-react';

export default function UserPicker() {
  const { users, currentUser, selectUser } = useUser();

  return (
    <div className="flex items-center gap-2.5">
      {currentUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-amber-500/20">
          {currentUser.name.charAt(0)}
        </div>
      )}
      {!currentUser && (
        <UserCircle size={20} className="text-[var(--color-text-muted)]" />
      )}
      <select
        aria-label="Select who is voting"
        value={currentUser?.id ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          if (!val) return;
          const user = users.find((u) => u.id === Number(val));
          if (user) selectUser(user);
        }}
        className="appearance-none bg-slate-100 border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-sm font-semibold rounded-xl px-4 py-2 pr-9 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all cursor-pointer hover:bg-slate-200"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1rem',
        }}
      >
        <option value="">Who's voting?</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} {u.is_vegetarian ? '🌿' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
