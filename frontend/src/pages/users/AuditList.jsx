import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import { toast } from 'react-hot-toast';

export default function AuditList() {
  const [audits, setAudits] = useState([]);
  const [stats, setStats] = useState({ total: 0, succes: 0, echec: 0, aujourdhui: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });

  // Filtres
  const [actionFilter, setActionFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (actionFilter) params.action = actionFilter;
      if (statutFilter) params.statut = statutFilter;
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;
      if (searchTerm) params.search = searchTerm;

      const res = await axiosInstance.get('/audits', { params });
      if (res.data.success) {
        setAudits(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Erreur lors du chargement des journaux d\'audit.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axiosInstance.get('/audits/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Erreur stats audit:', err);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [page, actionFilter, statutFilter, dateDebut, dateFin]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAudits();
  };

  const getActionBadge = (action) => {
    if (action.includes('REFUSE') || action.includes('SUSPENDU') || action.includes('ANNULE')) {
      return <span className="badge badge-danger">{action}</span>;
    }
    if (action.includes('ACTIVE') || action.includes('AUTORISE')) {
      return <span className="badge badge-success">{action}</span>;
    }
    return <span className="badge badge-primary">{action}</span>;
  };

  return (
    <div className="container" style={{ padding: '24px 0' }}>
      {/* Header */}
      <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Piste d'Audit & Journalisation des Opérations</h2>
          <p style={{ marginTop: '4px' }}>
            Traçabilité immuable des actions sensibles (génération, suspension, réactivation, validations).
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => { fetchAudits(); fetchStats(); }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>refresh</span>
          <span>Actualiser</span>
        </button>
      </div>

      {/* Cartes statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)' }}>receipt_long</span>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.total}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total des actions</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--success-500)' }}>check_circle</span>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-500)' }}>{stats.succes}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Opérations réussies</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--danger-500)' }}>error</span>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger-500)' }}>{stats.echec}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Opérations en échec / refusées</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--warning-500)' }}>today</span>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.aujourdhui}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Événements aujourd'hui</div>
          </div>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Recherche mot-clé</label>
            <input
              type="text"
              className="form-input"
              placeholder="Action, ID ressource, utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ flex: '0 1 180px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Type d'action</label>
            <select
              className="form-input"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              style={{ width: '100%' }}
            >
              <option value="">Toutes les actions</option>
              <option value="TICKET_CREE">Création Ticket</option>
              <option value="TICKET_CREE_GUICHET">Création Guichet</option>
              <option value="TICKET_ACTIVE">Activation Titre</option>
              <option value="TICKET_SUSPENDU">Suspension Titre</option>
              <option value="TICKET_ANNULE">Annulation Titre</option>
              <option value="SCAN_VOYAGE_AUTORISE">Voyage Autorisé</option>
              <option value="SCAN_VOYAGE_REFUSE">Voyage Refusé</option>
            </select>
          </div>

          <div style={{ flex: '0 1 140px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Résultat</label>
            <select
              className="form-input"
              value={statutFilter}
              onChange={(e) => { setStatutFilter(e.target.value); setPage(1); }}
              style={{ width: '100%' }}
            >
              <option value="">Tous statuts</option>
              <option value="succes">Succès</option>
              <option value="echec">Échec / Refus</option>
            </select>
          </div>

          <div style={{ flex: '0 1 150px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Du</label>
            <input
              type="date"
              className="form-input"
              value={dateDebut}
              onChange={(e) => { setDateDebut(e.target.value); setPage(1); }}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ flex: '0 1 150px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Au</label>
            <input
              type="date"
              className="form-input"
              value={dateFin}
              onChange={(e) => { setDateFin(e.target.value); setPage(1); }}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>search</span>
              <span>Filtrer</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tableau des audits */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chargement de la piste d'audit...
          </div>
        ) : audits.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Aucun enregistrement d'audit trouvé pour ces critères.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>DATE & HEURE</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTEUR</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTION</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>RESSOURCE</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>RÉSULTAT</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>DÉTAILS</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>IP</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((item) => {
                  let detailsObj = null;
                  try {
                    detailsObj = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
                  } catch {
                    detailsObj = item.details;
                  }

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8125rem' }}>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        {new Date(item.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600 }}>
                          {item.utilisateur?.nom ? `${item.utilisateur.prenom} ${item.utilisateur.nom}` : (item.utilisateurRole || 'Système')}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Rôle : {item.utilisateurRole || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {getActionBadge(item.action)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500 }}>{item.ressourceType}</div>
                        {item.ressourceId && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {String(item.ressourceId).slice(0, 13)}...
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {item.statut === 'succes' ? (
                          <span style={{ color: 'var(--success-500)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check_circle</span>
                            Succès
                          </span>
                        ) : (
                          <span style={{ color: 'var(--danger-500)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>cancel</span>
                            Refus / Échec
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: '300px' }}>
                        {detailsObj ? (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {detailsObj.motif && <div><strong>Motif :</strong> {detailsObj.motif}</div>}
                            {detailsObj.nouveauStatut && <div><strong>Nouveau statut :</strong> {detailsObj.nouveauStatut}</div>}
                            {detailsObj.prix && <div><strong>Prix :</strong> {detailsObj.prix} FCFA</div>}
                            {!detailsObj.motif && !detailsObj.nouveauStatut && !detailsObj.prix && (
                              <pre style={{ margin: 0, fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(detailsObj)}
                              </pre>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {item.adresseIP || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center" style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Page {pagination.page} sur {pagination.pages} ({pagination.total} enregistrements)
            </span>
            <div className="flex gap-2">
              <button
                className="btn btn-sm btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Précédent
              </button>
              <button
                className="btn btn-sm btn-secondary"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
