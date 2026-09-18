const User = require('../models/User');
const { sendActivationEmail } = require('../services/emailService');

// ─── Helpers ────────────────────────────────────────────────────────────────

const buildFilter = (query) => {
  const filter = {};
  if (query.role)   filter.role   = query.role;
  if (query.statut) filter.statut = query.statut;
  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [
      { email: regex },
      { telephone: regex },
      { _id: query.search.match(/^[a-f\d]{24}$/i) ? query.search : undefined },
    ].filter(c => Object.values(c)[0] !== undefined);
  }
  return filter;
};

// ─── Helper : message d'erreur de clé dupliquée MongoDB ────────────────────
const parseDuplicateKeyError = (err) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    if (field === 'email')     return 'Un compte avec cet email existe déjà.';
    if (field === 'telephone') return 'Ce numéro de téléphone est déjà utilisé par un autre compte.';
    return 'Une valeur dupliquée a été détectée.';
  }
  return null;
};

// ─── Lister les utilisateurs ─────────────────────────────────────────────────

// @desc  GET /api/users?role=&statut=&search=&page=&limit=
exports.getUsers = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const filter = buildFilter(req.query);

    const [users, total] = await Promise.all([
      User.find(filter).select('-motDePasse').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Statistiques ─────────────────────────────────────────────────────────────

// @desc  GET /api/users/stats
exports.getStats = async (req, res) => {
  try {
    const [admins, agents, clients] = await Promise.all([
      User.aggregate([
        { $match: { role: 'admin' } },
        { $group: { _id: '$statut', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { role: 'agent' } },
        { $group: { _id: '$statut', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { role: 'client' } },
        { $group: { _id: '$statut', count: { $sum: 1 } } },
      ]),
    ]);

    const toMap = (arr) => {
      const m = { actif: 0, bloque: 0, supprime: 0, inactif: 0, total: 0 };
      arr.forEach(({ _id, count }) => { m[_id] = count; m.total += count; });
      return m;
    };

    const a = toMap(admins);
    const ag = toMap(agents);
    const cl = toMap(clients);

    res.json({
      success: true,
      data: {
        admins: a,
        agents: ag,
        clients: cl,
        global: {
          total:    a.total + ag.total + cl.total,
          actif:    a.actif  + ag.actif  + cl.actif,
          bloque:   a.bloque + ag.bloque + cl.bloque,
          supprime: a.supprime + ag.supprime + cl.supprime,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Créer un utilisateur ─────────────────────────────────────────────────────

// @desc  POST /api/users
exports.createUser = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, role } = req.body;

    if (!nom || !prenom || !email || !role) {
      return res.status(400).json({ success: false, message: 'Champs requis : nom, prénom, email, rôle.' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      if (exists.statut === 'supprime') {
        // Si l'ancien compte était en statut supprimé, on le retire pour permettre la recréation
        await User.findByIdAndDelete(exists._id);
      } else {
        return res.status(409).json({ success: false, message: 'Un compte avec cet email existe déjà.' });
      }
    }

    // Mot de passe temporaire par défaut
    const tempPwd = User.generateTempPassword();
    const user = await User.create({
      nom, prenom, email, telephone, role,
      motDePasse: tempPwd,
      statut: 'actif',
      premiereConnexion: true,
      motDePasseTemporaire: true,
    });

    // Envoyer l'email avec les identifiants
    try {
      await sendActivationEmail({
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        motDePasseTemp: tempPwd,
      });
      console.log(`[Email] Email d'identifiants envoyé avec succès à ${user.email}`);
      console.log(`[AUTH_TEST] Compte créé : ${user.email} | Mot de passe temporaire : ${tempPwd}`);
    } catch (emailErr) {
      console.error(`[Email] Erreur envoi email création:`, emailErr.message);
    }

    const { motDePasse, ...userData } = user.toObject();

    res.status(201).json({ success: true, data: userData });
  } catch (err) {
    const dupMsg = parseDuplicateKeyError(err);
    if (dupMsg) return res.status(409).json({ success: false, message: dupMsg });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Obtenir un utilisateur ───────────────────────────────────────────────────

// @desc  GET /api/users/:id
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-motDePasse');
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Modifier un utilisateur ──────────────────────────────────────────────────

// @desc  PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { nom, prenom, telephone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { nom, prenom, telephone },
      { new: true, runValidators: true }
    ).select('-motDePasse');

    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    res.json({ success: true, data: user });
  } catch (err) {
    const dupMsg = parseDuplicateKeyError(err);
    if (dupMsg) return res.status(409).json({ success: false, message: dupMsg });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Changer le statut d'un utilisateur ──────────────────────────────────────

// @desc  PATCH /api/users/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { statut } = req.body;
    if (!['actif', 'bloque', 'supprime'].includes(statut)) {
      return res.status(400).json({ success: false, message: 'Statut invalide.' });
    }

    if (statut === 'supprime') {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { statut: 'supprime' },
        { new: true }
      ).select('-motDePasse');

      if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
      return res.json({ success: true, data: user, message: 'Utilisateur marqué comme supprimé.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { statut },
      { new: true }
    ).select('-motDePasse');

    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    res.json({ success: true, data: user, message: `Statut mis à jour : ${statut}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Actions groupées ─────────────────────────────────────────────────────────

// @desc  PATCH /api/users/bulk-action
exports.bulkAction = async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: 'Aucun ID fourni.' });

    if (action === 'supprimer') {
      const result = await User.updateMany({ _id: { $in: ids } }, { statut: 'supprime' });
      return res.json({ success: true, message: `${result.modifiedCount} utilisateur(s) marqué(s) comme supprimé(s).` });
    }

    let statut;
    if (action === 'activer')   statut = 'actif';
    if (action === 'bloquer')   statut = 'bloque';

    if (!statut) return res.status(400).json({ success: false, message: 'Action invalide.' });

    const result = await User.updateMany({ _id: { $in: ids } }, { statut });
    res.json({ success: true, message: `${result.modifiedCount} utilisateur(s) mis à jour.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Activation d'un compte ───────────────────────────────────────────────────

// @desc  PATCH /api/users/:id/activate
exports.activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    if (user.statut === 'actif') {
      return res.status(400).json({ success: false, message: 'Ce compte est déjà actif.' });
    }

    // Générer mot de passe temporaire
    const tempPwd = User.generateTempPassword();
    user.motDePasse = tempPwd;
    user.statut = 'actif';
    user.premiereConnexion = true;
    user.motDePasseTemporaire = true;
    await user.save();

    // Envoyer l'email
    try {
      await sendActivationEmail({
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        motDePasseTemp: tempPwd,
      });
    } catch (emailErr) {
      console.error('Erreur envoi email:', emailErr.message);
      // On ne bloque pas l'activation si l'email échoue
    }

    res.json({ success: true, message: `Compte de ${user.prenom} ${user.nom} activé avec succès.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Activation groupée ───────────────────────────────────────────────────────

// @desc  POST /api/users/activate-bulk
exports.activateBulk = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: 'Aucun ID fourni.' });

    const users = await User.find({ _id: { $in: ids }, statut: { $ne: 'actif' } });

    const results = await Promise.allSettled(
      users.map(async (user) => {
        const tempPwd = User.generateTempPassword();
        user.motDePasse = tempPwd;
        user.statut = 'actif';
        user.premiereConnexion = true;
        user.motDePasseTemporaire = true;
        await user.save();

        try {
          await sendActivationEmail({
            nom: user.nom, prenom: user.prenom,
            email: user.email, role: user.role,
            motDePasseTemp: tempPwd,
          });
        } catch (_) {}

        return user.email;
      })
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    res.json({ success: true, message: `${success} compte(s) activé(s) sur ${users.length}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Import CSV ───────────────────────────────────────────────────────────────

// @desc  POST /api/users/import-csv
exports.importCSV = async (req, res) => {
  try {
    const { users: rows, role } = req.body; // rows = tableau parsé côté frontend

    if (!rows?.length) return res.status(400).json({ success: false, message: 'Aucune donnée à importer.' });
    if (!role) return res.status(400).json({ success: false, message: 'Rôle requis.' });

    const successes = [];
    const errors    = [];

    for (const [i, row] of rows.entries()) {
      try {
        const { nom, prenom, email, telephone } = row;
        if (!nom || !prenom || !email) {
          errors.push({ ligne: i + 2, email: email || '—', raison: 'Champs obligatoires manquants (nom, prénom, email)' });
          continue;
        }

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
          errors.push({ ligne: i + 2, email, raison: 'Email déjà utilisé' });
          continue;
        }

        const tempPwd = User.generateTempPassword();
        await User.create({ nom, prenom, email: email.toLowerCase(), telephone, role, motDePasse: tempPwd, statut: 'inactif' });
        successes.push(email);
      } catch (e) {
        errors.push({ ligne: i + 2, email: row.email || '—', raison: e.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Import terminé : ${successes.length} créé(s), ${errors.length} erreur(s).`,
      data: { successes: successes.length, errors },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Modifier le profil de l'utilisateur connecté ─────────────────────────────

// @desc  PUT /api/users/me/profile
exports.updateProfile = async (req, res) => {
  try {
    const { nom, prenom, telephone } = req.body;
    const updates = { nom, prenom, telephone };

    // Si une photo a été téléversée
    if (req.file) {
      // Supprimer l'ancienne photo si elle existe
      const current = await User.findById(req.user._id).select('photo');
      if (current?.photo) {
        const oldPath = current.photo.replace('/uploads/', 'uploads/');
        const fs = require('fs');
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.photo = `/uploads/${req.file.path.replace(/\\/g, '/').replace(/^.*uploads\//, 'profiles/')}`;
      updates.photo = `/uploads/${req.file.filename ? `profiles/${req.file.filename}` : req.file.path.replace(/\\/g, '/')}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-motDePasse');

    res.json({ success: true, data: user });
  } catch (err) {
    const dupMsg = parseDuplicateKeyError(err);
    if (dupMsg) return res.status(409).json({ success: false, message: dupMsg });
    res.status(500).json({ success: false, message: err.message });
  }
};
