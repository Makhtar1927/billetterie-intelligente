import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getBackendURL } from '../../api/axios';

const navItems = [
  { path: '/dashboard',         icon: 'home',                   label: 'Tableau de bord',   roles: ['admin'] },
  { path: '/admin/admins',      icon: 'admin_panel_settings',   label: 'Administrateurs',   roles: ['admin'] },
  { path: '/admin/agents',      icon: 'badge',                  label: 'Agents',             roles: ['admin'] },
  { path: '/admin/clients',     icon: 'group',                  label: 'Clients',            roles: ['admin'] },
  { path: '/admin/tickets',     icon: 'local_activity',         label: 'Billets / Tickets',  roles: ['admin'] },
  { path: '/admin/abonnements', icon: 'card_membership',         label: 'Abonnements',        roles: ['admin'] },
  { path: '/admin/voyages',     icon: 'directions_bus',         label: 'Voyages',            roles: ['admin'] },
  { path: '/admin/audits',      icon: 'history',                 label: 'Piste d\'Audit',     roles: ['admin'] },
  { path: '/agent/scan',        icon: 'qr_code_scanner',        label: 'Scanner QR',         roles: ['agent'] },
  { path: '/agent/creer-ticket',icon: 'confirmation_number',     label: 'Créer Ticket',      roles: ['agent'] },
  { path: '/mes-billets',       icon: 'local_activity',         label: 'Mes Billets',        roles: ['client'] },
  { path: '/mes-abonnements',   icon: 'card_membership',         label: 'Mes Abonnements',    roles: ['client'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '1.35rem' }}>directions_bus</span>
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">Billetterie</span>
          <span className="sidebar-logo-sub">Intelligente</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="nav-section-title">Navigation</span>
        {filteredNav.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="material-symbols-outlined nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{
        padding: '16px 16px 0',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto',
      }}>
        <NavLink
          to="/profil"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
            {user?.photo
              ? <img src={user.photo.startsWith('http') ? user.photo : `${getBackendURL()}${user.photo}`} alt="profil" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : initials
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.prenom} {user?.nom}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
        </NavLink>

        <button
          onClick={handleLogout}
          className="nav-item"
          style={{
            width: '100%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            marginTop: 10,
            marginBottom: 10,
            color: '#f87171',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 12px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
          }}
          id="btn-logout"
          title="Se déconnecter de l'application"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>logout</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
