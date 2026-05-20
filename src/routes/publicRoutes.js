const express = require('express');
const router = express.Router();
const apiKeyAuth = require('../middleware/apiKey');
const { verificarToken } = require('../middleware/auth');
const Reporte = require('../models/Reporte');
const Autoevaluacion = require('../models/Autoevaluacion');
const crypto = require('crypto');
const Usuario = require('../models/Usuario');

router.post('/apikey', verificarToken, async (req, res, next) => {
  try {
    const rawKey = crypto.randomUUID();
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    await Usuario.findByIdAndUpdate(req.usuario.id, { apiKey: hashedKey });
    // Retornar solo una vez — no se puede recuperar después
    res.json({ apiKey: rawKey, nota: 'Guarda esta clave, no se mostrará de nuevo.' });
  } catch (e) {
    next(e);
  }
});

router.get('/reportes', apiKeyAuth, async (req, res, next) => {
  const reportes = await Reporte.find({ usuario: req.usuario.id });
  res.json(reportes);
});

router.post('/reportes', apiKeyAuth, async (req, res, next) => {
  const { empresa, tipoVulnerabilidad, descripcion } = req.body;
  const reporte = new Reporte({ usuario: req.usuario.id, empresa, tipoVulnerabilidad, descripcion });
  await reporte.save();
  res.status(201).json(reporte);
});

router.get('/autoevaluaciones', apiKeyAuth, async (req, res, next) => {
  const evaluaciones = await Autoevaluacion.find({ usuario: req.usuario.id });
  res.json(evaluaciones);
});

module.exports = router;
