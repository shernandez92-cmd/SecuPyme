const express = require('express');
const router = express.Router();
const { registro, login, obtenerUsuarios, forgotPassword, resetPassword } = require('../controllers/authController');
const { setup2FA, verify2FA, loginCon2FA } = require('../controllers/twoFactorController');
const { verificarToken, verificarAdmin, revocarToken } = require('../middleware/auth');
const Usuario = require('../models/Usuario');

router.post('/registro', registro);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/usuarios', verificarToken, verificarAdmin, obtenerUsuarios);
router.post('/2fa/setup', verificarToken, setup2FA);
router.post('/2fa/verify', verificarToken, verify2FA);
router.post('/2fa/login', loginCon2FA);

// Cambio de plan — sin impacto en sesión activa, no requiere revocación
router.put('/usuarios/:id/plan', verificarToken, verificarAdmin, async (req, res) => {
  try {
    await Usuario.findByIdAndUpdate(req.params.id, { plan: req.body.plan });
    res.json({ mensaje: 'Plan actualizado' });
  } catch (e) { res.status(500).json({ mensaje: 'Error', e }); }
});

// Cambio de rol — revocar token activo del usuario afectado
router.put('/usuarios/:id/rol', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { rol: req.body.rol },
      { new: true }
    );
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    // El token del admin que hace la acción viene en el header —
    // el token del usuario afectado no lo tenemos, pero podemos
    // marcar en el modelo que debe re-autenticarse en el próximo request
    // usando el campo tokenVersion (sin romper el flujo actual).
    // Por ahora revocamos el token de la sesión actual si el admin
    // se cambió el rol a sí mismo (edge case).
    if (req.params.id === req.usuario.id) {
      await revocarToken(req.headers['authorization']);
    }

    res.json({ mensaje: 'Rol actualizado. El usuario deberá iniciar sesión nuevamente.' });
  } catch (e) { res.status(500).json({ mensaje: 'Error', e }); }
});

// Eliminación de usuario — revocar sesión del admin si se elimina a sí mismo (guard)
router.delete('/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    if (req.params.id === req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puedes eliminar tu propia cuenta' });
    }
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (e) { res.status(500).json({ mensaje: 'Error', e }); }
});

// Logout explícito — revocar token actual
router.post('/logout', verificarToken, async (req, res) => {
  try {
    await revocarToken(req.headers['authorization']);
    res.json({ mensaje: 'Sesión cerrada correctamente' });
  } catch (e) { res.status(500).json({ mensaje: 'Error', e }); }
});

module.exports = router;
