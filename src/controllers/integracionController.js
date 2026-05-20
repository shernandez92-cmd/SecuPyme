const logger = require('../utils/logger');
const { actualizarRisk } = require("./riskController");
const { registrarEvento } = require("./siemController");
const Usuario = require("../models/Usuario");

const checkShodan = async (req, res, next) => {
  try {
    const { ip } = req.params;
    const response = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${process.env.SHODAN_KEY}`);
    const data = await response.json();
    if (data.error) return res.status(400).json({ mensaje: data.error });

    const resultado = {
      ip: data.ip_str,
      paises: data.country_name,
      puertos: data.ports,
      organizacion: data.org,
      sistema: data.os,
      ultimaActualizacion: data.last_update,
      vulnerabilidades: data.vulns || []
    };

    // Guardar IP en el perfil del usuario para monitoreo automático
    await Usuario.findByIdAndUpdate(req.usuario.id, {
      $addToSet: { ipsMonitoreadas: ip }
    });

    const puertosCriticos = [22, 23, 3389, 445, 139, 21, 3306, 5432];
    const puertosPeligrosos = (data.ports || []).filter(p => puertosCriticos.includes(p));

    if (puertosPeligrosos.length > 0) {
      await actualizarRisk(req.usuario.id, "shodan_puerto_critico");
      await registrarEvento(
        "nuevo_reporte",
        `Shodan detectó puertos críticos: ${puertosPeligrosos.join(", ")} en IP ${data.ip_str}`,
        "high",
        req.usuario.id,
        req.ip
      );
      resultado.alertaPuertos = puertosPeligrosos;
    }

    if (data.vulns && Object.keys(data.vulns).length > 0) {
      await actualizarRisk(req.usuario.id, "shodan_puerto_critico");
      await registrarEvento(
        "nuevo_reporte",
        `Shodan detectó vulnerabilidades CVE en IP ${data.ip_str}`,
        "high",
        req.usuario.id,
        req.ip
      );
    }

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

const checkVirusTotal = async (req, res, next) => {
  try {
    const { hash } = req.params;
    const response = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: { 'x-apikey': process.env.VIRUSTOTAL_KEY }
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ mensaje: data.error.message });

    const stats = data.data.attributes.last_analysis_stats;
    const resultado = {
      nombre: data.data.attributes.meaningful_name || hash,
      malicioso: stats.malicious,
      sospechoso: stats.suspicious,
      limpio: stats.undetected,
      tipo: data.data.attributes.type_description,
      tamaño: data.data.attributes.size,
      ultimoAnalisis: data.data.attributes.last_analysis_date
    };

    if (stats.malicious > 0) {
      await actualizarRisk(req.usuario.id, "virustotal_malicioso");
      await registrarEvento(
        "nuevo_reporte",
        `VirusTotal detectó archivo malicioso: ${resultado.nombre} (${stats.malicious} detecciones)`,
        "high",
        req.usuario.id,
        req.ip
      );
    }

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

module.exports = { checkShodan, checkVirusTotal };
