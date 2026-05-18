const mongoose = require('mongoose');

const riskScoreSchema = new mongoose.Schema({
  empresaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    unique: true
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  nivel: {
    type: String,
    enum: ['normal', 'monitoreo', 'alerta', 'critico'],
    default: 'normal'
  },
  bloqueado: {
    type: Boolean,
    default: false
  },
  bloqueoHasta: {
    type: Date,
    default: null
  },
  ultimaActualizacion: {
    type: Date,
    default: Date.now
  },
  historial: [{
    evento: String,
    cambio: Number,
    fecha: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('RiskScore', riskScoreSchema);
