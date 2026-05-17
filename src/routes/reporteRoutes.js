const express = require('express');
const router = express.Router();
const { crearReporte, obtenerReportes, obtenerReporte, actualizarReporte, actualizarEstado, eliminarReporte } = require('../controllers/reporteController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

router.post('/', verificarToken, crearReporte);
router.get('/', verificarToken, obtenerReportes);
router.get('/:id', verificarToken, obtenerReporte);
router.put('/:id', verificarToken, verificarAdmin, actualizarReporte);
router.delete('/:id', verificarToken, verificarAdmin, eliminarReporte);
module.exports = router;
