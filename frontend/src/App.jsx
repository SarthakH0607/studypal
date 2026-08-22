/**
 * App — Root router and auth protection wrapper for StudyPal.
 * Includes Landing Page, Dual Student/Parent Login, and Parent Portal.
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';

// Layout
import Layout from './components/layout/Layout';
import { PageLoader } from './components/ui/Loader';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ParentLoginPage from './pages/ParentLoginPage';
import ParentPortalPage from './pages/ParentPortalPage';
import TeacherLoginPage from './pages/TeacherLoginPage';
import TeacherDashboard from './pages/TeacherDashboard';

// Student Protected Pages
import DashboardPage from './pages/DashboardPage';
import TutorPage from './pages/TutorPage';
import LearningPathPage from './pages/LearningPathPage';
import ExamsPage from './pages/ExamsPage';
import DocumentsPage from './pages/DocumentsPage';
import SnapLearnPage from './pages/SnapLearnPage';
import ScholarshipsPage from './pages/ScholarshipsPage';
import SettingsPage from './pages/SettingsPage';

function StudentProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useStore();

  if (authLoading) {
    return <PageLoader text="Loading StudyPal..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function HomeRoute() {
  const { isAuthenticated, authLoading } = useStore();

  if (authLoading) {
    return <PageLoader text="Loading StudyPal..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
}

export default function App() {
  const { restoreAuth } = useStore();

  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: 'var(--color-text)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            boxShadow: 'var(--shadow-md)',
          },
        }}
      />
      <Routes>
        {/* Public Home Route (Landing Page) */}
        <Route path="/" element={<HomeRoute />} />

        {/* Public Auth & Portal Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/parent-login" element={<ParentLoginPage />} />
        <Route path="/parent-portal" element={<ParentPortalPage />} />
        <Route path="/teacher-login" element={<TeacherLoginPage />} />
        <Route path="/teacher-portal" element={<TeacherDashboard />} />

        {/* Protected Student App Routes */}
        <Route
          element={
            <StudentProtectedRoute>
              <Layout />
            </StudentProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tutor" element={<TutorPage />} />
          <Route path="/learning" element={<LearningPathPage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/snap-learn" element={<SnapLearnPage />} />
          <Route path="/scholarships" element={<ScholarshipsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
