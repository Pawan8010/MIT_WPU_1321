/**
 * ProtectedRoute — redirects unauthenticated users to /login.
 *
 * Checks both Firebase Auth (via AuthContext) and demo session.
 */
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { Activity } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthContext();

  // Check for demo user in session storage
  const demoUser = sessionStorage.getItem("gh_demo_user");

  // Still loading auth state — show branded loading spinner
  if (loading && !demoUser) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#F8FAFC',
        fontFamily: "'Inter', sans-serif",
        color: '#64748B',
        gap: '16px',
      }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <Activity size={24} />
        </div>
        <p style={{ margin: 0, fontWeight: 500 }}>Loading GoldenHour...</p>
        <style>{`@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.95); } }`}</style>
      </div>
    );
  }

  // Not authenticated and no demo user — redirect to login
  if (!user && !demoUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
