const express = require('express');
const router = express.Router();
const apiKeyAuth = require('../middleware/apiKey');
const Reporte = require('../models/Reporte');
const Autoevaluacion = require('../models/Autoevaluacion');
const crypto = require('crypto');
const Usuario = require('../models/Usuario');

router.post('/apikey', async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.body.userId,
      { apiKey: crypto.randomUUID() },
      { new: true }
    );
    res.json({ apiKey: usuario.apiKey });
  } catch (e) {
    res.status(500).json({ mensaje: 'Error', e });
  }
});

router.get('/reportes', apiKeyAuth, async (req, res) => {
  const reportes = await Reporte.find({ usuario: req.usuario.id });
  res.json(reportes);
});

router.post('/reportes', apiKeyAuth, async (req, res) => {
  const { empresa, tipoVulnerabilidad, descripcion } = req.body;
  const reporte = new Reporte({ usuario: req.usuario.id, empresa, tipoVulnerabilidad, descripcion });
  await reporte.save();
  res.status(201).json(reporte);
});

router.get('/autoevaluaciones', apiKeyAuth, async (req, res) => {
  const evaluaciones = await Autoevaluacion.find({ usuario: req.usuario.id });
  res.json(evaluaciones);
});

module.exports = router;
