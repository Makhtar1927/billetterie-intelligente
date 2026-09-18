import { useState, useEffect } from 'react';
import { tousAbonnements, statsAbonnements, updateStatutAbonnement } from '../../api/userService';
import toast from 'react-hot-toast';

const statutColor  = { actif: 'success', expire: 'warning', annule: 'danger', suspendu: 'primary' };
const statutLabel  = { actif: 'Actif', expire: 'Expiré', annule: 'Annulé', suspendu: 'Suspendu' };
const typeLabel    = { limite: 'Limité', illimite: 'Illimité' };
const STATUTS      = ['', 'actif', 'expire', 'annule', 'suspendu'];

export default function AbonnementList() {
  const [abonnements,    setAbonnements]   = useState([]);
  const [stats,          setStats]         = useState(null);
  const [loading,        setLoading]       = useState(true);
  const [actionLoading,  setActionLoading] = useState(false);
  const [page,           setPage]          = useState(1);
  const [total,          setTotal]         = useState(0);
  const [pages,          setPages]         = useState(1);
  const [statut,         setStatut]        = useState('');
  const [search,         setSearch]        = useState('');
  const [type,           setType]          = useState('');
  const LIMIT = 15;

  const load = () => {
    setLoading(true);
    Promise.all([
      tousAbonnements({ page, limit: LIMIT, statut: statut || undefined, type: type || undefined }),
      statsAbonnements(),
    ])
      .then(([r, s]) => {
        setAbonnements(r.data.data);
        setTotal(r.data.pagination.total);
        setPages(r.data.pagination.pages);
        setStats(s.data.data);
      })
      .catch(() => toast.error('Erreur de chargement.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, statut, type]);

  const handleStatut = async (id, newStatut) => {
    if (!window.confirm(`Confirmer l'action : ${newStatut} ?`)) return;
    setActionLoading(true);
    try {
      await updateStatutAbonnement(id, newStatut);
      toast.success(`Abonnement ${statutLabel[newStatut] || newStatut} avec succès.`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtre local sur nom/email (les données client sont déjà agrégées par le gateway)
  const displayed = search.trim()
    ? abonnements.filter(a => {
        const q = search.toLowerCase();
        const nom  = `${a.utilisateur?.prenom ?? ''} ${a.utilisateur?.nom ?? ''}`.toLowerCase();
        const mail = (a.utilisateur?.email ?? '').toLowerCase();
        return nom.includes(q) || mail.includes(q);
      })
    : abonnements;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Abonnements</h1>
          <p className="page-subtitle">Consulter, suspendre, renouveler ou résilier les abonnements</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { l: 'Total',     v: stats.total,    c: 'primary' },
            { l: 'Actifs',    v: stats.actif,    c: 'success' },
            { l: 'Expirés',   v: stats.expire,   c: 'warning' },
            { l: 'Suspendus', v: stats.suspendu, c: 'primary' },
            { l: 'Annulés',   v: stats.annule,   c: 'danger'  },
          ].map(({ l, v, c }) => (
            <div key={l} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: `var(--${c})` }}>{v ?? 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '14px 18px' }}>
        {/* Recherche client */}
        <div className="search-wrapper" style={{ flex: '1 1 200px' }}>
          <span className="search-icon material-symbols-outlined" style={{ fontSize: '1.1rem' }}>search</span>
          <input
            className="form-input search-input"
            placeholder="Rechercher par nom ou email client…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filtre type */}
        <select className="form-input" style={{ width: 150 }} value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
          <option value="">Tous types</option>
          <option value="limite">Limité</option>
          <option value="illimite">Illimité</option>
        </select>

        {/* Filtre statut */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUTS.map(s => (
            <button
              key={s || 'tous'}
              className={`btn btn-${statut === s ? 'primary' : 'ghost'}`}
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
              onClick={() => { setStatut(s); setPage(1); }}
            >
              {s ? statutLabel[s] : 'Tous'}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          {total} abonnements
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Chargement…</div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Client', 'Type', 'Voyages', 'Date début', 'Date fin', 'Prix', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucun abonnement trouvé.</td>
                </tr>
              ) : displayed.map(a => (
                <tr key={a._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {/* Client */}
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.utilisateur?.prenom} {a.utilisateur?.nom}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.utilisateur?.email}</div>
                  </td>

                  {/* Type */}
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--primary-500)' }}>
                        {a.type === 'limite' ? 'card_membership' : 'all_inclusive'}
                      </span>
                      {a.type === 'limite'
                        ? 'Limité'
                        : (a.dateDebut && a.dateFin && Math.round((new Date(a.dateFin) - new Date(a.dateDebut)) / 3600000) <= 26 ? 'Pass 24H' : 'Illimité')}
                    </span>
                  </td>

                  {/* Voyages */}
                  <td style={{ padding: '10px 14px' }}>
                    {a.type === 'limite'
                      ? <span style={{ fontWeight: 700, color: 'var(--primary-300)' }}>{a.voyagesRestants} / {a.voyagesTotal}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>Illimité</span>}
                  </td>

                  {/* Date début */}
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                    {a.dateDebut ? new Date(a.dateDebut).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>

                  {/* Date fin */}
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                    {a.dateFin ? new Date(a.dateFin).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>

                  {/* Prix */}
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{Number(a.prix).toLocaleString('fr-FR')} FCFA</td>

                  {/* Statut */}
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`badge badge-${statutColor[a.statut] || 'primary'}`}>
                      {statutLabel[a.statut] || a.statut}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                      {a.statut === 'actif' && (
                        <>
                          <button
                            className="btn btn-sm btn-secondary"
                            title="Suspendre"
                            onClick={() => handleStatut(a._id, 'suspendu')}
                            disabled={actionLoading}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>pause_circle</span>
                            Suspendre
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            title="Résilier"
                            onClick={() => handleStatut(a._id, 'annule')}
                            disabled={actionLoading}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>cancel</span>
                            Résilier
                          </button>
                        </>
                      )}
                      {a.statut === 'suspendu' && (
                        <button
                          className="btn btn-sm btn-success"
                          title="Réactiver"
                          onClick={() => handleStatut(a._id, 'actif')}
                          disabled={actionLoading}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>play_circle</span>
                          Réactiver
                        </button>
                      )}
                      {(a.statut === 'expire' || a.statut === 'annule') && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Aucune action</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: 16 }}>
              <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_left</span>
              </button>
              <span style={{ padding: '8px 14px', color: 'var(--text-muted)' }}>Page {page} / {pages}</span>
              <button className="btn btn-ghost" disabled={page === pages} onClick={() => setPage(p => p + 1)} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
