const logger = require('../utils/logger');
const { registrarEvento } = require('./siemController');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const registro = async (req, res, next) => {
  try {
    const { nombre, email, contraseña, empresa, rol } = req.body;
    const usuarioExiste = await Usuario.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }
    const salt = await bcrypt.genSalt(10);
    const contraseñaEncriptada = await bcrypt.hash(contraseña, salt);
    const usuario = new Usuario({ nombre, email, contraseña: contraseñaEncriptada, empresa, rol });
    await usuario.save();
    const tokenTemporal = jwt.sign(
      { id: usuario._id, rol: usuario.rol, empresa: usuario.empresa, plan: usuario.plan },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(201).json({ mensaje: 'Usuario registrado exitosamente', token: tokenTemporal });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, contraseña } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      await registrarEvento('login_fallido', `Intento fallido: ${email}`, 'high', null, req.ip);
      const { actualizarRisk } = require('./riskController');
      await actualizarRisk(null, 'login_fallido');
      return res.status(400).json({ mensaje: 'Credenciales incorrectas' });
    }
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!contraseñaValida) {
      await registrarEvento('login_fallido', `Contraseña incorrecta: ${email}`, 'high', usuario._id, req.ip);
      const { actualizarRisk: ar2 } = require('./riskController');
      await ar2(usuario._id, 'login_fallido');
      const intentosRecientes = await require('../models/SecurityEvent').countDocuments({
        userId: usuario._id,
        type: 'login_fallido',
        timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
      });
      if (intentosRecientes >= 3) {
        await registrarEvento('bloqueo_automatico', `Múltiples intentos fallidos: ${email}`, 'high', usuario._id, req.ip);
        const RiskScore = require('../models/RiskScore');
        await RiskScore.findOneAndUpdate(
          { empresaId: usuario._id },
          { bloqueado: true, bloqueoHasta: new Date(Date.now() + 15 * 60 * 1000) },
          { upsert: true }
        );
      }
      return res.status(400).json({ mensaje: 'Credenciales incorrectas' });
    }
    if (usuario.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { id: usuario._id, requires2FA: true },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
      return res.json({ requires2FA: true, tempToken });
    }
    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol, empresa: usuario.empresa, plan: usuario.plan, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    await registrarEvento('login_exitoso', `Login de ${usuario.email}`, 'low', usuario._id, req.ip);
    const { actualizarRisk: ar } = require('./riskController');
    await ar(usuario._id, 'login_exitoso');
    res.json({ token, rol: usuario.rol, nombre: usuario.nombre, empresa: usuario.empresa, plan: usuario.plan });
  } catch (error) {
    next(error);
  }
};

const obtenerUsuarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.find().select('-contraseña');
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ mensaje: 'El email es requerido' });
    }
    const usuario = await Usuario.findOne({ email });
    const respuestaGenerica = { mensaje: 'Si ese email está registrado, recibirás un enlace de recuperación.' };
    if (!usuario) {
      return res.json(respuestaGenerica);
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 30 * 60 * 1000);
    usuario.resetToken = token;
    usuario.resetTokenExpiry = expiry;
    await usuario.save();
    const baseUrl = process.env.FRONTEND_URL || 'https://secupyme.onrender.com';
    const resetLink = `${baseUrl}/reset-password.html?token=${token}`;
    await transporter.sendMail({
      from: `"SecuPyme" <${process.env.EMAIL_USER}>`,
      to: usuario.email,
      subject: 'Recuperación de contraseña — SecuPyme',
      html: `
        <div style="font-family:'Share Tech Mono',monospace;background:#0d0618;color:#e2e8f0;padding:32px;border-radius:8px;max-width:520px;margin:auto;">
          <h2 style="color:#7c3aed;margin-bottom:8px;">SecuPyme</h2>
          <p style="margin-bottom:16px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
          <p style="margin-bottom:24px;">El enlace es válido por <strong>30 minutos</strong> y solo puede usarse una vez.</p>
          <a href="${resetLink}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
            Restablecer contraseña
          </a>
          <p style="margin-top:24px;font-size:12px;color:#94a3b8;">Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.</p>
          <p style="font-size:12px;color:#94a3b8;">O copia este enlace: <span style="color:#7c3aed;">${resetLink}</span></p>
        </div>
      `
    });
    await registrarEvento('password_reset_solicitado', `Reset solicitado para ${email}`, 'medium', usuario._id, req.ip);
    res.json(respuestaGenerica);
  } catch (error) {
    logger.error('forgotPassword error:', error);
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, nuevaContraseña } = req.body;
    if (!token || !nuevaContraseña) {
      return res.status(400).json({ mensaje: 'Token y nueva contraseña son requeridos' });
    }
    if (nuevaContraseña.length < 8) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
    }
    const usuario = await Usuario.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });
    if (!usuario) {
      return res.status(400).json({ mensaje: 'Token inválido o expirado' });
    }
    const salt = await bcrypt.genSalt(10);
    usuario.contraseña = await bcrypt.hash(nuevaContraseña, salt);
    usuario.resetToken = null;
    usuario.resetTokenExpiry = null;
    await usuario.save();
    await registrarEvento('password_reset_exitoso', `Contraseña restablecida para ${usuario.email}`, 'medium', usuario._id, req.ip);
    res.json({ mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    logger.error('resetPassword error:', error);
    next(error);
  }
};


const crypto = require('crypto');

const generateApiKey = async (req, res, next) => {
  try {
    const rawKey = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    await Usuario.findByIdAndUpdate(req.usuario.id, { apiKey: hash });
    res.json({ apiKey: rawKey, mensaje: 'Guarda esta key — no se mostrará de nuevo.' });
  } catch (error) { next(error); }
};

const revokeApiKey = async (req, res, next) => {
  try {
    await Usuario.findByIdAndUpdate(req.usuario.id, { apiKey: null });
    res.json({ mensaje: 'API key revocada.' });
  } catch (error) { next(error); }
};

const apiKeyStatus = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('apiKey ipsMonitoreadas');
    res.json({
      tieneKey: !!usuario.apiKey,
      ipsMonitoreadas: usuario.ipsMonitoreadas || []
    });
  } catch (error) { next(error); }
};

module.exports = { registro, login, obtenerUsuarios, forgotPassword, resetPassword, generateApiKey, revokeApiKey, apiKeyStatus };
