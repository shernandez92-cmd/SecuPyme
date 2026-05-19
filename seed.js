/**
 * seed.js — SecuPyme
 * Pobla MongoDB Atlas con datos demo realistas para presentación de grado.
 * Uso: node seed.js (desde la raíz del proyecto)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI no está definida en .env');
  process.exit(1);
}

const UsuarioSchema = new mongoose.Schema({
  nombre: String,
  email: { type: String, unique: true },
  password: String,
  empresa: String,
  rol: { type: String, enum: ['admin', 'cliente'], default: 'cliente' },
  plan: { type: String, enum: ['free', 'basico', 'premium'], default: 'free' },
  fechaRegistro: { type: Date, default: Date.now },
  twoFactorEnabled: { type: Boolean, default: false },
}, { collection: 'usuarios' });

const ReporteSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  empresa: String,
  tipoVulnerabilidad: { type: String, enum: ['phishing','malware','acceso no autorizado','fuga de datos','otro'] },
  descripcion: String,
  estado: { type: String, enum: ['abierto','en proceso','resuelto'], default: 'abierto' },
  prioridad: { type: String, enum: ['alta','media','baja'] },
  notasAdmin: String,
  fecha: { type: Date, default: Date.now },
}, { collection: 'reportes' });

const AutoevaluacionSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  respuestas: mongoose.Schema.Types.Mixed,
  puntaje: Number,
  nivelRiesgo: { type: String, enum: ['alto','medio','bajo'] },
  recomendaciones: [String],
  fecha: { type: Date, default: Date.now },
}, { collection: 'autoevaluacions' });

const RiskScoreSchema = new mongoose.Schema({
  empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  score: Number,
  nivel: { type: String, enum: ['normal','monitoreo','alerta','critico'] },
  bloqueado: { type: Boolean, default: false },
  ultimaActualizacion: { type: Date, default: Date.now },
}, { collection: 'riskscores' });

const SecurityEventSchema = new mongoose.Schema({
  type: { type: String, enum: ['login_exitoso','login_fallido','nuevo_reporte','cambio_rol','bloqueo_automatico'] },
  description: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  severity: { type: String, enum: ['low','medium','high'] },
  ip: String,
  timestamp: { type: Date, default: Date.now },
}, { collection: 'securityevents' });

const ConversationSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  ultimoMensaje: String,
  ultimaActividad: { type: Date, default: Date.now },
  noLeidos: { type: Number, default: 0 },
}, { collection: 'conversations' });

const ChatGeneralSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  texto: String,
  fecha: { type: Date, default: Date.now },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
}, { collection: 'chatgenerals' });

const Usuario = mongoose.model('Usuario', UsuarioSchema);
const Reporte = mongoose.model('Reporte', ReporteSchema);
const Autoevaluacion = mongoose.model('Autoevaluacion', AutoevaluacionSchema);
const RiskScore = mongoose.model('RiskScore', RiskScoreSchema);
const SecurityEvent = mongoose.model('SecurityEvent', SecurityEventSchema);
const Conversation = mongoose.model('Conversation', ConversationSchema);
const ChatGeneral = mongoose.model('ChatGeneral', ChatGeneralSchema);

function daysAgo(max, min = 0) {
  const ms = (Math.random() * (max - min) + min) * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
const IPS = ['181.55.12.34','190.24.45.67','200.118.9.21','181.78.200.5','190.90.155.3'];

const EMPRESAS_DEF = [
  {
    nombre: 'Ana María Rodríguez', email: 'ana@drogueriaasalud.com',
    empresa: 'Droguería Salud Total', plan: 'basico',
    riskPerfil: { score: 88, nivel: 'critico', bloqueado: true },
    reportes: [
      { tipo: 'phishing', desc: 'Correo falso suplantando a la DIAN solicitando credenciales del portal de facturación electrónica.', estado: 'abierto', prioridad: 'alta' },
      { tipo: 'acceso no autorizado', desc: 'Empleado despedido intentó acceder al sistema de inventario con credenciales antiguas desde IP externa.', estado: 'abierto', prioridad: 'alta' },
      { tipo: 'malware', desc: 'Equipo de caja infectado con keylogger detectado por antivirus. Se suspendió operación del terminal.', estado: 'en proceso', prioridad: 'alta' },
      { tipo: 'fuga de datos', desc: 'Base de datos de clientes con datos de fórmulas médicas posiblemente expuesta en servidor sin contraseña.', estado: 'abierto', prioridad: 'alta' },
      { tipo: 'otro', desc: 'Sitio web clonado encontrado en dominio drogueria-saludtotal.com que recoge pagos fraudulentos.', estado: 'en proceso', prioridad: 'media' },
    ],
    evaluaciones: [
      { dias: 55, puntaje: 3, nivel: 'alto', recs: ['Implementar autenticación multifactor de inmediato','Capacitar al personal en identificación de phishing','Revisar y revocar accesos de exempleados','Contratar auditoría de seguridad externa'] },
      { dias: 30, puntaje: 5, nivel: 'alto', recs: ['Actualizar sistema operativo en terminales de caja','Realizar backup cifrado de base de datos de clientes','Establecer política de contraseñas seguras'] },
      { dias: 7,  puntaje: 7, nivel: 'medio', recs: ['Completar implementación de 2FA','Mantener monitoreo activo del servidor web','Documentar procedimiento de respuesta a incidentes'] },
    ],
    siem: [
      { type: 'login_fallido', desc: 'Múltiples intentos fallidos de login desde IP 181.55.12.34 — posible ataque de fuerza bruta', severity: 'high' },
      { type: 'nuevo_reporte', desc: 'Reporte crítico registrado: keylogger en terminal de caja #3', severity: 'high' },
      { type: 'bloqueo_automatico', desc: 'Cuenta bloqueada automáticamente por score de riesgo superior a 80', severity: 'high' },
      { type: 'login_fallido', desc: 'Acceso denegado al portal de inventario con credenciales de usuario inactivo', severity: 'high' },
      { type: 'login_exitoso', desc: 'Inicio de sesión exitoso desde dispositivo no reconocido — se solicitó verificación adicional', severity: 'medium' },
      { type: 'nuevo_reporte', desc: 'Reporte de fuga de datos enviado por administrador de sistema', severity: 'high' },
    ],
    chat: [
      { esAdmin: false, texto: 'Buenos días, estamos muy preocupados. Recibimos un correo sospechoso de la DIAN y creemos que alguien entró al sistema de inventario.' },
      { esAdmin: true,  texto: 'Hola Ana María. Ya vi los reportes. Primero: cambien TODAS las contraseñas ahora mismo y revoquen accesos de ex-empleados. Voy a revisar los logs del servidor esta tarde.' },
      { esAdmin: false, texto: 'Listo, ya lo estamos haciendo. El keylogger puede haber robado los datos de las fórmulas de los clientes?' },
      { esAdmin: true,  texto: 'Es posible. Mientras analizo, deben notificar a los clientes afectados por precaución (Ley 1581). Les envío el protocolo de respuesta a incidentes ahora.' },
    ],
  },
  {
    nombre: 'Carlos Eduardo Gómez', email: 'carlos@ferreteriaeltornillo.com',
    empresa: 'Ferretería El Tornillo', plan: 'basico',
    riskPerfil: { score: 72, nivel: 'alerta', bloqueado: false },
    reportes: [
      { tipo: 'phishing', desc: 'Empleada de ventas recibió correo falso de Bancolombia solicitando actualización de datos bancarios.', estado: 'en proceso', prioridad: 'alta' },
      { tipo: 'acceso no autorizado', desc: 'Intento de acceso al panel de administración del sitio web desde múltiples IPs en Rumanía.', estado: 'resuelto', prioridad: 'media' },
      { tipo: 'malware', desc: 'USB desconocida conectada a equipo de bodega. Antivirus bloqueó ejecución automática de archivo .bat.', estado: 'abierto', prioridad: 'alta' },
      { tipo: 'otro', desc: 'Factura electrónica recibida con macro maliciosa en Word. El archivo fue abierto antes de ser detectado.', estado: 'en proceso', prioridad: 'media' },
    ],
    evaluaciones: [
      { dias: 50, puntaje: 6, nivel: 'alto', recs: ['Deshabilitar ejecución automática de USB en todos los equipos','Capacitación urgente sobre correos de phishing','Implementar filtro de spam avanzado'] },
      { dias: 25, puntaje: 9, nivel: 'medio', recs: ['Actualizar definiciones de antivirus semanalmente','Establecer política de no abrir adjuntos no solicitados','Revisar configuración del firewall'] },
      { dias: 5, puntaje: 11, nivel: 'medio', recs: ['Continuar con capacitaciones de seguridad','Implementar autenticación de doble factor en correo corporativo'] },
    ],
    siem: [
      { type: 'login_fallido', desc: 'Escaneo de puertos detectado desde IP 200.118.9.21 — posible reconocimiento previo a ataque', severity: 'high' },
      { type: 'nuevo_reporte', desc: 'Reporte de USB sospechosa en bodega registrado por empleado', severity: 'medium' },
      { type: 'login_exitoso', desc: 'Acceso al panel admin del sitio web bloqueado y contraseña cambiada exitosamente', severity: 'medium' },
      { type: 'nuevo_reporte', desc: 'Macro maliciosa detectada en documento Word recibido por correo', severity: 'high' },
      { type: 'login_exitoso', desc: 'Carlos Gómez inició sesión desde nueva ubicación — Medellín', severity: 'low' },
    ],
    chat: [
      { esAdmin: false, texto: 'Hola, necesito ayuda. Una empleada abrió un correo de Bancolombia que parece falso. Qué hacemos?' },
      { esAdmin: true,  texto: 'Carlos, tranquilo. Primero: aíslen ese equipo de la red ahora. Luego cambien la contraseña del correo y de la banca en línea desde otro dispositivo.' },
      { esAdmin: false, texto: 'Ya lo hicimos. También encontramos una USB en bodega que nadie reconoce. Eso es grave?' },
      { esAdmin: true,  texto: 'Sí, puede ser un vector de ataque. No la conecten a nada más. La analizamos esta semana. Buen ojo del empleado en reportarlo.' },
    ],
  },
  {
    nombre: 'Luisa Fernanda Torres', email: 'luisa@clinicavidanueva.com',
    empresa: 'Clínica Vida Nueva', plan: 'premium',
    riskPerfil: { score: 45, nivel: 'monitoreo', bloqueado: false },
    reportes: [
      { tipo: 'phishing', desc: 'Médico reportó correo suplantando al Ministerio de Salud con enlace a formulario falso de recertificación.', estado: 'resuelto', prioridad: 'media' },
      { tipo: 'fuga de datos', desc: 'Historia clínica de paciente enviada por error al correo equivocado. El destinatario notificó a la clínica.', estado: 'resuelto', prioridad: 'alta' },
      { tipo: 'otro', desc: 'Sistema de turnos en línea presentó lentitud inusual compatible con intento de DDoS de baja intensidad.', estado: 'en proceso', prioridad: 'baja' },
    ],
    evaluaciones: [
      { dias: 60, puntaje: 8, nivel: 'medio', recs: ['Implementar cifrado en el envío de historias clínicas','Capacitar al personal en manejo seguro de datos de pacientes (Ley 1581)','Revisar protocolo de envío de correos con información sensible'] },
      { dias: 35, puntaje: 12, nivel: 'medio', recs: ['Activar autenticación de doble factor en correos del personal médico','Realizar simulacro de phishing para evaluar al personal'] },
      { dias: 10, puntaje: 15, nivel: 'bajo', recs: ['Mantener las buenas prácticas implementadas','Programar auditoría de seguridad semestral'] },
    ],
    siem: [
      { type: 'nuevo_reporte', desc: 'Reporte de posible phishing enviado por Dr. Ramírez del área de cardiología', severity: 'medium' },
      { type: 'login_exitoso', desc: 'Luisa Torres accedió al panel de administración desde IP corporativa habitual', severity: 'low' },
      { type: 'nuevo_reporte', desc: 'Incidente de privacidad registrado — historia clínica enviada a correo incorrecto', severity: 'high' },
      { type: 'cambio_rol', desc: 'Actualización de plan de free a premium completada exitosamente', severity: 'low' },
      { type: 'login_exitoso', desc: 'Acceso desde nuevo dispositivo verificado con 2FA exitosamente', severity: 'low' },
    ],
    chat: [
      { esAdmin: false, texto: 'Buenos días. Quería confirmar que ya activamos el 2FA en todos los correos del personal. Hay algo más que debamos hacer?' },
      { esAdmin: true,  texto: 'Excelente noticia, Luisa. El siguiente paso es hacer un simulacro de phishing para medir qué tan preparado está el equipo. Les parece el próximo mes?' },
      { esAdmin: false, texto: 'Perfecto. También queremos saber si el plan premium incluye el monitoreo continuo de la red interna.' },
      { esAdmin: true,  texto: 'Sí, el plan premium incluye monitoreo SIEM 24/7 y reportes semanales automáticos. Ya lo activé para su cuenta.' },
    ],
  },
  {
    nombre: 'Jorge Andrés Vargas', email: 'jorge@constructoracimientos.com',
    empresa: 'Constructora Cimientos CO', plan: 'free',
    riskPerfil: { score: 91, nivel: 'critico', bloqueado: true },
    reportes: [
      { tipo: 'acceso no autorizado', desc: 'Acceso remoto no autorizado al servidor de planos y presupuestos detectado. Posible exfiltración de datos de licitaciones.', estado: 'abierto', prioridad: 'alta' },
      { tipo: 'malware', desc: 'Cifrado masivo de archivos en servidor de contratos. Nota de rescate exigiendo 2 BTC. Sistema fuera de línea.', estado: 'abierto', prioridad: 'alta' },
      { tipo: 'phishing', desc: 'Director financiero recibió correo falso de SECOP con contrato malicioso adjunto. Lo abrió en equipo corporativo.', estado: 'en proceso', prioridad: 'alta' },
      { tipo: 'fuga de datos', desc: 'Credenciales de acceso al portal bancario empresarial encontradas en foro de la dark web.', estado: 'abierto', prioridad: 'alta' },
      { tipo: 'otro', desc: 'Empleado encontró cámara oculta en sala de reuniones donde se discuten contratos con entidades públicas.', estado: 'abierto', prioridad: 'alta' },
    ],
    evaluaciones: [
      { dias: 45, puntaje: 2, nivel: 'alto', recs: ['Contratar empresa especializada en respuesta a incidentes de inmediato','Desconectar servidor de contratos de la red','Notificar al banco del posible compromiso de credenciales','Reportar ante la Fiscalía el posible espionaje empresarial'] },
      { dias: 20, puntaje: 4, nivel: 'alto', recs: ['Restaurar desde backup limpio (verificar que no esté cifrado)','Cambiar TODAS las credenciales desde dispositivos limpios','Implementar segmentación de red entre administración y obras'] },
      { dias: 3,  puntaje: 5, nivel: 'alto', recs: ['El caso de ransomware requiere atención especializada urgente','No pagar el rescate sin antes consultar a expertos','Preservar evidencia digital para investigación'] },
    ],
    siem: [
      { type: 'bloqueo_automatico', desc: 'Cuenta bloqueada automáticamente — score crítico de 91 puntos alcanzado', severity: 'high' },
      { type: 'nuevo_reporte', desc: 'Incidente de ransomware registrado — CRÍTICO — requiere respuesta inmediata', severity: 'high' },
      { type: 'login_fallido', desc: 'Acceso al servidor de planos fallido reiteradamente desde IP extranjera 45.33.32.156', severity: 'high' },
      { type: 'nuevo_reporte', desc: 'Credenciales corporativas detectadas en brecha de datos externa', severity: 'high' },
      { type: 'login_exitoso', desc: 'Jorge Vargas inició sesión para reportar incidente crítico', severity: 'medium' },
      { type: 'nuevo_reporte', desc: 'Reporte de posible dispositivo de espionaje físico en instalaciones', severity: 'high' },
      { type: 'login_fallido', desc: 'Portal bancario reportó múltiples intentos de acceso no autorizados con credenciales de la constructora', severity: 'high' },
    ],
    chat: [
      { esAdmin: false, texto: 'URGENTE: nuestros servidores fueron cifrados anoche. Hay una nota de rescate. No podemos acceder a NADA. Qué hacemos?' },
      { esAdmin: true,  texto: 'Jorge, entiendo la gravedad. PASOS INMEDIATOS: 1) Desconecten TODOS los equipos de la red ahora. 2) No paguen el rescate. 3) Llamen al CAI Cibernético de la Policía: 018000910010. Yo inicio el análisis remoto.' },
      { esAdmin: false, texto: 'Ya desconectamos todo. Tenemos backup de hace 3 semanas en disco externo. Lo conectamos?' },
      { esAdmin: true,  texto: 'NO conecten el backup todavía. Primero hay que verificar que no esté infectado. Escanéenlo desde un equipo limpio y aislado. Les envío las instrucciones por correo ahora mismo.' },
    ],
  },
  {
    nombre: 'Valentina Ospina', email: 'valentina@fogoncolombia.com',
    empresa: 'Fogón Colombia Restaurante', plan: 'basico',
    riskPerfil: { score: 22, nivel: 'normal', bloqueado: false },
    reportes: [
      { tipo: 'phishing', desc: 'Mesero reportó SMS sospechoso suplantando a Rappi solicitando datos de la cuenta del restaurante.', estado: 'resuelto', prioridad: 'baja' },
      { tipo: 'otro', desc: 'Reseña falsa negativa masiva en Google Maps coordinada. Posible ataque de reputación por competidor.', estado: 'resuelto', prioridad: 'baja' },
      { tipo: 'acceso no autorizado', desc: 'Ex-proveedor de domicilios intentó acceder al sistema de pedidos con credenciales expiradas.', estado: 'resuelto', prioridad: 'media' },
    ],
    evaluaciones: [
      { dias: 58, puntaje: 13, nivel: 'bajo', recs: ['Activar verificación en dos pasos en cuentas de plataformas de delivery','Documentar y revocar accesos de proveedores al terminar contratos'] },
      { dias: 28, puntaje: 16, nivel: 'bajo', recs: ['Mantener buenas prácticas de seguridad','Realizar revisión trimestral de accesos activos'] },
      { dias: 6,  puntaje: 18, nivel: 'bajo', recs: ['Excelente postura de seguridad — continuar con las políticas actuales','Considerar capacitación anual del equipo'] },
    ],
    siem: [
      { type: 'nuevo_reporte', desc: 'Reporte de SMS phishing registrado — resuelto sin incidentes', severity: 'low' },
      { type: 'login_exitoso', desc: 'Valentina Ospina accedió desde dispositivo móvil — actividad normal', severity: 'low' },
      { type: 'login_exitoso', desc: 'Acceso exitoso al panel administrativo desde IP corporativa habitual', severity: 'low' },
      { type: 'nuevo_reporte', desc: 'Acceso de ex-proveedor bloqueado y credenciales revocadas exitosamente', severity: 'medium' },
      { type: 'login_exitoso', desc: 'Autenticación 2FA configurada y verificada exitosamente', severity: 'low' },
    ],
    chat: [
      { esAdmin: false, texto: 'Hola, solo quería avisarles que ya resolvimos el tema del SMS falso de Rappi. Informamos a todo el equipo.' },
      { esAdmin: true,  texto: 'Qué bien, Valentina! La respuesta rápida es clave. Pudieron activar la verificación en dos pasos en las cuentas de delivery?' },
      { esAdmin: false, texto: 'Sí, ya está activo en Rappi y en iFood. También revocamos el acceso del proveedor anterior.' },
      { esAdmin: true,  texto: 'Perfecto. Su empresa está manejando muy bien la seguridad. Score de riesgo en zona normal. Sigan así.' },
    ],
  },
  {
    nombre: 'Daniela Moreno', email: 'daniela@matizropa.com',
    empresa: 'Matiz Tienda de Ropa', plan: 'basico',
    riskPerfil: { score: 48, nivel: 'monitoreo', bloqueado: false },
    reportes: [
      { tipo: 'phishing', desc: 'Correo falso de PayU solicitando reverificación de cuenta de pagos en línea. La dueña casi ingresa sus datos.', estado: 'resuelto', prioridad: 'media' },
      { tipo: 'acceso no autorizado', desc: 'Panel de administración de la tienda virtual accedido desde IP de otro país. Se detectó por alerta de inicio de sesión.', estado: 'resuelto', prioridad: 'alta' },
      { tipo: 'fuga de datos', desc: 'Lista de clientes con correos y compras exportada por exempleada antes de su desvinculación.', estado: 'en proceso', prioridad: 'alta' },
    ],
    evaluaciones: [
      { dias: 52, puntaje: 7, nivel: 'alto', recs: ['Cambiar contraseña del panel de la tienda virtual inmediatamente','Activar alertas de inicio de sesión','Revisar qué datos exportó la exempleada y notificar a clientes afectados'] },
      { dias: 22, puntaje: 11, nivel: 'medio', recs: ['Implementar control de exportación de datos en el panel administrativo','Establecer política de offboarding seguro para empleados'] },
      { dias: 4,  puntaje: 14, nivel: 'bajo', recs: ['Buena mejora en las métricas de seguridad','Continuar con la implementación del 2FA','Completar la investigación del incidente de la exempleada'] },
    ],
    siem: [
      { type: 'nuevo_reporte', desc: 'Acceso no autorizado al panel de e-commerce detectado y bloqueado', severity: 'high' },
      { type: 'login_fallido', desc: 'Múltiples intentos de acceso al panel admin desde IP 45.89.100.12 — bloqueados por firewall', severity: 'medium' },
      { type: 'login_exitoso', desc: 'Daniela Moreno cambió contraseña de acceso exitosamente desde dispositivo verificado', severity: 'low' },
      { type: 'nuevo_reporte', desc: 'Reporte de posible exfiltración de datos de clientes por exempleada — en investigación', severity: 'high' },
      { type: 'login_exitoso', desc: 'Autenticación reforzada activada en panel de e-commerce', severity: 'low' },
      { type: 'nuevo_reporte', desc: 'Alerta de phishing suplantando a PayU procesada y resuelta', severity: 'medium' },
    ],
    chat: [
      { esAdmin: false, texto: 'Buenas tardes. Entraron a mi tienda virtual desde Argentina, pero yo estaba en Bogotá. Cambié la contraseña pero estoy muy asustada.' },
      { esAdmin: true,  texto: 'Hola Daniela. Hiciste bien en cambiar la contraseña de inmediato. Pudieron ver los pedidos o datos de pago de los clientes? Necesito saber qué sección visitaron.' },
      { esAdmin: false, texto: 'El log muestra que estuvieron en la sección de clientes y en los reportes de ventas. No sé si descargaron algo.' },
      { esAdmin: true,  texto: 'Eso es importante. Por precaución notifica a tus clientes que hubo acceso no autorizado (es obligatorio según la ley colombiana). Activa el 2FA ahora y activa los logs de descarga en tu plataforma.' },
    ],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  Conectado a MongoDB Atlas\n');

  const admin = await Usuario.findOne({ email: 'sebastian@secupyme.com' });
  if (!admin) {
    console.error('❌  No se encontró el admin sebastian@secupyme.com');
    process.exit(1);
  }
  console.log('ℹ️   Admin encontrado: ' + admin._id + '\n');

  const demoEmails = EMPRESAS_DEF.map(e => e.email);
  const demoUsuarios = await Usuario.find({ email: { $in: demoEmails } });
  const demoIds = demoUsuarios.map(u => u._id);

  await Promise.all([
    Reporte.deleteMany({ usuario: { $in: demoIds } }),
    Autoevaluacion.deleteMany({ usuario: { $in: demoIds } }),
    RiskScore.deleteMany({ empresaId: { $in: demoIds } }),
    SecurityEvent.deleteMany({ userId: { $in: demoIds } }),
    Conversation.deleteMany({ empresaId: { $in: demoIds } }),
    ChatGeneral.deleteMany({ empresaId: { $in: demoIds } }),
    Usuario.deleteMany({ email: { $in: demoEmails } }),
  ]);
  console.log('🧹  Colecciones de demo limpiadas\n');

  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash('123456', 10);

  const conteo = { usuarios: 0, reportes: 0, autoevaluaciones: 0, riskscores: 0, eventos: 0, conversaciones: 0, mensajes: 0 };

  function daysAgo(max, min = 0) {
    const ms = (Math.random() * (max - min) + min) * 24 * 60 * 60 * 1000;
    return new Date(Date.now() - ms);
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  const IPS = ['181.55.12.34','190.24.45.67','200.118.9.21','181.78.200.5','190.90.155.3'];

  for (const def of EMPRESAS_DEF) {
    const usuario = await Usuario.create({
      nombre: def.nombre, email: def.email, password: passwordHash,
      empresa: def.empresa, rol: 'cliente', plan: def.plan,
      fechaRegistro: daysAgo(65, 62), twoFactorEnabled: false,
    });
    conteo.usuarios++;

    for (let i = 0; i < def.reportes.length; i++) {
      const r = def.reportes[i];
      await Reporte.create({
        usuario: usuario._id, empresa: def.empresa,
        tipoVulnerabilidad: r.tipo, descripcion: r.desc,
        estado: r.estado, prioridad: r.prioridad,
        notasAdmin: r.estado === 'resuelto' ? 'Incidente gestionado y cerrado correctamente.' : (r.estado === 'en proceso' ? 'En análisis por el equipo de seguridad.' : null),
        fecha: daysAgo(55 - i * 8, 40 - i * 8),
      });
      conteo.reportes++;
    }

    for (const ev of def.evaluaciones) {
      const p = ev.puntaje;
      const respuestas = {
        antivirus: p >= 1, firewall: p >= 2, backups: p >= 3,
        actualizaciones: p >= 4, contraseñasSeguras: p >= 5,
        capacitacionPersonal: p >= 6, controlAccesos: p >= 7,
        cifradoDatos: p >= 8, monitoreoRed: p >= 9, planRespuesta: p >= 10,
      };
      await Autoevaluacion.create({
        usuario: usuario._id, respuestas, puntaje: ev.puntaje,
        nivelRiesgo: ev.nivel, recomendaciones: ev.recs,
        fecha: daysAgo(ev.dias, ev.dias - 1),
      });
      conteo.autoevaluaciones++;
    }

    await RiskScore.create({
      empresaId: usuario._id, score: def.riskPerfil.score,
      nivel: def.riskPerfil.nivel, bloqueado: def.riskPerfil.bloqueado,
      ultimaActualizacion: daysAgo(3, 0),
    });
    conteo.riskscores++;

    for (let i = 0; i < def.siem.length; i++) {
      const ev = def.siem[i];
      await SecurityEvent.create({
        type: ev.type, description: ev.desc, userId: usuario._id,
        severity: ev.severity, ip: pick(IPS),
        timestamp: daysAgo(50 - i * 6, 44 - i * 6),
      });
      conteo.eventos++;
    }

    const conv = await Conversation.create({
      adminId: admin._id, empresaId: usuario._id,
      ultimoMensaje: def.chat[def.chat.length - 1].texto.slice(0, 80),
      ultimaActividad: daysAgo(2, 0), noLeidos: 1,
    });
    conteo.conversaciones++;

    for (let i = 0; i < def.chat.length; i++) {
      const m = def.chat[i];
      await ChatGeneral.create({
        usuario: m.esAdmin ? admin._id : usuario._id,
        empresaId: usuario._id, texto: m.texto,
        fecha: daysAgo(5 - i * 0.3, 4 - i * 0.3),
        conversationId: conv._id,
      });
      conteo.mensajes++;
    }

    console.log('✅  ' + def.empresa.padEnd(30) + ' | ' + def.riskPerfil.nivel.padEnd(9) + ' (' + def.riskPerfil.score + ') | ' + def.reportes.length + ' reportes | ' + def.evaluaciones.length + ' evaluaciones | ' + def.siem.length + ' eventos');
  }

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  RESUMEN SEED SecuPyme');
  console.log('══════════════════════════════════════════════════════════');
  console.log('  Usuarios creados        : ' + conteo.usuarios);
  console.log('  Reportes creados        : ' + conteo.reportes);
  console.log('  Autoevaluaciones        : ' + conteo.autoevaluaciones);
  console.log('  Risk Scores             : ' + conteo.riskscores);
  console.log('  Eventos SIEM            : ' + conteo.eventos);
  console.log('  Conversaciones de chat  : ' + conteo.conversaciones);
  console.log('  Mensajes de chat        : ' + conteo.mensajes);
  console.log('══════════════════════════════════════════════════════════');
  console.log('\n  Credenciales clientes: <email> / 123456');
  console.log('  Consulta el documento de credenciales para acceso.\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('❌  Error:', err); process.exit(1); });