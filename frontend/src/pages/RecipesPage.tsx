import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Plus, AlertCircle, Leaf, Flame, Loader2 } from 'lucide-react';
import { createMeal, getMeals } from '../api';
import { Meal } from '../types';

function lines(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean);
}

export default function RecipesPage() {
  const [pool, setPool] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [isVeg, setIsVeg] = useState(false);
  const [time, setTime] = useState('');
  const [summary, setSummary] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPool(await getMeals());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createMeal({
        name: name.trim(),
        cuisine: cuisine.trim() || undefined,
        is_vegetarian: isVeg,
        recipe_summary: summary.trim() || undefined,
        ingredients: lines(ingredients),
        prep_steps: lines(steps),
        estimated_time_minutes: time ? Number(time) : undefined,
      });
      setName(''); setCuisine(''); setIsVeg(false); setTime('');
      setSummary(''); setIngredients(''); setSteps('');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-amber-400/70 mb-2">
          <BookOpen size={18} />
          <span className="font-bold uppercase tracking-widest text-xs">Recipe Box</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Your <span className="gradient-text">Recipes</span>
        </h1>
        <p className="mt-3 text-[var(--color-text-secondary)]">Add your own meals to the pool — they become available to pin on the weekly plan.</p>
      </header>

      {error && (
        <div role="alert" className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/15 text-red-500 text-sm font-medium flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-5 mb-10">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="r-name" className="block text-[10px] font-black uppercase text-[var(--color-text-muted)] mb-2 tracking-widest">Name</label>
            <input id="r-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grandma's Lasagna" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30" />
          </div>
          <div>
            <label htmlFor="r-time" className="block text-[10px] font-black uppercase text-[var(--color-text-muted)] mb-2 tracking-widest">Time (min)</label>
            <input id="r-time" type="number" min={1} max={600} value={time} onChange={(e) => setTime(e.target.value)} placeholder="45" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="r-cuisine" className="block text-[10px] font-black uppercase text-[var(--color-text-muted)] mb-2 tracking-widest">Cuisine</label>
            <input id="r-cuisine" value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="Italian" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30" />
          </div>
          <div>
            <span className="block text-[10px] font-black uppercase text-[var(--color-text-muted)] mb-2 tracking-widest">Type</span>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              <button type="button" onClick={() => setIsVeg(false)} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${!isVeg ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}><Flame size={13} /> Meat</button>
              <button type="button" onClick={() => setIsVeg(true)} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${isVeg ? 'bg-green-500 text-white' : 'text-slate-500'}`}><Leaf size={13} /> Veg</button>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="r-summary" className="block text-[10px] font-black uppercase text-[var(--color-text-muted)] mb-2 tracking-widest">Summary</label>
          <input id="r-summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="One-line description" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="r-ing" className="block text-[10px] font-black uppercase text-[var(--color-text-muted)] mb-2 tracking-widest">Ingredients (one per line)</label>
            <textarea id="r-ing" rows={5} value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder={'500g pasta\n2 cans tomatoes\ngarlic'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 resize-y" />
          </div>
          <div>
            <label htmlFor="r-steps" className="block text-[10px] font-black uppercase text-[var(--color-text-muted)] mb-2 tracking-widest">Steps (one per line)</label>
            <textarea id="r-steps" rows={5} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={'Boil pasta\nSimmer sauce\nCombine'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 resize-y" />
          </div>
        </div>

        <button type="submit" disabled={saving || !name.trim()} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {saving ? 'Saving…' : 'Add to recipe box'}
        </button>
      </form>

      <section>
        <h2 className="text-xl font-bold mb-4">Meal Pool <span className="text-sm font-bold text-[var(--color-text-muted)]">({pool.length})</span></h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-amber-400" size={24} /></div>
        ) : pool.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">No meals in the pool yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {pool.map((m) => (
              <div key={m.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-[var(--color-text-primary)] truncate">{m.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{m.cuisine || 'meal'}{m.estimated_time_minutes ? ` · ${m.estimated_time_minutes}m` : ''}</div>
                </div>
                <span role="img" aria-label={m.is_vegetarian ? 'Vegetarian' : 'Contains meat'} className={`p-2 rounded-lg shrink-0 ${m.is_vegetarian ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {m.is_vegetarian ? <Leaf size={16} /> : <Flame size={16} />}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
