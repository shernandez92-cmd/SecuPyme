const logger = require('../utils/logger');
const cron = require('node-cron');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const Usuario = require('../models/Usuario');
const { actualizarRisk } = require('../controllers/riskController');
const { registrarEvento } = require('../controllers/siemController');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const notificarPorCorreo = async (email, nombre, ip, hallazgos) => {
  try {
    await transporter.sendMail({
      from: `"SecuPyme" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `⚠️ Alerta de seguridad — IP ${ip} monitoreada`,
      html: `
        <div style="font-family: monospace; background: #0d0618; color: #e2e8f0; padding: 24px; border-radius: 8px;">
          <h2 style="color: #7c3aed;">⚠️ SecuPyme — Alerta de monitoreo automático</h2>
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>El monitoreo automático de la IP <strong>${ip}</strong> detectó lo siguiente:</p>
          <ul>
            ${hallazgos.map(h => `<li style="margin-bottom: 8px;">${h}</li>`).join('')}
          </ul>
          <p>Ingresa a tu panel para revisar el detalle en SIEM y Risk Score.</p>
          <a href="${process.env.FRONTEND_URL}/siem.html"
             style="display:inline-block; margin-top:16px; padding:10px 20px;
                    background:#7c3aed; color:#fff; border-radius:4px; text-decoration:none;">
            Ver en SIEM
          </a>
          <p style="margin-top: 24px; color: #94a3b8; font-size: 12px;">
            Este es un mensaje automático de SecuPyme. No respondas este correo.
          </p>
        </div>
      `
    });
  } catch (e) {
    logger.info('[MONITOREO] Error enviando correo:', e.message);
  }
};

const consultarIPShodan = async (ip) => {
  try {
    const response = await fetch(
      `https://api.shodan.io/shodan/host/${ip}?key=${process.env.SHODAN_KEY}`
    );
    const data = await response.json();
    if (data.error) return null;
    return {
      puertos: data.ports || [],
      vulns: data.vulns ? Object.keys(data.vulns) : [],
      org: data.org || '',
      os: data.os || ''
    };
  } catch (e) {
    logger.info(`[MONITOREO] Error consultando Shodan para ${ip}:`, e.message);
    return null;
  }
};

const puertosCriticos = [22, 23, 3389, 445, 139, 21, 3306, 5432];

const ejecutarMonitoreo = async () => {
  logger.info('[MONITOREO] Iniciando ciclo de monitoreo de IPs...');

  try {
    // Traer solo usuarios con IPs monitoreadas
    const usuarios = await Usuario.find({
      ipsMonitoreadas: { $exists: true, $not: { $size: 0 } }
    }).select('nombre email empresa ipsMonitoreadas');

    if (usuarios.length === 0) {
      logger.info('[MONITOREO] No hay IPs registradas para monitorear.');
      return;
    }

    for (const usuario of usuarios) {
      for (const ip of usuario.ipsMonitoreadas) {
        logger.info(`[MONITOREO] Consultando ${ip} para ${usuario.empresa}...`);

        const resultado = await consultarIPShodan(ip);
        if (!resultado) continue;

        const hallazgos = [];

        // Detectar puertos críticos
        const puertosPeligrosos = resultado.puertos.filter(p => puertosCriticos.includes(p));
        if (puertosPeligrosos.length > 0) {
          hallazgos.push(`Puertos críticos expuestos: <strong>${puertosPeligrosos.join(', ')}</strong>`);
          await actualizarRisk(usuario._id.toString(), 'shodan_puerto_critico');
          await registrarEvento(
            'nuevo_reporte',
            `[Monitoreo automático] Shodan detectó puertos críticos: ${puertosPeligrosos.join(', ')} en IP ${ip} (${usuario.empresa})`,
            'high',
            usuario._id.toString(),
            ip
          );
        }

        // Detectar CVEs
        if (resultado.vulns.length > 0) {
          hallazgos.push(`Vulnerabilidades CVE detectadas: <strong>${resultado.vulns.slice(0, 5).join(', ')}${resultado.vulns.length > 5 ? '...' : ''}</strong>`);
          await actualizarRisk(usuario._id.toString(), 'shodan_puerto_critico');
          await registrarEvento(
            'nuevo_reporte',
            `[Monitoreo automático] Shodan detectó ${resultado.vulns.length} CVE(s) en IP ${ip} (${usuario.empresa})`,
            'high',
            usuario._id.toString(),
            ip
          );
        }

        // Enviar correo solo si hay algo que reportar
        if (hallazgos.length > 0) {
          await notificarPorCorreo(usuario.email, usuario.nombre, ip, hallazgos);
          logger.info(`[MONITOREO] Alerta enviada a ${usuario.email} por IP ${ip}`);
        } else {
          logger.info(`[MONITOREO] IP ${ip} sin novedades para ${usuario.empresa}`);
        }

        // Pausa entre consultas para no saturar la API de Shodan
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    logger.info('[MONITOREO] Ciclo completado.');
  } catch (e) {
    logger.info('[MONITOREO] Error en ciclo:', e.message);
  }
};

const iniciarMonitoreo = () => {
  // Corre todos los días a las 3:00 AM
  cron.schedule('0 3 * * *', ejecutarMonitoreo, {
    timezone: 'America/Bogota'
  });
  logger.info('[MONITOREO] Cron de monitoreo de IPs activo — corre diariamente a las 3:00 AM (Bogotá)');
};

module.exports = { iniciarMonitoreo, ejecutarMonitoreo };
