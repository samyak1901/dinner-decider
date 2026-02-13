import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <div className="relative min-h-screen bg-[var(--color-bg-primary)]">
          <div className="ambient-bg" />
          <div className="relative z-10">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </div>
        </div>
      </UserProvider>
    </BrowserRouter>
  );
}
