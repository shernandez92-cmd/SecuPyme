const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  adminNombre:  { type: String },
  accion:       { type: String, required: true }, // cambio_plan | cambio_rol | eliminar_usuario | bloqueo_manual | desbloqueo_manual
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  targetNombre: { type: String },
  detalle:      { type: String },
  timestamp:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
