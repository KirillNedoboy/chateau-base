import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { usePlayerStore } from './store/playerStore';
import WelcomePage from './pages/WelcomePage';
import HubPage from './pages/HubPage';
import ShopPage from './pages/ShopPage';
import VineyardPage from './pages/VineyardPage';
import WineryPage from './pages/WineryPage';
import AcademyPage from './pages/AcademyPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = usePlayerStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated } = usePlayerStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/hub" replace /> : <WelcomePage />} />
        <Route path="/hub" element={<ProtectedRoute><HubPage /></ProtectedRoute>} />
        <Route path="/shop" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
        <Route path="/vineyard" element={<ProtectedRoute><VineyardPage /></ProtectedRoute>} />
        <Route path="/winery" element={<ProtectedRoute><WineryPage /></ProtectedRoute>} />
        <Route path="/academy" element={<ProtectedRoute><AcademyPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
