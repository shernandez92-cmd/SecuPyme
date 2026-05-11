const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { exportarReportes, exportarReporteIndividual, exportarAutoevaluaciones } = require('../controllers/pdfController');

const verificarTokenPDF = (req, res, next) => {
  const token = req.query.token;
  if (!token) return res.status(401).json({ mensaje: 'Token requerido' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ mensaje: 'Token inválido' });
  }
};

router.get('/reportes', verificarTokenPDF, exportarReportes);
router.get('/reportes/:id', verificarTokenPDF, exportarReporteIndividual);
router.get('/autoevaluaciones', verificarTokenPDF, exportarAutoevaluaciones);

module.exports = router;
