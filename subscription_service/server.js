const express = require('express');
const cors = require('cors');
const http = require('http');
const os = require('os');
require('dotenv').config();

const { sequelize, ensureDatabaseExists } = require('./config/db');

const logger = require('./utils/logger');
require('./models/AuditLog');

const ticketRoutes = require('./routes/ticketRoutes');
const abonnementRoutes = require('./routes/abonnementRoutes');
const voyageRoutes = require('./routes/voyageRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de journalisation des requêtes HTTP
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.http(req, res, Date.now() - start);
  });
  next();
});

// Endpoints
app.use('/api/tickets', ticketRoutes);
app.use('/api/abonnements', abonnementRoutes);
app.use('/api/voyages', voyageRoutes);
app.use('/api/audits', auditRoutes);

// Route de statut
app.get('/status', (req, res) => {
  res.json({ status: 'ok', service: 'abonnements-mysql' });
});

const PORT = process.env.PORT || 5001;

// Helper pour récupérer l'IP locale (LAN)
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

async function startServer() {
  // 1. S'assurer que la base de données existe
  await ensureDatabaseExists();

  // 2. Synchroniser les modèles Sequelize
  try {
    await sequelize.sync({ force: false });
    console.log('[Sequelize] Tous les modèles ont été synchronisés avec MySQL.');
  } catch (err) {
    console.error('[Sequelize] Erreur lors de la synchronisation des modèles :', err.message);
    process.exit(1);
  }

  // 3. Lancer le serveur HTTP sur toutes les interfaces réseau
  // Note : ce service fonctionne en HTTP (communication interne localhost).
  // Le HTTPS est géré côté frontend (Vite proxy) pour les connexions navigateur.
  const server = http.createServer(app);

  server.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`🚀 [Subscription Service] Serveur démarré :`);
    console.log(`   ➜ Local   : http://localhost:${PORT}`);
    console.log(`   ➜ Réseau  : http://${localIP}:${PORT}`);
  });
}

startServer();
