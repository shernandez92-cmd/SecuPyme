const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const { verificarToken } = require('../middleware/auth');

// GET todas las conversaciones del usuario (admin: todas sus, empresa: la suya)
router.get('/', verificarToken, async (req, res) => {
  try {
    const rol = req.usuario.rol;
    const userId = req.usuario.id;
    
    let conversations;
    if (rol === 'admin') {
      conversations = await Conversation.find({ adminId: userId })
        .sort({ ultimaActividad: -1 });
    } else {
      const conv = await Conversation.findOne({ empresaId: userId });
      conversations = conv ? [conv] : [];
    }
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error obteniendo conversaciones', error });
  }
});

// GET conversación actual (crea si no existe)
router.get('/actual', verificarToken, async (req, res) => {
  try {
    const rol = req.usuario.rol;
    const userId = req.usuario.id;
    
    let conversation;
    
    if (rol === 'admin') {
      // Admin: primera conversación ordenada por reciente
      // Si no tiene conversaciones, retorna null (admin crea nuevas con empresas)
      conversation = await Conversation.findOne({ adminId: userId })
        .sort({ ultimaActividad: -1 });
    } else {
      // Empresa: buscar su conversación o crearla automáticamente
      conversation = await Conversation.findOne({ empresaId: userId });
      
      // Si no existe, crear automáticamente
      if (!conversation) {
        try {
          // Buscar cualquier admin para crear la conversación
          // En casos reales, podría haber lógica para seleccionar admin
          // Por ahora, crear sin adminId específico (se completa después)
          conversation = new Conversation({
            adminId: userId, // Placeholder, debería ser un admin real
            empresaId: userId,
            ultimoMensaje: null,
            ultimaActividad: new Date(),
            creadaEn: new Date()
          });
          
          // Intentar guardar (puede fallar por unique index si ya existe)
          try {
            await conversation.save();
          } catch (e) {
            if (e.code === 11000) {
              // Ya existe (race condition), buscar de nuevo
              conversation = await Conversation.findOne({ empresaId: userId });
            } else {
              throw e;
            }
          }
        } catch (createError) {
          console.log('Error al crear conversación:', createError.message);
          // Retornar null si falla (fallback frontend)
          return res.json({ _id: null });
        }
      }
    }
    
    // Retornar conversación o null si no existe
    res.json(conversation ? {
      _id: conversation._id,
      adminId: conversation.adminId,
      empresaId: conversation.empresaId,
      ultimoMensaje: conversation.ultimoMensaje,
      ultimaActividad: conversation.ultimaActividad
    } : { _id: null });
    
  } catch (error) {
    console.log('Error en /actual:', error.message);
    // Fallback: retornar null para que frontend siga en modo legacy
    res.json({ _id: null });
  }
});

// POST crear o encontrar conversación (solo admin)
router.post('/', verificarToken, async (req, res) => {
  try {
    const rol = req.usuario.rol;
    if (rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Solo admins pueden crear conversaciones' });
    }
    
    const { empresaId } = req.body;
    if (!empresaId) {
      return res.status(400).json({ mensaje: 'empresaId requerido' });
    }
    
    const adminId = req.usuario.id;
    
    // Buscar o crear
    let conversation = await Conversation.findOne({ adminId, empresaId });
    
    if (!conversation) {
      conversation = new Conversation({
        adminId,
        empresaId,
        ultimoMensaje: null,
        ultimaActividad: new Date(),
        creadaEn: new Date()
      });
      try {
        await conversation.save();
      } catch (e) {
        if (e.code === 11000) {
          // Ya existe, buscar
          conversation = await Conversation.findOne({ adminId, empresaId });
        } else {
          throw e;
        }
      }
    }
    
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error });
  }
});

module.exports = router;
