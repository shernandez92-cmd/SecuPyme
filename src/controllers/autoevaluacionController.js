const Autoevaluacion = require('../models/Autoevaluacion');

const calcularPuntaje = (respuestas) => {
  let puntaje = 0;
  const recomendaciones = [];

  if (respuestas.contraseñasSeguras) puntaje += 3;
  else recomendaciones.push('Implementar una política de contraseñas seguras en toda la empresa.');

  if (respuestas.dobleAutenticacion) puntaje += 2;
  else recomendaciones.push('Activar la verificación en dos pasos en todos los sistemas críticos.');

  if (respuestas.equiposActualizados) puntaje += 2;
  else recomendaciones.push('Mantener todos los equipos y sistemas operativos actualizados.');

  if (respuestas.softwareLicenciado) puntaje += 1;
  else recomendaciones.push('Usar únicamente software con licencias vigentes y legales.');

  if (respuestas.copiasSeguridad) puntaje += 3;
  else recomendaciones.push('Establecer copias de seguridad periódicas de toda la información crítica.');

  if (respuestas.copiasEnLugarSeguro) puntaje += 2;
  else recomendaciones.push('Almacenar las copias de seguridad en un lugar externo o en la nube.');

  if (respuestas.capacitacionEmpleados) puntaje += 1;
  else recomendaciones.push('Capacitar a todos los empleados en buenas prácticas de seguridad.');

  if (respuestas.identificaPhishing) puntaje += 1;
  else recomendaciones.push('Enseñar a los empleados a reconocer correos falsos que roban información.');

  if (respuestas.firewallActivo) puntaje += 3;
  else recomendaciones.push('Instalar y activar un programa que proteja la red de accesos no autorizados.');

  if (respuestas.redProtegida) puntaje += 2;
  else recomendaciones.push('Proteger la red WiFi con contraseña segura y acceso restringido.');

  let nivelRiesgo;
  if (puntaje >= 16) nivelRiesgo = 'bajo';
  else if (puntaje >= 10) nivelRiesgo = 'medio';
  else nivelRiesgo = 'alto';

  return { puntaje, nivelRiesgo, recomendaciones };
};

const crearAutoevaluacion = async (req, res) => {
  try {
    const { respuestas } = req.body;
    const { puntaje, nivelRiesgo, recomendaciones } = calcularPuntaje(respuestas);

    const autoevaluacion = new Autoevaluacion({
      usuario: req.usuario.id,
      respuestas,
      puntaje,
      nivelRiesgo,
      recomendaciones
    });

    await autoevaluacion.save();

    res.status(201).json({
      mensaje: 'Autoevaluación completada',
      puntaje,
      nivelRiesgo,
      recomendaciones
    });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

const obtenerAutoevaluaciones = async (req, res) => {
  try {
    let autoevaluaciones;

    if (req.usuario.rol === 'admin') {
      autoevaluaciones = await Autoevaluacion.find().populate('usuario', 'nombre email empresa');
    } else {
      autoevaluaciones = await Autoevaluacion.find({ usuario: req.usuario.id });
    }

    res.json(autoevaluaciones);

  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

module.exports = { crearAutoevaluacion, obtenerAutoevaluaciones };
