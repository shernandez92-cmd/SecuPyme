const express = require('express');
const router = express.Router();
const apiKeyAuth = require('../middleware/apiKey');
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errorHandler');
const Reporte = require('../models/Reporte');
const Autoevaluacion = require('../models/Autoevaluacion');
const crypto = require('crypto');
const Usuario = require('../models/Usuario');
const validators = require('../utils/validators');
const { sendErrorResponse } = require('../utils/errorHandler');

/**
 * Generate API key - Only for authenticated users (their own key)
 */
router.post('/apikey', verificarToken, asyncHandler(async (req, res) => {
  // Users can only generate API key for themselves, admins can generate for any user
  const targetUserId = req.body.userId;
  
  // Validation
  if (!targetUserId || !validators.isValidMongoID(targetUserId)) {
    return sendErrorResponse(res, 400, 'userId es requerido y debe ser un ID válido', 'INVALID_INPUT');
  }

  // Authorization: User can only request their own API key, admin can request any
  if (req.usuario.rol !== 'admin' && req.usuario.id !== targetUserId) {
    return sendErrorResponse(res, 403, 'No puedes generar API keys para otro usuario', 'UNAUTHORIZED');
  }

  try {
    const usuario = await Usuario.findByIdAndUpdate(
      targetUserId,
      { apiKey: crypto.randomUUID() },
      { new: true, runValidators: true }
    );

    if (!usuario) {
      return sendErrorResponse(res, 404, 'Usuario no encontrado', 'USER_NOT_FOUND');
    }

    res.json({ 
      mensaje: 'API key generada exitosamente',
      apiKey: usuario.apiKey 
    });
  } catch (error) {
    console.error('Error generating API key:', error.message);
    sendErrorResponse(res, 500, 'Error al generar API key', 'GENERATION_ERROR');
  }
}));

/**
 * Get reports via API key
 */
router.get('/reportes', apiKeyAuth, asyncHandler(async (req, res) => {
  try {
    const reportes = await Reporte.find({ usuario: req.usuario.id })
      .select('-notasAdmin') // Don't expose admin notes to API users
      .lean();
    
    res.json(reportes);
  } catch (error) {
    console.error('Error fetching reports:', error.message);
    sendErrorResponse(res, 500, 'Error al obtener reportes', 'FETCH_ERROR');
  }
}));

/**
 * Create report via API key
 */
router.post('/reportes', apiKeyAuth, asyncHandler(async (req, res) => {
  const { empresa, tipoVulnerabilidad, descripcion } = req.body;

  // Validate required fields
  const errors = validators.validateRequiredFields(
    { empresa, tipoVulnerabilidad, descripcion },
    ['empresa', 'tipoVulnerabilidad', 'descripcion']
  );

  if (errors) {
    return sendErrorResponse(res, 400, 'Campos requeridos faltantes', 'MISSING_FIELDS');
  }

  // Validate field lengths
  if (!validators.isValidLength(empresa, 1, 255) ||
      !validators.isValidLength(tipoVulnerabilidad, 1, 100) ||
      !validators.isValidLength(descripcion, 10, 5000)) {
    return sendErrorResponse(res, 400, 'Longitud de campos inválida', 'INVALID_LENGTH');
  }

  try {
    const reporte = new Reporte({
      usuario: req.usuario.id,
      empresa: validators.sanitizeString(empresa),
      tipoVulnerabilidad: validators.sanitizeString(tipoVulnerabilidad),
      descripcion: validators.sanitizeString(descripcion)
    });

    await reporte.save();

    res.status(201).json({
      mensaje: 'Reporte creado exitosamente',
      reporte: {
        id: reporte._id,
        empresa: reporte.empresa,
        tipoVulnerabilidad: reporte.tipoVulnerabilidad,
        estado: reporte.estado,
        fechaCreacion: reporte.fechaCreacion
      }
    });
  } catch (error) {
    console.error('Error creating report:', error.message);
    sendErrorResponse(res, 500, 'Error al crear reporte', 'CREATION_ERROR');
  }
}));

/**
 * Get autoevaluaciones via API key
 */
router.get('/autoevaluaciones', apiKeyAuth, asyncHandler(async (req, res) => {
  try {
    const evaluaciones = await Autoevaluacion.find({ usuario: req.usuario.id })
      .lean();
    
    res.json(evaluaciones);
  } catch (error) {
    console.error('Error fetching autoevaluaciones:', error.message);
    sendErrorResponse(res, 500, 'Error al obtener autoevaluaciones', 'FETCH_ERROR');
  }
}));

module.exports = router;

