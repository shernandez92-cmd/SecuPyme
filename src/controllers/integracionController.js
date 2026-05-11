const { sendErrorResponse, asyncHandler } = require('../utils/errorHandler');
const validators = require('../utils/validators');

/**
 * Check IP on Shodan
 * Validates IP format to prevent SSRF attacks
 */
const checkShodan = asyncHandler(async (req, res) => {
  const { ip } = req.params;

  // Validate IP format
  if (!ip || !validators.isValidIP(ip)) {
    return sendErrorResponse(res, 400, 'Formato de IP inválido', 'INVALID_IP');
  }

  // Prevent private IP addresses (SSRF prevention)
  const privateRanges = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.)/;
  if (privateRanges.test(ip)) {
    return sendErrorResponse(res, 400, 'No se permiten direcciones IP privadas', 'PRIVATE_IP');
  }

  if (!process.env.SHODAN_KEY) {
    return sendErrorResponse(res, 500, 'Shodan no está configurado', 'SERVICE_ERROR');
  }

  try {
    const response = await fetch(
      `https://api.shodan.io/shodan/host/${ip}?key=${process.env.SHODAN_KEY}`,
      { timeout: 10000 }
    );

    // Check response status
    if (!response.ok) {
      if (response.status === 401) {
        return sendErrorResponse(res, 500, 'Credenciales de Shodan inválidas', 'AUTH_ERROR');
      }
      if (response.status === 429) {
        return sendErrorResponse(res, 429, 'Límite de solicitudes de Shodan excedido', 'RATE_LIMIT');
      }
      return sendErrorResponse(res, 502, 'Error al consultar Shodan', 'SERVICE_ERROR');
    }

    const data = await response.json();

    if (data.error) {
      return sendErrorResponse(res, 400, 'IP no encontrada en Shodan', 'NOT_FOUND');
    }

    res.json({
      ip: data.ip_str,
      paises: data.country_name || 'Desconocido',
      puertos: data.ports || [],
      organizacion: data.org || 'Desconocida',
      sistema: data.os || 'Desconocido',
      ultimaActualizacion: data.last_update,
      vulnerabilidades: (data.vulns || []).slice(0, 10) // Limit vulnerabilities returned
    });
  } catch (error) {
    console.error('Shodan API error:', error.message);
    if (error.name === 'AbortError') {
      return sendErrorResponse(res, 504, 'Timeout consultando Shodan', 'TIMEOUT');
    }
    sendErrorResponse(res, 500, 'Error consultando Shodan', 'API_ERROR');
  }
});

/**
 * Check file hash on VirusTotal
 * Validates hash format (MD5, SHA1, SHA256)
 */
const checkVirusTotal = asyncHandler(async (req, res) => {
  const { hash } = req.params;

  // Validate hash format (MD5: 32, SHA1: 40, SHA256: 64)
  const hashRegex = /^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i;
  if (!hash || !hashRegex.test(hash)) {
    return sendErrorResponse(res, 400, 'Formato de hash inválido (MD5, SHA1 o SHA256)', 'INVALID_HASH');
  }

  if (!process.env.VIRUSTOTAL_KEY) {
    return sendErrorResponse(res, 500, 'VirusTotal no está configurado', 'SERVICE_ERROR');
  }

  try {
    const response = await fetch(
      `https://www.virustotal.com/api/v3/files/${hash}`,
      {
        headers: { 'x-apikey': process.env.VIRUSTOTAL_KEY },
        timeout: 10000
      }
    );

    // Check response status
    if (!response.ok) {
      if (response.status === 401) {
        return sendErrorResponse(res, 500, 'Credenciales de VirusTotal inválidas', 'AUTH_ERROR');
      }
      if (response.status === 404) {
        return sendErrorResponse(res, 404, 'Hash no encontrado en VirusTotal', 'NOT_FOUND');
      }
      if (response.status === 429) {
        return sendErrorResponse(res, 429, 'Límite de solicitudes de VirusTotal excedido', 'RATE_LIMIT');
      }
      return sendErrorResponse(res, 502, 'Error al consultar VirusTotal', 'SERVICE_ERROR');
    }

    const data = await response.json();

    if (data.error) {
      return sendErrorResponse(res, 400, 'Error en VirusTotal', 'API_ERROR');
    }

    const stats = data.data.attributes.last_analysis_stats;
    const total = stats.malicious + stats.suspicious + stats.undetected + (stats.harmless || 0);

    res.json({
      nombre: data.data.attributes.meaningful_name || hash,
      malicioso: stats.malicious,
      sospechoso: stats.suspicious,
      limpio: stats.undetected,
      harmless: stats.harmless || 0,
      total_detectores: total,
      riesgo: stats.malicious > 0 ? 'ALTO' : stats.suspicious > 0 ? 'MEDIO' : 'BAJO',
      tipo: data.data.attributes.type_description || 'Desconocido',
      tamaño: data.data.attributes.size || 0,
      ultimoAnalisis: data.data.attributes.last_analysis_date
    });
  } catch (error) {
    console.error('VirusTotal API error:', error.message);
    if (error.name === 'AbortError') {
      return sendErrorResponse(res, 504, 'Timeout consultando VirusTotal', 'TIMEOUT');
    }
    sendErrorResponse(res, 500, 'Error consultando VirusTotal', 'API_ERROR');
  }
});

module.exports = { checkShodan, checkVirusTotal };
