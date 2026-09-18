const mongoose = require('mongoose');

const connectDB = async (retries = 5, delay = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 25000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`❌ Tentative ${i}/${retries} - Erreur connexion MongoDB : ${error.message}`);
      if (i === retries) {
        console.error('❌ Impossible de se connecter à MongoDB après plusieurs tentatives.');
        process.exit(1);
      }
      console.log(`⏳ Nouvelle tentative dans ${delay / 1000}s...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

module.exports = connectDB;
