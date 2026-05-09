const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['login_exitoso', 'login_fallido', 'nuevo_reporte', 'cambio_rol'],
    required: true
  },
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SecurityEvent', securityEventSchema);
