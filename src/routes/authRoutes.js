const express = require('express');
const router = express.Router();
const { registro, login, obtenerUsuarios, forgotPassword, resetPassword } = require('../controllers/authController');
const { setup2FA, verify2FA, loginCon2FA } = require('../controllers/twoFactorController');
const { verificarToken, verificarAdmin, revocarToken } = require('../middleware/auth');
const { registrarAudit } = require('../controllers/auditController');
const Usuario = require('../models/Usuario');

router.post('/registro', validate(s.registro), registro);
router.post('/login', validate(s.login), login);
router.post('/forgot-password', validate(s.forgotPassword), forgotPassword);
router.post('/reset-password', validate(s.resetPassword), resetPassword);
router.get('/usuarios', verificarToken, verificarAdmin, obtenerUsuarios);
router.post('/2fa/setup', verificarToken, setup2FA);
router.post('/2fa/verify', verificarToken, verify2FA);
router.post('/2fa/login', loginCon2FA);

router.post('/logout', verificarToken, async (req, res, next) => {
  try {
    await revocarToken(req.headers['authorization']);
    res.json({ mensaje: 'Sesión cerrada correctamente' });
  } catch (e) { next(e); }
});

router.put('/usuarios/:id/plan', verificarToken, verificarAdmin, validate(s.cambiarPlan), async (req, res, next) => {
  try {
    const target = await Usuario.findByIdAndUpdate(
      req.params.id,
      { plan: req.body.plan },
      { new: true }
    );
    if (!target) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    await registrarAudit({
      adminId:     req.usuario.id,
      adminNombre: req.usuario.nombre || req.usuario.id,
      accion:      'cambio_plan',
      targetUserId: target._id,
      targetNombre: target.nombre,
      detalle:     `Plan cambiado a: ${req.body.plan}`
    });

    res.json({ mensaje: 'Plan actualizado' });
  } catch (e) { next(e); }
});

router.put('/usuarios/:id/rol', verificarToken, verificarAdmin, validate(s.cambiarRol), async (req, res, next) => {
  try {
    const target = await Usuario.findByIdAndUpdate(
      req.params.id,
      { rol: req.body.rol },
      { new: true }
    );
    if (!target) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    if (req.params.id === req.usuario.id) {
      await revocarToken(req.headers['authorization']);
    }

    await registrarAudit({
      adminId:     req.usuario.id,
      adminNombre: req.usuario.nombre || req.usuario.id,
      accion:      'cambio_rol',
      targetUserId: target._id,
      targetNombre: target.nombre,
      detalle:     `Rol cambiado a: ${req.body.rol}`
    });

    res.json({ mensaje: 'Rol actualizado. El usuario deberá iniciar sesión nuevamente.' });
  } catch (e) { next(e); }
});

router.delete('/usuarios/:id', verificarToken, verificarAdmin, async (req, res, next) => {
  try {
    if (req.params.id === req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puedes eliminar tu propia cuenta' });
    }
    const target = await Usuario.findByIdAndDelete(req.params.id);

    await registrarAudit({
      adminId:     req.usuario.id,
      adminNombre: req.usuario.nombre || req.usuario.id,
      accion:      'eliminar_usuario',
      targetUserId: req.params.id,
      targetNombre: target ? target.nombre : req.params.id,
      detalle:     `Usuario eliminado: ${target ? target.email : req.params.id}`
    });

    res.json({ mensaje: 'Usuario eliminado' });
  } catch (e) { next(e); }
});

module.exports = router;
