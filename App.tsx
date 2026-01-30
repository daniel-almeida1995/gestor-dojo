import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { NewStudent } from './pages/NewStudent';
import { StudentFinancial } from './pages/StudentFinancial';
import { Payments } from './pages/Payments';
import { Attendance } from './pages/Attendance';
import { Schedule } from './pages/Schedule';
import { Assistant } from './pages/Assistant';
import { ChurnRisk } from './pages/ChurnRisk';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { BottomNav } from './components/BottomNav';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StudentProvider } from './contexts/StudentContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { AttendanceProvider } from './contexts/AttendanceContext';
import { Toaster } from 'sonner';

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  // Hide nav on New Student, Edit Student, Attendance Check, Assistant and Student Financial Detail, and Profile, Settings
  const hideNavRoutes = ['/student/new', '/student/edit', '/attendance', '/assistant', '/login', '/profile', '/settings'];

  // Check strict match or if path starts with /student/ and ends with /financial
  const shouldHide = hideNavRoutes.includes(location.pathname) ||
    (location.pathname.startsWith('/student/') && location.pathname.endsWith('/financial'));

  const showNav = !shouldHide;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white relative">
      {children}
      {showNav && <BottomNav />}
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { session, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const location = useLocation();

  if (authLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Onboarding Logic: If logged in but no settings, force redirect to /settings
  // But allow access to /settings itself to avoid infinite loop
  if (session && !settings && location.pathname !== '/settings') {
    return <Navigate to="/settings" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { session } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
      <Route path="/student/new" element={<ProtectedRoute><NewStudent /></ProtectedRoute>} />
      <Route path="/student/edit" element={<ProtectedRoute><NewStudent /></ProtectedRoute>} />
      <Route path="/student/:id/financial" element={<ProtectedRoute><StudentFinancial /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
      <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
      <Route path="/churn-risk" element={<ProtectedRoute><ChurnRisk /></ProtectedRoute>} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AuthProvider>
        <SettingsProvider>
          <StudentProvider>
            <AttendanceProvider>
              <HashRouter>
                <Layout>
                  <AppRoutes />
                  <Toaster position="top-center" richColors />
                </Layout>
              </HashRouter>
            </AttendanceProvider>
          </StudentProvider>
        </SettingsProvider>
      </AuthProvider>
    </AuthProvider>
  );
};

export default App;