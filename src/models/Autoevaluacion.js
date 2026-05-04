const mongoose = require('mongoose');

const autoevaluacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  respuestas: {
    contraseñasSeguras: { type: Boolean, required: true },
    dobleAutenticacion: { type: Boolean, required: true },
    equiposActualizados: { type: Boolean, required: true },
    softwareLicenciado: { type: Boolean, required: true },
    copiasSeguridad: { type: Boolean, required: true },
    copiasEnLugarSeguro: { type: Boolean, required: true },
    capacitacionEmpleados: { type: Boolean, required: true },
    identificaPhishing: { type: Boolean, required: true },
    firewallActivo: { type: Boolean, required: true },
    redProtegida: { type: Boolean, required: true }
  },
  puntaje: {
    type: Number,
    required: true
  },
  nivelRiesgo: {
    type: String,
    enum: ['bajo', 'medio', 'alto'],
    required: true
  },
  recomendaciones: [{
    type: String
  }],
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Autoevaluacion', autoevaluacionSchema);