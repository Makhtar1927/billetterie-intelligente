const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Charger les variables d'environnement
dotenv.config();

// Autoriser les certificats auto-signés locaux pour la communication microservices
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Créer les répertoires d'upload si absents
['uploads/profiles', 'uploads/qrcodes'].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Créer le répertoire backend/uploads/qrcodes si absent (pour les QR codes du microservice)
const backendUploadsPath = path.join(__dirname, '../backend/uploads/qrcodes');
if (!fs.existsSync(backendUploadsPath)) {
  fs.mkdirSync(backendUploadsPath, { recursive: true });
}

// Connexion à la base de données (sauf en environnement de test)
if (process.env.NODE_ENV !== 'test') {
  const connectDB = require('./config/db');
  connectDB();
}

const logger = require('./utils/logger');

// Initialiser Express
const app = express();

// Middlewares globaux
app.use(cors({
  origin: function(origin, callback) {
    // Autoriser toutes les origines pour le développement local
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Journalisation technique structurée des requêtes HTTP
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.http(req, res, Date.now() - start);
  });
  next();
});

// Servir les fichiers statiques (uploads) - depuis Backend_PI et depuis le dossier backend partagé
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../backend/uploads')));

// Routes
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/users',        require('./routes/userRoutes'));
app.use('/api/tickets',      require('./routes/ticketRoutes'));
app.use('/api/abonnements',  require('./routes/abonnementRoutes'));
app.use('/api/voyages',      require('./routes/voyageRoutes'));
app.use('/api/audits',       require('./routes/auditRoutes'));

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '🎫 API Billetterie intelligente — Opérationnelle', timestamp: new Date() });
});

// Gestion des routes inexistantes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable.' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Erreur serveur.' });
});

// Démarrer le serveur — écoute sur toutes les interfaces (réseau local inclus)
const PORT = process.env.PORT || 5000;
const os = require('os');
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

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`🚀 Serveur démarré :`);
    console.log(`   ➜ Local   : http://localhost:${PORT}`);
    console.log(`   ➜ Réseau  : http://${localIP}:${PORT}`);
  });
}

module.exports = app;
