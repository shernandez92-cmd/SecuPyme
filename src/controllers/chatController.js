const logger = require('../utils/logger');
const ChatGeneral = require('../models/ChatGeneral');
const Reporte = require('../models/Reporte');
const Conversation = require('../models/Conversation');

const enviarMensaje = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const rol = req.usuario.rol;
    const { texto, reporteRelacionado, paraId } = req.body;

    let conversation = null;
    let empresaId = userId;

    if (rol === "admin") {
      if (paraId) {
        conversation = await Conversation.findOne({ adminId: userId, empresaId: paraId });
        empresaId = paraId;
      } else {
        conversation = await Conversation.findOne({ adminId: userId }).sort({ ultimaActividad: -1 });
        if (conversation) empresaId = conversation.empresaId;
      }
    } else {
      conversation = await Conversation.findOne({ empresaId: userId });
    }

    const mensaje = new ChatGeneral({
      usuario: userId,
      empresaId: empresaId,
      texto,
      conversationId: conversation ? conversation._id : null,
      reporteRelacionado: reporteRelacionado || null
    });

    await mensaje.save();

    if (conversation) {
      const updateData = {
        ultimoMensaje: texto,
        ultimaActividad: new Date()
      };
      if (rol !== "admin") {
        updateData["$inc"] = { noLeidos: 1 };
      } else {
        updateData.noLeidos = 0;
      }
      await Conversation.findByIdAndUpdate(conversation._id, updateData);
    }

    const populado = await ChatGeneral.findById(mensaje._id)
      .populate('usuario', 'nombre rol empresa')
      .populate('reporteRelacionado', 'empresa tipoVulnerabilidad');

    const io = req.app.get('io');
    if (io) {
      if (conversation) {
        io.to(`conv:${conversation._id}`).emit('nuevoMensaje', populado);
      } else {
        io.emit('nuevoMensaje', populado);
      }
    }

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

    if (rol === "admin") {
      const conId = req.query.conId;
      const filtro = conId ? { empresaId: conId } : {};
      mensajes = await ChatGeneral.find(filtro)
        .populate("usuario", "nombre rol empresa")
        .populate("reporteRelacionado", "empresa tipoVulnerabilidad")
        .sort({ fecha: 1 });
    } else {
      mensajes = await ChatGeneral.find({
        $or: [
          { usuario: usuarioId },
          { empresaId: usuarioId }
        ]
      })
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
    res.status(500).json({ mensaje: 'Error', error });
  }
};

const borrarChat = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const rol = req.usuario.rol;
    if (rol === 'admin') {
      await ChatGeneral.deleteMany({});
    } else {
      await ChatGeneral.deleteMany({
        $or: [{ usuario: userId }, { empresaId: userId }]
      });
    }
    res.json({ mensaje: 'Chat borrado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error });
  }
};


const marcarLeido = async (req, res) => {
  try {
    const { conversacionId } = req.params;
    await Conversation.findByIdAndUpdate(conversacionId, { noLeidos: 0 });
    res.json({ mensaje: 'Marcado como leído' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error });
  }
};
module.exports = { enviarMensaje, obtenerMensajes, obtenerReportesUsuario, borrarChat, marcarLeido };
