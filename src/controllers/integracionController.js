const checkShodan = async (req, res) => {
  try {
    const { ip } = req.params;
    const response = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${process.env.SHODAN_KEY}`);
    const data = await response.json();
    if (data.error) return res.status(400).json({ mensaje: data.error });
    res.json({
      ip: data.ip_str,
      paises: data.country_name,
      puertos: data.ports,
      organizacion: data.org,
      sistema: data.os,
      ultimaActualizacion: data.last_update,
      vulnerabilidades: data.vulns || []
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error consultando Shodan', error: error.message });
  }
};

const checkVirusTotal = async (req, res) => {
  try {
    const { hash } = req.params;
    const response = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: { 'x-apikey': process.env.VIRUSTOTAL_KEY }
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ mensaje: data.error.message });
    const stats = data.data.attributes.last_analysis_stats;
    res.json({
      nombre: data.data.attributes.meaningful_name || hash,
      malicioso: stats.malicious,
      sospechoso: stats.suspicious,
      limpio: stats.undetected,
      tipo: data.data.attributes.type_description,
      tamaño: data.data.attributes.size,
      ultimoAnalisis: data.data.attributes.last_analysis_date
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error consultando VirusTotal', error: error.message });
  }
};

module.exports = { checkShodan, checkVirusTotal };
