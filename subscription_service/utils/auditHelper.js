const AuditLog = require('../models/AuditLog');

const recordAudit = async ({
  utilisateurId = null,
  utilisateurRole = null,
  action,
  ressourceType,
  ressourceId = null,
  statut = 'succes',
  details = null,
  req = null,
}) => {
  try {
    let ip = null;
    let ua = null;

    if (req) {
      ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
      ua = req.headers['user-agent'] || null;
      if (!utilisateurId) utilisateurId = req.headers['x-user-id'] || null;
      if (!utilisateurRole) utilisateurRole = req.headers['x-user-role'] || null;
    }

    const detailsStr = typeof details === 'object' && details !== null 
      ? JSON.stringify(details) 
      : (details ? String(details) : null);

    return await AuditLog.create({
      utilisateurId: utilisateurId ? String(utilisateurId) : null,
      utilisateurRole: utilisateurRole ? String(utilisateurRole) : null,
      action,
      ressourceType,
      ressourceId: ressourceId ? String(ressourceId) : null,
      statut,
      details: detailsStr,
      adresseIP: ip ? String(ip).slice(0, 45) : null,
      userAgent: ua ? String(ua).slice(0, 255) : null,
    });
  } catch (err) {
    console.error('[Audit] Erreur lors de l\'enregistrement de l\'audit :', err.message);
    return null;
  }
};

module.exports = { recordAudit };
