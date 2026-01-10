import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import Layout from './components/Layout.tsx';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Rooms from './pages/Rooms.tsx';
import Settings from './pages/Settings.tsx';
import Tenants from './pages/Tenants.tsx';
import Readings from './pages/Readings.tsx';
import WorkLogs from './pages/WorkLogs.tsx';
import BillingHistory from './pages/BillingHistory.tsx';


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="billing-history" element={<BillingHistory />} />
            <Route path="readings" element={<Readings />} />
            <Route path="work-logs" element={<WorkLogs />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
