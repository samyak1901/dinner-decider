import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Save, Trash2, ShieldAlert, Check, X, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, User } from '../api';
import { useUser } from '../context/UserContext';

export default function SettingsPage() {
  const { refreshUsers } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // New User Form
  const [newName, setNewName] = useState('');
  const [newIsVeg, setNewIsVeg] = useState(false);
  const [newRestrictions, setNewRestrictions] = useState('');
  
  // Edit Buffer
  const [editName, setEditName] = useState('');
  const [editIsVeg, setEditIsVeg] = useState(false);
  const [editRestrictions, setEditRestrictions] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      await createUser(newName, newIsVeg, newRestrictions);
      setNewName('');
      setNewIsVeg(false);
      setNewRestrictions('');
      await loadUsers();
      await refreshUsers();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleUpdate(id: number) {
    setError(null);
    try {
      await updateUser(id, {
        name: editName,
        is_vegetarian: editIsVeg,
        dietary_restrictions: editRestrictions
      });
      setEditingId(null);
      await loadUsers();
      await refreshUsers();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to remove this member?')) return;
    setError(null);
    try {
      await deleteUser(id);
      await loadUsers();
      await refreshUsers();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function startEditing(user: User) {
    setEditingId(user.id);
    setEditName(user.name);
    setEditIsVeg(user.is_vegetarian);
    setEditRestrictions(user.dietary_restrictions || '');
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-10">
        <div className="flex items-center gap-2 text-amber-400/70 mb-2">
          <SettingsIcon size={18} />
          <span className="font-bold uppercase tracking-widest text-xs">Management</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Household <span className="gradient-text">Settings</span>
        </h1>
        <p className="mt-4 text-[var(--color-text-secondary)] text-lg max-w-2xl">
          Manage who's at the table. Your AI assistant uses these details to ensure everyone's dietary needs are met.
        </p>
      </header>

      {error && (
        <div role="alert" className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/15 text-red-500 text-sm font-medium flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-8">
        {/* Registration Card */}
        <section className="glass-card rounded-2xl p-8 border-amber-500/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
              <UserPlus size={20} />
            </div>
            <h2 className="text-xl font-bold">Add Member</h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--color-text-muted)] mb-2 tracking-widest">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alice"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 outline-none transition-all font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--color-text-muted)] mb-2 tracking-widest">Type</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewIsVeg(false)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${!newIsVeg ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Omnivore
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewIsVeg(true)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newIsVeg ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Vegetarian
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-[var(--color-text-muted)] mb-2 tracking-widest">
                Dietary Restrictions
              </label>
              <input
                type="text"
                placeholder="e.g. No peanuts, Gluten-free, Halal"
                value={newRestrictions}
                onChange={(e) => setNewRestrictions(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 outline-none transition-all font-semibold"
              />
            </div>

            <button type="submit" className="btn-primary w-full shadow-amber-500/10">
              Register Member
            </button>
          </form>
        </section>

        {/* Members List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
                <Users size={20} />
              </div>
              <h2 className="text-xl font-bold">Household Members</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">{users.length} registered</span>
          </div>

          <div className="space-y-3">
            {users.map((user) => (
              <motion.div
                key={user.id}
                layout
                className="glass-card rounded-2xl p-4 md:p-6"
              >
                {editingId === user.id ? (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                      />
                      <button
                        onClick={() => setEditIsVeg(!editIsVeg)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${editIsVeg ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {editIsVeg ? 'Vegetarian' : 'Omnivore'}
                      </button>
                    </div>
                    <input
                      value={editRestrictions}
                      onChange={(e) => setEditRestrictions(e.target.value)}
                      placeholder="Dietary rules..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-slate-600">
                        <X size={20} />
                      </button>
                      <button onClick={() => handleUpdate(user.id)} className="p-2 text-green-500 hover:text-green-600 bg-green-50 rounded-lg">
                        <Check size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">{user.name}</h3>
                          {user.is_vegetarian && (
                            <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Veg</span>
                          )}
                        </div>
                        {user.dietary_restrictions ? (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <ShieldAlert size={12} className="text-amber-500" />
                            {user.dietary_restrictions}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1">No restrictions</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(user)}
                        className="p-2 text-slate-400 hover:text-amber-500 transition-colors"
                      >
                        <Save size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
            
            {users.length === 0 && !loading && (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Users size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No members registered yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
