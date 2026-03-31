import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import InvitePage from './pages/InvitePage';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import TasksPage from './pages/TasksPage';
import LogsPage from './pages/LogsPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';

function RequireAuth({ children }) {
  const { user, member, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)' }}>
      読み込み中...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!member) return <Navigate to="/login?notmember=1" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<HomePage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
