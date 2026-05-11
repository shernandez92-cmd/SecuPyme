const ChatGeneral = require('../models/ChatGeneral');
const Reporte = require('../models/Reporte');
const { sendErrorResponse, asyncHandler } = require('../utils/errorHandler');
const validators = require('../utils/validators');

/**
 * Send a chat message with input validation
 */
const enviarMensaje = asyncHandler(async (req, res) => {
  const { texto, reporteRelacionado } = req.body;

  // Validate required fields
  if (!texto || typeof texto !== 'string') {
    return sendErrorResponse(res, 400, 'Texto del mensaje requerido', 'MISSING_TEXT');
  }

  // Validate message length
  if (!validators.isValidLength(texto, 1, 5000)) {
    return sendErrorResponse(res, 400, 'Mensaje debe tener entre 1 y 5000 caracteres', 'INVALID_LENGTH');
  }

  // Validate reporteRelacionado ID if provided
  if (reporteRelacionado && !validators.isValidMongoID(reporteRelacionado)) {
    return sendErrorResponse(res, 400, 'ID de reporte relacionado inválido', 'INVALID_REPORT_ID');
  }

  try {
    // Verify report exists and user has access
    if (reporteRelacionado) {
      const reporte = await Reporte.findById(reporteRelacionado);
      if (!reporte) {
        return sendErrorResponse(res, 404, 'Reporte no encontrado', 'REPORT_NOT_FOUND');
      }

      // User can only link to their own reports or admin can link to any
      const isOwner = reporte.usuario.toString() === req.usuario.id.toString();
      if (req.usuario.rol !== 'admin' && !isOwner) {
        return sendErrorResponse(res, 403, 'No tienes acceso a este reporte', 'UNAUTHORIZED');
      }
    }

    const mensaje = new ChatGeneral({
      usuario: req.usuario.id,
      texto: validators.sanitizeString(texto),
      reporteRelacionado: reporteRelacionado || null
    });

    await mensaje.save();

    const populado = await ChatGeneral.findById(mensaje._id)
      .populate('usuario', 'nombre rol email')
      .populate('reporteRelacionado', 'empresa tipoVulnerabilidad');

    res.status(201).json({
      mensaje: 'Mensaje enviado exitosamente',
      data: populado
    });
  } catch (error) {
    console.error('Error sending message:', error.message);
    sendErrorResponse(res, 500, 'Error al enviar mensaje', 'SEND_ERROR');
  }
});

/**
 * Get all messages (admin) or user's messages
 */
const obtenerMensajes = asyncHandler(async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);

    let mensajes;

    if (rol === 'admin') {
      mensajes = await ChatGeneral.find()
        .populate('usuario', 'nombre rol empresa email')
        .populate('reporteRelacionado', 'empresa tipoVulnerabilidad')
        .sort({ fecha: -1 })
        .limit(limit)
        .lean();
    } else {
      mensajes = await ChatGeneral.find({ usuario: usuarioId })
        .populate('usuario', 'nombre rol empresa')
        .populate('reporteRelacionado', 'empresa tipoVulnerabilidad')
        .sort({ fecha: -1 })
        .limit(limit)
        .lean();
    }

    res.json({
      total: mensajes.length,
      mensajes
    });
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    sendErrorResponse(res, 500, 'Error al obtener mensajes', 'FETCH_ERROR');
  }
});

/**
 * Get reports for user
 */
const obtenerReportesUsuario = asyncHandler(async (req, res) => {
  try {
    const rol = req.usuario.rol;
    const usuarioId = req.usuario.id;
    let reportes;

    if (rol === 'admin') {
      reportes = await Reporte.find()
        .populate('usuario', 'nombre empresa')
        .lean();
    } else {
      reportes = await Reporte.find({ usuario: usuarioId })
        .lean();
    }

    res.json({
      total: reportes.length,
      reportes
    });
  } catch (error) {
    console.error('Error fetching reports:', error.message);
    sendErrorResponse(res, 500, 'Error al obtener reportes', 'FETCH_ERROR');
  }
});

/**
 * Delete chat messages (admin: all, user: their own)
 */
const borrarChat = asyncHandler(async (req, res) => {
  try {
    const rol = req.usuario.rol;
    const usuarioId = req.usuario.id;

    let result;

    if (rol === 'admin') {
      // Confirm deletion from query param to prevent accidental deletes
      if (req.query.confirm !== 'true') {
        return sendErrorResponse(res, 400, 'Confirmación requerida para borrar todo', 'CONFIRMATION_REQUIRED');
      }
      result = await ChatGeneral.deleteMany({});
    } else {
      result = await ChatGeneral.deleteMany({ usuario: usuarioId });
    }

    res.json({
      mensaje: 'Chat borrado exitosamente',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting chat:', error.message);
    sendErrorResponse(res, 500, 'Error al borrar chat', 'DELETE_ERROR');
  }
});

module.exports = { 
  enviarMensaje, 
  obtenerMensajes, 
  obtenerReportesUsuario, 
  borrarChat 
};
