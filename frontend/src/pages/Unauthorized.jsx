import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg-base)', gap: 20 }}>
      <div style={{ fontSize: '4rem' }}>🚫</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Accès refusé</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
      <Link to="/dashboard" className="btn btn-primary">Retour au tableau de bord</Link>
    </div>
  );
}
