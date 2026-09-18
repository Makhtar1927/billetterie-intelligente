const nodemailer = require('nodemailer');

// Créer le transporteur
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT) || 587;
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Email d'activation de compte avec mot de passe temporaire
const sendActivationEmail = async ({ nom, prenom, email, role, motDePasseTemp }) => {
  const transporter = createTransporter();

  const roleLabel = { admin: 'Administrateur', agent: 'Agent', client: 'Client' }[role] || role;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #0a0b14; color: #f1f5f9; margin: 0; padding: 0; }
        .container { max-width: 580px; margin: 40px auto; background: #13152a; border-radius: 16px; overflow: hidden; border: 1px solid rgba(99,102,241,0.25); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 40px 32px; text-align: center; }
        .header-icon { font-size: 48px; margin-bottom: 12px; }
        .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 18px; font-weight: 600; color: #f1f5f9; margin-bottom: 12px; }
        .text { color: #94a3b8; font-size: 14px; line-height: 1.7; margin-bottom: 20px; }
        .badge { display: inline-block; padding: 4px 12px; background: rgba(99,102,241,0.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 28px; }
        .credentials { background: #1a1d3a; border: 1px solid rgba(99,102,241,0.2); border-radius: 12px; padding: 24px; margin: 24px 0; }
        .cred-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(99,102,241,0.1); }
        .cred-row:last-child { border-bottom: none; }
        .cred-label { color: #64748b; font-size: 13px; }
        .cred-value { color: #f1f5f9; font-weight: 600; font-size: 13px; font-family: monospace; }
        .password-box { background: rgba(99,102,241,0.1); border: 2px dashed rgba(99,102,241,0.4); border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0; }
        .password-value { font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #a5b4fc; font-family: monospace; }
        .warning { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; padding: 14px 16px; margin: 20px 0; color: #fbbf24; font-size: 13px; }
        .footer { background: #0f1023; padding: 20px 40px; text-align: center; color: #475569; font-size: 12px; border-top: 1px solid rgba(99,102,241,0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-icon">🎫</div>
          <h1>Système de Billetterie Intelligente</h1>
        </div>
        <div class="body">
          <p class="greeting">Bonjour ${prenom} ${nom} 👋</p>
          <div class="badge">Rôle : ${roleLabel}</div>
          <p class="text">Votre compte vient d'être activé sur la plateforme de billetterie intelligente. Voici vos identifiants de connexion :</p>

          <div class="credentials">
            <div class="cred-row">
              <span class="cred-label">📧 Adresse email</span>
              <span class="cred-value">${email}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">🔑 Mot de passe temporaire</span>
            </div>
            <div class="password-box">
              <div class="password-value">${motDePasseTemp}</div>
            </div>
          </div>

          <div class="warning">
            ⚠️ <strong>Important :</strong> Ce mot de passe est temporaire. Vous serez invité(e) à le modifier lors de votre première connexion.
          </div>

          <p class="text">Pour des raisons de sécurité, ne partagez jamais vos identifiants avec d'autres personnes.</p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Système de Billetterie Intelligente — CCAK L3<br>
          Ce message est généré automatiquement, merci de ne pas y répondre.
        </div>
      </div>
    </body>
    </html>
  `;

  const plainText = `Bonjour ${prenom} ${nom},\n\nVotre compte (${roleLabel}) a été créé sur la plateforme de billetterie intelligente.\n\nVos identifiants de connexion :\n- Email : ${email}\n- Mot de passe temporaire : ${motDePasseTemp}\n\nImportant : Ce mot de passe est temporaire. Vous serez invité(e) à le modifier lors de votre première connexion.\n\nCordialement,\nL'équipe Billetterie Intelligente`;

  await transporter.sendMail({
    from: `"Billetterie Intelligente" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Activation de votre compte — Billetterie Intelligente',
    text: plainText,
    html,
  });
};

// Email de bienvenue après inscription (client)
const sendWelcomeEmail = async ({ nom, prenom, email, motDePasse }) => {
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #0a0b14; color: #f1f5f9; margin: 0; padding: 0; }
        .container { max-width: 580px; margin: 40px auto; background: #13152a; border-radius: 16px; overflow: hidden; border: 1px solid rgba(99,102,241,0.25); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 40px 32px; text-align: center; }
        .header-icon { font-size: 48px; margin-bottom: 12px; }
        .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 18px; font-weight: 600; color: #f1f5f9; margin-bottom: 12px; }
        .text { color: #94a3b8; font-size: 14px; line-height: 1.7; margin-bottom: 20px; }
        .credentials { background: #1a1d3a; border: 1px solid rgba(99,102,241,0.2); border-radius: 12px; padding: 24px; margin: 24px 0; }
        .cred-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(99,102,241,0.1); }
        .cred-row:last-child { border-bottom: none; }
        .cred-label { color: #64748b; font-size: 13px; }
        .cred-value { color: #f1f5f9; font-weight: 600; font-size: 13px; font-family: monospace; }
        .password-box { background: rgba(99,102,241,0.1); border: 2px dashed rgba(99,102,241,0.4); border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0; }
        .password-value { font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #a5b4fc; font-family: monospace; }
        .warning { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; padding: 14px 16px; margin: 20px 0; color: #fbbf24; font-size: 13px; }
        .footer { background: #0f1023; padding: 20px 40px; text-align: center; color: #475569; font-size: 12px; border-top: 1px solid rgba(99,102,241,0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-icon">🎫</div>
          <h1>Système de Billetterie Intelligente</h1>
        </div>
        <div class="body">
          <p class="greeting">Bienvenue ${prenom} ${nom} 🎉</p>
          <p class="text">Nous sommes ravis de vous compter parmi nous. Votre inscription a été effectuée avec succès sur la plateforme de billetterie intelligente.</p>
          <p class="text">Voici vos identifiants de connexion par défaut générés automatiquement :</p>
          
          <div class="credentials">
            <div class="cred-row">
              <span class="cred-label">📧 Adresse email (Nom d'utilisateur)</span>
              <span class="cred-value">${email}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">🔑 Mot de passe par défaut</span>
            </div>
            <div class="password-box">
              <div class="password-value">${motDePasse}</div>
            </div>
          </div>

          <div class="warning">
            ⚠️ <strong>Important :</strong> Ce mot de passe est temporaire. Vous serez invité(e) à le modifier lors de votre première connexion pour des raisons de sécurité.
          </div>

        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Système de Billetterie Intelligente — CCAK L3<br>
          Ce message est généré automatiquement, merci de ne pas y répondre.
        </div>
      </div>
    </body>
    </html>
  `;

  const plainText = `Bienvenue ${prenom} ${nom} !\n\nVotre inscription a été effectuée avec succès sur la plateforme de billetterie intelligente.\n\nVos identifiants de connexion :\n- Email : ${email}\n- Mot de passe temporaire : ${motDePasse}\n\nImportant : Ce mot de passe est temporaire. Vous serez invité(e) à le modifier lors de votre première connexion.\n\nCordialement,\nL'équipe Billetterie Intelligente`;

  await transporter.sendMail({
    from: `"Billetterie Intelligente" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Bienvenue sur Billetterie Intelligente !',
    text: plainText,
    html,
  });
};

module.exports = { sendActivationEmail, sendWelcomeEmail };
