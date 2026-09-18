const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Ticket = require('./Ticket');
const Abonnement = require('./Abonnement');

const Voyage = sequelize.define('Voyage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  utilisateur: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Ticket,
      key: 'id',
    },
  },
  abonnementId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Abonnement,
      key: 'id',
    },
  },
  agent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  statut: {
    type: DataTypes.ENUM('autorise', 'refuse'),
    allowNull: false,
  },
  motifRefus: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dateVoyage: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  lieu: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'voyages',
  timestamps: true,
});

// Associations
Voyage.belongsTo(Ticket, { as: 'ticket', foreignKey: 'ticketId' });
Voyage.belongsTo(Abonnement, { as: 'abonnement', foreignKey: 'abonnementId' });

module.exports = Voyage;
