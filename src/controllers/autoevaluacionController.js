const logger = require('../utils/logger');
const Autoevaluacion = require('../models/Autoevaluacion');
const Pregunta       = require('../models/Pregunta');
const Usuario        = require('../models/Usuario');
const nodemailer     = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// ─── Calcular puntaje dinámico según preguntas activas ───────────────────────
const calcularPuntaje = (respuestas, preguntas) => {
  let puntaje = 0;
  let puntajeMaximo = 0;
  const recomendaciones = [];

  preguntas.forEach(p => {
    puntajeMaximo += p.peso;
    if (respuestas[p.campo] === true) {
      puntaje += p.peso;
    } else {
      recomendaciones.push(p.recomendacion || `Mejorar: ${p.texto}`);
    }
  });

  // Normalizar a escala 0-20 para mantener compatibilidad con historial
  const puntajeNormalizado = puntajeMaximo > 0
    ? Math.round((puntaje / puntajeMaximo) * 20)
    : 0;

  let nivelRiesgo;
  if (puntajeNormalizado >= 16)     nivelRiesgo = 'bajo';
  else if (puntajeNormalizado >= 10) nivelRiesgo = 'medio';
  else                               nivelRiesgo = 'alto';

  return { puntaje: puntajeNormalizado, puntajeRaw: puntaje, puntajeMaximo, nivelRiesgo, recomendaciones };
};

// ─── GET preguntas activas (para el formulario) ───────────────────────────────
const obtenerPreguntas = async (req, res, next) => {
  try {
    const preguntas = await Pregunta.find({ activa: true }).sort({ orden: 1, fechaCreacion: 1 });
    res.json(preguntas);
  } catch (error) {
    next(error);
  }
};

// ─── GET todas las preguntas (admin) ─────────────────────────────────────────
const obtenerTodasPreguntas = async (req, res, next) => {
  try {
    const preguntas = await Pregunta.find().sort({ orden: 1, fechaCreacion: 1 });
    res.json(preguntas);
  } catch (error) {
    next(error);
  }
};

// ─── POST pregunta nueva (admin) ──────────────────────────────────────────────
const crearPregunta = async (req, res, next) => {
  try {
    const { texto, campo, categoria, peso, recomendacion, orden } = req.body;
    if (!texto || !campo || !peso) {
      return res.status(400).json({ mensaje: 'texto, campo y peso son requeridos' });
    }
    const existe = await Pregunta.findOne({ campo });
    if (existe) return res.status(400).json({ mensaje: `El campo '${campo}' ya existe` });

    const pregunta = await Pregunta.create({ texto, campo, categoria, peso, recomendacion, orden: orden || 0 });
    res.status(201).json({ mensaje: 'Pregunta creada', pregunta });
  } catch (error) {
    next(error);
  }
};

// ─── PUT activar/desactivar pregunta (admin) ─────────────────────────────────
const togglePregunta = async (req, res, next) => {
  try {
    const pregunta = await Pregunta.findById(req.params.id);
    if (!pregunta) return res.status(404).json({ mensaje: 'Pregunta no encontrada' });
    pregunta.activa = !pregunta.activa;
    await pregunta.save();
    res.json({ mensaje: `Pregunta ${pregunta.activa ? 'activada' : 'desactivada'}`, pregunta });
  } catch (error) {
    next(error);
  }
};

// ─── POST autoevaluación ──────────────────────────────────────────────────────
const crearAutoevaluacion = async (req, res, next) => {
  try {
    const { respuestas } = req.body;
    const preguntas = await Pregunta.find({ activa: true }).sort({ orden: 1, fechaCreacion: 1 });

    if (preguntas.length === 0) {
      return res.status(400).json({ mensaje: 'No hay preguntas activas configuradas' });
    }

    const totalPreguntas = preguntas.length;
    const respondidas = preguntas.filter(p => respuestas[p.campo] !== undefined).length;
    if (respondidas < totalPreguntas) {
      return res.status(400).json({ mensaje: `Por favor responde todas las preguntas (${respondidas}/${totalPreguntas})` });
    }

    const { puntaje, nivelRiesgo, recomendaciones } = calcularPuntaje(respuestas, preguntas);

    const autoevaluacion = new Autoevaluacion({
      usuario: req.usuario.id,
      respuestas,
      puntaje,
      nivelRiesgo,
      recomendaciones
    });
    await autoevaluacion.save();

    const { actualizarRisk } = require('./riskController');
    await actualizarRisk(req.usuario.id, `autoevaluacion_${nivelRiesgo}`);

    if (nivelRiesgo === 'alto') {
      const usuario = await Usuario.findById(req.usuario.id);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `⚠ ALERTA RIESGO ALTO — ${usuario.empresa}`,
        text: `La empresa ${usuario.empresa} tiene nivel de riesgo ALTO.\n\nPuntaje: ${puntaje}/20\n\nRecomendaciones:\n${recomendaciones.join('\n')}`
      });
    }

    res.status(201).json({ mensaje: 'Autoevaluación completada', puntaje, nivelRiesgo, recomendaciones });
  } catch (error) {
    next(error);
  }
};

// ─── GET historial ────────────────────────────────────────────────────────────
const obtenerAutoevaluaciones = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filtro = req.usuario.rol === 'admin' ? {} : { usuario: req.usuario.id };

    const [autoevaluaciones, total] = await Promise.all([
      Autoevaluacion.find(filtro).populate('usuario', 'nombre email empresa')
        .sort({ fecha: -1 }).skip(skip).limit(limit),
      Autoevaluacion.countDocuments(filtro)
    ]);

    res.json({ autoevaluaciones, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerPreguntas,
  obtenerTodasPreguntas,
  crearPregunta,
  togglePregunta,
  crearAutoevaluacion,
  obtenerAutoevaluaciones
};
