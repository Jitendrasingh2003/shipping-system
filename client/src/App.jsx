import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { TenantProvider } from './context/TenantContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages — Existing
import PortalSelectPage from './pages/PortalSelectPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import WelcomePage from './pages/WelcomePage';

// Pages — SaaS New
import LandingPage from './pages/LandingPage';
import TenantRegister from './pages/TenantRegister';
import SuperAdminPanel from './pages/SuperAdminPanel';
import TenantSettings from './pages/TenantSettings';

function App() {
  return (
    <BrowserRouter>
      <TenantProvider>
        <AuthProvider>
          <SocketProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#111827',
                  color: '#f3f4f6',
                  border: '1px solid #1f2937',
                  borderRadius: '12px',
                  fontSize: '14px',
                  boxShadow: '0 8px 32px 0 rgba(15, 23, 42, 0.3)',
                },
                success: { iconTheme: { primary: '#10b981', secondary: '#111827' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#111827' } },
              }}
            />
            <Routes>
              {/* ── SaaS Public Pages ── */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/register-company" element={<TenantRegister />} />

              {/* ── Super Admin (Platform Owner) ── */}
              <Route path="/superadmin" element={<SuperAdminPanel />} />

              {/* ── Existing Portals ── */}
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/" element={<PortalSelectPage />} />
              <Route path="/admin-login" element={<AdminLoginPage />} />

              {/* Protected Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/settings" element={<TenantSettings />} />
              </Route>

              {/* Protected Staff Routes */}
              <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
                <Route path="/staff" element={<StaffDashboard />} />
              </Route>

              {/* Protected Customer Routes */}
              <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
                <Route path="/customer" element={<CustomerDashboard />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </TenantProvider>
    </BrowserRouter>
  );
}

export default App;
