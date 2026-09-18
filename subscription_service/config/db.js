const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

const connectionUri = process.env.SERVICE_URI;
let sequelize;

// Création dynamique de la base de données si elle n'existe pas (seulement en local)
async function ensureDatabaseExists() {
  if (connectionUri) {
    // Sur Aiven Cloud, la base defaultdb existe déjà et on n'a pas les droits superuser pour créer des bases
    console.log('[Database] Utilisation du lien de connexion Aiven MySQL. Vérification locale désactivée.');
    return;
  }

  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = process.env.DB_PORT || 3306;
  const dbUser = process.env.DB_USER || 'root';
  const dbPass = process.env.DB_PASS || '';
  const dbName = process.env.DB_NAME || 'billetterie_abonnements_db';

  try {
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPass,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();
    console.log(`[Database] Base de données locale '${dbName}' vérifiée/créée.`);
  } catch (err) {
    console.error(`[Database] Erreur lors de la création de la base locale :`, err.message);
  }
}

if (connectionUri) {
  sequelize = new Sequelize(connectionUri, {
    dialect: 'mysql',
    logging: false, // Passer à console.log pour voir les requêtes SQL
    define: {
      timestamps: true, // Ajoute createdAt et updatedAt
    },
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false, // Permet de se connecter de façon sécurisée à Aiven sans fournir de certificat client
      },
    },
  });
} else {
  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = process.env.DB_PORT || 3306;
  const dbUser = process.env.DB_USER || 'root';
  const dbPass = process.env.DB_PASS || '';
  const dbName = process.env.DB_NAME || 'billetterie_abonnements_db';

  sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false,
    define: {
      timestamps: true,
    },
  });
}

module.exports = {
  sequelize,
  ensureDatabaseExists,
};

