const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Contexto normativo colombiano ───────────────────────────────────────────
const CONTEXTO_NORMATIVO = `
Marco normativo colombiano relevante (referenciar cuando aplique):
- Ley 1581 de 2012: protección de datos personales (habeas data). Obliga a las empresas a
  proteger los datos de clientes y empleados, registrar bases de datos y tener política de
  tratamiento de datos.
- Ley 1273 de 2009: delitos informáticos. Tipifica acceso abusivo a sistemas, interceptación
  de datos, daño informático y suplantación de sitios web. Penas de hasta 8 años de prisión.
- CONPES 3995 de 2020: Política Nacional de Confianza y Seguridad Digital. Define lineamientos
  para que empresas colombianas gestionen riesgos digitales y adopten buenas prácticas.
Menciona la norma específica solo si es directamente relevante para el tema tratado.
`.trim();

const chat = async (prompt) => {
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    max_tokens: 500
  });
  return completion.choices[0].message.content;
};

const explicarEvento = async (req, res) => {
  try {
    const { tipo, descripcion, severidad } = req.body;
    const prompt = `Eres un experto en ciberseguridad explicando a pequeñas empresas colombianas.

${CONTEXTO_NORMATIVO}

Evento detectado:
- Tipo: ${tipo}
- Descripción: ${descripcion}
- Severidad: ${severidad}

Explica en 3 párrafos cortos:
1. Qué significa en palabras simples
2. Por qué es peligroso para la empresa y qué norma colombiana podría verse afectada
3. Qué debe hacer ahora mismo

Sin jerga técnica. Directo y práctico.`;

    const explicacion = await chat(prompt);
    res.json({ explicacion });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error con IA', error: error.message });
  }
};

const analizarRisk = async (req, res) => {
  try {
    const { score, nivel, historial } = req.body;
    const eventos = (historial || []).slice(-5).map(h => `${h.evento}: ${h.cambio > 0 ? '+' : ''}${h.cambio}`).join('\n');

    const prompt = `Eres analista de ciberseguridad para pymes colombianas.

${CONTEXTO_NORMATIVO}

Estado de seguridad:
- Risk Score: ${score}/100
- Nivel: ${nivel}
- Últimos eventos:
${eventos || 'Sin eventos recientes'}

En 2 párrafos:
1. Diagnóstico simple de la situación y riesgos de incumplimiento normativo si aplica
2. Las 3 acciones más importantes HOY, indicando si alguna es obligatoria por ley colombiana

En español simple y directo.`;

    const analisis = await chat(prompt);
    res.json({ analisis });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error con IA', error: error.message });
  }
};

const asistente = async (req, res) => {
  try {
    const { pregunta, contexto } = req.body;

    const prompt = `Eres el asistente de ciberseguridad de SecuPyme para pymes colombianas.

${CONTEXTO_NORMATIVO}

Contexto: ${contexto || 'Pequeña empresa colombiana'}
Pregunta: ${pregunta}

Responde en máximo 150 palabras, español simple y directo. Solo temas de ciberseguridad.
Si la pregunta tiene relación con alguna norma colombiana, menciónala brevemente.`;

    const respuesta = await chat(prompt);
    res.json({ respuesta });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error con IA', error: error.message });
  }
};

const resumenSemanal = async (req, res) => {
  try {
    const SecurityEvent = require('../models/SecurityEvent');
    const RiskScore = require('../models/RiskScore');
    const userId = req.usuario.id;
    const rol = req.usuario.rol;

    const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const filtro = rol === 'admin' ? {} : { userId };
    const eventos = await SecurityEvent.find({
      ...filtro,
      timestamp: { $gte: hace7dias }
    }).sort({ timestamp: -1 }).limit(20);

    const riskDoc = await RiskScore.findOne({ empresaId: userId });
    const resumenEventos = eventos.map(e => `${e.type}: ${e.description}`).join('\n');

    const prompt = `Eres analista de seguridad de SecuPyme.

${CONTEXTO_NORMATIVO}

Semana de seguridad:
- Total eventos: ${eventos.length}
- Risk score: ${riskDoc?.score || 0}/100
- Nivel: ${riskDoc?.nivel || 'normal'}
- Eventos:
${resumenEventos || 'Sin eventos'}

Resumen ejecutivo semanal en 3 párrafos:
1. Lo más importante de la semana
2. Estado actual de seguridad y cumplimiento normativo colombiano si aplica
3. Recomendaciones para próxima semana, indicando obligaciones legales si corresponde

En español simple para una pyme colombiana.`;

    const resumen = await chat(prompt);
    res.json({ resumen });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error con IA', error: error.message });
  }
};

module.exports = { explicarEvento, analizarRisk, asistente, resumenSemanal };
