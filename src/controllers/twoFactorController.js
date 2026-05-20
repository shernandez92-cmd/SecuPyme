const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// ─── Genera 10 códigos de respaldo de un solo uso ────────────────────────────
const generarBackupCodes = async () => {
  const codigos = [];
  const hasheados = [];

  for (let i = 0; i < 10; i++) {
    // Formato legible: XXXX-XXXX-XXXX
    const raw = [
      crypto.randomBytes(2).toString('hex').toUpperCase(),
      crypto.randomBytes(2).toString('hex').toUpperCase(),
      crypto.randomBytes(2).toString('hex').toUpperCase()
    ].join('-');

    const hash = await bcrypt.hash(raw, 10);
    codigos.push(raw);
    hasheados.push({ code: hash, used: false });
  }

  return { codigos, hasheados };
};

// ─── Setup: genera secret y QR ───────────────────────────────────────────────
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

// ─── Verify: activa 2FA y devuelve los 10 backup codes (solo esta vez) ───────
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

    // Generar backup codes al activar 2FA
    const { codigos, hasheados } = await generarBackupCodes();

    await Usuario.findByIdAndUpdate(req.usuario.id, {
      twoFactorEnabled: true,
      backupCodes: hasheados
    });

    const nuevoToken = jwt.sign(
      { id: usuario._id, rol: usuario.rol, empresa: usuario.empresa, plan: usuario.plan, nombre: usuario.nombre, twoFactorEnabled: true },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // codigos en texto plano — se muestran UNA sola vez, no se vuelven a recuperar
    res.json({
      mensaje: '2FA activado correctamente',
      token: nuevoToken,
      backupCodes: codigos,
      advertencia: 'Guarda estos códigos en un lugar seguro. No se volverán a mostrar.'
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error verificando 2FA', error });
  }
};

// ─── Login con 2FA: acepta TOTP o backup code ────────────────────────────────
const loginCon2FA = async (req, res) => {
  try {
    const { token: code, tempToken } = req.body;

    const payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (!payload.requires2FA) {
      return res.status(400).json({ mensaje: 'Token inválido' });
    }

    const usuario = await Usuario.findById(payload.id);
    if (!usuario) return res.status(400).json({ mensaje: 'Usuario no encontrado' });

    // 1. Intentar validar como TOTP normal
    const verified = speakeasy.totp.verify({
      secret: usuario.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (verified) {
      return emitirToken(usuario, res);
    }

    // 2. Si no es TOTP válido, intentar como backup code
    if (usuario.backupCodes && usuario.backupCodes.length > 0) {
      for (let i = 0; i < usuario.backupCodes.length; i++) {
        const entry = usuario.backupCodes[i];
        if (entry.used) continue;

        const coincide = await bcrypt.compare(code, entry.code);
        if (coincide) {
          // Marcar como usado
          usuario.backupCodes[i].used = true;
          await usuario.save();

          const restantes = usuario.backupCodes.filter(c => !c.used).length;
          return emitirToken(usuario, res, restantes);
        }
      }
    }

    return res.status(400).json({ mensaje: 'Código incorrecto' });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

// ─── Helper: emite JWT final ─────────────────────────────────────────────────
const emitirToken = (usuario, res, backupCodesRestantes = null) => {
  const finalToken = jwt.sign(
    { id: usuario._id, rol: usuario.rol, empresa: usuario.empresa, plan: usuario.plan, nombre: usuario.nombre, twoFactorEnabled: true },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  const respuesta = {
    token: finalToken,
    rol: usuario.rol,
    nombre: usuario.nombre,
    empresa: usuario.empresa,
    plan: usuario.plan
  };

  if (backupCodesRestantes !== null) {
    respuesta.aviso = `Usaste un código de respaldo. Te quedan ${backupCodesRestantes} códigos disponibles.`;
  }

  return res.json(respuesta);
};

module.exports = { setup2FA, verify2FA, loginCon2FA };
