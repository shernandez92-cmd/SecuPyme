const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

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
const pdfRoutes = require('./routes/pdfRoutes');
const siemRoutes = require('./routes/siemRoutes');
const integracionRoutes = require('./routes/integracionRoutes');
const publicRoutes = require('./routes/publicRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/autoevaluaciones', autoevaluacionRoutes);
app.use('/api/mensajes', mensajeRoutes);
app.use('/api/chat', chatRoutes);
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

  socket.on('identificar', (data) => {
    usuariosConectados[socket.id] = data;
    socket.join(data.empresaId || data.userId);
    io.emit('usuariosOnline', Object.values(usuariosConectados).length);
  });

  socket.on('mensajeChat', async (data) => {
    const ChatGeneral = require('./models/ChatGeneral');
    try {
      const mensaje = new ChatGeneral({
        usuario: data.userId,
        empresaId: data.empresaId,
        texto: data.texto,
        reporteRelacionado: data.reporteRelacionado || null
      });
      await mensaje.save();
      const populado = await ChatGeneral.findById(mensaje._id)
        .populate('usuario', 'nombre rol')
        .populate('reporteRelacionado', 'empresa tipoVulnerabilidad');
      
      io.emit('nuevoMensaje', populado);
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