const express = require('express');
const router = express.Router();
const { registro, login, obtenerUsuarios } = require('../controllers/authController');
const { setup2FA, verify2FA } = require('../controllers/twoFactorController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

router.post('/registro', registro);
router.post('/login', login);
router.get('/usuarios', verificarToken, verificarAdmin, obtenerUsuarios);
router.post('/2fa/setup', verificarToken, setup2FA);
router.post('/2fa/verify', verificarToken, verify2FA);

module.exports = router;
