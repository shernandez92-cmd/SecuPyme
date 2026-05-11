const express = require('express');
const router = express.Router();
const { 
  criarReporte,
  crearReporte,
  obtenerReportes, 
  obtenerReporte, 
  actualizarReporte, 
  actualizarEstado,
  eliminarReporte,
  archivarReporte
} = require('../controllers/reporteController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errorHandler');
const checkPlan = require('../middleware/checkPlan');

/**
 * Create a new report
 * POST /api/reportes
 */
router.post('/', verificarToken, checkPlan, asyncHandler(crearReporte));

/**
 * Get all reports (admin) or user's reports
 * GET /api/reportes
 */
router.get('/', verificarToken, asyncHandler(obtenerReportes));

/**
 * Get single report
 * GET /api/reportes/:id
 */
router.get('/:id', verificarToken, asyncHandler(obtenerReporte));

/**
 * Update report (admin only - status, priority, notes)
 * PUT /api/reportes/:id
 */
router.put('/:id', verificarToken, verificarAdmin, asyncHandler(actualizarReporte));

/**
 * Update report state only
 * PATCH /api/reportes/:id/estado
 */
router.patch('/:id/estado', verificarToken, asyncHandler(actualizarEstado));

/**
 * Delete report (admin only)
 * DELETE /api/reportes/:id
 */
router.delete('/:id', verificarToken, verificarAdmin, asyncHandler(eliminarReporte));

/**
 * Archive report (admin only)
 * PATCH /api/reportes/:id/archivar
 */
router.patch('/:id/archivar', verificarToken, verificarAdmin, asyncHandler(archivarReporte));

module.exports = router;
