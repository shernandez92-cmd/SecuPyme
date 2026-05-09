const express = require('express');
const router = express.Router();
const { obtenerEventos } = require('../controllers/siemController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

router.get('/events', verificarToken, verificarAdmin, obtenerEventos);

module.exports = router;
