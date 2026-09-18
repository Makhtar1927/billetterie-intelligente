const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  utilisateur: {
    type: DataTypes.STRING,
    allowNull: true, // Permet les tickets anonymes créés par les agents
  },
  type: {
    type: DataTypes.ENUM('simple', 'abonnement_limite', 'abonnement_illimite'),
    allowNull: false,
  },
  qrCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  qrCodeData: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  signature: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  statut: {
    type: DataTypes.ENUM('valide', 'utilise', 'expire', 'annule', 'suspendu'),
    defaultValue: 'valide',
  },
  prix: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  voyagesInitiaux: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  voyagesUtilises: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  voyagesRestants: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  dateDebut: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  dateExpiration: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  dateDernierVoyage: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  derniereValidationId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'tickets',
  timestamps: true,
});

module.exports = Ticket;
