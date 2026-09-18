import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger le token et l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const savedToken = localStorage.getItem('billetterie_token');
    const savedUser  = localStorage.getItem('billetterie_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Connexion
  const login = (tokenData, userData) => {
    localStorage.setItem('billetterie_token', tokenData);
    localStorage.setItem('billetterie_user', JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
  };

  // Déconnexion
  const logout = () => {
    localStorage.removeItem('billetterie_token');
    localStorage.removeItem('billetterie_user');
    setToken(null);
    setUser(null);
  };

  // Mettre à jour les infos utilisateur (ex: après modification du profil)
  const updateUser = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    localStorage.setItem('billetterie_user', JSON.stringify(merged));
    setUser(merged);
  };

  const isAuthenticated = !!token;
  const isAdmin  = user?.role === 'admin';
  const isAgent  = user?.role === 'agent';
  const isClient = user?.role === 'client';

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated, isAdmin, isAgent, isClient,
      login, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export default AuthContext;
