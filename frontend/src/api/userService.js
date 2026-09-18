import api from '../api/axios';

// ─── Utilisateurs ────────────────────────────────────────────────────────────

export const getUsers = (params = {}) =>
  api.get('/users', { params });

export const getStats = () =>
  api.get('/users/stats');

export const createUser = (data) =>
  api.post('/users', data);

export const getUser = (id) =>
  api.get(`/users/${id}`);

export const updateUser = (id, data) =>
  api.put(`/users/${id}`, data);

export const updateStatus = (id, statut) =>
  api.patch(`/users/${id}/status`, { statut });

export const bulkAction = (ids, action) =>
  api.patch('/users/bulk-action', { ids, action });

export const activateUser = (id) =>
  api.patch(`/users/${id}/activate`);

export const activateBulk = (ids) =>
  api.post('/users/activate-bulk', { ids });

export const importCSV = (users, role) =>
  api.post('/users/import-csv', { users, role });

// Profil — FormData pour la photo
export const updateProfile = (formData) =>
  api.put('/users/me/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ─── Auth ────────────────────────────────────────────────────────────────────

export const login = (data) =>
  api.post('/auth/login', data);

export const getMe = () =>
  api.get('/auth/me');

export const changePassword = (data) =>
  api.put('/auth/change-password', data);

// ─── Tickets ─────────────────────────────────────────────────────────────────

export const acheterTicket = (data) =>
  api.post('/tickets', data);

export const creerTicketAgent = (data) =>
  api.post('/tickets/agent', data);

export const mesTickets = () =>
  api.get('/tickets/mes-tickets');

export const tousTickets = (params = {}) =>
  api.get('/tickets', { params });

export const statsTickets = () =>
  api.get('/tickets/stats');

export const updateStatutTicket = (id, statut) =>
  api.patch(`/tickets/${id}/statut`, { statut });

// ─── Abonnements ─────────────────────────────────────────────────────────────

export const souscrireAbonnement = (data) =>
  api.post('/abonnements', data);

export const mesAbonnements = () =>
  api.get('/abonnements/mes-abonnements');

export const tousAbonnements = (params = {}) =>
  api.get('/abonnements', { params });

export const statsAbonnements = () =>
  api.get('/abonnements/stats');

export const updateStatutAbonnement = (id, statut) =>
  api.patch(`/abonnements/${id}/statut`, { statut });


// ─── Voyages ─────────────────────────────────────────────────────────────────

export const scanQRCode = (qrCodeData) =>
  api.post('/voyages/scan', { qrCodeData });

export const monHistorique = () =>
  api.get('/voyages/mon-historique');

export const tousVoyages = (params = {}) =>
  api.get('/voyages', { params });

export const statsVoyages = () =>
  api.get('/voyages/stats');
