const logger = require('../utils/logger');
const Conversation = require('../models/Conversation');
const Usuario = require('../models/Usuario');

const getConversaciones = async (req, res, next) => {
  try {
    const { rol, id: userId } = req.usuario;

    let conversations;
    if (rol === 'admin') {
      conversations = await Conversation.find({ adminId: userId, empresaId: { $ne: null } })
        .populate('empresaId', 'nombre empresa rol')
        .sort({ ultimaActividad: -1 });
    } else {
      const conv = await Conversation.findOne({ empresaId: userId });
      conversations = conv ? [conv] : [];
    }

    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

const getConversacionActual = async (req, res, next) => {
  try {
    const { rol, id: userId } = req.usuario;
    let conversation;

    if (rol === 'admin') {
      conversation = await Conversation.findOne({ adminId: userId })
        .sort({ ultimaActividad: -1 });
    } else {
      conversation = await Conversation.findOne({ empresaId: userId });

      if (!conversation) {
        try {
          const admin = await Usuario.findOne({ rol: 'admin' }).select('_id').lean();
          const adminId = admin ? admin._id : userId;
          conversation = new Conversation({
            adminId: adminId,
            empresaId: userId,
            ultimoMensaje: null,
            ultimaActividad: new Date(),
            creadaEn: new Date(),
          });
          await conversation.save();
        } catch (e) {
          if (e.code === 11000) {
            conversation = await Conversation.findOne({ empresaId: userId });
          } else {
            logger.error('Error al crear conversación:', e.message);
            return res.json({ _id: null });
          }
        }
      }
    }

    if (!conversation) return res.json({ _id: null });

    res.json({
      _id: conversation._id,
      adminId: conversation.adminId,
      empresaId: conversation.empresaId,
      ultimoMensaje: conversation.ultimoMensaje,
      ultimaActividad: conversation.ultimaActividad,
    });
  } catch (error) {
    logger.error('Error en /actual:', error.message);
    res.json({ _id: null });
  }
};

const crearConversacion = async (req, res, next) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Solo admins pueden crear conversaciones' });
    }

    const { empresaId } = req.body;
    if (!empresaId) {
      return res.status(400).json({ mensaje: 'empresaId requerido' });
    }

    const adminId = req.usuario.id;
    let conversation = await Conversation.findOne({ adminId, empresaId });

    if (!conversation) {
      try {
        conversation = await Conversation.create({
          adminId,
          empresaId,
          ultimoMensaje: null,
          ultimaActividad: new Date(),
          creadaEn: new Date(),
        });
      } catch (e) {
        if (e.code === 11000) {
          conversation = await Conversation.findOne({ adminId, empresaId });
        } else {
          throw e;
        }
      }
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

module.exports = { getConversaciones, getConversacionActual, crearConversacion };
