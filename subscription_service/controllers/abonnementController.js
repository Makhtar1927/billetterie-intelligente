const crypto = require('crypto');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const Abonnement = require('../models/Abonnement');
const Ticket = require('../models/Ticket');
const { sequelize } = require('../config/db');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const generateHMAC = (data) =>
  crypto.createHmac('sha256', process.env.HMAC_SECRET).update(data).digest('hex');

const getQRUploadPath = (filename) => {
  const gatewayQRPath = path.join(__dirname, '../../backend/uploads/qrcodes');
  ensureDir(gatewayQRPath);
  return path.join(gatewayQRPath, filename);
};

// @desc  POST /api/abonnements
// @access Client
exports.souscrireAbonnement = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.headers['x-user-id'];
    const { type, voyagesTotal, dateFin, prix } = req.body;

    if (!userId) {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: 'Non authentifié.' });
    }
    if (!type || !prix) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Type et prix requis.' });
    }
    if (!['limite', 'illimite'].includes(type)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Type invalide (limite ou illimite).' });
    }
    if (type === 'limite' && (!voyagesTotal || voyagesTotal < 1)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Nombre de voyages requis pour abonnement limité.' });
    }
    if (type === 'illimite' && !dateFin) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'La date d\'expiration (dateFin) est obligatoire pour un abonnement illimité.' });
    }

    const ticketId = crypto.randomUUID();
    const signature = generateHMAC(ticketId);
    const qrData = JSON.stringify({ id: ticketId, sig: signature, abonnement: true });

    const qrFilename = `qr-${ticketId}.png`;
    const fullPath = getQRUploadPath(qrFilename);
    await QRCode.toFile(fullPath, qrData, { width: 300, errorCorrectionLevel: 'H' });

    const ticket = await Ticket.create({
      id: ticketId,
      utilisateur: userId,
      type: type === 'limite' ? 'abonnement_limite' : 'abonnement_illimite',
      qrCode: `/uploads/qrcodes/${qrFilename}`,
      qrCodeData: qrData,
      signature,
      prix: parseFloat(prix),
      dateDebut: new Date(),
      dateExpiration: dateFin ? new Date(dateFin) : null,
      voyagesInitiaux: type === 'limite' ? parseInt(voyagesTotal) : null,
      voyagesRestants: type === 'limite' ? parseInt(voyagesTotal) : null,
      statut: 'valide',
    }, { transaction });

    const abonnement = await Abonnement.create({
      utilisateur: userId,
      type,
      voyagesTotal: type === 'limite' ? parseInt(voyagesTotal) : null,
      voyagesRestants: type === 'limite' ? parseInt(voyagesTotal) : null,
      dateFin: dateFin ? new Date(dateFin) : null,
      prix: parseFloat(prix),
      ticketId: ticket.id,
      statut: 'actif',
    }, { transaction });

    await transaction.commit();

    // Renvoi compatible avec le populate mongoose du frontend
    res.status(201).json({
      success: true,
      data: {
        ...abonnement.toJSON(),
        _id: abonnement.id,
        ticket: { ...ticket.toJSON(), _id: ticket.id }
      }
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  GET /api/abonnements/mes-abonnements
// @access Client
exports.mesAbonnements = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié.' });

    const abonnements = await Abonnement.findAll({
      where: { utilisateur: userId },
      include: [{ model: Ticket, as: 'ticket' }],
      order: [['createdAt', 'DESC']],
    });

    const formatted = abonnements.map(a => {
      const data = a.toJSON();
      if (data.ticket) {
        data.ticket._id = data.ticket.id;
      }
      return { ...data, _id: data.id };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  GET /api/abonnements
// @access Admin
exports.tousAbonnements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.statut) where.statut = req.query.statut;
    if (req.query.type) where.type = req.query.type;

    const { count, rows } = await Abonnement.findAndCountAll({
      where,
      include: [{ model: Ticket, as: 'ticket' }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const formatted = rows.map(a => {
      const data = a.toJSON();
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
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  PATCH /api/abonnements/:id/statut
// @access Admin
exports.updateStatutAbonnement = async (req, res) => {
  try {
    const { statut } = req.body;
    const STATUTS_VALIDES = ['actif', 'suspendu', 'annule'];
    if (!STATUTS_VALIDES.includes(statut)) {
      return res.status(400).json({ success: false, message: `Statut invalide. Valeurs acceptées : ${STATUTS_VALIDES.join(', ')}.` });
    }

    const abonnement = await Abonnement.findByPk(req.params.id, {
      include: [{ model: Ticket, as: 'ticket' }],
    });
    if (!abonnement) {
      return res.status(404).json({ success: false, message: 'Abonnement introuvable.' });
    }

    abonnement.statut = statut;
    await abonnement.save();

    // Synchroniser le statut du ticket associé
    if (abonnement.ticket) {
      if (statut === 'annule') {
        abonnement.ticket.statut = 'annule';
      } else if (statut === 'suspendu') {
        abonnement.ticket.statut = 'expire'; // Un abonnement suspendu ne peut pas être utilisé
      } else if (statut === 'actif') {
        // Réactiver uniquement si le ticket n'était pas déjà utilisé ou vraiment expiré
        if (['expire', 'annule'].includes(abonnement.ticket.statut)) {
          abonnement.ticket.statut = 'valide';
        }
      }
      await abonnement.ticket.save();
    }

    const result = abonnement.toJSON();
    result._id = result.id;
    if (result.ticket) result.ticket._id = result.ticket.id;

    res.json({ success: true, data: result, message: `Abonnement ${statut} avec succès.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  GET /api/abonnements/stats
// @access Admin
exports.statsAbonnements = async (req, res) => {
  try {
    const stats = { actif: 0, expire: 0, annule: 0, suspendu: 0, total: 0 };

    const rows = await Abonnement.findAll({
      attributes: ['statut', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['statut'],
    });

    rows.forEach(r => {
      const data = r.toJSON();
      const countVal = parseInt(data.count) || 0;
      stats[data.statut] = countVal;
      stats.total += countVal;
    });

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
