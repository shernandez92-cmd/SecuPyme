const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // ==== CAMPOS PRINCIPALES ====
  
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  
  empresaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  
  // ==== METADATA DE ACTIVIDAD ====
  
  ultimoMensaje: {
    type: String,
    default: null,
    trim: true
  },
  
  ultimaActividad: {
    type: Date,
    default: Date.now
  }
  
}, {
  // ==== TIMESTAMPS AUTOMÁTICOS ====
  timestamps: true  // Crea createdAt y updatedAt automáticamente
});

// ==== ÍNDICES ====

// Único en (adminId, empresaId)
conversationSchema.index({ adminId: 1, empresaId: 1 }, { unique: true });

// Para queries rápidas por adminId
conversationSchema.index({ adminId: 1 });

// Para queries rápidas por empresaId
conversationSchema.index({ empresaId: 1 });

// Para ordenar por actividad reciente
conversationSchema.index({ ultimaActividad: -1 });

// ==== VALIDACIÓN PRE-SAVE ====

conversationSchema.pre('save', function(next) {
  if (this.adminId.toString() === this.empresaId.toString()) {
    return next(new Error('Un admin no puede tener conversación consigo mismo'));
  }
  next();
});

// ==== EXPORTAR ====

module.exports = mongoose.model('Conversation', conversationSchema);
