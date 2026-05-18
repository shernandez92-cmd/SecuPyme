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
  cors: { origin: '*' }
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.static('public'));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
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

app.use((req, res) => {
  res.status(404).sendFile(__dirname + '/../public/404.html');
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

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado a MongoDB');
    server.listen(process.env.PORT || 3000, () => {
      console.log(`Servidor corriendo en puerto ${process.env.PORT || 3000}`);
    });
  })
  .catch((error) => {
    console.log('Error de conexión:', error);
  });