
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


const exportarReporteEjecutivo = async (req, res, next) => {
  try {
    const Autoevaluacion = require('../models/Autoevaluacion');
    const RiskScore      = require('../models/RiskScore');
    const Usuario        = require('../models/Usuario');

    const usuarioId = req.usuario.id || req.usuario._id;
    const usuario   = await Usuario.findById(usuarioId).lean();
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const [evaluaciones, reportes, riskScore] = await Promise.all([
      Autoevaluacion.find({ usuario: usuarioId }).sort({ fecha: -1 }).limit(5).lean(),
      Reporte.find({ usuario: usuarioId }).sort({ fecha: -1 }).lean(),
      RiskScore.findOne({ empresaId: usuarioId }).lean(),
    ]);

    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: false });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename=reporte-ejecutivo-${usuario.empresa.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
    doc.pipe(res);

    // ── Encabezado ────────────────────────────────────────────────────────────
    doc.strokeColor(colors.moradoClaro).lineWidth(3)
       .moveTo(50, 45).lineTo(545, 45).stroke();

    doc.fontSize(22).fillColor(colors.moradoClaro).font('Helvetica-Bold')
       .text('SECUPYME', { align: 'center' });
    doc.fontSize(12).fillColor(colors.textoSuave).font('Helvetica')
       .text('Reporte Ejecutivo de Ciberseguridad', { align: 'center' });
    doc.fontSize(9).fillColor(colors.textoSuave)
       .text(`Generado: ${new Date().toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })}`, { align: 'center' });

    doc.strokeColor(colors.moradoClaro).lineWidth(1)
       .moveTo(50, doc.y + 8).lineTo(545, doc.y + 8).stroke();
    doc.moveDown(2);

    // ── Datos de la empresa ───────────────────────────────────────────────────
    crearSeccion(doc, '1. IDENTIFICACIÓN DE LA EMPRESA');

    const datosEmpresa = [
      ['Empresa',    usuario.empresa],
      ['Responsable', usuario.nombre],
      ['Correo',     usuario.email],
      ['Plan',       usuario.plan.toUpperCase()],
    ];
    datosEmpresa.forEach(([label, valor]) => {
      const y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.moradoClaro)
         .text(label, 50, y, { width: 140 });
      doc.fontSize(9).font('Helvetica').fillColor(colors.texto)
         .text(valor, 200, y, { width: 300 });
      doc.moveDown(0.6);
    });

    doc.moveDown(0.5);

    // ── Nivel de riesgo global ────────────────────────────────────────────────
    crearSeccion(doc, '2. ESTADO DE RIESGO GLOBAL');

    const ultimaEval   = evaluaciones[0];
    const nivelRiesgo  = ultimaEval?.nivelRiesgo || 'sin datos';
    const puntaje      = ultimaEval?.puntaje ?? '—';
    const colorNivel   = nivelRiesgo === 'alto' ? colors.rojo
                       : nivelRiesgo === 'medio' ? colors.amarillo
                       : nivelRiesgo === 'bajo'  ? colors.verde
                       : colors.textoSuave;

    const scoreRisk = riskScore?.score ?? '—';
    const nivelRisk = riskScore?.nivel ?? '—';

    // Caja de nivel
    const cajaY = doc.y;
    doc.roundedRect(50, cajaY, 490, 64, 6).stroke(colors.borde);

    doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.moradoClaro)
       .text('Nivel de riesgo (última autoevaluación)', 65, cajaY + 10);
    doc.fontSize(22).font('Helvetica-Bold').fillColor(colorNivel)
       .text(nivelRiesgo.toUpperCase(), 65, cajaY + 26);
    doc.fontSize(10).font('Helvetica').fillColor(colors.textoSuave)
       .text(`Puntaje: ${puntaje}/20`, 65, cajaY + 50);

    doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.moradoClaro)
       .text('Risk Score', 320, cajaY + 10);
    doc.fontSize(22).font('Helvetica-Bold').fillColor(colorNivel)
       .text(`${scoreRisk}`, 320, cajaY + 26);
    doc.fontSize(10).font('Helvetica').fillColor(colors.textoSuave)
       .text(`Nivel: ${nivelRisk}`, 320, cajaY + 50);

    doc.y = cajaY + 80;
    doc.moveDown(0.5);

    // ── Resumen de incidentes ─────────────────────────────────────────────────
    crearSeccion(doc, '3. RESUMEN DE INCIDENTES');

    const abiertos    = reportes.filter(r => r.estado === 'abierto').length;
    const enProceso   = reportes.filter(r => r.estado === 'en proceso').length;
    const resueltos   = reportes.filter(r => r.estado === 'resuelto').length;
    const criticos    = reportes.filter(r => r.prioridad === 'alta').length;

    const metricas = [
      ['Total de reportes',    reportes.length,  colors.texto],
      ['Abiertos',             abiertos,          colors.rojo],
      ['En proceso',           enProceso,         colors.amarillo],
      ['Resueltos',            resueltos,         colors.verde],
      ['Prioridad alta',       criticos,          colors.rojo],
    ];

    const colW = 95;
    const startX = 50;
    const metY = doc.y;

    metricas.forEach(([label, valor, color], i) => {
      const x = startX + i * colW;
      doc.roundedRect(x, metY, colW - 8, 52, 4).stroke(colors.borde);
      doc.fontSize(18).font('Helvetica-Bold').fillColor(color)
         .text(String(valor), x, metY + 8, { width: colW - 8, align: 'center' });
      doc.fontSize(8).font('Helvetica').fillColor(colors.textoSuave)
         .text(label, x, metY + 34, { width: colW - 8, align: 'center' });
    });

    doc.y = metY + 66;
    doc.moveDown(0.5);

    // ── Últimos incidentes ────────────────────────────────────────────────────
    if (reportes.length > 0) {
      crearSeccion(doc, '4. INCIDENTES RECIENTES');
      const recientes = reportes.slice(0, 5);
      recientes.forEach((r, i) => {
        const colorEstado = r.estado === 'abierto' ? colors.rojo
                          : r.estado === 'en proceso' ? colors.amarillo : colors.verde;
        const y = doc.y;
        doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.texto)
           .text(`${i + 1}. ${r.tipoVulnerabilidad}`, 50, y, { width: 280 });
        doc.fontSize(9).font('Helvetica').fillColor(colorEstado)
           .text(r.estado.toUpperCase(), 340, y, { width: 100 });
        doc.fontSize(9).fillColor(colors.textoSuave)
           .text(new Date(r.fecha).toLocaleDateString('es-CO'), 450, y, { width: 90 });
        doc.fontSize(8).font('Helvetica').fillColor(colors.textoSuave)
           .text(r.descripcion.substring(0, 80) + (r.descripcion.length > 80 ? '...' : ''), 50, doc.y, { width: 490 });
        doc.moveDown(0.8);
      });
      doc.moveDown(0.3);
    }

    // ── Recomendaciones ───────────────────────────────────────────────────────
    if (ultimaEval?.recomendaciones?.length > 0) {
      crearSeccion(doc, '5. PLAN DE ACCIÓN RECOMENDADO');
      ultimaEval.recomendaciones.slice(0, 6).forEach((r, i) => {
        doc.fontSize(9).font('Helvetica').fillColor(colors.texto)
           .text(`${i + 1}.  ${r}`, 50, doc.y, { width: 490 });
        doc.moveDown(0.5);
      });
      doc.moveDown(0.3);
    }

    // ── Tendencia de autoevaluaciones ─────────────────────────────────────────
    if (evaluaciones.length > 1) {
      crearSeccion(doc, '6. TENDENCIA DE PUNTAJES');
      evaluaciones.slice().reverse().forEach(e => {
        const barW = Math.round((e.puntaje / 20) * 300);
        const barColor = e.nivelRiesgo === 'alto' ? colors.rojo
                       : e.nivelRiesgo === 'medio' ? colors.amarillo : colors.verde;
        const y = doc.y;
        doc.fontSize(8).font('Helvetica').fillColor(colors.textoSuave)
           .text(new Date(e.fecha).toLocaleDateString('es-CO'), 50, y, { width: 80 });
        doc.rect(140, y + 1, barW, 10).fill(barColor);
        doc.fontSize(8).fillColor(colors.texto)
           .text(`${e.puntaje}/20`, 450, y, { width: 60 });
        doc.moveDown(0.9);
      });
      doc.moveDown(0.3);
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.moveDown(1);
    doc.strokeColor(colors.moradoClaro).lineWidth(1)
       .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor(colors.textoSuave).font('Helvetica')
       .text('Secupyme © 2026 — Plataforma de Ciberseguridad para PYMEs Colombianas', { align: 'center' });
    doc.fontSize(7).fillColor(colors.borde)
       .text('Documento confidencial — Generado automáticamente', { align: 'center' });

    doc.end();
  } catch (error) {
    logger.error('Error en exportarReporteEjecutivo:', error);
    if (!res.headersSent) next(error);
  }
};

module.exports = { exportarReportes, exportarReporteIndividual, exportarAutoevaluaciones, exportarReporteEjecutivo };
