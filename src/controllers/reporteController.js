const Reporte = require('../models/Reporte');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const crearReporte = async (req, res) => {
  try {
    const { empresa, tipoVulnerabilidad, descripcion } = req.body;

    const reporte = new Reporte({
      usuario: req.usuario.id,
      empresa,
      tipoVulnerabilidad,
      descripcion
    });

    await reporte.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Nuevo reporte de seguridad - ${empresa}`,
      text: `Se ha recibido un nuevo reporte de seguridad.\n\nEmpresa: ${empresa}\nTipo: ${tipoVulnerabilidad}\nDescripción: ${descripcion}\n\nIngresa a Secupyme para gestionar este reporte.`
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ mensaje: 'Reporte creado exitosamente', reporte });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

const obtenerReportes = async (req, res) => {
  try {
    let reportes;

    if (req.usuario.rol === 'admin') {
      reportes = await Reporte.find().populate('usuario', 'nombre email empresa');
    } else {
      reportes = await Reporte.find({ usuario: req.usuario.id });
    }

    res.json(reportes);

  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

const obtenerReporte = async (req, res) => {
  try {
    const reporte = await Reporte.findById(req.params.id).populate('usuario', 'nombre email empresa');

    if (!reporte) {
      return res.status(404).json({ mensaje: 'Reporte no encontrado' });
    }

    res.json(reporte);

  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

const actualizarReporte = async (req, res) => {
  try {
    const { estado, prioridad, notasAdmin } = req.body;

    const reporte = await Reporte.findByIdAndUpdate(
      req.params.id,
      { estado, prioridad, notasAdmin },
      { new: true }
    ).populate('usuario', 'nombre email empresa');

    if (!reporte) {
      return res.status(404).json({ mensaje: 'Reporte no encontrado' });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: reporte.usuario.email,
      subject: `Actualización de tu reporte - ${reporte.empresa}`,
      text: `Tu reporte ha sido actualizado.\n\nEstado: ${estado}\nPrioridad: ${prioridad}\n\nNotas del equipo de Secupyme:\n${notasAdmin}\n\nIngresa a Secupyme para ver más detalles.`
    };

    await transporter.sendMail(mailOptions);

    res.json({ mensaje: 'Reporte actualizado', reporte });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const reporte = await Reporte.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    );

    if (!reporte) {
      return res.status(404).json({ mensaje: 'Reporte no encontrado' });
    }

    res.json({ mensaje: 'Estado actualizado', reporte });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

module.exports = { crearReporte, obtenerReportes, obtenerReporte, actualizarReporte, actualizarEstado };
