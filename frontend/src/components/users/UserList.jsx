import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import * as userService from '../../api/userService';
import UserModal from './UserModal';
import ImportCSVModal from './ImportCSVModal';

const ROLE_ICON = { admin: 'shield', agent: 'badge', client: 'group' };
const ROLE_LABELS = { admin: 'Admin', agent: 'Agent', client: 'Client' };
const STATUT_BADGE = {
  actif:    { cls: 'badge-success', label: 'Actif' },
  bloque:   { cls: 'badge-warning', label: 'Bloqué' },
  supprime: { cls: 'badge-danger',  label: 'Supprimé' },
  inactif:  { cls: 'badge-muted',   label: 'Inactif' },
};

export default function UserList({ role }) {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState([]);
  const [search,   setSearch]   = useState('');
  const [statut,   setStatut]   = useState('');
  const [page,     setPage]     = useState(1);
  const [pagination, setPagination] = useState({});
  const [showModal,     setShowModal]     = useState(false);
  const [showCSV,       setShowCSV]       = useState(false);
  const [editingUser,   setEditingUser]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const roleTitle = { admin: 'Administrateurs', agent: 'Agents', client: 'Clients' }[role];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers({ role, statut, search, page, limit: 15 });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Erreur de chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, [role, statut, search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Sélection
  const toggleSelect = (id) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () =>
    setSelected(selected.length === users.length ? [] : users.map(u => u._id));

  // Actions groupées
  const handleBulk = async (action) => {
    if (!selected.length) return toast.error('Sélectionnez au moins un utilisateur.');
    setActionLoading(true);
    try {
      if (action === 'activer') {
        const res = await userService.activateBulk(selected);
        toast.success(res.data.message);
      } else {
        const res = await userService.bulkAction(selected, action);
        toast.success(res.data.message);
      }
      setSelected([]);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  // Activer un seul
  const handleActivate = async (user) => {
    setActionLoading(true);
    try {
      const res = await userService.activateUser(user._id);
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur activation');
    } finally {
      setActionLoading(false);
    }
  };

  // Changer statut
  const handleStatus = async (id, newStatut) => {
    setActionLoading(true);
    try {
      await userService.updateStatus(id, newStatut);
      toast.success('Statut mis à jour');
      fetchUsers();
    } catch {
      toast.error('Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* En-tête */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{roleTitle}</h1>
          <p className="page-subtitle">
            {pagination.total ?? '—'} utilisateur(s) au total
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => setShowCSV(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>upload_file</span> Importer CSV
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingUser(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>person_add</span> Nouveau {role}
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div className="flex gap-3" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Recherche */}
          <div className="search-wrapper" style={{ flex: '1 1 220px' }}>
            <span className="search-icon material-symbols-outlined" style={{ fontSize: '1.1rem' }}>search</span>
            <input
              className="form-input search-input"
              placeholder="Rechercher par email, téléphone ou ID…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          {/* Filtre statut */}
          <select
            className="form-input"
            style={{ width: 160 }}
            value={statut}
            onChange={e => { setStatut(e.target.value); setPage(1); }}
          >
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="bloque">Bloqué</option>
            <option value="supprime">Supprimé</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={fetchUsers}>↺ Actualiser</button>
        </div>
      </div>

      {/* Actions groupées */}
      {selected.length > 0 && (
        <div className="card" style={{ marginBottom: 16, padding: '12px 20px', borderColor: 'var(--border-active)', background: 'rgba(99,102,241,0.06)' }}>
          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--primary-200)', fontSize: '0.875rem', fontWeight: 600 }}>
              {selected.length} sélectionné(s)
            </span>
            <button className="btn btn-sm btn-secondary" onClick={() => handleBulk('activer')} disabled={actionLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check_circle</span> Activer
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => handleBulk('bloquer')} disabled={actionLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>block</span> Bloquer
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => handleBulk('supprimer')} disabled={actionLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span> Supprimer
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => setSelected([])} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span> Annuler
            </button>
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox" className="checkbox"
                  checked={selected.length === users.length && users.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th>Nom complet</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Statut</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  Chargement…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : users.map(user => {
              const badge = STATUT_BADGE[user.statut] || STATUT_BADGE.inactif;
              return (
                <tr key={user._id}>
                  <td>
                    <input type="checkbox" className="checkbox"
                      checked={selected.includes(user._id)}
                      onChange={() => toggleSelect(user._id)}
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        {user.photo
                          ? <img src={user.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          : `${user.prenom?.[0]}${user.nom?.[0]}`
                        }
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.prenom} {user.nom}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '0.85rem', color: 'var(--primary-500)' }}>{ROLE_ICON[user.role]}</span>
                          {ROLE_LABELS[user.role]}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{user.email}</td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user.telephone || '—'}</td>
                  <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {user.statut === 'supprime' ? (
                        <button className="btn btn-sm btn-success" title="Restaurer" onClick={() => handleStatus(user._id, 'actif')} disabled={actionLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>restore</span>
                          <span>Restaurer</span>
                        </button>
                      ) : (
                        <>
                          {user.statut !== 'actif' && (
                            <button className="btn btn-sm btn-secondary" title="Activer" onClick={() => handleActivate(user)} disabled={actionLoading}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check_circle</span>
                            </button>
                          )}
                          {user.statut === 'actif' && (
                            <button className="btn btn-sm btn-secondary" title="Bloquer" onClick={() => handleStatus(user._id, 'bloque')} disabled={actionLoading}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>block</span>
                            </button>
                          )}
                          {user.statut === 'bloque' && (
                            <button className="btn btn-sm btn-secondary" title="Débloquer" onClick={() => handleStatus(user._id, 'actif')} disabled={actionLoading}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>lock_open</span>
                            </button>
                          )}
                          <button className="btn btn-sm btn-secondary" title="Modifier" onClick={() => { setEditingUser(user); setShowModal(true); }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span>
                          </button>
                          <button className="btn btn-sm btn-danger" title="Supprimer" onClick={() => handleStatus(user._id, 'supprime')} disabled={actionLoading}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3" style={{ marginTop: 20 }}>
          <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_left</span> Précédent
          </button>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Page {page} / {pagination.pages}
          </span>
          <button className="btn btn-sm btn-secondary" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Suivant <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_right</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <UserModal
          role={role}
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchUsers(); }}
        />
      )}

      {showCSV && (
        <ImportCSVModal
          role={role}
          onClose={() => setShowCSV(false)}
          onDone={() => { setShowCSV(false); fetchUsers(); }}
        />
      )}
    </div>
  );
}
