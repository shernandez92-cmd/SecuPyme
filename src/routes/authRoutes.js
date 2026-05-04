const express = require('express');
const router = express.Router();
const { registro, login, obtenerUsuarios } = require('../controllers/authController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

router.post('/registro', registro);
router.post('/login', login);
router.get('/usuarios', verificarToken, verificarAdmin, obtenerUsuarios);

module.exports = router;
