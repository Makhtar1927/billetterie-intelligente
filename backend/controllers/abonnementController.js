const axios = require('axios');
const User = require('../models/User');

const SUBSCRIPTION_SERVICE_URL = process.env.SUBSCRIPTION_SERVICE_URL || 'https://localhost:5001';

const handleError = (err, res) => {
  if (err.response) {
    return res.status(err.response.status).json(err.response.data);
  }
  res.status(500).json({ success: false, message: err.message });
};

// @desc  POST /api/abonnements
// @access Client
exports.souscrireAbonnement = async (req, res) => {
  try {
    const response = await axios.post(`${SUBSCRIPTION_SERVICE_URL}/api/abonnements`, req.body, {
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

// @desc  GET /api/abonnements/mes-abonnements
// @access Client
exports.mesAbonnements = async (req, res) => {
  try {
    const response = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/api/abonnements/mes-abonnements`, {
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

// @desc  GET /api/abonnements
// @access Admin
exports.tousAbonnements = async (req, res) => {
  try {
    const response = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/api/abonnements`, {
      params: req.query,
      headers: {
        'x-user-id': req.user._id.toString(),
        'x-user-role': req.user.role,
      },
    });

    const abonnements = response.data.data;
    if (abonnements && abonnements.length > 0) {
      const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
      const validUserIds = [...new Set(abonnements.map(a => a.utilisateur).filter(isValidObjectId))];
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

      abonnements.forEach(a => {
        a.utilisateur = userMap[a.utilisateur] || { _id: a.utilisateur, nom: 'Inconnu', prenom: '', email: '' };
      });
    }

    res.status(response.status).json(response.data);
  } catch (err) {
    handleError(err, res);
  }
};

// @desc  GET /api/abonnements/stats
// @access Admin
exports.statsAbonnements = async (req, res) => {
  try {
    const response = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/api/abonnements/stats`, {
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

// @desc  PATCH /api/abonnements/:id/statut
// @access Admin
exports.updateStatutAbonnement = async (req, res) => {
  try {
    const response = await axios.patch(
      `${SUBSCRIPTION_SERVICE_URL}/api/abonnements/${req.params.id}/statut`,
      req.body,
      {
        headers: {
          'x-user-id': req.user._id.toString(),
          'x-user-role': req.user.role,
        },
      }
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    handleError(err, res);
  }
};

