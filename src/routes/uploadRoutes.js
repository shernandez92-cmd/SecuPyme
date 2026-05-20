const express = require('express');
const router = express.Router();
const { upload, subirArchivo } = require('../controllers/uploadController');
const { verificarToken } = require('../middleware/auth');
const axios = require('axios');

router.post('/', verificarToken, upload.single('archivo'), subirArchivo);

router.get('/descargar', async (req, res, next) => {
  const { url, nombre } = req.query;
  if (!url) return res.status(400).json({ mensaje: 'URL requerida' });
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nombre || 'archivo.pdf'}"`);
    response.data.pipe(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
