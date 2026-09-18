import { useState } from 'react';
import { creerTicketAgent } from '../api/userService';
import toast from 'react-hot-toast';

export default function TicketCreationPage() {
  const [prix, setPrix] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prix || isNaN(prix) || parseFloat(prix) <= 0) {
      toast.error('Veuillez entrer un prix valide');
      return;
    }

    setLoading(true);
    setCreatedTicket(null);
    try {
      const res = await creerTicketAgent({ prix: parseFloat(prix) });
      setCreatedTicket(res.data.data);
      toast.success('Ticket créé avec succès');
      setPrix('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la création du ticket';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Créer un ticket</h1>
          <p className="page-subtitle">Générer un billet pour un client sans compte</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
        {/* Formulaire de création */}
        <div className="card">
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)' }}>add_circle</span>
            Nouveau ticket
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>
                Prix (FCFA)
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="Ex: 500"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                min="0"
                step="100"
                required
                style={{ fontSize: '1rem', padding: '10px 14px' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                {loading ? 'autorenew' : 'confirmation_number'}
              </span>
              {loading ? 'Création en cours...' : 'Créer le ticket'}
            </button>
          </form>
        </div>

        {/* Ticket créé */}
        {createdTicket && (
          <div className="card" style={{ border: '2px solid var(--success)', background: 'rgba(16,185,129,0.04)' }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>check_circle</span>
              Ticket créé avec succès
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>ID du ticket</div>
                <div style={{ fontWeight: 600, fontSize: '1rem', fontFamily: 'monospace' }}>{createdTicket._id}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Prix</div>
                <div style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--primary-500)' }}>{createdTicket.prix} FCFA</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Statut</div>
                <span className="badge badge-success">{createdTicket.statut}</span>
              </div>
              {createdTicket.qrCode && (
                <div style={{ textAlign: 'center', padding: 16, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>QR Code</div>
                  <img 
                    src={createdTicket.qrCode} 
                    alt="QR Code" 
                    style={{ maxWidth: '200px', height: 'auto', borderRadius: 8 }}
                  />
                </div>
              )}
              <button
                className="btn btn-ghost"
                onClick={() => setCreatedTicket(null)}
                style={{ marginTop: 8 }}
              >
                Créer un autre ticket
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
