import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import PortalSelectPage from './pages/PortalSelectPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import CustomerDashboard from './pages/CustomerDashboard';

function App() {
  return (
    <BrowserRouter>
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
            {/* Public Portal & Login Selector */}
            <Route path="/" element={<PortalSelectPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Protected Staff Routes */}
            <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
              <Route path="/staff" element={<StaffDashboard />} />
            </Route>

            {/* Protected Customer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route path="/customer" element={<CustomerDashboard />} />
            </Route>

            {/* Fallback to select portal */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
