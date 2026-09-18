const crypto = require('crypto');
const { Op } = require('sequelize');
const Ticket = require('../models/Ticket');
const Abonnement = require('../models/Abonnement');
const Voyage = require('../models/Voyage');
const { sequelize } = require('../config/db');
const { recordAudit } = require('../utils/auditHelper');
const logger = require('../utils/logger');

const verifyHMAC = (id, sig) => {
  const expected = crypto
    .createHmac('sha256', process.env.HMAC_SECRET)
    .update(id)
    .digest('hex');
  return expected === sig;
};

// @desc  POST /api/voyages/scan
// @access Agent
exports.scanQRCode = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { qrCodeData, lieu } = req.body;
    const agentId = req.headers['x-user-id'];

    if (!qrCodeData) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'QR Code manquant.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(qrCodeData);
    } catch {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'QR Code invalide.' });
    }

    const { id, sig } = parsed;

    // 1. Vérifier la signature HMAC
    if (!id || !sig || !verifyHMAC(id, sig)) {
      const voyage = await Voyage.create({
        utilisateur: null,
        ticketId: null,
        abonnementId: null,
        agent: agentId,
        statut: 'refuse',
        motifRefus: 'QR Code falsifié ou signature invalide.',
        lieu: lieu || null,
      }, { transaction });

      await transaction.commit();

      await recordAudit({
        action: 'SCAN_VOYAGE_REFUSE',
        ressourceType: 'ticket',
        ressourceId: id || 'inconnu',
        statut: 'echec',
        details: { motif: 'QR Code falsifié ou signature invalide.', agentId },
        req,
      });

      logger.warn(`Scan refusé : signature invalide pour id=${id} par agent=${agentId}`);

      return res.status(403).json({
        success: false,
        statut: 'refuse',
        motif: 'QR Code falsifié ou signature invalide.',
      });
    }

    // 2. Récupérer le ticket avec VERROUILLAGE PESSIMISTE (Anti-concurrence)
    const ticket = await Ticket.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!ticket) {
      const voyage = await Voyage.create({
        utilisateur: null,
        ticketId: null,
        abonnementId: null,
        agent: agentId,
        statut: 'refuse',
        motifRefus: 'Titre de transport inconnu dans le système.',
        lieu: lieu || null,
      }, { transaction });

      await transaction.commit();

      await recordAudit({
        action: 'SCAN_VOYAGE_REFUSE',
        ressourceType: 'ticket',
        ressourceId: id,
        statut: 'echec',
        details: { motif: 'Titre de transport inconnu', agentId },
        req,
      });

      return res.status(404).json({
        success: false,
        statut: 'refuse',
        motif: 'Titre de transport inconnu dans le système.',
      });
    }

    // Récupérer l'abonnement s'il existe avec VERROUILLAGE PESSIMISTE
    const abonnement = await Abonnement.findOne({
      where: { ticketId: ticket.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    let motifRefus = null;

    // 3. Vérifications des règles métier
    if (ticket.statut === 'suspendu') {
      motifRefus = 'Titre de transport suspendu par l\'administration.';
    } else if (ticket.statut === 'annule') {
      motifRefus = 'Titre de transport annulé ou désactivé.';
    } else if (ticket.statut === 'expire' || (ticket.dateExpiration && new Date() > ticket.dateExpiration)) {
      motifRefus = 'Titre de transport expiré.';
      if (ticket.statut !== 'expire') {
        ticket.statut = 'expire';
        await ticket.save({ transaction });
      }
      if (abonnement && abonnement.statut !== 'expire') {
        abonnement.statut = 'expire';
        await abonnement.save({ transaction });
      }
    } else {
      if (ticket.type === 'simple') {
        if (ticket.statut === 'utilise' || ticket.voyagesRestants <= 0) {
          motifRefus = 'Ticket déjà utilisé (voyage unique consommé).';
        }
      } else if (ticket.type === 'abonnement_limite') {
        if (ticket.voyagesRestants <= 0) {
          motifRefus = 'Abonnement épuisé (solde de voyages à zéro).';
          if (ticket.statut !== 'expire') {
            ticket.statut = 'expire';
            await ticket.save({ transaction });
          }
          if (abonnement && abonnement.statut !== 'expire') {
            abonnement.statut = 'expire';
            await abonnement.save({ transaction });
          }
        }
      } else if (ticket.type === 'abonnement_illimite') {
        if (ticket.dateExpiration && new Date() > ticket.dateExpiration) {
          motifRefus = 'Abonnement illimité expiré.';
        }
      }
    }

    if (!motifRefus) {
      // 4. Enregistrer le voyage autorisé
      const voyage = await Voyage.create({
        utilisateur: ticket.utilisateur,
        ticketId: ticket.id,
        abonnementId: abonnement ? abonnement.id : null,
        agent: agentId,
        statut: 'autorise',
        lieu: lieu || null,
      }, { transaction });

      // 5. Mettre à jour le solde du ticket
      if (ticket.type !== 'abonnement_illimite') {
        ticket.voyagesRestants -= 1;
        if (ticket.type === 'simple') {
          ticket.statut = 'utilise';
        }
      }

      ticket.voyagesUtilises = (ticket.voyagesUtilises || 0) + 1;
      ticket.dateDernierVoyage = new Date();
      ticket.derniereValidationId = voyage.id.toString();
      await ticket.save({ transaction });

      // Mettre à jour l'abonnement
      if (abonnement) {
        if (abonnement.type === 'limite') {
          abonnement.voyagesRestants -= 1;
          if (abonnement.voyagesRestants <= 0) {
            abonnement.statut = 'expire';
          }
        }
        await abonnement.save({ transaction });
      }

      await transaction.commit();

      await recordAudit({
        action: 'SCAN_VOYAGE_AUTORISE',
        ressourceType: 'ticket',
        ressourceId: ticket.id,
        statut: 'succes',
        details: {
          type: ticket.type,
          agentId,
          voyagesRestants: ticket.voyagesRestants,
          voyageId: voyage.id,
        },
        req,
      });

      logger.info(`Voyage autorisé pour ticket=${ticket.id}, type=${ticket.type} par agent=${agentId}`);

      res.json({
        success: true,
        statut: 'autorise',
        client: { _id: ticket.utilisateur },
        type: ticket.type,
        voyagesRestants: ticket.voyagesRestants,
      });
      return;
    }

    // Enregistrement d'un voyage refusé
    const voyageRefuse = await Voyage.create({
      utilisateur: ticket.utilisateur,
      ticketId: ticket.id,
      abonnementId: abonnement ? abonnement.id : null,
      agent: agentId,
      statut: 'refuse',
      motifRefus,
      lieu: lieu || null,
    }, { transaction });

    await transaction.commit();

    await recordAudit({
      action: 'SCAN_VOYAGE_REFUSE',
      ressourceType: 'ticket',
      ressourceId: ticket.id,
      statut: 'echec',
      details: { motif: motifRefus, agentId, voyageId: voyageRefuse.id },
      req,
    });

    logger.warn(`Voyage refusé ticket=${ticket.id} par agent=${agentId} : ${motifRefus}`);

    return res.status(403).json({ success: false, statut: 'refuse', motif: motifRefus });

  } catch (err) {
    await transaction.rollback();
    logger.error('Erreur transaction scan QR', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  GET /api/voyages/mon-historique
// @access Client
exports.monHistorique = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié.' });

    const voyages = await Voyage.findAll({
      where: { utilisateur: userId },
      include: [{ model: Ticket, as: 'ticket' }],
      order: [['createdAt', 'DESC']],
    });

    const formatted = voyages.map(v => {
      const data = v.toJSON();
      if (data.ticket) {
        data.ticket._id = data.ticket.id;
      }
      return { ...data, _id: data.id };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    logger.error('Erreur historique client', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  GET /api/voyages
// @access Admin
exports.tousVoyages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.statut) where.statut = req.query.statut;
    if (req.query.motifRefus) {
      where.motifRefus = { [Op.like]: `%${req.query.motifRefus}%` };
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
        { utilisateur: { [Op.like]: `%${req.query.search}%` } },
        { agent: { [Op.like]: `%${req.query.search}%` } },
        { motifRefus: { [Op.like]: `%${req.query.search}%` } },
      ];
    }

    const { count, rows } = await Voyage.findAndCountAll({
      where,
      include: [{ model: Ticket, as: 'ticket' }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const formatted = rows.map(v => {
      const data = v.toJSON();
      if (data.ticket) {
        data.ticket._id = data.ticket.id;
      }
      return { ...data, _id: data.id };
    });

    res.json({
      success: true,
      data: formatted,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    logger.error('Erreur récupération voyages admin', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  GET /api/voyages/stats
// @access Admin
exports.statsVoyages = async (req, res) => {
  try {
    const stats = { autorise: 0, refuse: 0, total: 0, motifsRefus: {} };

    const rows = await Voyage.findAll({
      attributes: ['statut', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['statut'],
    });

    rows.forEach(r => {
      const data = r.toJSON();
      const countVal = parseInt(data.count) || 0;
      stats[data.statut] = countVal;
      stats.total += countVal;
    });

    // Répartition des motifs de refus
    const motifs = await Voyage.findAll({
      where: { statut: 'refuse' },
      attributes: ['motifRefus', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['motifRefus'],
    });

    motifs.forEach(m => {
      const data = m.toJSON();
      if (data.motifRefus) {
        stats.motifsRefus[data.motifRefus] = parseInt(data.count) || 0;
      }
    });

    res.json({ success: true, data: stats });
  } catch (err) {
    logger.error('Erreur stats voyages', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};
