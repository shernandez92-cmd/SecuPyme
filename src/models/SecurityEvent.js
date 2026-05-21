const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['login_exitoso', 'login_fallido', 'nuevo_reporte', 'cambio_rol', 'bloqueo_automatico', 'alerta_siem', 'external', 'password_reset_solicitado', 'password_reset_exitoso'],
    required: true
  },
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  ip: { type: String },
  source: { type: String, enum: ['internal', 'external'], default: 'internal' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SecurityEvent', securityEventSchema);
