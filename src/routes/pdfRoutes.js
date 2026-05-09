const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { exportarReportes, exportarReporteIndividual } = require('../controllers/pdfController');

// Middleware para verificar token desde query param
const verificarTokenPDF = (req, res, next) => {
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado, token requerido' });
  }

  try {
    const verificado = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = verificado;
    next();
  } catch (error) {
    res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};

router.get('/reportes', verificarTokenPDF, exportarReportes);
router.get('/reportes/:id', verificarTokenPDF, exportarReporteIndividual);

module.exports = router;
