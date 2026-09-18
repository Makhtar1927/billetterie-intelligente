import { useState, useEffect } from 'react';
import { mesAbonnements, souscrireAbonnement } from '../api/userService';
import { getBackendURL } from '../api/axios';
import toast from 'react-hot-toast';

const OFFRES = [
  { label: 'Pass 24 Heures — Illimité (1 jour)', type: 'illimite', voyagesTotal: null, dureeHeures: 24, prix: 1500, badge: '24H' },
  { label: 'Limité — 10 voyages',                 type: 'limite',   voyagesTotal: 10,   dureeHeures: null, prix: 4000 },
  { label: 'Limité — 20 voyages',                 type: 'limite',   voyagesTotal: 20,   dureeHeures: null, prix: 7000 },
  { label: 'Mensuel — 30 jours',                   type: 'illimite', voyagesTotal: null, dureeHeures: 30 * 24, prix: 15000 },
  { label: 'Annuel — 365 jours',                   type: 'illimite', voyagesTotal: null, dureeHeures: 365 * 24, prix: 120000 },
];

const statutColor = { actif: 'success', expire: 'warning', annule: 'danger', suspendu: 'primary' };

const getAbonnementTitre = (abo) => {
  if (abo.type === 'limite') return `Abonnement Limité (${abo.voyagesTotal} voyages)`;
  if (abo.dateDebut && abo.dateFin) {
    const diffHours = Math.round((new Date(abo.dateFin) - new Date(abo.dateDebut)) / (3600 * 1000));
    if (diffHours <= 26) return 'Pass 24 Heures (Illimité)';
    if (diffHours <= 31 * 24) return 'Abonnement Mensuel (30 jours)';
  }
  return 'Abonnement Illimité';
};

const formatDateAvecHeure = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

function QRModal({ abonnement, onClose }) {
  if (!abonnement?.ticket) return null;
  const qrUrl = `${getBackendURL()}${abonnement.ticket.qrCode}`;

  const handleDownload = async () => {
    const res = await fetch(qrUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `abonnement-qr.png`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
        <h3 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)' }}>card_membership</span>
          {getAbonnementTitre(abonnement)}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
          Présentez ce QR Code à l'agent lors de votre voyage
        </p>
        <img src={qrUrl} alt="QR Abonnement" style={{ width: 220, height: 220, borderRadius: 12, border: '2px solid var(--primary-500)', background: '#fff', padding: 8 }} />
        {abonnement.type === 'limite' && (
          <p style={{ marginTop: 12, fontSize: '1rem', fontWeight: 700, color: 'var(--primary-300)' }}>
            {abonnement.voyagesRestants} / {abonnement.voyagesTotal} voyages restants
          </p>
        )}
        {abonnement.type === 'illimite' && abonnement.dateFin && (
          <p style={{ marginTop: 12, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Expire le : <strong style={{ color: 'var(--text-primary)' }}>{formatDateAvecHeure(abonnement.dateFin)}</strong>
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }} onClick={handleDownload}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>download</span>
            Télécharger
          </button>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

function OffreModal({ onClose, onSubscribe }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleSubscribe = async () => {
    if (selected === null) return;
    setLoading(true);
    const offre = OFFRES[selected];
    const dateFin = offre.dureeHeures
      ? new Date(Date.now() + offre.dureeHeures * 3600 * 1000).toISOString()
      : (offre.dateFin ? new Date(Date.now() + parseInt(offre.dateFin) * 86400000).toISOString() : null);

    try {
      await souscrireAbonnement({ type: offre.type, voyagesTotal: offre.voyagesTotal, dateFin, prix: offre.prix });
      toast.success('Abonnement souscrit avec succès !');
      onSubscribe();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la souscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)' }}>card_membership</span>
          Choisir un abonnement
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {OFFRES.map((o, i) => (
            <div
              key={i}
              onClick={() => setSelected(i)}
              style={{
                padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                border: `2px solid ${selected === i ? 'var(--primary-500)' : 'var(--border)'}`,
                background: selected === i ? 'rgba(99,102,241,0.08)' : 'var(--bg-elevated)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'all .15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{o.label}</span>
                {o.badge && (
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                    {o.badge}
                  </span>
                )}
              </div>
              <span style={{ color: 'var(--primary-300)', fontWeight: 700 }}>{o.prix.toLocaleString('fr-FR')} FCFA</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }} onClick={handleSubscribe} disabled={selected === null || loading}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>check_circle</span>
            {loading ? 'Souscription…' : 'Souscrire'}
          </button>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

export default function MesAbonnements() {
  const [abonnements, setAbonnements] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showOffres, setShowOffres]   = useState(false);
  const [selectedAbo, setSelectedAbo] = useState(null);

  const load = () => {
    setLoading(true);
    mesAbonnements()
      .then(res => setAbonnements(res.data.data))
      .catch(() => toast.error('Impossible de charger vos abonnements.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const actifs    = abonnements.filter(a => a.statut === 'actif');
  const historique = abonnements.filter(a => a.statut !== 'actif');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mes Abonnements</h1>
          <p className="page-subtitle">Gérez vos abonnements et accédez à vos QR Codes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowOffres(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add_card</span>
          Souscrire un abonnement
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Chargement…</div>
      ) : (
        <>
          <p className="nav-section-title" style={{ marginBottom: 12 }}>Abonnements actifs ({actifs.length})</p>
          {actifs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              Aucun abonnement actif. Souscrivez-en un pour voyager librement !
            </div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
              {actifs.map(a => (
                <div
                  key={a._id} className="card"
                  onClick={() => setSelectedAbo(a)}
                  style={{ cursor: 'pointer', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                    {a.type === 'limite' 
                      ? <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--primary-500)' }}>local_activity</span> 
                      : <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--primary-500)' }}>all_inclusive</span>
                    }
                    <span className="badge badge-success">Actif</span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                    {getAbonnementTitre(a)}
                  </p>
                  {a.type === 'limite' && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Voyages restants</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary-300)' }}>{a.voyagesRestants} / {a.voyagesTotal}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: 'var(--primary-500)', width: `${(a.voyagesRestants / a.voyagesTotal) * 100}%`, transition: 'width .5s' }} />
                      </div>
                    </div>
                  )}
                  {a.type === 'illimite' && a.dateFin && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Expire le : <strong style={{ color: 'var(--text-primary)' }}>{formatDateAvecHeure(a.dateFin)}</strong>
                    </p>
                  )}
                  <p style={{ fontSize: '0.8rem', color: 'var(--primary-500)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>qr_code</span>
                    Voir le QR Code
                  </p>
                </div>
              ))}
            </div>
          )}

          {historique.length > 0 && (
            <>
              <p className="nav-section-title" style={{ marginBottom: 12 }}>Historique ({historique.length})</p>
              <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Type', 'Prix', 'Statut', 'Date souscription'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historique.map(a => (
                      <tr key={a._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 12px' }}>{a.type === 'limite' ? `Limité (${a.voyagesTotal} voyages)` : 'Illimité'}</td>
                        <td style={{ padding: '10px 12px' }}>{a.prix} FCFA</td>
                        <td style={{ padding: '10px 12px' }}><span className={`badge badge-${statutColor[a.statut]}`}>{a.statut}</span></td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {showOffres && <OffreModal onClose={() => setShowOffres(false)} onSubscribe={load} />}
      {selectedAbo && <QRModal abonnement={selectedAbo} onClose={() => setSelectedAbo(null)} />}
    </div>
  );
}
