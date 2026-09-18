import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', motDePasse: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.motDePasse) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const { token, user } = res.data;
      login(token, user);

      if (user.premiereConnexion || user.motDePasseTemporaire) {
        navigate('/change-password', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/dashboard', { replace: true });
      } else if (user.role === 'agent') {
        navigate('/agent/scan', { replace: true });
      } else {
        navigate('/mes-billets', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'var(--bg-base)',
      backgroundImage: `
        radial-gradient(ellipse at 20% 50%, rgba(79,70,229,0.05) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.04) 0%, transparent 50%)
      `
    }}>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px', padding: '24px' }}>

        {/* Logo */}
        <div className="flex flex-col items-center" style={{ marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64,
            background: 'var(--gradient-primary)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(79,70,229,0.25)',
          }}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '2rem' }}>directions_bus</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', textAlign: 'center' }}>
            Billetterie Intelligente
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Formulaire */}
        <div className="card" style={{ padding: 36, boxShadow: 'var(--shadow-lg)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Adresse email</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '1.2rem', pointerEvents: 'none',
                }}>mail</span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="exemple@email.com"
                  className={`form-input ${error ? 'input-error' : ''}`}
                  style={{ paddingLeft: 44 }}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="form-group">
              <label htmlFor="motDePasse" className="form-label">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '1.2rem', pointerEvents: 'none',
                }}>lock</span>
                <input
                  id="motDePasse"
                  type={showPassword ? 'text' : 'password'}
                  name="motDePasse"
                  value={form.motDePasse}
                  onChange={handleChange}
                  placeholder="Votre mot de passe"
                  className={`form-input ${error ? 'input-error' : ''}`}
                  style={{ paddingLeft: 44, paddingRight: 50 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 4,
                    display: 'flex', alignItems: 'center',
                  }}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', flexShrink: 0 }}>warning</span>
                <span>{error}</span>
              </div>
            )}

            {/* Bouton */}
            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: 4, gap: 8 }}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Connexion…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>login</span>
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          {/* Footer du card */}
          <div style={{
            marginTop: 24, paddingTop: 20,
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Accès réservé aux utilisateurs autorisés.<br />
              Contactez votre administrateur si vous ne pouvez pas vous connecter.
            </p>
          </div>
        </div>

        {/* Footer bas de page */}
        <p style={{
          textAlign: 'center', marginTop: 24,
          fontSize: '0.75rem', color: 'var(--text-muted)',
        }}>
          © {new Date().getFullYear()} Système de Billetterie Intelligente — CCAK L3
        </p>
      </div>
    </div>
  );
}
