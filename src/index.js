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
app.use(express.static('public'));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { mensaje: 'Demasiados intentos' } });
app.use(limiter);
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

const { iniciarMonitoreo } = require("./jobs/monitoreoIPs");
iniciarMonitoreo();

app.use((req, res) => {
  const path = require('path');
  res.status(404).sendFile(path.resolve(__dirname, '../public/404.html'));
});

// Socket.IO
const usuariosConectados = {};

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('identificar', async (data) => {
    usuariosConectados[socket.id] = data;
    socket.join(data.empresaId || data.userId);
    
    // Unirse a rooms de conversaciones
    try {
      if (data.rol === 'admin') {
        // Admin: unirse a TODAS sus conversaciones
        const conversations = await Conversation.find({ adminId: data.userId });
        conversations.forEach(conv => {
          socket.join(`conv:${conv._id}`);
        });
      } else {
        const empresaId = data.empresaId || data.userId;
        let conversation = await Conversation.findOne({ empresaId });
        if (!conversation) {
          const Usuario = require("./models/Usuario");
          const admin = await Usuario.findOne({ rol: "admin" });
          if (admin) {
            try {
              conversation = await Conversation.findOneAndUpdate(
                { adminId: admin._id, empresaId },
                { ultimaActividad: new Date() },
                { upsert: true, new: true }
              );
              console.log("Conversacion creada para empresa:", empresaId);
              const adminSockets = Object.entries(usuariosConectados)
                .filter(([, u]) => u.userId === admin._id.toString())
                .map(([socketId]) => socketId);
              adminSockets.forEach(sid => {
                const s = io.sockets.sockets.get(sid);
                if (s) s.join("conv:" + conversation._id);
              });
            } catch (e) {
              if (e.code !== 11000) console.log("Error creando conversacion:", e.message);
              conversation = await Conversation.findOne({ empresaId });
            }
          }
        }
        if (conversation) {
          socket.join("conv:" + conversation._id);
        }
      }
    } catch (e) {
      console.log('Error al unir a rooms de conversación:', e.message);
    }
    
    io.emit('usuariosOnline', Object.values(usuariosConectados).length);
  });

  socket.on('mensajeChat', async (data) => {
    const ChatGeneral = require('./models/ChatGeneral');
    try {
      const mensaje = new ChatGeneral({
        usuario: data.userId,
        empresaId: data.empresaId,
        texto: data.texto,
        conversationId: data.conversationId || null,
        reporteRelacionado: data.reporteRelacionado || null
      });
      await mensaje.save();
      const populado = await ChatGeneral.findById(mensaje._id)
        .populate('usuario', 'nombre rol')
        .populate('reporteRelacionado', 'empresa tipoVulnerabilidad');
      
      // Emitir SOLO a la room de la conversación si existe
      if (data.conversationId) {
        io.to(`conv:${data.conversationId}`).emit('nuevoMensaje', populado);
      } else {
        // Sin conversationId, mantener compatibilidad: emit global
        io.emit('nuevoMensaje', populado);
      }
    } catch (e) {
      console.log('Error socket mensaje:', e.message);
    }
  });

  socket.on('disconnect', () => {
    delete usuariosConectados[socket.id];
    io.emit('usuariosOnline', Object.values(usuariosConectados).length);
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
  console.log('Preguntas de autoevaluación inicializadas (' + preguntas.length + ')');
};

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado a MongoDB');
    // El índice TTL de TokenBlacklist limpia tokens expirados automáticamente
    require('./models/TokenBlacklist');
    console.log('TokenBlacklist TTL index activo');
    seedPreguntas();
    server.listen(process.env.PORT || 3000, () => {
      console.log(`Servidor corriendo en puerto ${process.env.PORT || 3000}`);
    });
  })
  .catch((error) => {
    console.log('Error de conexión:', error);
  });