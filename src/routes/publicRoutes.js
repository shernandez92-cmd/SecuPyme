const express = require('express');
const router = express.Router();
const apiKeyAuth = require('../middleware/apiKey');
const { verificarToken } = require('../middleware/auth');
const Reporte = require('../models/Reporte');
const Autoevaluacion = require('../models/Autoevaluacion');
const crypto = require('crypto');
const Usuario = require('../models/Usuario');

const parsePagination = (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

router.post('/apikey', verificarToken, async (req, res, next) => {
  try {
    const rawKey    = crypto.randomUUID();
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    await Usuario.findByIdAndUpdate(req.usuario.id, { apiKey: hashedKey });
    res.json({ apiKey: rawKey, nota: 'Guarda esta clave, no se mostrará de nuevo.' });
  } catch (e) {
    next(e);
  }
});

router.get('/reportes', apiKeyAuth, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filtro = { usuario: req.usuario.id };
    const [reportes, total] = await Promise.all([
      Reporte.find(filtro).sort({ fecha: -1 }).skip(skip).limit(limit),
      Reporte.countDocuments(filtro),
    ]);
    res.json({
      data: reportes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    next(e);
  }
});

router.post('/reportes', apiKeyAuth, async (req, res, next) => {
  try {
    const { empresa, tipoVulnerabilidad, descripcion } = req.body;
    const reporte = new Reporte({ usuario: req.usuario.id, empresa, tipoVulnerabilidad, descripcion });
    await reporte.save();
    res.status(201).json(reporte);
  } catch (e) {
    next(e);
  }
});

router.get('/autoevaluaciones', apiKeyAuth, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filtro = { usuario: req.usuario.id };
    const [evaluaciones, total] = await Promise.all([
      Autoevaluacion.find(filtro).sort({ fecha: -1 }).skip(skip).limit(limit),
      Autoevaluacion.countDocuments(filtro),
    ]);
    res.json({
      data: evaluaciones,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
