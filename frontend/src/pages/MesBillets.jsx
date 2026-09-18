import { useState, useEffect } from 'react';
import { mesTickets, acheterTicket } from '../api/userService';
import { getBackendURL } from '../api/axios';
import toast from 'react-hot-toast';

const PRIX_TICKET = 500; // 500 FCFA par défaut

const statutColor = {
  valide:  'success',
  utilise: 'primary',
  expire:  'warning',
  annule:  'danger',
};

const statutLabel = {
  valide:  'Valide',
  utilise: 'Utilisé',
  expire:  'Expiré',
  annule:  'Annulé',
};

function QRModal({ ticket, onClose }) {
  if (!ticket) return null;
  const qrUrl = `${getBackendURL()}${ticket.qrCode}`;

  const handleDownload = async () => {
    const res = await fetch(qrUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billet-${ticket._id.slice(-6)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
        <h3 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)' }}>local_activity</span>
          Mon Billet
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
          ID : <code style={{ color: 'var(--primary-300)' }}>{ticket._id.slice(-8).toUpperCase()}</code>
        </p>
        <img
          src={qrUrl}
          alt="QR Code"
          style={{ width: 220, height: 220, borderRadius: 12, border: '2px solid var(--primary-500)', background: '#fff', padding: 8 }}
        />
        <div style={{ marginTop: 16 }}>
          <span className={`badge badge-${statutColor[ticket.statut]}`} style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
            {statutLabel[ticket.statut]}
          </span>
        </div>
        <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Prix : <strong style={{ color: 'var(--text-primary)' }}>{ticket.prix} FCFA</strong>
        </p>
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

export default function MesBillets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying,  setBuying]  = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const load = () => {
    setLoading(true);
    mesTickets()
      .then(res => setTickets(res.data.data))
      .catch(() => toast.error('Impossible de charger vos billets.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAcheter = async () => {
    setBuying(true);
    try {
      await acheterTicket({ prix: PRIX_TICKET });
      toast.success('Billet acheté avec succès !');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'achat.');
    } finally {
      setBuying(false);
    }
  };

  const valides   = tickets.filter(t => t.statut === 'valide');
  const historique = tickets.filter(t => t.statut !== 'valide');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mes Billets</h1>
          <p className="page-subtitle">Achetez et gérez vos billets de transport</p>
        </div>
        <button className="btn btn-primary" onClick={handleAcheter} disabled={buying} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>shopping_cart</span>
          {buying ? 'Achat…' : 'Acheter un billet'} — {PRIX_TICKET} FCFA
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Chargement…</div>
      ) : (
        <>
          {/* Billets valides */}
          <p className="nav-section-title" style={{ marginBottom: 12 }}>Billets actifs ({valides.length})</p>
          {valides.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              Vous n'avez pas de billet actif. Achetez-en un pour voyager !
            </div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
              {valides.map(t => (
                <div
                  key={t._id}
                  className="card"
                  onClick={() => setSelectedTicket(t)}
                  style={{ cursor: 'pointer', border: '1px solid rgba(16,185,129,0.3)', transition: 'transform .2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--primary-500)' }}>local_activity</span>
                    <span className="badge badge-success">Valide</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    ID : <code style={{ color: 'var(--primary-300)' }}>{t._id.slice(-8).toUpperCase()}</code>
                  </p>
                  <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{t.prix} FCFA</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    {new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--primary-500)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>qr_code</span>
                    Cliquer pour voir le QR Code
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Historique */}
          {historique.length > 0 && (
            <>
              <p className="nav-section-title" style={{ marginBottom: 12 }}>Historique ({historique.length})</p>
              <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['ID', 'Prix', 'Statut', 'Date'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historique.map(t => (
                      <tr key={t._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 12px' }}><code>{t._id.slice(-8).toUpperCase()}</code></td>
                        <td style={{ padding: '10px 12px' }}>{t.prix} FCFA</td>
                        <td style={{ padding: '10px 12px' }}><span className={`badge badge-${statutColor[t.statut]}`}>{statutLabel[t.statut]}</span></td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <QRModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}
