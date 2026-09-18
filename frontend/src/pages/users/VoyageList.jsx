import { useState, useEffect, useCallback } from 'react';
import { tousVoyages, statsVoyages } from '../../api/userService';
import toast from 'react-hot-toast';

const MOTIFS = [
  '',
  'QR Code falsifié ou signature invalide.',
  'Titre de transport inconnu dans le système.',
  'Titre de transport suspendu par l\'administration.',
  'Titre de transport annulé ou désactivé.',
  'Titre de transport expiré.',
  'Ticket déjà utilisé (voyage unique consommé).',
  'Abonnement épuisé (solde de voyages à zéro).',
  'Abonnement illimité expiré.',
];

const MOTIFS_LABELS = {
  '': 'Tous les motifs',
  'QR Code falsifié ou signature invalide.': '🔒 QR falsifié',
  'Titre de transport inconnu dans le système.': '❓ Titre inconnu',
  'Titre de transport suspendu par l\'administration.': '⛔ Suspendu',
  'Titre de transport annulé ou désactivé.': '❌ Annulé',
  'Titre de transport expiré.': '⏰ Expiré',
  'Ticket déjà utilisé (voyage unique consommé).': '✔ Déjà utilisé',
  'Abonnement épuisé (solde de voyages à zéro).': '📉 Épuisé',
  'Abonnement illimité expiré.': '📅 Abo. illimité expiré',
};

export default function VoyageList() {
  const [voyages, setVoyages]   = useState([]);
  const [stats,   setStats]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [page,    setPage]      = useState(1);
  const [total,   setTotal]     = useState(0);
  const [pages,   setPages]     = useState(1);

  // Filtres
  const [statut,     setStatut]     = useState('');
  const [motifRefus, setMotifRefus] = useState('');
  const [search,     setSearch]     = useState('');
  const [dateDebut,  setDateDebut]  = useState('');
  const [dateFin,    setDateFin]    = useState('');

  const LIMIT = 15;

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (statut)     params.statut     = statut;
    if (motifRefus) params.motifRefus = motifRefus;
    if (search)     params.search     = search;
    if (dateDebut)  params.dateDebut  = dateDebut;
    if (dateFin)    params.dateFin    = dateFin;

    Promise.all([
      tousVoyages(params),
      statsVoyages(),
    ])
      .then(([r, s]) => {
        setVoyages(r.data.data);
        setTotal(r.data.pagination.total);
        setPages(r.data.pagination.pages);
        setStats(s.data.data);
      })
      .catch(() => toast.error('Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [page, statut, motifRefus, search, dateDebut, dateFin]);

  useEffect(() => { load(); }, [load]);

  const resetFiltres = () => {
    setStatut(''); setMotifRefus(''); setSearch('');
    setDateDebut(''); setDateFin(''); setPage(1);
  };

  const hasFiltres = statut || motifRefus || search || dateDebut || dateFin;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Historique des Voyages</h1>
          <p className="page-subtitle">Journal de tous les scans et validations effectués par les agents</p>
        </div>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { l: 'Total scans', v: stats.total,    c: 'primary' },
            { l: 'Autorisés',   v: stats.autorise, c: 'success' },
            { l: 'Refusés',     v: stats.refuse,   c: 'danger'  },
          ].map(({ l, v, c }) => (
            <div key={l} className="card" style={{ textAlign: 'center', padding: '20px 12px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: `var(--${c})` }}>{v ?? 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
          {stats.total > 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '20px 12px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>
                {Math.round((stats.autorise / stats.total) * 100)}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Taux de succès</div>
            </div>
          )}
        </div>
      )}

      {/* ── Panneau filtres ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>

          {/* Recherche */}
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Recherche (ID, motif…)
            </label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: 'var(--text-muted)' }}>
                search
              </span>
              <input
                type="text"
                className="input"
                placeholder="Rechercher…"
                style={{ paddingLeft: 34 }}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {/* Statut */}
          <div style={{ flex: '0 1 150px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Statut</label>
            <select
              className="input"
              value={statut}
              onChange={e => { setStatut(e.target.value); setPage(1); }}
            >
              <option value="">Tous</option>
              <option value="autorise">Autorisés</option>
              <option value="refuse">Refusés</option>
            </select>
          </div>

          {/* Motif de refus */}
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Motif de refus</label>
            <select
              className="input"
              value={motifRefus}
              onChange={e => { setMotifRefus(e.target.value); setPage(1); }}
            >
              {MOTIFS.map(m => (
                <option key={m} value={m}>{MOTIFS_LABELS[m] || m}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div style={{ flex: '0 1 155px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Date début</label>
            <input type="date" className="input" value={dateDebut}
              onChange={e => { setDateDebut(e.target.value); setPage(1); }} />
          </div>
          <div style={{ flex: '0 1 155px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Date fin</label>
            <input type="date" className="input" value={dateFin}
              onChange={e => { setDateFin(e.target.value); setPage(1); }} />
          </div>

          {/* Bouton reset */}
          {hasFiltres && (
            <div style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={resetFiltres}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>filter_alt_off</span>
                Effacer
              </button>
            </div>
          )}

          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem', alignSelf: 'flex-end', paddingBottom: 4 }}>
            {total} scans
          </span>
        </div>
      </div>

      {/* ── Tableau ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Chargement…</div>
      ) : voyages.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', marginBottom: 12, display: 'block' }}>
            travel_explore
          </span>
          Aucun voyage trouvé avec ces critères.
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Voyageur', 'Type de titre', 'Agent', 'Statut', 'Motif refus', 'Date & Heure'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {voyages.map(v => (
                <tr key={v._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div>{v.utilisateur?.prenom} {v.utilisateur?.nom}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{v.utilisateur?.email}</div>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--primary-500)' }}>
                        {v.ticket?.type === 'simple' ? 'local_activity'
                          : v.ticket?.type === 'abonnement_limite' ? 'card_membership'
                          : v.ticket?.type ? 'all_inclusive' : 'remove'}
                      </span>
                      {v.ticket?.type === 'simple' ? 'Ticket simple'
                        : v.ticket?.type === 'abonnement_limite' ? 'Abo. limité'
                        : v.ticket?.type ? 'Abo. illimité' : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {v.agent ? `${v.agent.prenom} ${v.agent.nom}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`badge badge-${v.statut === 'autorise' ? 'success' : 'danger'}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>
                        {v.statut === 'autorise' ? 'check_circle' : 'cancel'}
                      </span>
                      {v.statut === 'autorise' ? 'Autorisé' : 'Refusé'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--danger)', fontSize: '0.82rem', maxWidth: 200 }}>
                    {v.motifRefus || '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {new Date(v.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: 16 }}>
              <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_left</span>
              </button>
              <span style={{ padding: '8px 14px', color: 'var(--text-muted)' }}>Page {page} / {pages}</span>
              <button className="btn btn-ghost" disabled={page === pages} onClick={() => setPage(p => p + 1)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
