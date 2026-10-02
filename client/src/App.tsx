import { lazy, ReactNode, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import { Loading } from './components/ui';
import PublicPage from './pages/PublicPage';

const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ClientsList = lazy(() => import('./pages/ClientsList'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const Payments = lazy(() => import('./pages/Payments'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Readings = lazy(() => import('./pages/Readings'));
const Settings = lazy(() => import('./pages/Settings'));

function RequireAuth({ children }: { children: ReactNode }) {
  const { email, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center"><Loading label="Loading..." /></div>;
  if (!email) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center"><Loading label="Loading..." /></div>}>
      <Routes>
        <Route path="/" element={<PublicPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="requests" element={<ClientsList variant="requests" />} />
          <Route path="clients" element={<ClientsList variant="clients" />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="payments" element={<Payments />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="readings" element={<Readings />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
