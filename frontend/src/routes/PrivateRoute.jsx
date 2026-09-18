import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protection de base — doit être connecté
export const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Chargement…</p>
        </div>
      </div>
    );
  }

  return isAuthenticated
    ? children
    : <Navigate to="/login" state={{ from: location }} replace />;
};

// Protection par rôle
export const RoleRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
