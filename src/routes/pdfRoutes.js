const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const { 
  exportarReportes, 
  exportarReporteIndividual, 
  exportarAutoevaluaciones 
} = require('../controllers/pdfController');

/**
 * Export reports to PDF
 * Requires: Authorization header with Bearer token
 * Security: Tokens should NEVER be in query parameters (they get logged)
 */
router.get('/reportes', verificarToken, exportarReportes);

/**
 * Export individual report to PDF
 */
router.get('/reportes/:id', verificarToken, exportarReporteIndividual);

/**
 * Export autoevaluaciones to PDF
 */
router.get('/autoevaluaciones', verificarToken, exportarAutoevaluaciones);

module.exports = router;
