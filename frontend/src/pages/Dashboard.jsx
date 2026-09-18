import { useEffect, useState } from 'react';
import { getStats, statsTickets, statsAbonnements, statsVoyages } from '../api/userService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card">
    <div className={`stat-icon stat-icon-${color}`}>
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    <div>
      <div className="stat-value">{value ?? '0'}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tStats, setTStats] = useState(null);
  const [aStats, setAStats] = useState(null);
  const [vStats, setVStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getStats(),
      statsTickets(),
      statsAbonnements(),
      statsVoyages(),
    ])
      .then(([uRes, tRes, aRes, vRes]) => {
        setStats(uRes.data.data);
        setTStats(tRes.data.data);
        setAStats(aRes.data.data);
        setVStats(vRes.data.data);
      })
      .catch(() => {
        toast.error('Erreur lors du chargement des statistiques globales.');
      })
      .finally(() => setLoading(false));
  }, []);

  const g  = stats?.global;
  const a  = stats?.admins;
  const ag = stats?.agents;
  const cl = stats?.clients;

  // Calcul du taux de succès des scans
  const scanSuccessRate = vStats && vStats.total > 0
    ? Math.round((vStats.autorise / vStats.total) * 100)
    : 0;

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">
            Bonjour, <strong style={{ color: 'var(--primary-200)' }}>{user?.prenom} {user?.nom}</strong>
          </p>
        </div>
        <div className="badge badge-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '1rem', marginRight: 4 }}>admin_panel_settings</span>
          Administrateur
        </div>
      </div>

      {/* ── Statistiques globales utilisateurs ── */}
      <p className="nav-section-title" style={{ marginBottom: 12 }}>Statistiques utilisateurs</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
        <StatCard icon="group"        label="Total utilisateurs"  value={loading ? '…' : g?.total}    color="primary" />
        <StatCard icon="check_circle" label="Comptes actifs"       value={loading ? '…' : g?.actif}    color="success" />
        <StatCard icon="block"        label="Comptes bloqués"     value={loading ? '…' : g?.bloque}   color="warning" />
        <StatCard icon="delete"       label="Comptes supprimés"   value={loading ? '…' : g?.supprime} color="danger"  />
      </div>

      {/* ── Détail par rôle ── */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>

        {/* Admins */}
        <div className="card">
          <h4 style={{ marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)', fontSize: '1.25rem' }}>admin_panel_settings</span>
            Administrateurs
            <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>{loading ? '…' : a?.total}</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Actifs', a?.actif, 'success'], ['Bloqués', a?.bloque, 'warning'], ['Supprimés', a?.supprime, 'danger']].map(([l, v, c]) => (
              <div key={l} className="flex justify-between items-center">
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{l}</span>
                <span className={`badge badge-${c}`}>{loading ? '…' : (v || 0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Agents */}
        <div className="card">
          <h4 style={{ marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)', fontSize: '1.25rem' }}>badge</span>
            Agents
            <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>{loading ? '…' : ag?.total}</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Actifs', ag?.actif, 'success'], ['Bloqués', ag?.bloque, 'warning'], ['Supprimés', ag?.supprime, 'danger']].map(([l, v, c]) => (
              <div key={l} className="flex justify-between items-center">
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{l}</span>
                <span className={`badge badge-${c}`}>{loading ? '…' : (v || 0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clients */}
        <div className="card">
          <h4 style={{ marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)', fontSize: '1.25rem' }}>group</span>
            Clients
            <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>{loading ? '…' : cl?.total}</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Actifs', cl?.actif, 'success'], ['Bloqués', cl?.bloque, 'warning'], ['Supprimés', cl?.supprime, 'danger']].map(([l, v, c]) => (
              <div key={l} className="flex justify-between items-center">
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{l}</span>
                <span className={`badge badge-${c}`}>{loading ? '…' : (v || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Réseau de transport & Validations ── */}
      <p className="nav-section-title" style={{ marginBottom: 12 }}>Réseau de transport &amp; validations</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 40 }}>

        {/* Voyages & Scans */}
        <div className="card">
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)' }}>transit_enterexit</span>
            Validation des scans (Voyages)
          </h3>
          {loading ? (
            <div style={{ padding: 20, color: 'var(--text-muted)' }}>Chargement…</div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{vStats?.total ?? 0}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total validations</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{scanSuccessRate}%</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Taux d'accès autorisé</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Autorisés</span>
                    <strong style={{ color: 'var(--success)' }}>{vStats?.autorise ?? 0}</strong>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--success)', width: `${vStats?.total ? (vStats.autorise / vStats.total) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Refusés (infractions/expirations)</span>
                    <strong style={{ color: 'var(--danger)' }}>{vStats?.refuse ?? 0}</strong>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--danger)', width: `${vStats?.total ? (vStats.refuse / vStats.total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Titres & Abonnements */}
        <div className="card">
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)' }}>card_membership</span>
            Distribution des titres
          </h3>
          {loading ? (
            <div style={{ padding: 20, color: 'var(--text-muted)' }}>Chargement…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tickets simples</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Utilisation unitaire</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tStats?.total ?? 0}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>{tStats?.valide ?? 0} valides</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Abonnements mensuels / annuels</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Limités et illimités</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{aStats?.total ?? 0}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>{aStats?.actif ?? 0} actifs</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Analyse des motifs de refus ── */}
      {!loading && vStats && vStats.refuse > 0 && (
        <>
          <p className="nav-section-title" style={{ marginBottom: 12 }}>Analyse des refus</p>
          <div className="card" style={{ marginBottom: 40 }}>
            <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--danger)' }}>gpp_bad</span>
              Répartition des motifs de refus
              <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>{vStats.refuse} refus total</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Object.entries(vStats.motifsRefus || {})
                .sort(([, a], [, b]) => b - a)
                .map(([motif, count]) => {
                  const pct = vStats.refuse > 0 ? Math.round((count / vStats.refuse) * 100) : 0;
                  return (
                    <div key={motif}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', flex: 1, paddingRight: 12 }}>{motif}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span className="badge badge-danger">{count}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 38, textAlign: 'right' }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          borderRadius: 3,
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, var(--danger), #f87171)',
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              {(!vStats.motifsRefus || Object.keys(vStats.motifsRefus).length === 0) && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aucun motif enregistré.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── État des billets ── */}
      {!loading && tStats && (
        <>
          <p className="nav-section-title" style={{ marginBottom: 12 }}>État des billets</p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 40 }}>
            {[
              { l: 'Valides',   v: tStats?.valide,   c: 'success' },
              { l: 'Suspendus', v: tStats?.suspendu,  c: 'warning' },
              { l: 'Expirés',   v: tStats?.expire,    c: 'danger'  },
              { l: 'Annulés',   v: tStats?.annule,    c: 'danger'  },
              { l: 'Utilisés',  v: tStats?.utilise,   c: 'primary' },
            ].map(({ l, v, c }) => (
              <div key={l} className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: `var(--${c})` }}>{v ?? 0}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
