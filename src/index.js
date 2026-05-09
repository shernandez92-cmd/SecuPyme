const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.static('public'));
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const autoevaluacionRoutes = require('./routes/autoevaluacionRoutes');
const mensajeRoutes = require('./routes/mensajeRoutes');
const chatRoutes = require('./routes/chatRoutes');
const pdfRoutes = require('./routes/pdfRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/autoevaluaciones', autoevaluacionRoutes);
app.use('/api/mensajes', mensajeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/pdf', pdfRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: 'Secupyme API funcionando' });
});
const siemRoutes = require('./routes/siemRoutes');
const publicRoutes = require('./routes/publicRoutes');
app.use('/api/siem', siemRoutes);
app.use('/api/public', publicRoutes);
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado a MongoDB');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.log('Error de conexión:', error);
  });
const integracionRoutes = require('./routes/integracionRoutes');
app.use('/api/integraciones', integracionRoutes);
