const { z } = require('zod');

const registro = z.object({
  nombre:    z.string().min(2).max(100),
  email:     z.string().email(),
  contraseña: z.string().min(8).max(128),
  empresa:   z.string().min(2).max(100),
  rol:       z.enum(['cliente', 'admin']).optional(),
});

const login = z.object({
  email:     z.string().email(),
  contraseña: z.string().min(1),
});

const forgotPassword = z.object({
  email: z.string().email(),
});

const resetPassword = z.object({
  token:          z.string().min(1),
  nuevaContraseña: z.string().min(8).max(128),
});

const crearReporte = z.object({
  tipoVulnerabilidad: z.string().min(1).max(100),
  descripcion:        z.string().min(10).max(2000),
});

const actualizarReporte = z.object({
  estado:     z.enum(['abierto', 'en proceso', 'resuelto']).optional(),
  prioridad:  z.enum(['baja', 'media', 'alta']).optional(),
  notasAdmin: z.string().max(2000).optional(),
});

const actualizarEstado = z.object({
  estado: z.enum(['abierto', 'en proceso', 'resuelto']),
});

const crearPregunta = z.object({
  texto:          z.string().min(5).max(500),
  campo:          z.string().min(1).max(100).regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos'),
  categoria:      z.string().max(100).optional(),
  peso:           z.number().int().min(1).max(10),
  recomendacion:  z.string().max(500).optional(),
  orden:          z.number().int().min(0).optional(),
  tipo:           z.enum(['boolean', 'texto']).optional(),
  condicionCampo: z.string().max(100).optional(),
  condicionValor: z.union([z.boolean(), z.string()]).optional(),
});

const respuestas = z.object({
  respuestas: z.record(z.union([z.boolean(), z.string().min(1).max(1000)])),
});

const cambiarPlan = z.object({
  plan: z.enum(['free', 'basico', 'premium']),
});

const cambiarRol = z.object({
  rol: z.enum(['cliente', 'admin']),
});


const eventoExterno = z.object({
  type:        z.string().max(100).optional(),
  description: z.string().min(1).max(1000),
  severity:    z.enum(['low', 'medium', 'high']),
  ip:          z.string().max(45).optional(),
  timestamp:   z.string().optional(),
});

const explicarEvento = z.object({
  tipo:        z.string().min(1).max(100),
  descripcion: z.string().min(1).max(1000),
  severidad:   z.enum(['low', 'medium', 'high']),
});

const analizarRisk = z.object({
  score:    z.number().min(0).max(100),
  nivel:    z.string().min(1).max(50),
  historial: z.array(z.any()).optional(),
});

const asistente = z.object({
  pregunta: z.string().min(1).max(2000),
  contexto: z.string().max(500).optional(),
});

const enviarMensaje = z.object({
  texto: z.string().min(1).max(2000),
});


const editarPregunta = z.object({
  texto:          z.string().min(5).optional(),
  categoria:      z.string().optional(),
  peso:           z.number().int().min(1).max(10).optional(),
  recomendacion:  z.string().optional(),
  orden:          z.number().int().min(0).optional(),
  tipo:           z.enum(['boolean', 'texto']).optional(),
  condicionCampo: z.string().max(100).optional(),
  condicionValor: z.union([z.boolean(), z.string()]).optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'Debe enviar al menos un campo a editar' });

module.exports = {
  editarPregunta,
  registro, login, forgotPassword, resetPassword,
  crearReporte, actualizarReporte, actualizarEstado,
  crearPregunta, respuestas,
  cambiarPlan, cambiarRol,
  eventoExterno, explicarEvento, analizarRisk, asistente, enviarMensaje,
};
