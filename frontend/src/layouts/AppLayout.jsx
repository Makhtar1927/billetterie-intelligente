import Sidebar from '../components/layout/Sidebar';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getBackendURL } from '../api/axios';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase();
  const roleLabel = { admin: 'Administrateur', agent: 'Agent', client: 'Client' }[user?.role] || user?.role;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {/* Topbar globale */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Espace {roleLabel}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Bouton de bascule de thème clair / sombre */}
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                fontSize: '0.8125rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
              title={isDark ? 'Basculer vers le thème clair' : 'Basculer vers le thème sombre'}
              id="btn-toggle-theme"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: isDark ? '#fbbf24' : '#6366f1' }}>
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
              <span>{isDark ? 'Mode clair' : 'Mode sombre'}</span>
            </button>
            <Link
              to="/profil"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                {user?.photo
                  ? <img src={user.photo.startsWith('http') ? user.photo : `${getBackendURL()}${user.photo}`} alt="profil" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : initials
                }
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.prenom} {user?.nom}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '0.8125rem',
                color: '#f87171',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)',
                cursor: 'pointer',
              }}
              title="Déconnexion"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>logout</span>
              <span>Déconnexion</span>
            </button>
          </div>
        </header>

        <div className="page-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
