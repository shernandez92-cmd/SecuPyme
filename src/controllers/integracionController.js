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

module.exports = { checkShodan };
