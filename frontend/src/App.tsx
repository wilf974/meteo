import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import MapPage from './pages/MapPage';
import AlertsPage from './pages/AlertsPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import { useWeatherAlerts } from './hooks/useWeatherAlerts';
import { useAnalytics } from './hooks/useAnalytics';

function App() {
  // Track user connection for analytics
  useAnalytics();

  // Active le monitoring automatique des alertes météo
  // Vérifie toutes les 30 minutes les conditions météo des favoris
  useWeatherAlerts(true, 30);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/map" element={<MapPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/" element={<Navigate to="/map" />} />
      </Route>
    </Routes>
  );
}

export default App;
