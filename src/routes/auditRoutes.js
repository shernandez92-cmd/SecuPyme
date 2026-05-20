const express = require('express');
const router = express.Router();
const { obtenerLogs } = require('../controllers/auditController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

router.get('/', verificarToken, verificarAdmin, obtenerLogs);

module.exports = router;
