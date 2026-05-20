const logger = require('../utils/logger');
const Mensaje = require('../models/Mensaje');

const enviarMensaje = async (req, res, next) => {
  try {
    const mensaje = new Mensaje({
      reporte: req.params.reporteId,
      usuario: req.usuario.id,
      texto: req.body.texto
    });
    await mensaje.save();
    const mensajePopulado = await Mensaje.findById(mensaje._id).populate('usuario', 'nombre rol');
    res.status(201).json(mensajePopulado);
  } catch (error) {
    next(error);
  }
};

const obtenerMensajes = async (req, res, next) => {
  try {
    const mensajes = await Mensaje.find({ reporte: req.params.reporteId })
      .populate('usuario', 'nombre rol')
      .sort({ fecha: 1 });
    res.json(mensajes);
  } catch (error) {
    next(error);
  }
};

module.exports = { enviarMensaje, obtenerMensajes };
