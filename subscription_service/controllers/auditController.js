const { Op } = require('sequelize');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

// @desc  GET /api/audits
// @access Admin
exports.tousAudits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const where = {};

    if (req.query.action) {
      where.action = req.query.action;
    }
    if (req.query.statut) {
      where.statut = req.query.statut;
    }
    if (req.query.utilisateurRole) {
      where.utilisateurRole = req.query.utilisateurRole;
    }
    if (req.query.ressourceType) {
      where.ressourceType = req.query.ressourceType;
    }

    if (req.query.dateDebut || req.query.dateFin) {
      where.createdAt = {};
      if (req.query.dateDebut) {
        where.createdAt[Op.gte] = new Date(req.query.dateDebut);
      }
      if (req.query.dateFin) {
        const endDate = new Date(req.query.dateFin);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = endDate;
      }
    }

    if (req.query.search) {
      where[Op.or] = [
        { action: { [Op.like]: `%${req.query.search}%` } },
        { utilisateurId: { [Op.like]: `%${req.query.search}%` } },
        { ressourceId: { [Op.like]: `%${req.query.search}%` } },
        { details: { [Op.like]: `%${req.query.search}%` } },
      ];
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    logger.error('Erreur récupération audits', { error: err.message });
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des audits.' });
  }
};

// @desc  GET /api/audits/stats
// @access Admin
exports.statsAudits = async (req, res) => {
  try {
    const total = await AuditLog.count();
    const succes = await AuditLog.count({ where: { statut: 'succes' } });
    const echec = await AuditLog.count({ where: { statut: 'echec' } });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const aujourdhui = await AuditLog.count({
      where: {
        createdAt: { [Op.gte]: todayStart },
      },
    });

    res.json({
      success: true,
      data: {
        total,
        succes,
        echec,
        aujourdhui,
      },
    });
  } catch (err) {
    logger.error('Erreur stats audits', { error: err.message });
    res.status(500).json({ success: false, message: 'Erreur lors du calcul des stats d\'audit.' });
  }
};
