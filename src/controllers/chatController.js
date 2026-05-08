const ChatGeneral = require('../models/ChatGeneral');
const Reporte = require('../models/Reporte');

const enviarMensaje = async (req, res) => {
  try {
    const mensaje = new ChatGeneral({
      usuario: req.usuario.id,
      texto: req.body.texto,
      reporteRelacionado: req.body.reporteRelacionado || null
    });
    await mensaje.save();
    const populado = await ChatGeneral.findById(mensaje._id)
      .populate('usuario', 'nombre rol')
      .populate('reporteRelacionado', 'empresa tipoVulnerabilidad');
    res.status(201).json(populado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

const obtenerMensajes = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;
    let mensajes;
    if (rol === 'admin') {
      mensajes = await ChatGeneral.find()
        .populate('usuario', 'nombre rol empresa')
        .populate('reporteRelacionado', 'empresa tipoVulnerabilidad')
        .sort({ fecha: 1 });
    } else {
      mensajes = await ChatGeneral.find({ usuario: usuarioId })
        .populate('usuario', 'nombre rol empresa')
        .populate('reporteRelacionado', 'empresa tipoVulnerabilidad')
        .sort({ fecha: 1 });
    }
    res.json(mensajes);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

const obtenerReportesUsuario = async (req, res) => {
  try {
    const rol = req.usuario.rol;
    let reportes;
    if (rol === 'admin') {
      reportes = await Reporte.find().populate('usuario', 'nombre empresa');
    } else {
      reportes = await Reporte.find({ usuario: req.usuario.id });
    }
    res.json(reportes);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

module.exports = { enviarMensaje, obtenerMensajes, obtenerReportesUsuario };
