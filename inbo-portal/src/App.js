import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import InboxPage from './pages/InboxPage';
import DraftsPage from './pages/DraftsPage';
import DraftsSettingsPage from './pages/DraftsSettingsPage';
import CategorizationPage from './pages/CategorizationPage';
import NotetakerPage from './pages/NotetakerPage';
import SchedulingPage from './pages/SchedulingPage';
import ChatPage from './pages/ChatPage';
import BillingPage from './pages/BillingPage';
import AdminPage from './pages/AdminPage';
import { OrganizationPage, PeoplePage, IntegrationsPage, ProfileSettingsPage } from './pages/SettingsPages';
import './styles.css';

function ProtectedRoute({ children, adminOnly, skipOnboarding }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-logo">in<em>bo</em></div>
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  // Force onboarding if Gmail not connected, unless we're already on onboarding
  if (!skipOnboarding && !user.gmail_connected && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <div className="loading-logo">in<em>bo</em></div>
      <div className="spinner" />
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.gmail_connected ? '/inbox' : '/onboarding'} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/onboarding" replace /> : <RegisterPage />} />
      <Route path="/onboarding" element={<ProtectedRoute skipOnboarding><OnboardingPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
      <Route path="/drafts" element={<ProtectedRoute><DraftsPage /></ProtectedRoute>} />
      <Route path="/drafts-settings" element={<ProtectedRoute><DraftsSettingsPage /></ProtectedRoute>} />
      <Route path="/categorization" element={<ProtectedRoute><CategorizationPage /></ProtectedRoute>} />
      <Route path="/notetaker" element={<ProtectedRoute><NotetakerPage /></ProtectedRoute>} />
      <Route path="/scheduling" element={<ProtectedRoute><SchedulingPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
      <Route path="/settings/organization" element={<ProtectedRoute><OrganizationPage /></ProtectedRoute>} />
      <Route path="/settings/people" element={<ProtectedRoute><PeoplePage /></ProtectedRoute>} />
      <Route path="/settings/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
      <Route path="/settings/profile" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<Navigate to="/settings/organization" replace />} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? (user.gmail_connected ? '/inbox' : '/onboarding') : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
