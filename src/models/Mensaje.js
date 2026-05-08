const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
  reporte: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reporte',
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  texto: {
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Mensaje', mensajeSchema);
