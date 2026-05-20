
const logger = require('../utils/logger');
const PDFDocument = require('pdfkit');
const Reporte = require('../models/Reporte');

// Color scheme matching the app
const colors = {
  primaryDark: '#050508',
  moradoOscuro: '#0d0618',
  morado: '#4a1a8a',
  moradoClaro: '#7c3aed',
  acento: '#a855f7',
  acentoBrillante: '#d946ef',
  texto: '#e2d9f3',
  textoSuave: '#6b5a8a',
  borde: '#1a0a2e',
  verde: '#00ff41',
  rojo: '#ff4444',
  amarillo: '#ffbb44',
};

// Función para crear el documento PDF base con tema oscuro
const crearDocumentoPDF = (doc, titulo, subtitulo = null) => {
  // Línea decorativa superior
  doc.strokeColor(colors.moradoClaro).lineWidth(2).moveTo(50, 40).lineTo(510, 40).stroke();
  
  doc.fontSize(26).fillColor(colors.moradoClaro).font('Helvetica-Bold').text(titulo, { align: 'center' });
  
  if (subtitulo) {
    doc.fontSize(11).fillColor(colors.textoSuave).font('Helvetica').text(subtitulo, { align: 'center' });
  }
  
  doc.fontSize(8).fillColor(colors.textoSuave).text(`GENERADO: ${new Date().toLocaleDateString('es-CO')}`, { align: 'center' });
  doc.moveDown(1.5);
};

// Función para crear secciones con encabezado
const crearSeccion = (doc, titulo) => {
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor(colors.moradoClaro).font('Helvetica-Bold').text(titulo);
  doc.moveDown(0.3);
};

const exportarReporteIndividual = async (req, res, next) => {
  try {
    const rol = req.usuario.rol;
    const usuarioId = req.usuario.id || req.usuario._id;
    const reporteId = req.params.id;

    const reporte = await Reporte.findById(reporteId).lean();
    
    if (!reporte) {
      return res.status(404).json({ mensaje: 'Reporte no encontrado' });
    }

    if (rol !== 'admin' && reporte.usuario.toString() !== usuarioId.toString()) {
      return res.status(403).json({ mensaje: 'No tienes permiso para descargar este reporte' });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: false });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-${reporte.empresa.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
    
    doc.pipe(res);

    // Encabezado
    crearDocumentoPDF(doc, 'SECUPYME', 'Reporte Individual de Seguridad');
    
    // Información principal
    crearSeccion(doc, 'INFORMACIÓN DEL REPORTE');
    
    doc.fontSize(9).fillColor(colors.textoSuave);
    const dataItems = [
      { label: 'EMPRESA', value: reporte.empresa, highlight: true },
      { label: 'TIPO', value: reporte.tipoVulnerabilidad.toUpperCase(), highlight: false },
      { label: 'ESTADO', value: reporte.estado, badge: true },
      { label: 'PRIORIDAD', value: reporte.prioridad.toUpperCase(), highlight: false },
      { label: 'FECHA', value: new Date(reporte.fecha).toLocaleDateString('es-CO'), highlight: false }
    ];

    dataItems.forEach((item) => {
      const currentY = doc.y;
      
      doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.moradoClaro).text(item.label, 50, currentY, { width: 150 });
      
      if (item.badge && item.value === 'abierto') {
        doc.fillColor(colors.rojo);
      } else if (item.badge && item.value === 'en proceso') {
        doc.fillColor(colors.amarillo);
      } else if (item.badge && item.value === 'resuelto') {
        doc.fillColor(colors.verde);
      } else if (item.highlight) {
        doc.fillColor(colors.acentoBrillante).font('Helvetica-Bold');
      } else {
        doc.fillColor(colors.texto).font('Helvetica');
      }
      
      doc.fontSize(9).text(item.value, 210, currentY, { width: 200 });
      doc.moveDown(0.8);
    });

    doc.moveDown(0.5);
    
    // Descripción del incidente
    crearSeccion(doc, 'DESCRIPCIÓN');
    doc.fontSize(10).fillColor(colors.texto).font('Helvetica');
    doc.text(reporte.descripcion.substring(0, 500), { width: 495, align: 'left' });
    
    doc.moveDown(1);
    
    // Notas del admin si existen
    if (reporte.notasAdmin && reporte.notasAdmin.trim()) {
      crearSeccion(doc, 'NOTAS Y RECOMENDACIONES');
      doc.fontSize(9).fillColor(colors.texto).font('Helvetica');
      doc.text(reporte.notasAdmin.substring(0, 300), { width: 495, align: 'left' });
    }

    doc.moveDown(2);
    
    // Footer simple
    doc.fontSize(8).fillColor(colors.textoSuave);
    doc.text('Secupyme © 2026 - Plataforma de Seguridad para PYMEs Colombianas', { align: 'center' });
    doc.fontSize(8).fillColor(colors.borde);
    doc.text('Documento confidencial - Información sensible sobre incidentes de seguridad', { align: 'center' });

    doc.end();
  } catch (error) {
    logger.error('Error en exportarReporteIndividual:', error);
    if (!res.headersSent) {
      next(error);
    }
  }
};

const exportarReportes = async (req, res, next) => {
  try {
    const rol = req.usuario.rol;
    const usuarioId = req.usuario.id || req.usuario._id;
    let reportes;

    if (rol === 'admin') {
      reportes = await Reporte.find().select('empresa tipoVulnerabilidad estado descripcion fecha prioridad').sort({ fecha: -1 }).lean();
    } else {
      reportes = await Reporte.find({ usuario: usuarioId }).select('empresa tipoVulnerabilidad estado descripcion fecha prioridad').sort({ fecha: -1 }).lean();
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: false });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reportes-secupyme-' + Date.now() + '.pdf');

    doc.pipe(res);

    // Encabezado
    crearDocumentoPDF(doc, 'SECUPYME', 'Reporte Consolidado de Incidentes');
    
    // Información general
    doc.fontSize(9).fillColor(colors.textoSuave).font('Helvetica');
    doc.text(`Total de reportes: ${reportes.length}`);
    doc.text(`Tipo: ${rol === 'admin' ? 'Todos los reportes' : 'Tus reportes'}`);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`);
    doc.moveDown(1);
    
    if (reportes.length === 0) {
      doc.fontSize(12).fillColor(colors.textoSuave).text('No hay reportes disponibles', { align: 'center' });
    } else {
      // Tabla simple
      const colX = [50, 150, 280, 400, 480];
      const colWidths = [90, 120, 110, 70, 30];
      
      doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.moradoClaro);
      doc.text('EMPRESA', colX[0], doc.y, { width: colWidths[0] });
      doc.text('TIPO', colX[1], doc.y - 12, { width: colWidths[1] });
      doc.text('DESC', colX[2], doc.y - 12, { width: colWidths[2] });
      doc.text('ESTADO', colX[3], doc.y - 12, { width: colWidths[3] });
      doc.text('FECHA', colX[4], doc.y - 12, { width: colWidths[4] });
      
      doc.strokeColor(colors.moradoClaro).lineWidth(1).moveTo(50, doc.y).lineTo(510, doc.y).stroke();
      doc.moveDown(1);
      
      // Filas
      reportes.slice(0, 20).forEach((r) => {
        const empresa = r.empresa.substring(0, 14);
        const tipo = r.tipoVulnerabilidad.substring(0, 12);
        const desc = r.descripcion.substring(0, 20) + '...';
        const fecha = new Date(r.fecha).toLocaleDateString('es-CO');
        
        doc.fontSize(8).font('Helvetica').fillColor(colors.texto);
        doc.text(empresa, colX[0], doc.y, { width: colWidths[0] });
        doc.text(tipo, colX[1], doc.y - 10, { width: colWidths[1] });
        doc.text(desc, colX[2], doc.y - 10, { width: colWidths[2] });
        
        if (r.estado === 'abierto') doc.fillColor(colors.rojo);
        else if (r.estado === 'en proceso') doc.fillColor(colors.amarillo);
        else doc.fillColor(colors.verde);
        doc.text(r.estado.substring(0, 8), colX[3], doc.y - 10, { width: colWidths[3] });
        
        doc.fillColor(colors.textoSuave).text(fecha, colX[4], doc.y - 10, { width: colWidths[4] });
        doc.moveDown(0.9);
      });
    }

    doc.moveDown(1);
    doc.fontSize(8).fillColor(colors.textoSuave);
    doc.text('Secupyme © 2026 - Documento Confidencial', { align: 'center' });

    doc.end();
  } catch (error) {
    logger.error('Error en exportarReportes:', error);
    if (!res.headersSent) {
      next(error);
    }
  }
};
const exportarAutoevaluaciones = async (req, res, next) => {
  try {
    const Autoevaluacion = require('../models/Autoevaluacion');
    const evaluaciones = await Autoevaluacion.find({ usuario: req.usuario.id })
      .populate('usuario', 'nombre empresa').lean();

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=autoevaluaciones-secupyme.pdf');
    doc.pipe(res);

    crearDocumentoPDF(doc, 'SECUPYME', 'Historial de Autoevaluaciones de Seguridad');

    if (evaluaciones.length === 0) {
      doc.fontSize(12).fillColor(colors.textoSuave).text('No hay evaluaciones disponibles', { align: 'center' });
    } else {
      evaluaciones.forEach((e, i) => {
        crearSeccion(doc, `EVALUACIÓN #${i + 1}`);
        doc.fontSize(9).fillColor(colors.textoSuave).font('Helvetica');
        doc.text(`Empresa: ${e.usuario.empresa}`);
        doc.text(`Fecha: ${new Date(e.fecha).toLocaleDateString('es-CO')}`);
        doc.text(`Puntaje: ${e.puntaje}/20`);

        if (e.nivelRiesgo === 'alto') doc.fillColor(colors.rojo);
        else if (e.nivelRiesgo === 'medio') doc.fillColor(colors.amarillo);
        else doc.fillColor(colors.verde);
        doc.text(`Nivel de riesgo: ${e.nivelRiesgo.toUpperCase()}`);

        doc.fillColor(colors.textoSuave).moveDown(0.5);
        doc.font('Helvetica-Bold').text('Recomendaciones:');
        doc.font('Helvetica');
        e.recomendaciones.forEach(r => doc.text(`  • ${r}`));
        doc.moveDown(1.5);
      });
    }

    doc.fontSize(8).fillColor(colors.textoSuave).text('Secupyme © 2026 - Documento Confidencial', { align: 'center' });
    doc.end();
  } catch (error) {
    if (!res.headersSent) next(error);
  }
};

module.exports = { exportarReportes, exportarReporteIndividual, exportarAutoevaluaciones };
