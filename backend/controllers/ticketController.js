const axios = require('axios');
const User = require('../models/User');

const SUBSCRIPTION_SERVICE_URL = process.env.SUBSCRIPTION_SERVICE_URL || 'https://localhost:5001';

// Helper pour propager les erreurs d'Axios ou renvoyer un statut 500 générique
const handleError = (err, res) => {
  if (err.response) {
    return res.status(err.response.status).json(err.response.data);
  }
  res.status(500).json({ success: false, message: err.message });
};

// @desc  POST /api/tickets
// @access Client
exports.acheterTicket = async (req, res) => {
  try {
    const response = await axios.post(`${SUBSCRIPTION_SERVICE_URL}/api/tickets`, req.body, {
      headers: {
        'x-user-id': req.user._id.toString(),
        'x-user-role': req.user.role,
      },
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    handleError(err, res);
  }
};

// @desc  POST /api/tickets/agent
// @access Agent - création de ticket sans compte client
exports.creerTicketAgent = async (req, res) => {
  try {
    const response = await axios.post(`${SUBSCRIPTION_SERVICE_URL}/api/tickets/agent`, req.body, {
      headers: {
        'x-user-id': req.user._id.toString(),
        'x-user-role': req.user.role,
      },
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    handleError(err, res);
  }
};

// @desc  GET /api/tickets/mes-tickets
// @access Client
exports.mesTickets = async (req, res) => {
  try {
    const response = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/api/tickets/mes-tickets`, {
      headers: {
        'x-user-id': req.user._id.toString(),
        'x-user-role': req.user.role,
      },
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    handleError(err, res);
  }
};

// @desc  GET /api/tickets
// @access Admin
exports.tousTickets = async (req, res) => {
  try {
    const response = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/api/tickets`, {
      params: req.query,
      headers: {
        'x-user-id': req.user._id.toString(),
        'x-user-role': req.user.role,
      },
    });

    const tickets = response.data.data;
    if (tickets && tickets.length > 0) {
      // Filtrer uniquement les IDs MongoDB valides (24 caractères hexadécimaux)
      const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
      const validUserIds = [...new Set(tickets.map(t => t.utilisateur).filter(isValidObjectId))];
      
      // Chercher les profils correspondants dans MongoDB
      const users = validUserIds.length > 0
        ? await User.find({ _id: { $in: validUserIds } }).select('nom prenom email')
        : [];

      const userMap = users.reduce((acc, user) => {
        acc[user._id.toString()] = {
          _id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
        };
        return acc;
      }, {});

      // Injecter les données d'utilisateurs dans la réponse
      tickets.forEach(t => {
        if (t.utilisateur && String(t.utilisateur).startsWith('anonymous')) {
          t.utilisateur = { _id: t.utilisateur, nom: 'Client Anonyme (Guichet)', prenom: '', email: '-' };
        } else {
          t.utilisateur = userMap[t.utilisateur] || { _id: t.utilisateur, nom: 'Inconnu', prenom: '', email: '' };
        }
      });
    }

    res.status(response.status).json(response.data);
  } catch (err) {
    handleError(err, res);
  }
};

// @desc  PATCH /api/tickets/:id/statut
// @access Admin
exports.changerStatutTicket = async (req, res) => {
  try {
    const response = await axios.patch(`${SUBSCRIPTION_SERVICE_URL}/api/tickets/${req.params.id}/statut`, req.body, {
      headers: {
        'x-user-id': req.user._id.toString(),
        'x-user-role': req.user.role,
        'x-forwarded-for': req.ip,
        'user-agent': req.headers['user-agent'],
      },
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    handleError(err, res);
  }
};

// @desc  GET /api/tickets/stats
// @access Admin
exports.statsTickets = async (req, res) => {
  try {
    const response = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/api/tickets/stats`, {
      headers: {
        'x-user-id': req.user._id.toString(),
        'x-user-role': req.user.role,
      },
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    handleError(err, res);
  }
};

