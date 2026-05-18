const express = require('express');
const router = express.Router();
const { upload, subirArchivo } = require('../controllers/uploadController');
const { verificarToken } = require('../middleware/auth');

router.post('/', verificarToken, upload.single('archivo'), subirArchivo);

module.exports = router;

const https = require('https');
const http = require('http');

router.get("/descargar", async (req, res) => {
  const { url, nombre } = req.query;
  if (!url) return res.status(400).json({ mensaje: 'URL requerida' });
  
  res.setHeader('Content-Disposition', `attachment; filename="${nombre || 'archivo.pdf'}"`);
  res.setHeader('Content-Type', 'application/pdf');
  
  const client = url.startsWith('https') ? https : http;
  client.get(url, (stream) => {
    stream.pipe(res);
  }).on('error', () => {
    res.status(500).json({ mensaje: 'Error descargando archivo' });
  });
});
