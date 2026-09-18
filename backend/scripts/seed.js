const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI n\'est pas défini dans le fichier .env');
    }

    console.log('⏳ Connexion à MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB.');

    // 1. Nettoyer la collection des utilisateurs existante
    console.log('🗑️ Nettoyage de la base de données (collection Users)...');
    await User.deleteMany({});

    // 2. Création de l'Administrateur initial
    console.log('👤 Création de l\'Administrateur...');
    const adminNom = process.env.ADMIN_NOM || 'Diallo';
    const adminPrenom = process.env.ADMIN_PRENOM || 'Mamadou';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@billetterie.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminPhone = process.env.ADMIN_TELEPHONE || '+221771234567';

    const admin = await User.create({
      nom: adminNom,
      prenom: adminPrenom,
      email: adminEmail,
      telephone: adminPhone,
      role: 'admin',
      motDePasse: adminPassword,
      statut: 'actif',
      premiereConnexion: false,
      motDePasseTemporaire: false
    });
    console.log(`✅ Administrateur créé : ${admin.email} / ${adminPassword}`);

    // 3. Création de l'Agent initial
    console.log('👤 Création de l\'Agent de contrôle...');
    const agentNom = process.env.AGENT_NOM || 'Sow';
    const agentPrenom = process.env.AGENT_PRENOM || 'Fatou';
    const agentEmail = process.env.AGENT_EMAIL || 'agent@billetterie.com';
    const agentPassword = process.env.AGENT_PASSWORD || 'agent123';
    const agentPhone = process.env.AGENT_TELEPHONE || '+221777654321';

    const agent = await User.create({
      nom: agentNom,
      prenom: agentPrenom,
      email: agentEmail,
      telephone: agentPhone,
      role: 'agent',
      motDePasse: agentPassword,
      statut: 'actif',
      premiereConnexion: false,
      motDePasseTemporaire: false
    });
    console.log(`✅ Agent de contrôle créé : ${agent.email} / ${agentPassword}`);

    // 4. Création du Client initial
    console.log('👤 Création du Client...');
    const clientNom = process.env.CLIENT_NOM || 'Ndiaye';
    const clientPrenom = process.env.CLIENT_PRENOM || 'Abdou';
    const clientEmail = process.env.CLIENT_EMAIL || 'client@billetterie.com';
    const clientPassword = process.env.CLIENT_PASSWORD || 'client123';
    const clientPhone = process.env.CLIENT_TELEPHONE || '+221789998877';

    const client = await User.create({
      nom: clientNom,
      prenom: clientPrenom,
      email: clientEmail,
      telephone: clientPhone,
      role: 'client',
      motDePasse: clientPassword,
      statut: 'actif',
      premiereConnexion: false,
      motDePasseTemporaire: false
    });
    console.log(`✅ Client créé : ${client.email} / ${clientPassword}`);

    console.log('\n🎉 Base de données initialisée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seeding de la base de données :', error);
    process.exit(1);
  }
};

seedDB();
