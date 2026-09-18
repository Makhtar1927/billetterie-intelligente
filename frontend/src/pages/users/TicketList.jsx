import { useState, useEffect } from 'react';
import { tousTickets, statsTickets, updateStatutTicket } from '../../api/userService';
import toast from 'react-hot-toast';

const statutColor = {
  valide: 'success',
  utilise: 'primary',
  expire: 'warning',
  annule: 'danger',
  suspendu: 'warning',
};

const typeLabel = {
  simple: 'Ticket simple',
  abonnement_limite: 'Abo. limité',
  abonnement_illimite: 'Abo. illimité',
};

const STATUTS = ['', 'valide', 'utilise', 'suspendu', 'expire', 'annule'];

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [statut, setStatut] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const LIMIT = 15;

  const load = () => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (statut) params.statut = statut;
    if (dateDebut) params.dateDebut = dateDebut;
    if (dateFin) params.dateFin = dateFin;
    if (search) params.search = search;

    Promise.all([
      tousTickets(params),
      statsTickets(),
    ])
      .then(([r, s]) => {
        setTickets(r.data.data);
        setTotal(r.data.pagination.total);
        setPages(r.data.pagination.pages);
        setStats(s.data.data);
      })
      .catch(() => toast.error('Erreur de chargement des tickets.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, statut, dateDebut, dateFin]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleChangerStatut = async (ticketId, nouveauStatut) => {
    const actionLabel = nouveauStatut === 'valide' ? 'activer' : (nouveauStatut === 'suspendu' ? 'suspendre' : 'annuler');
    if (!window.confirm(`Êtes-vous sûr de vouloir ${actionLabel} ce titre de transport ?`)) {
      return;
    }

    setActionLoading(ticketId);
    try {
      const res = await updateStatutTicket(ticketId, nouveauStatut);
      if (res.data.success) {
        toast.success(`Titre ${actionLabel} avec succès !`);
        load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Erreur lors de la modification du statut.`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="container" style={{ padding: '24px 0' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Billets / Titres de Transport</h1>
          <p className="page-subtitle">Gestion, consultation et contrôle d'activation des titres de transport numériques</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>refresh</span>
          <span>Actualiser</span>
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { l: 'Total',       v: stats.total,    c: 'primary-500' },
            { l: 'Valides',     v: stats.valide,   c: 'success-500' },
            { l: 'Suspendus',   v: stats.suspendu, c: 'warning-500' },
            { l: 'Utilisés',    v: stats.utilise,  c: 'primary-400' },
            { l: 'Expirés',     v: stats.expire,   c: 'text-muted' },
            { l: 'Annulés',     v: stats.annule,   c: 'danger-500'  },
          ].map(({ l, v, c }) => (
            <div key={l} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: `var(--${c})` }}>{v ?? 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres & Recherche */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Recherche par ID ticket ou ID client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Statut :</span>
            {STATUTS.map(s => (
              <button
                key={s || 'tous'}
                type="button"
                className={`btn btn-sm ${statut === s ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => { setStatut(s); setPage(1); }}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Tous'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Du :</span>
            <input
              type="date"
              className="form-input"
              value={dateDebut}
              onChange={(e) => { setDateDebut(e.target.value); setPage(1); }}
              style={{ padding: '4px 8px', fontSize: '0.8125rem' }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Au :</span>
            <input
              type="date"
              className="form-input"
              value={dateFin}
              onChange={(e) => { setDateFin(e.target.value); setPage(1); }}
              style={{ padding: '4px 8px', fontSize: '0.8125rem' }}
            />
          </div>

          <button type="submit" className="btn btn-sm btn-primary" style={{ padding: '6px 14px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>search</span>
            <span>Rechercher</span>
          </button>

          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            {total} résultat{total > 1 ? 's' : ''}
          </span>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Chargement des titres…</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>ID TITRE</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>CLIENT</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>TYPE</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>PRIX</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>RESTANTS</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>STATUT</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>DATE CRÉATION</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aucun titre de transport trouvé.
                    </td>
                  </tr>
                ) : (
                  tickets.map(t => (
                    <tr key={t._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <code style={{ color: 'var(--primary-500)', fontSize: '0.8rem', fontWeight: 600 }}>
                          {t._id.slice(0, 8).toUpperCase()}...
                        </code>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{t.utilisateur?.prenom} {t.utilisateur?.nom}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.utilisateur?.email}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {typeLabel[t.type] || t.type}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{t.prix} FCFA</td>
                      <td style={{ padding: '12px 16px' }}>
                        {t.type === 'abonnement_illimite' ? 'Illimité' : (t.voyagesRestants ?? 0)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge badge-${statutColor[t.statut] || 'primary'}`}>
                          {t.statut}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(t.createdAt).toLocaleDateString('fr-FR')} {new Date(t.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          {t.statut === 'valide' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--warning-500)' }}
                              disabled={actionLoading === t._id}
                              onClick={() => handleChangerStatut(t._id, 'suspendu')}
                              title="Suspendre temporairement ce titre"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>pause</span>
                              <span>Suspendre</span>
                            </button>
                          )}
                          {t.statut === 'suspendu' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--success-500)' }}
                              disabled={actionLoading === t._id}
                              onClick={() => handleChangerStatut(t._id, 'valide')}
                              title="Réactiver ce titre de transport"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>play_arrow</span>
                              <span>Réactiver</span>
                            </button>
                          )}
                          {t.statut !== 'annule' && t.statut !== 'utilise' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--danger-500)' }}
                              disabled={actionLoading === t._id}
                              onClick={() => handleChangerStatut(t._id, 'annule')}
                              title="Annuler définitivement ce titre"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>block</span>
                              <span>Annuler</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', padding: '14px 16px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}>
              <button className="btn btn-sm btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                ◀ Précédent
              </button>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Page {page} sur {pages}</span>
              <button className="btn btn-sm btn-secondary" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                Suivant ▶
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
