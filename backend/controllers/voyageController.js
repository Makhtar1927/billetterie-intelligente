const axios = require('axios');
const User = require('../models/User');

const SUBSCRIPTION_SERVICE_URL = process.env.SUBSCRIPTION_SERVICE_URL || 'https://localhost:5001';

const handleError = (err, res) => {
  if (err.response) {
    return res.status(err.response.status).json(err.response.data);
  }
  res.status(500).json({ success: false, message: err.message });
};

// @desc  POST /api/voyages/scan
// @access Agent
exports.scanQRCode = async (req, res) => {
  try {
    const response = await axios.post(`${SUBSCRIPTION_SERVICE_URL}/api/voyages/scan`, req.body, {
      headers: {
        'x-user-id': req.user._id.toString(),
        'x-user-role': req.user.role,
      },
    });

    // Populate client profile details if the response succeeded and has a client id
    const result = response.data;
    if (result.success && result.client && result.client._id) {
      const clientUser = await User.findById(result.client._id).select('nom prenom email');
      if (clientUser) {
        result.client = {
          _id: clientUser._id,
          nom: clientUser.nom,
          prenom: clientUser.prenom,
          email: clientUser.email,
        };
      }
    }

    res.status(response.status).json(result);
  } catch (err) {
    handleError(err, res);
  }
};

// @desc  GET /api/voyages/mon-historique
// @access Client
exports.monHistorique = async (req, res) => {
  try {
    const response = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/api/voyages/mon-historique`, {
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

// @desc  GET /api/voyages
// @access Admin
exports.tousVoyages = async (req, res) => {
  try {
    const response = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/api/voyages`, {
      params: req.query,
      headers: {
        'x-user-id': req.user._id.toString(),
        'x-user-role': req.user.role,
      },
    });

    const voyages = response.data.data;
    if (voyages && voyages.length > 0) {
      const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
      const userIds = [...new Set(voyages.map(v => v.utilisateur).filter(isValidObjectId))];
      const agentIds = [...new Set(voyages.map(v => v.agent).filter(isValidObjectId))];
      const allIds = [...new Set([...userIds, ...agentIds])];

      const users = allIds.length > 0
        ? await User.find({ _id: { $in: allIds } }).select('nom prenom email')
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

      voyages.forEach(v => {
        if (v.utilisateur && String(v.utilisateur).startsWith('anonymous')) {
          v.utilisateur = { _id: v.utilisateur, nom: 'Client Anonyme (Guichet)', prenom: '', email: '-' };
        } else {
          v.utilisateur = userMap[v.utilisateur] || (v.utilisateur ? { _id: v.utilisateur, nom: 'Inconnu', prenom: '', email: '' } : null);
        }
        v.agent = userMap[v.agent] || (v.agent ? { _id: v.agent, nom: 'Inconnu', prenom: '', email: '' } : null);
      });
    }

    res.status(response.status).json(response.data);
  } catch (err) {
    handleError(err, res);
  }
};

// @desc  GET /api/voyages/stats
// @access Admin
exports.statsVoyages = async (req, res) => {
  try {
    const response = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/api/voyages/stats`, {
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
