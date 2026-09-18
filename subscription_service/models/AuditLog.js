const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  utilisateurId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  utilisateurRole: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ressourceType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ressourceId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  statut: {
    type: DataTypes.ENUM('succes', 'echec'),
    defaultValue: 'succes',
    allowNull: false,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  adresseIP: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  timestamps: true,
});

module.exports = AuditLog;
