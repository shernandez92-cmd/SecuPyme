const { registrarEvento } = require('./siemController');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registro = async (req, res) => {
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
    res.status(201).json({ mensaje: 'Usuario registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

const login = async (req, res) => {
  try {
    const { email, contraseña } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      await registrarEvento('login_fallido', `Intento fallido: ${email}`, 'high', null, req.ip);
      return res.status(400).json({ mensaje: 'Credenciales incorrectas' });
    }
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!contraseñaValida) {
      await registrarEvento('login_fallido', `Contraseña incorrecta: ${email}`, 'high', null, req.ip);
      return res.status(400).json({ mensaje: 'Credenciales incorrectas' });
    }
    if (usuario.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { id: usuario._id, requires2FA: true },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      );
      return res.json({ requires2FA: true, tempToken });
    }
    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    await registrarEvento("login_exitoso", `Login de ${usuario.email}`, "low", usuario._id, req.ip);
    res.json({ token, rol: usuario.rol, nombre: usuario.nombre });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-contraseña');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

module.exports = { registro, login, obtenerUsuarios };
