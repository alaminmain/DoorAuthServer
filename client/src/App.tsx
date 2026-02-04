import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Applications from './pages/Applications';
import Roles from './pages/Roles';
import Menus from './pages/Menus';
import Users from './pages/Users';
import UserRoles from './pages/UserRoles';
import Sessions from './pages/Sessions';
import Organizations from './pages/Organizations';
import Security from './pages/Security';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />

                {/* Placeholders for future routes */}
                <Route path="tenants" element={<Tenants />} />
                <Route path="applications" element={<Applications />} />
                <Route path="roles" element={<Roles />} />
                <Route path="menus" element={<Menus />} />
                <Route path="users" element={<Users />} />
                <Route path="user-roles" element={<UserRoles />} />
                <Route path="sessions" element={<Sessions />} />
                <Route path="organizations" element={<Organizations />} />
                <Route path="settings" element={<Security />} />
                <Route path="security" element={<Security />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
