import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../api/userService';
import { getBackendURL } from '../api/axios';
import toast from 'react-hot-toast';

export default function Profil() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm]     = useState({ nom: user?.nom || '', prenom: user?.prenom || '', telephone: user?.telephone || '' });
  const [preview, setPreview] = useState(user?.photo ? `${getBackendURL()}${user.photo}` : null);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving]  = useState(false);

  const [pwd, setPwd]       = useState({ ancienMotDePasse: '', nouveauMotDePasse: '', confirm: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSaveProfil = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nom', form.nom);
      fd.append('prenom', form.prenom);
      fd.append('telephone', form.telephone);
      if (photoFile) fd.append('photo', photoFile);

      const res = await updateProfile(fd);
      updateUser(res.data.data);
      toast.success('Profil mis à jour avec succès.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePwd = async (e) => {
    e.preventDefault();
    if (pwd.nouveauMotDePasse !== pwd.confirm) {
      return toast.error('Les mots de passe ne correspondent pas.');
    }
    if (pwd.nouveauMotDePasse.length < 6) {
      return toast.error('Le mot de passe doit contenir au moins 6 caractères.');
    }
    setPwdSaving(true);
    try {
      await changePassword({ ancienMotDePasse: pwd.ancienMotDePasse, nouveauMotDePasse: pwd.nouveauMotDePasse });
      toast.success('Mot de passe modifié avec succès.');
      setPwd({ ancienMotDePasse: '', nouveauMotDePasse: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mon Profil</h1>
          <p className="page-subtitle">Gérez vos informations personnelles et votre sécurité</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

        {/* Carte Informations */}
        <div className="card">
          <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)' }}>edit</span>
            Informations personnelles
          </h3>

          {/* Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, gap: 12 }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: 96, height: 96, borderRadius: '50%', cursor: 'pointer',
                border: '3px solid var(--primary-500)', overflow: 'hidden',
                background: 'var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 700, color: 'var(--primary-300)',
                position: 'relative',
              }}
            >
              {preview
                ? <img src={preview} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11,
                textAlign: 'center', padding: '4px 0',
              }}>
                Modifier
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPEG, PNG ou WebP — 2 Mo max</span>
          </div>

          <form onSubmit={handleSaveProfil} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input className="form-input" value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input className="form-input" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input className="form-input" value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} placeholder="+221 XX XXX XX XX" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>save</span>
              {saving ? 'Enregistrement…' : 'Sauvegarder les modifications'}
            </button>
          </form>
        </div>

        {/* Carte Mot de passe */}
        <div className="card">
          <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)' }}>lock</span>
            Changer le mot de passe
          </h3>
          <form onSubmit={handleChangePwd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Ancien mot de passe</label>
              <input
                className="form-input" type="password"
                value={pwd.ancienMotDePasse}
                onChange={e => setPwd(p => ({ ...p, ancienMotDePasse: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input
                className="form-input" type="password"
                value={pwd.nouveauMotDePasse}
                onChange={e => setPwd(p => ({ ...p, nouveauMotDePasse: e.target.value }))}
                required minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer le nouveau mot de passe</label>
              <input
                className="form-input" type="password"
                value={pwd.confirm}
                onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
                required
              />
            </div>
            {pwd.nouveauMotDePasse && pwd.confirm && pwd.nouveauMotDePasse !== pwd.confirm && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>⚠️ Les mots de passe ne correspondent pas.</p>
            )}
            <button className="btn btn-primary" type="submit" disabled={pwdSaving} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>vpn_key</span>
              {pwdSaving ? 'Modification…' : 'Modifier le mot de passe'}
            </button>
          </form>

          <div className="card" style={{ marginTop: 24, background: 'var(--bg-elevated)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: 4, color: 'var(--primary-500)' }}>security</span>
              <strong style={{ color: 'var(--text-secondary)' }}>Conseils de sécurité :</strong><br />
              Utilisez au moins 8 caractères, avec des majuscules, chiffres et symboles.
              Ne partagez jamais votre mot de passe.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
