const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Ticket = require('./Ticket');

const Abonnement = sequelize.define('Abonnement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  utilisateur: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('limite', 'illimite'),
    allowNull: false,
  },
  voyagesTotal: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  voyagesRestants: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  dateFin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  prix: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  statut: {
    type: DataTypes.ENUM('actif', 'expire', 'annule', 'suspendu'),
    defaultValue: 'actif',
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Ticket,
      key: 'id',
    },
  },
}, {
  tableName: 'abonnements',
  timestamps: true,
});

// Associations
Abonnement.belongsTo(Ticket, { as: 'ticket', foreignKey: 'ticketId' });
Ticket.hasMany(Abonnement, { foreignKey: 'ticketId' });

module.exports = Abonnement;
