const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
    },
    prenom: {
      type: String,
      required: [true, 'Le prénom est requis'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
    },
    telephone: {
      type: String,
      trim: true,
      unique: true,  // Numéro de téléphone unique
      sparse: true,  // Autorise plusieurs utilisateurs sans téléphone (null)
    },
    role: {
      type: String,
      enum: ['admin', 'agent', 'client'],
      default: 'client',
    },
    photo: {
      type: String,
      default: null,
    },
    motDePasse: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: 6,
      select: false,
    },
    statut: {
      type: String,
      enum: ['actif', 'bloque', 'supprime', 'inactif'],
      default: 'inactif',
    },
    premiereConnexion: {
      type: Boolean,
      default: true,
    },
    motDePasseTemporaire: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function () {
  if (!this.isModified('motDePasse')) return;
  const salt = await bcrypt.genSalt(12);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.motDePasse);
};

// Générer un mot de passe temporaire robuste et aléatoire
userSchema.statics.generateTempPassword = function () {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const specials = '!@#$%&*';
  const all = uppers + lowers + numbers + specials;

  const pwd = [
    uppers[Math.floor(Math.random() * uppers.length)],
    lowers[Math.floor(Math.random() * lowers.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    specials[Math.floor(Math.random() * specials.length)],
  ];

  for (let i = 4; i < 10; i++) {
    pwd.push(all[Math.floor(Math.random() * all.length)]);
  }

  return pwd.sort(() => Math.random() - 0.5).join('');
};

module.exports = mongoose.model('User', userSchema);
