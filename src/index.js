
process.on('uncaughtException', (err) => {
  require('./utils/logger').error('uncaughtException:', { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  require('./utils/logger').error('unhandledRejection:', { reason: String(reason) });
  process.exit(1);
});
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Conversation = require('./models/Conversation');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*' }
});

app.use(helmet({ contentSecurityPolicy: false }));

app.get('/', (req, res) => res.redirect('/landing.html'));
app.use(express.static('public'));
app.use(require('./middleware/httpLogger'));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { mensaje: 'Demasiados intentos' } });
app.use(limiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth/login', loginLimiter);

const authRoutes = require('./routes/authRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const autoevaluacionRoutes = require('./routes/autoevaluacionRoutes');
const mensajeRoutes = require('./routes/mensajeRoutes');
const chatRoutes = require('./routes/chatRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const siemRoutes = require('./routes/siemRoutes');
const integracionRoutes = require('./routes/integracionRoutes');
const publicRoutes = require('./routes/publicRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/autoevaluaciones', autoevaluacionRoutes);
app.use('/api/mensajes', mensajeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/siem', siemRoutes);
app.use('/api/integraciones', integracionRoutes);
app.use('/api/public', publicRoutes);
const riskRoutes = require("./routes/riskRoutes");
app.use("/api/risk", riskRoutes);
const iaRoutes = require("./routes/iaRoutes");
app.use("/api/ia", iaRoutes);
const uploadRoutes = require("./routes/uploadRoutes");
app.use("/api/upload", uploadRoutes);
const auditRoutes = require("./routes/auditRoutes");
app.use("/api/audit", auditRoutes);

if (process.env.NODE_ENV !== 'test') {
  const { iniciarMonitoreo } = require("./jobs/monitoreoIPs");
  iniciarMonitoreo();
}

app.use((req, res) => {
  const path = require('path');
  res.status(404).sendFile(path.resolve(__dirname, '../public/404.html'));
});

// Socket.IO
const Usuario = require('./models/Usuario');
const ChatGeneral = require('./models/ChatGeneral');
const jwt = require('jsonwebtoken');

// Map<socketId, { userId, rol, empresaId }> — se limpia en disconnect
const usuariosConectados = new Map();

/**
 * Verifica el token JWT enviado en el handshake.
 * Si falla, desconecta el socket antes de que llegue a ningún handler.
 */
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('AUTH_REQUIRED'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.usuario = { userId: payload.id, rol: payload.rol, empresaId: payload.empresa || payload.id };
    next();
  } catch {
    next(new Error('AUTH_INVALID'));
  }
});

io.on('connection', async (socket) => {
  const { userId, rol, empresaId } = socket.usuario;
  logger.info('Socket autenticado:', { socketId: socket.id, userId, rol });

  usuariosConectados.set(socket.id, socket.usuario);
  socket.join(empresaId);
  if (rol === 'admin') socket.join('admin');

  // Unirse a rooms de conversaciones
  try {
    if (rol === 'admin') {
      // Solo las últimas 50 conversaciones activas para evitar joins masivos
      const conversations = await Conversation.find({ adminId: userId })
        .sort({ ultimaActividad: -1 })
        .limit(50)
        .select('_id');
      conversations.forEach(conv => socket.join(`conv:${conv._id}`));
    } else {
      let conversation = await Conversation.findOne({ empresaId });
      if (!conversation) {
        const admin = await Usuario.findOne({ rol: 'admin' }).select('_id');
        if (admin) {
          try {
            conversation = await Conversation.findOneAndUpdate(
              { adminId: admin._id, empresaId },
              { ultimaActividad: new Date() },
              { upsert: true, new: true }
            );
            // Notificar al admin si está conectado
            for (const [sid, u] of usuariosConectados) {
              if (u.userId === admin._id.toString()) {
                const adminSocket = io.sockets.sockets.get(sid);
                if (adminSocket) adminSocket.join(`conv:${conversation._id}`);
              }
            }
          } catch (e) {
            if (e.code !== 11000) logger.error('Error creando conversacion:', { message: e.message });
            conversation = await Conversation.findOne({ empresaId });
          }
        }
      }
      if (conversation) socket.join(`conv:${conversation._id}`);
    }
  } catch (e) {
    logger.error('Error al unir socket a rooms:', { message: e.message });
  }

  // Broadcast conteo — solo a admins para no saturar
  io.to('admin').emit('usuariosOnline', usuariosConectados.size);

  socket.on('mensajeChat', async (data) => {
    // userId y empresaId vienen del token, no del cliente
    const texto = typeof data?.texto === 'string' ? data.texto.slice(0, 2000).trim() : null;
    const conversationId = typeof data?.conversationId === 'string' ? data.conversationId : null;
    const reporteRelacionado = typeof data?.reporteRelacionado === 'string' ? data.reporteRelacionado : null;

    if (!texto) return socket.emit('error', { message: 'Texto inválido' });

    try {
      const mensaje = new ChatGeneral({
        usuario: userId,
        empresaId,
        texto,
        conversationId: conversationId || null,
        reporteRelacionado: reporteRelacionado || null
      });
      await mensaje.save();

      const populado = await ChatGeneral.findById(mensaje._id)
        .populate('usuario', 'nombre rol')
        .populate('reporteRelacionado', 'empresa tipoVulnerabilidad');

      if (conversationId) {
        io.to(`conv:${conversationId}`).emit('nuevoMensaje', populado);
      } else {
        socket.emit('nuevoMensaje', populado);
      }
    } catch (e) {
      logger.error('Error socket mensajeChat:', { message: e.message });
      socket.emit('error', { message: 'Error al enviar mensaje' });
    }
  });

  socket.on('disconnect', (reason) => {
    usuariosConectados.delete(socket.id);
    logger.info('Socket desconectado:', { socketId: socket.id, userId, reason });
    io.to('admin').emit('usuariosOnline', usuariosConectados.size);
  });
});

app.set('io', io);


// ─── Seed preguntas autoevaluación si la colección está vacía ────────────────
const seedPreguntas = async () => {
  const Pregunta = require('./models/Pregunta');
  const count = await Pregunta.countDocuments();
  if (count > 0) return;

  const preguntas = [
    { campo: 'contraseñasSeguras',    texto: '¿Su empresa usa contraseñas seguras en todos los sistemas?',                                    categoria: 'acceso',    peso: 3, orden: 1,  recomendacion: 'Implementar una política de contraseñas seguras en toda la empresa.' },
    { campo: 'dobleAutenticacion',    texto: '¿Al iniciar sesión piden una segunda confirmación como un código al celular?',                   categoria: 'acceso',    peso: 2, orden: 2,  recomendacion: 'Activar la verificación en dos pasos en todos los sistemas críticos.' },
    { campo: 'equiposActualizados',   texto: '¿Los equipos y sistemas de la empresa están actualizados?',                                      categoria: 'sistemas',  peso: 2, orden: 3,  recomendacion: 'Mantener todos los equipos y sistemas operativos actualizados.' },
    { campo: 'softwareLicenciado',    texto: '¿Todo el software que usan tiene licencias vigentes y legales?',                                 categoria: 'sistemas',  peso: 1, orden: 4,  recomendacion: 'Usar únicamente software con licencias vigentes y legales.' },
    { campo: 'copiasSeguridad',       texto: '¿Hacen copias de seguridad de la información importante regularmente?',                          categoria: 'datos',     peso: 3, orden: 5,  recomendacion: 'Establecer copias de seguridad periódicas de toda la información crítica.' },
    { campo: 'copiasEnLugarSeguro',   texto: '¿Las copias de seguridad están guardadas en un lugar externo o en la nube?',                    categoria: 'datos',     peso: 2, orden: 6,  recomendacion: 'Almacenar las copias de seguridad en un lugar externo o en la nube.' },
    { campo: 'capacitacionEmpleados', texto: '¿Los empleados han recibido capacitación en seguridad informática?',                             categoria: 'personas',  peso: 1, orden: 7,  recomendacion: 'Capacitar a todos los empleados en buenas prácticas de seguridad.' },
    { campo: 'identificaPhishing',    texto: '¿Sus empleados saben reconocer correos falsos que intentan robar información?',                  categoria: 'personas',  peso: 1, orden: 8,  recomendacion: 'Enseñar a los empleados a reconocer correos falsos que roban información.' },
    { campo: 'firewallActivo',        texto: '¿Tienen algún programa que proteja su red de accesos no autorizados?',                           categoria: 'red',       peso: 3, orden: 9,  recomendacion: 'Instalar y activar un firewall que proteja la red de accesos no autorizados.' },
    { campo: 'redProtegida',          texto: '¿La red WiFi de la empresa tiene contraseña segura y acceso restringido?',                       categoria: 'red',       peso: 2, orden: 10, recomendacion: 'Proteger la red WiFi con contraseña segura y acceso restringido.' },
    { campo: 'ley1581',               texto: '¿Su empresa cumple con la Ley 1581 de protección de datos personales (Habeas Data)?',            categoria: 'normativa', peso: 2, orden: 11, recomendacion: 'Implementar una política de tratamiento de datos personales conforme a la Ley 1581 de 2012.' }
  ];

  await Pregunta.insertMany(preguntas);
  logger.info('Preguntas de autoevaluación inicializadas (' + preguntas.length + ')');
};


mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('Conectado a MongoDB');
    // El índice TTL de TokenBlacklist limpia tokens expirados automáticamente
    require('./models/TokenBlacklist');
    logger.info('TokenBlacklist TTL index activo');
    seedPreguntas();
    if (process.env.NODE_ENV !== 'test') server.listen(process.env.PORT || 3000, () => {
      logger.info(`Servidor corriendo en puerto ${process.env.PORT || 3000}`);
    });
  })
  .catch((error) => {
    logger.info('Error de conexión:', error);
  });

app.use(errorHandler);

module.exports = app;
