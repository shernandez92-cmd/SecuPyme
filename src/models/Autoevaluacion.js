const mongoose = require('mongoose');

const autoevaluacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  respuestas: { type: Map, of: mongoose.Schema.Types.Mixed, required: true },
  puntaje: { type: Number, required: true },
  nivelRiesgo: { type: String, enum: ['bajo', 'medio', 'alto'], required: true },
  recomendaciones: [{ type: String }],
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Autoevaluacion', autoevaluacionSchema);
