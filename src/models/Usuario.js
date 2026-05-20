const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  rol: { type: String, enum: ['cliente', 'admin'], default: 'cliente' },
  empresa: { type: String, required: true },
  plan: { type: String, enum: ['free', 'basico', 'premium'], default: 'free' },
  twoFactorSecret: { type: String, default: null },
  twoFactorEnabled: { type: Boolean, default: false },
  backupCodes: [{
    code: { type: String },
    used: { type: Boolean, default: false }
  }],
  fechaRegistro: { type: Date, default: Date.now },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  ipsMonitoreadas: { type: [String], default: [] }
});

module.exports = mongoose.model('Usuario', usuarioSchema);
