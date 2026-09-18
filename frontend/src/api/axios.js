import axios from 'axios';

// Retourne la base URL des fichiers statiques (uploads/QR codes).
// En développement : chemin relatif vide → /uploads/... passe par le proxy Vite
// En production    : utilise VITE_API_URL sans /api (ex: https://mon-serveur.com)
export const getBackendURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/api$/, '');
  }
  return ''; // chemin relatif — le proxy Vite gère /uploads
};

const api = axios.create({
  // Chemin relatif → le proxy Vite route /api vers localhost:5000
  // Cela élimine définitivement les erreurs "Mixed Content"
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Injecter automatiquement le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('billetterie_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas rediriger si l'erreur 401 survient lors de la connexion (/auth/login)
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('billetterie_token');
      localStorage.removeItem('billetterie_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
