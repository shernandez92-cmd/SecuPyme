const mongoose = require('mongoose');

const reporteSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  empresa: {
    type: String,
    required: true
  },
  tipoVulnerabilidad: {
    type: String,
    enum: ['phishing', 'malware', 'acceso no autorizado', 'fuga de datos', 'otro'],
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  estado: {
    type: String,
    enum: ['abierto', 'en proceso', 'resuelto'],
    default: 'abierto'
  },
prioridad: {
  type: String,
  enum: ['alta', 'media', 'baja'],
  default: 'media'
},
notasAdmin: {
  type: String,
  default: ''
},
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reporte', reporteSchema);
