const express = require('express');
const router = express.Router();
const { registro, login, obtenerUsuarios } = require('../controllers/authController');
const { setup2FA, verify2FA, loginCon2FA } = require('../controllers/twoFactorController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

router.post('/registro', registro);
router.post('/login', login);
router.get('/usuarios', verificarToken, verificarAdmin, obtenerUsuarios);
router.post('/2fa/setup', verificarToken, setup2FA);
router.post('/2fa/verify', verificarToken, verify2FA);
router.post("/2fa/login", loginCon2FA);
router.put('/usuarios/:id/plan', verificarToken, verificarAdmin, async (req, res) => {
  try {
    await require('../models/Usuario').findByIdAndUpdate(req.params.id, { plan: req.body.plan });
    res.json({ mensaje: 'Plan actualizado' });
  } catch (e) { res.status(500).json({ mensaje: 'Error', e }); }
});

router.put('/usuarios/:id/rol', verificarToken, verificarAdmin, async (req, res) => {
  try {
    await require('../models/Usuario').findByIdAndUpdate(req.params.id, { rol: req.body.rol });
    res.json({ mensaje: 'Rol actualizado' });
  } catch (e) { res.status(500).json({ mensaje: 'Error', e }); }
});
module.exports = router;
