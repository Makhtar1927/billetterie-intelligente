import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PrivateRoute, RoleRoute } from './routes/PrivateRoute';

// Layouts
import AppLayout from './layouts/AppLayout';

// Pages publiques
import Login       from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import ChangePassword from './pages/ChangePassword';

// Pages protégées — Admin
import Dashboard     from './pages/Dashboard';
import AdminsPage    from './pages/users/AdminsPage';
import AgentsPage    from './pages/users/AgentsPage';
import ClientsPage   from './pages/users/ClientsPage';
import TicketList    from './pages/users/TicketList';
import AbonnementList from './pages/users/AbonnementList';
import VoyageList    from './pages/users/VoyageList';
import AuditList     from './pages/users/AuditList';

// Pages protégées — Agent
import ScanPage from './pages/ScanPage';
import TicketCreationPage from './pages/TicketCreationPage';

// Pages protégées — Client
import MesBillets     from './pages/MesBillets';
import MesAbonnements from './pages/MesAbonnements';

// Pages protégées — Tous rôles
import Profil from './pages/Profil';

// Toaster config
const toasterConfig = {
  position: 'top-right',
  toastOptions: {
    duration: 4000,
    style: {
      background: '#13152a',
      color: '#f1f5f9',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: '10px',
      fontSize: '0.875rem',
      fontFamily: 'Inter, sans-serif',
    },
    success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
    error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
  },
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Toaster {...toasterConfig} />
          <Routes>
            {/* Routes publiques */}
            <Route path="/login"        element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Route de changement de mot de passe (protégée mais sans layout) */}
            <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />

            {/* Routes protégées — layout avec sidebar */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }
            >
              {/* Redirection racine selon rôle */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Admin — Tableau de bord */}
              <Route path="dashboard" element={
                <RoleRoute roles={['admin']}>
                  <Dashboard />
                </RoleRoute>
              } />

              {/* Admin — Gestion des utilisateurs */}
              <Route path="admin/admins"       element={<RoleRoute roles={['admin']}><AdminsPage /></RoleRoute>} />
              <Route path="admin/agents"       element={<RoleRoute roles={['admin']}><AgentsPage /></RoleRoute>} />
              <Route path="admin/clients"      element={<RoleRoute roles={['admin']}><ClientsPage /></RoleRoute>} />

              {/* Admin — Billetterie & Voyages */}
              <Route path="admin/tickets"      element={<RoleRoute roles={['admin']}><TicketList /></RoleRoute>} />
              <Route path="admin/abonnements"  element={<RoleRoute roles={['admin']}><AbonnementList /></RoleRoute>} />
              <Route path="admin/voyages"      element={<RoleRoute roles={['admin']}><VoyageList /></RoleRoute>} />
              <Route path="admin/audits"       element={<RoleRoute roles={['admin']}><AuditList /></RoleRoute>} />

              {/* Agent — Scanner QR & Création ticket */}
              <Route path="agent/scan"         element={<RoleRoute roles={['agent']}><ScanPage /></RoleRoute>} />
              <Route path="agent/creer-ticket" element={<RoleRoute roles={['agent']}><TicketCreationPage /></RoleRoute>} />

              {/* Client — Billets & Abonnements */}
              <Route path="mes-billets"        element={<RoleRoute roles={['client']}><MesBillets /></RoleRoute>} />
              <Route path="mes-abonnements"    element={<RoleRoute roles={['client']}><MesAbonnements /></RoleRoute>} />

              {/* Tous rôles — Profil */}
              <Route path="profil"             element={<PrivateRoute><Profil /></PrivateRoute>} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
