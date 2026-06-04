import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { UserProvider } from './context/UserContext';
import LoginGate from './components/LoginGate';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';

// Split non-landing routes into their own chunks so the initial (voting)
// page loads a smaller bundle.
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PlanPage = lazy(() => import('./pages/PlanPage'));
const RecipesPage = lazy(() => import('./pages/RecipesPage'));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="animate-spin text-amber-400" size={28} aria-label="Loading" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <div className="relative min-h-screen bg-[var(--color-bg-primary)]">
          <div className="ambient-bg" />
          <div className="relative z-10">
            <LoginGate>
              <Navbar />
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/plan" element={<PlanPage />} />
                  <Route path="/recipes" element={<RecipesPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </Suspense>
            </LoginGate>
          </div>
        </div>
      </UserProvider>
    </BrowserRouter>
  );
}
