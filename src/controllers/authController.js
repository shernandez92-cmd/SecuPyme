const { registrarEvento } = require('./siemController');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validators = require('../utils/validators');
const { sendErrorResponse, asyncHandler } = require('../utils/errorHandler');

/**
 * Register new user with input validation
 */
const registro = asyncHandler(async (req, res) => {
  const { nombre, email, contraseña, empresa, rol = 'user' } = req.body;

  // Validate required fields
  const errors = validators.validateRequiredFields(
    { nombre, email, contraseña, empresa },
    ['nombre', 'email', 'contraseña', 'empresa']
  );

  if (errors) {
    return sendErrorResponse(res, 400, 'Campos requeridos faltantes', 'MISSING_FIELDS');
  }

  // Validate email format
  if (!validators.isValidEmail(email)) {
    return sendErrorResponse(res, 400, 'Formato de email inválido', 'INVALID_EMAIL');
  }

  // Validate password strength
  if (!validators.isValidPassword(contraseña)) {
    return sendErrorResponse(res, 400, 
      'Contraseña débil. Debe contener 8+ caracteres, mayúscula, minúscula, número y carácter especial', 
      'WEAK_PASSWORD');
  }

  // Validate field lengths
  if (!validators.isValidLength(nombre, 2, 100) ||
      !validators.isValidLength(empresa, 2, 100)) {
    return sendErrorResponse(res, 400, 'Longitud de campos inválida', 'INVALID_LENGTH');
  }

  // Validate role
  const validRoles = ['user', 'admin'];
  if (rol && !validRoles.includes(rol)) {
    return sendErrorResponse(res, 400, 'Rol inválido', 'INVALID_ROLE');
  }

  try {
    // Check if email already exists
    const usuarioExiste = await Usuario.findOne({ email: email.toLowerCase() });
    if (usuarioExiste) {
      return sendErrorResponse(res, 409, 'El email ya está registrado', 'DUPLICATE_EMAIL');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const contraseñaEncriptada = await bcrypt.hash(contraseña, salt);

    // Create new user
    const usuario = new Usuario({
      nombre: validators.sanitizeString(nombre),
      email: email.toLowerCase(),
      contraseña: contraseñaEncriptada,
      empresa: validators.sanitizeString(empresa),
      rol: rol || 'user',
      activo: true
    });

    await usuario.save();

    // Log registration event
    try {
      await registrarEvento('registro_usuario', `Nuevo usuario: ${email}`, 'low', usuario._id, req.ip);
    } catch (siemError) {
      console.error('SIEM logging error:', siemError.message);
    }

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        empresa: usuario.empresa
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    if (error.code === 11000) {
      return sendErrorResponse(res, 409, 'El email ya está registrado', 'DUPLICATE_EMAIL');
    }
    sendErrorResponse(res, 500, 'Error al registrar usuario', 'REGISTRATION_ERROR');
  }
});

/**
 * Login with email and password
 */
const login = asyncHandler(async (req, res) => {
  const { email, contraseña } = req.body;

  // Validate required fields
  const errors = validators.validateRequiredFields(
    { email, contraseña },
    ['email', 'contraseña']
  );

  if (errors) {
    return sendErrorResponse(res, 400, 'Email y contraseña requeridos', 'MISSING_FIELDS');
  }

  // Validate email format
  if (!validators.isValidEmail(email)) {
    return sendErrorResponse(res, 400, 'Formato de email inválido', 'INVALID_EMAIL');
  }

  try {
    const usuario = await Usuario.findOne({ email: email.toLowerCase() });

    // Generic message for security
    if (!usuario) {
      try {
        await registrarEvento('login_fallido', `Intento fallido: usuario no encontrado`, 'medium', null, req.ip);
      } catch (siemError) {
        console.error('SIEM logging error:', siemError.message);
      }
      return sendErrorResponse(res, 401, 'Credenciales incorrectas', 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (usuario.activo === false) {
      return sendErrorResponse(res, 403, 'Usuario inactivo', 'USER_INACTIVE');
    }

    // Compare passwords
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);

    if (!contraseñaValida) {
      try {
        await registrarEvento('login_fallido', `Contraseña incorrecta`, 'medium', usuario._id, req.ip);
      } catch (siemError) {
        console.error('SIEM logging error:', siemError.message);
      }
      return sendErrorResponse(res, 401, 'Credenciales incorrectas', 'INVALID_CREDENTIALS');
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return sendErrorResponse(res, 500, 'Error interno del servidor', 'CONFIG_ERROR');
    }

    const token = jwt.sign(
      { 
        id: usuario._id, 
        rol: usuario.rol,
        email: usuario.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '8h' }
    );

    // Log successful login
    try {
      await registrarEvento('login_exitoso', `Login exitoso`, 'low', usuario._id, req.ip);
    } catch (siemError) {
      console.error('SIEM logging error:', siemError.message);
    }

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresa: usuario.empresa
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    sendErrorResponse(res, 500, 'Error al iniciar sesión', 'LOGIN_ERROR');
  }
});

/**
 * Get all users (admin only) - handled by middleware
 */
const obtenerUsuarios = asyncHandler(async (req, res) => {
  try {
    const usuarios = await Usuario.find()
      .select('-contraseña') // Never return password
      .lean();

    res.json({
      total: usuarios.length,
      usuarios
    });
  } catch (error) {
    console.error('Error fetching users:', error.message);
    sendErrorResponse(res, 500, 'Error al obtener usuarios', 'FETCH_ERROR');
  }
});

/**
 * Update user profile (own profile only)
 */
const actualizarPerfil = asyncHandler(async (req, res) => {
  const { nombre, empresa } = req.body;
  const usuarioId = req.usuario.id || req.usuario._id;

  if (nombre && !validators.isValidLength(nombre, 2, 100)) {
    return sendErrorResponse(res, 400, 'Nombre inválido', 'INVALID_NAME');
  }

  if (empresa && !validators.isValidLength(empresa, 2, 100)) {
    return sendErrorResponse(res, 400, 'Empresa inválida', 'INVALID_COMPANY');
  }

  try {
    const usuario = await Usuario.findByIdAndUpdate(
      usuarioId,
      {
        ...(nombre && { nombre: validators.sanitizeString(nombre) }),
        ...(empresa && { empresa: validators.sanitizeString(empresa) })
      },
      { new: true, runValidators: true }
    ).select('-contraseña');

    if (!usuario) {
      return sendErrorResponse(res, 404, 'Usuario no encontrado', 'NOT_FOUND');
    }

    res.json({
      mensaje: 'Perfil actualizado exitosamente',
      usuario
    });
  } catch (error) {
    console.error('Error updating profile:', error.message);
    sendErrorResponse(res, 500, 'Error al actualizar perfil', 'UPDATE_ERROR');
  }
});

module.exports = { 
  registro, 
  login, 
  obtenerUsuarios,
  actualizarPerfil 
};
