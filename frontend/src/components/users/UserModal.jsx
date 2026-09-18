import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as userService from '../../api/userService';

export default function UserModal({ role, user, onClose, onSave }) {
  const isEdit = !!user;
  const roleLabel = { admin: 'administrateur', agent: 'agent', client: 'client' }[role];

  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setForm({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        telephone: user.telephone || '',
      });
    }
  }, [user]);

  const validate = () => {
    const errs = {};
    if (!form.nom.trim())    errs.nom    = 'Nom requis';
    if (!form.prenom.trim()) errs.prenom = 'Prénom requis';
    if (!form.email.trim())  errs.email  = 'Email requis';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Email invalide';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      if (isEdit) {
        await userService.updateUser(user._id, { nom: form.nom, prenom: form.prenom, telephone: form.telephone });
        toast.success('Utilisateur modifié avec succès');
      } else {
        await userService.createUser({ ...form, role });
        toast.success(`${roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)} créé avec succès`);
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 28 }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
            {isEdit ? '✏️ Modifier' : '➕ Créer'} un {roleLabel}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.25rem', padding: 4 }}
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Prénom & Nom */}
          <div className="flex gap-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Prénom *</label>
              <input
                className={`form-input ${errors.prenom ? 'input-error' : ''}`}
                value={form.prenom}
                onChange={e => setForm({ ...form, prenom: e.target.value })}
                placeholder="Prénom"
              />
              {errors.prenom && <span className="form-error">{errors.prenom}</span>}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Nom *</label>
              <input
                className={`form-input ${errors.nom ? 'input-error' : ''}`}
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                placeholder="Nom de famille"
              />
              {errors.nom && <span className="form-error">{errors.nom}</span>}
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="exemple@email.com"
              disabled={isEdit}
              style={isEdit ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
            {isEdit && <span className="form-error" style={{ color: 'var(--text-muted)' }}>L'email ne peut pas être modifié</span>}
          </div>

          {/* Téléphone */}
          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <input
              className="form-input"
              value={form.telephone}
              onChange={e => setForm({ ...form, telephone: e.target.value })}
              placeholder="+221 77 000 00 00"
            />
          </div>

          {/* Info mot de passe */}
          {!isEdit && (
            <div className="alert alert-warning" style={{ fontSize: '0.8125rem' }}>
              ℹ️ Le compte sera créé à l'état <strong>Inactif</strong>. Un mot de passe temporaire sera généré lors de l'activation.
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" /><span>Enregistrement…</span></> : (isEdit ? 'Enregistrer' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
