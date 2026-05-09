const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');

const setup2FA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: `Secupyme (${req.usuario.id})` });
    await Usuario.findByIdAndUpdate(req.usuario.id, { twoFactorSecret: secret.base32 });
    const qrUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ qrCode: qrUrl, secret: secret.base32 });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error configurando 2FA', error });
  }
};

const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const usuario = await Usuario.findById(req.usuario.id);
    const verified = speakeasy.totp.verify({
      secret: usuario.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });
    if (!verified) return res.status(400).json({ mensaje: 'Código incorrecto' });
    await Usuario.findByIdAndUpdate(req.usuario.id, { twoFactorEnabled: true });
    const nuevoToken = jwt.sign(
      { id: usuario._id, rol: usuario.rol, twoFactorEnabled: true },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ mensaje: '2FA activado', token: nuevoToken });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error verificando 2FA', error });
  }
};

module.exports = { setup2FA, verify2FA };
