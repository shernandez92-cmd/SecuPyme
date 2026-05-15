const mongoose = require('mongoose');

const chatGeneralSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
empresaId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Usuario'
},
  texto: {
    type: String,
    required: true
  },
  reporteRelacionado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reporte',
    default: null
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null
  }
});

module.exports = mongoose.model('ChatGeneral', chatGeneralSchema);
