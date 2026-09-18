const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeEmail } = require('../services/emailService');

// @desc    Inscription utilisateur (Client)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { nom, prenom, email, telephone } = req.body;

    // Validation
    if (!nom || !prenom || !email) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un nom, prénom et email.',
      });
    }

    // Vérifier l'existence
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      if (userExists.statut === 'supprime') {
        await User.findByIdAndDelete(userExists._id);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà.',
        });
      }
    }

    // Génération du mot de passe par défaut
    const tempPwd = User.generateTempPassword();

    // Créer l'utilisateur (client) avec statut actif
    const user = await User.create({
      nom,
      prenom,
      email: email.toLowerCase(),
      telephone,
      motDePasse: tempPwd,
      role: 'client',
      statut: 'actif',
      premiereConnexion: true,
      motDePasseTemporaire: true,
    });

    // Envoi de l'email de bienvenue
    try {
      await sendWelcomeEmail({
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        motDePasse: tempPwd,
      });
    } catch (emailError) {
      console.error('Erreur envoi email de bienvenue:', emailError.message);
      // Ne pas bloquer l'inscription si l'email échoue
    }

    // Générer le JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        statut: user.statut,
      },
    });
  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// @desc    Connexion utilisateur
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    // Validation des champs
    if (!email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis.',
      });
    }

    const emailClean = (email || '').trim().toLowerCase();
    const motDePasseClean = (motDePasse || '').trim();

    // Chercher l'utilisateur (avec mot de passe)
    const user = await User.findOne({ email: emailClean }).select('+motDePasse');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects.',
      });
    }

    if (user.statut === 'bloque') {
      return res.status(403).json({
        success: false,
        message: 'Compte bloqué. Contactez votre administrateur.',
      });
    }

    if (user.statut === 'supprime') {
      return res.status(403).json({
        success: false,
        message: 'Ce compte n\'existe plus.',
      });
    }

    // Vérifier le mot de passe (exact ou nettoyé d'espaces)
    let isMatch = await user.comparePassword(motDePasse);
    if (!isMatch && motDePasse !== motDePasseClean) {
      isMatch = await user.comparePassword(motDePasseClean);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects.',
      });
    }

    // Activer automatiquement le client lors de sa première connexion s'il est inactif
    if (user.statut === 'inactif') {
      if (user.role === 'client') {
        user.statut = 'actif';
        await User.updateOne({ _id: user._id }, { statut: 'actif' });
      } else {
        return res.status(403).json({
          success: false,
          message: 'Compte inactif. Contactez votre administrateur.',
        });
      }
    }

    // Générer le JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Réponse
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        photo: user.photo,
        premiereConnexion: user.premiereConnexion,
        motDePasseTemporaire: user.motDePasseTemporaire,
      },
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Privé
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// @desc    Changer le mot de passe
// @route   PUT /api/auth/change-password
// @access  Privé
const changePassword = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    if (!nouveauMotDePasse) {
      return res.status(400).json({ success: false, message: 'Nouveau mot de passe requis.' });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const user = await User.findById(req.user._id).select('+motDePasse');

    // N'exiger l'ancien mot de passe que si le mot de passe actuel n'est PAS temporaire
    if (!user.motDePasseTemporaire) {
      if (!ancienMotDePasse) {
        return res.status(400).json({ success: false, message: 'Ancien mot de passe requis.' });
      }
      const isMatch = await user.comparePassword(ancienMotDePasse);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Ancien mot de passe incorrect.' });
      }
    }

    user.motDePasse = nouveauMotDePasse;
    user.premiereConnexion = false;
    user.motDePasseTemporaire = false;
    await user.save();

    res.status(200).json({ success: true, message: 'Mot de passe modifié avec succès.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

module.exports = { register, login, getMe, changePassword };
