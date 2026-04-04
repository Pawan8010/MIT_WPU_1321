import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import useStore from './store/useStore';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public pages (Lazy loaded)
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Signup = lazy(() => import('./pages/Auth/Signup'));

// Protected pages (Lazy loaded)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EMTForm = lazy(() => import('./pages/EMTForm'));
const Prediction = lazy(() => import('./pages/Prediction'));
const HospitalRouting = lazy(() => import('./pages/HospitalRouting'));
const MapDashboard = lazy(() => import('./pages/MapDashboard'));
const XAIPanel = lazy(() => import('./pages/XAIPanel'));
const MassCasualty = lazy(() => import('./pages/MassCasualty'));
const Settings = lazy(() => import('./pages/Settings'));

// New AI Features (Lazy loaded)
const SceneUpload = lazy(() => import('./pages/SceneUpload'));
const Navigation = lazy(() => import('./pages/Navigation'));

export default function App() {
  const darkMode = useStore(state => state.settings?.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <Routes>
        {/* ═══ Public routes ═══ */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ═══ Protected routes ═══ */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scene-upload" element={<SceneUpload />} />
          <Route path="navigation" element={<Navigation />} />
          <Route path="emt-form" element={<EMTForm />} />
          <Route path="prediction" element={<Prediction />} />
          <Route path="hospital-routing" element={<HospitalRouting />} />
          <Route path="map" element={<MapDashboard />} />
          <Route path="xai" element={<XAIPanel />} />
          <Route path="mass-casualty" element={<MassCasualty />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Route>

        {/* Legacy routes */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/scene-upload" element={<Navigate to="/app/scene-upload" replace />} />
        <Route path="/navigation" element={<Navigate to="/app/navigation" replace />} />
        <Route path="/emt-form" element={<Navigate to="/app/emt-form" replace />} />
        <Route path="/prediction" element={<Navigate to="/app/prediction" replace />} />
        <Route path="/hospital-routing" element={<Navigate to="/app/hospital-routing" replace />} />
        <Route path="/map" element={<Navigate to="/app/map" replace />} />
        <Route path="/xai" element={<Navigate to="/app/xai" replace />} />
        <Route path="/mass-casualty" element={<Navigate to="/app/mass-casualty" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
