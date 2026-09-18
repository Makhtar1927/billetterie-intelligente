import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/userService';
import toast from 'react-hot-toast';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const isTempPassword = user?.motDePasseTemporaire === true;

  const [form, setForm] = useState({ ancienMotDePasse: '', nouveauMotDePasse: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!isTempPassword && !form.ancienMotDePasse) || !form.nouveauMotDePasse || !form.confirm) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (form.nouveauMotDePasse !== form.confirm) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (form.nouveauMotDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      await changePassword({ 
        ancienMotDePasse: isTempPassword ? undefined : form.ancienMotDePasse, 
        nouveauMotDePasse: form.nouveauMotDePasse 
      });
      
      toast.success('Mot de passe changé avec succès !');
      
      // Update local user state so premiereConnexion is false
      updateUser({ ...user, premiereConnexion: false, motDePasseTemporaire: false });

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/dashboard', { replace: true });
      } else if (user.role === 'agent') {
        navigate('/agent/scan', { replace: true });
      } else {
        navigate('/mes-billets', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du changement. Réessayez.');
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
        <div className="flex flex-col items-center" style={{ marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64,
            background: 'var(--gradient-primary)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(79,70,229,0.25)',
          }}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '2rem' }}>lock_reset</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', textAlign: 'center' }}>
            Nouveau mot de passe
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
            Veuillez personnaliser votre mot de passe pour continuer
          </p>
        </div>

        <div className="card" style={{ padding: 36, boxShadow: 'var(--shadow-lg)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {!isTempPassword && (
              <div className="form-group">
                <label className="form-label">Mot de passe temporaire</label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{
                    position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', fontSize: '1.2rem', pointerEvents: 'none',
                  }}>key</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="ancienMotDePasse"
                    value={form.ancienMotDePasse}
                    onChange={handleChange}
                    placeholder="Reçu par email"
                    className={`form-input ${error ? 'input-error' : ''}`}
                    style={{ paddingLeft: 44, paddingRight: 50 }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: 4,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '1.2rem', pointerEvents: 'none',
                }}>lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="nouveauMotDePasse"
                  value={form.nouveauMotDePasse}
                  onChange={handleChange}
                  placeholder="Nouveau mot de passe"
                  className={`form-input ${error ? 'input-error' : ''}`}
                  style={{ paddingLeft: 44 }}
                  autoFocus={isTempPassword}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirmer le mot de passe</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '1.2rem', pointerEvents: 'none',
                }}>lock_clock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirm"
                  value={form.confirm}
                  onChange={handleChange}
                  placeholder="Confirmer"
                  className={`form-input ${error ? 'input-error' : ''}`}
                  style={{ paddingLeft: 44 }}
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', flexShrink: 0 }}>warning</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: 4, gap: 8 }}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Validation…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>check_circle</span>
                  <span>Mettre à jour</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
