const crypto = require('crypto');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const Ticket = require('../models/Ticket');
const { sequelize } = require('../config/db');
const { recordAudit } = require('../utils/auditHelper');
const logger = require('../utils/logger');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const generateHMAC = (data) =>
  crypto.createHmac('sha256', process.env.HMAC_SECRET).update(data).digest('hex');

// Chemin pour écrire les QR Codes dans le dossier uploads du service principal (backend gateway)
const getQRUploadPath = (filename) => {
  const gatewayQRPath = path.join(__dirname, '../../backend/uploads/qrcodes');
  ensureDir(gatewayQRPath);
  return path.join(gatewayQRPath, filename);
};

// @desc  POST /api/tickets
// @access Client (passé via gateway headers)
exports.acheterTicket = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { prix } = req.body;
    if (!prix) return res.status(400).json({ success: false, message: 'Le prix est requis.' });
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié.' });

    const ticketId = crypto.randomUUID();
    const signature = generateHMAC(ticketId);
    const qrData = JSON.stringify({ id: ticketId, sig: signature });

    const qrFilename = `qr-${ticketId}.png`;
    const fullPath = getQRUploadPath(qrFilename);
    await QRCode.toFile(fullPath, qrData, { width: 300, errorCorrectionLevel: 'H' });

    const ticket = await Ticket.create({
      id: ticketId,
      utilisateur: userId,
      type: 'simple',
      qrCode: `/uploads/qrcodes/${qrFilename}`,
      qrCodeData: qrData,
      signature,
      prix: parseFloat(prix),
      voyagesInitiaux: 1,
      voyagesRestants: 1,
      statut: 'valide',
    });

    await recordAudit({
      action: 'TICKET_CREE',
      ressourceType: 'ticket',
      ressourceId: ticketId,
      statut: 'succes',
      details: { type: 'simple', prix: parseFloat(prix) },
      req,
    });

    logger.info(`Ticket créé pour client ${userId}`, { ticketId });

    // Mongoose-like structure response for frontend compatibility
    res.status(201).json({ success: true, data: { ...ticket.toJSON(), _id: ticket.id } });
  } catch (err) {
    logger.error('Erreur achat ticket', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  POST /api/tickets/agent
// @access Agent (passé via gateway headers) - création de ticket sans compte client
exports.creerTicketAgent = async (req, res) => {
  try {
    const agentId = req.headers['x-user-id'];
    const { prix } = req.body;
    if (!prix) return res.status(400).json({ success: false, message: 'Le prix est requis.' });
    if (!agentId) return res.status(401).json({ success: false, message: 'Non authentifié.' });

    const ticketId = crypto.randomUUID();
    const signature = generateHMAC(ticketId);
    const qrData = JSON.stringify({ id: ticketId, sig: signature });

    const qrFilename = `qr-${ticketId}.png`;
    const fullPath = getQRUploadPath(qrFilename);
    await QRCode.toFile(fullPath, qrData, { width: 300, errorCorrectionLevel: 'H' });

    const ticket = await Ticket.create({
      id: ticketId,
      utilisateur: `anonymous_${agentId}`, // Ticket anonyme marqué avec l'ID de l'agent
      type: 'simple',
      qrCode: `/uploads/qrcodes/${qrFilename}`,
      qrCodeData: qrData,
      signature,
      prix: parseFloat(prix),
      voyagesInitiaux: 1,
      voyagesRestants: 1,
      statut: 'valide',
    });

    await recordAudit({
      action: 'TICKET_CREE_GUICHET',
      ressourceType: 'ticket',
      ressourceId: ticketId,
      statut: 'succes',
      details: { type: 'simple', prix: parseFloat(prix), agentId },
      req,
    });

    logger.info(`Ticket guichet créé par agent ${agentId}`, { ticketId });

    // Mongoose-like structure response for frontend compatibility
    res.status(201).json({ success: true, data: { ...ticket.toJSON(), _id: ticket.id } });
  } catch (err) {
    logger.error('Erreur création ticket agent', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  PATCH /api/tickets/:id/statut
// @access Admin - Activer / Suspendre / Annuler un titre de transport
exports.changerStatutTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const statutsValides = ['valide', 'suspendu', 'annule'];
    if (!statut || !statutsValides.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: `Statut invalide. Valeurs permises : ${statutsValides.join(', ')}`,
      });
    }

    const ticket = await Ticket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket introuvable.' });
    }

    const ancienStatut = ticket.statut;
    ticket.statut = statut;
    await ticket.save();

    const action = statut === 'valide' 
      ? 'TICKET_ACTIVE' 
      : (statut === 'suspendu' ? 'TICKET_SUSPENDU' : 'TICKET_ANNULE');

    await recordAudit({
      action,
      ressourceType: 'ticket',
      ressourceId: id,
      statut: 'succes',
      details: { ancienStatut, nouveauStatut: statut },
      req,
    });

    logger.info(`Statut ticket ${id} modifié : ${ancienStatut} -> ${statut}`);

    res.json({
      success: true,
      message: `Statut du titre de transport mis à jour avec succès : ${statut}`,
      data: { ...ticket.toJSON(), _id: ticket.id },
    });
  } catch (err) {
    logger.error('Erreur changement statut ticket', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  GET /api/tickets/mes-tickets
// @access Client (passé via gateway headers)
exports.mesTickets = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié.' });

    const tickets = await Ticket.findAll({
      where: { utilisateur: userId },
      order: [['createdAt', 'DESC']],
    });

    const formatted = tickets.map(t => ({ ...t.toJSON(), _id: t.id }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  GET /api/tickets
// @access Admin (passé via gateway headers)
exports.tousTickets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.statut) where.statut = req.query.statut;
    if (req.query.type) where.type = req.query.type;

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
        { id: { [Op.like]: `%${req.query.search}%` } },
        { utilisateur: { [Op.like]: `%${req.query.search}%` } },
      ];
    }

    const { count, rows } = await Ticket.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const formatted = rows.map(t => ({ ...t.toJSON(), _id: t.id }));

    res.json({
      success: true,
      data: formatted,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  GET /api/tickets/stats
// @access Admin (passé via gateway headers)
exports.statsTickets = async (req, res) => {
  try {
    const stats = { valide: 0, utilise: 0, expire: 0, annule: 0, suspendu: 0, total: 0 };
    
    const rows = await Ticket.findAll({
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
