const mongoose = require('mongoose');

const preguntaSchema = new mongoose.Schema({
  texto:        { type: String, required: true },
  campo:        { type: String, required: true, unique: true }, // clave usada en respuestas
  categoria:    { type: String, default: 'general' },
  peso:         { type: Number, required: true, default: 1 },  // puntos si responde SÍ
  activa:       { type: Boolean, default: true },
  orden:        { type: Number, default: 0 },
  fechaCreacion:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('Pregunta', preguntaSchema);
