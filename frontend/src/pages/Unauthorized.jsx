import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleReturnToLogin = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4" style={{ background: 'var(--bg-base)', gap: 20 }}>
      <div style={{ fontSize: '4.5rem', lineHeight: 1 }}>🚫</div>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Accès refusé</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 460, fontSize: '1.05rem', margin: 0 }}>
        Vous n'avez pas les droits nécessaires pour accéder à cette page.
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
        <button
          onClick={handleReturnToLogin}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', fontSize: '0.95rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>login</span>
          Retour à la connexion
        </button>
      </div>
    </div>
  );
}

