const axios = require('axios');
const User = require('../models/User');

const SUBSCRIPTION_SERVICE_URL = process.env.SUBSCRIPTION_SERVICE_URL || 'https://localhost:5001';

const handleError = (err, res) => {
  if (err.response) {
    return res.status(err.response.status).json(err.response.data);
  }
  res.status(500).json({ success: false, message: err.message });
};

// @desc  GET /api/audits
// @access Admin
exports.tousAudits = async (req, res) => {
  try {
    const response = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/api/audits`, {
      params: req.query,
      headers: {
        'x-user-id': req.user._id.toString(),
        'x-user-role': req.user.role,
      },
    });

    const audits = response.data.data;
    if (audits && audits.length > 0) {
      const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
      const validUserIds = [...new Set(audits.map(a => a.utilisateurId).filter(isValidObjectId))];

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

      audits.forEach(a => {
        if (a.utilisateurId && userMap[a.utilisateurId]) {
          a.utilisateur = userMap[a.utilisateurId];
        } else {
          a.utilisateur = {
            _id: a.utilisateurId,
            nom: a.utilisateurId ? (a.utilisateurId.startsWith('anonymous') ? 'Guichet (Agent)' : 'Utilisateur') : 'Système',
            prenom: '',
            email: '-',
          };
        }
      });
    }

    res.status(response.status).json(response.data);
  } catch (err) {
    handleError(err, res);
  }
};

// @desc  GET /api/audits/stats
// @access Admin
exports.statsAudits = async (req, res) => {
  try {
    const response = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/api/audits/stats`, {
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
