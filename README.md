# SecuPyme

Plataforma de ciberseguridad diseñada para pequeñas y medianas empresas (PYMES) colombianas. Permite reportar incidentes de seguridad, realizar autoevaluaciones de riesgo, monitorear el nivel de amenaza en tiempo real y recibir asistencia especializada con inteligencia artificial.

**Proyecto Productivo — Análisis y Desarrollo de Software, SENA 2026**  
**Deploy:** https://secupyme.onrender.com  
**Repo:** https://github.com/shernandez92-cmd/SecuPyme

---

## Funcionalidades

### Para empresas clientes
- Registro e inicio de sesión con JWT y autenticación de doble factor (2FA con TOTP)
- 10 códigos de respaldo (backup codes) para recuperar acceso sin 2FA
- Recuperación de contraseña por correo con token de un solo uso (30 min)
- Reporte de incidentes de seguridad con seguimiento de estado y prioridad
- Autoevaluación de seguridad dinámica — preguntas cargadas desde BD, puntaje 0–20
- Soporte para preguntas abiertas (texto libre) y preguntas condicionales (visibilidad según respuesta anterior)
- Historial de evaluaciones para visualizar evolución en el tiempo
- Dashboard con risk score en tiempo real y desglose narrativo de eventos
- Chat en tiempo real con el equipo de seguridad (Socket.IO)
- Descarga de reportes individuales y consolidados en PDF
- Reporte ejecutivo PDF con resumen gerencial: nivel de riesgo global, métricas de incidentes, plan de acción recomendado y tendencia histórica de puntajes
- Centro de notificaciones por categorías
- Generación de API key para conectar sistemas externos al SIEM

### Para administradores
- Panel de gestión de usuarios: cambiar plan, rol, eliminar
- Gestión dinámica de preguntas de autoevaluación (crear, editar inline, activar/desactivar)
- Soporte para preguntas tipo boolean (Sí/No) y abiertas (texto), con lógica condicional entre preguntas
- Panel SIEM con eventos de seguridad en tiempo real, filtros y paginación
- Monitor de risk scores de todas las empresas con bloqueo/desbloqueo manual
- Logs de auditoría completos: cada acción admin queda registrada
- Chat independiente con cada empresa
- Integración con Shodan (escaneo de IPs) y VirusTotal (análisis de hashes)
- Monitoreo automático de IPs vía cron diario (3 AM Bogotá)
- Resumen semanal de seguridad generado con IA

---


## Capturas de pantalla

> Las siguientes pantallas muestran el flujo principal de la plataforma.

| Dashboard | Autoevaluación | SIEM |
|-----------|---------------|------|
| Risk score en tiempo real, últimos incidentes y acceso al reporte ejecutivo PDF | Cuestionario dinámico con preguntas condicionales y resultado inmediato | Eventos de seguridad en tiempo real con filtros por severidad |

| Reporte ejecutivo PDF | Panel admin |
|-----------------------|-------------|
| Consolidado gerencial: nivel de riesgo, métricas de incidentes, plan de acción y tendencia histórica | Gestión de usuarios, preguntas de autoevaluación, logs de auditoría e integración Shodan/VirusTotal |

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Node.js 18+ + Express |
| Base de datos | MongoDB Atlas + Mongoose |
| Autenticación | JWT (sin Bearer) + bcryptjs + speakeasy (2FA) |
| Validación | Zod + middleware validate |
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Tiempo real | Socket.IO |
| IA | Groq (llama-3.3-70b-versatile) |
| Archivos | Cloudinary |
| PDF | PDFKit |
| Correos | Nodemailer + Gmail |
| Seguridad | Helmet + express-rate-limit |
| Logs | Winston (JSON en prod, colorizado en dev) |
| Tests | Jest + Supertest + mongodb-memory-server |
| Deploy | Render.com (auto-deploy desde main) |

---

## Estructura del proyecto

```
secupyme/
├── src/
│   ├── index.js                        # Entrada + Socket.IO + seed de preguntas
│   ├── controllers/
│   │   ├── authController.js           # Auth, usuarios, API keys
│   │   ├── riskController.js           # Risk score
│   │   ├── siemController.js           # Eventos de seguridad
│   │   ├── iaController.js             # Groq + normativa colombiana
│   │   ├── autoevaluacionController.js # Evaluaciones dinámicas
│   │   ├── reporteController.js
│   │   ├── chatController.js
│   │   ├── auditController.js          # Logs de auditoría
│   │   ├── uploadController.js
│   │   ├── conversationController.js   # getConversaciones, getConversacionActual, crearConversacion
│   │   ├── pdfController.js
│   │   ├── twoFactorController.js
│   │   ├── pdfController.js            # Reportes individuales, consolidados y reporte ejecutivo
│   │   └── integracionController.js    # Shodan + VirusTotal
│   ├── models/
│   │   ├── Usuario.js                  # Con ipsMonitoreadas y apiKey (hash)
│   │   ├── Reporte.js
│   │   ├── Autoevaluacion.js           # respuestas: Map<String, Mixed> (Boolean | String)
│   │   ├── RiskScore.js
│   │   ├── SecurityEvent.js
│   │   ├── AuditLog.js
│   │   ├── TokenBlacklist.js           # TTL index para logout
│   │   ├── Pregunta.js                 # Preguntas dinámicas de autoevaluación
│   │   ├── ChatGeneral.js
│   │   └── Conversation.js
│   ├── routes/                         # Un archivo por recurso
│   ├── middleware/
│   │   ├── auth.js                     # verificarToken, verificarAdmin
│   │   ├── checkPlan.js                # Límites por plan
│   │   ├── validate.js                 # Zod middleware
│   │   ├── apiKey.js                   # Autenticación por API key (SHA-256)
│   │   ├── errorHandler.js             # AppError + handler centralizado
│   │   └── httpLogger.js               # Log de requests HTTP
│   ├── validators/
│   │   └── schemas.js                  # Schemas Zod para todos los endpoints
│   ├── utils/
│   │   └── logger.js                   # Winston
│   └── jobs/
│       └── monitoreoIPs.js             # Cron de Shodan
├── public/
│   ├── landing.html                    # Primera página (GET / redirige aquí)
│   ├── login.html                      # Login
│   ├── registro.html
│   ├── dashboard.html
│   ├── admin.html                      # Panel admin + preguntas + auditoría
│   ├── siem.html                       # SIEM + integración externa
│   ├── autoevaluacion.html
│   ├── reportes.html
│   ├── historial.html
│   ├── membresias.html
│   ├── forgot-password.html
│   ├── reset-password.html
│   ├── reporte-detalle.html
│   ├── utils.js                        # apiFetch global + helpers de fecha
│   ├── sidebar.js
│   ├── chat.js
│   ├── notifications.js
│   ├── toast.js
│   ├── inactividad.js
│   └── styles.css
├── tests/
│   ├── auth.test.js                    # 12 tests
│   ├── health.test.js                  # 1 test
│   ├── validation.test.js              # 10 tests
│   ├── reportes.test.js                # 6 tests
│   ├── autoevaluaciones.test.js        # 8 tests
│   ├── siem.test.js                    # 8 tests
│   └── apikeys.test.js                 # 6 tests
├── src/scripts/
│   └── seedUser.js                     # Genera usuarios con contraseñas seguras
├── .env.example
├── package.json
├── DEPLOYMENT-RENDER.md
└── TECHNICAL-DOCS.md
```

---

## Instalación local

### Requisitos
- Node.js 18 o superior
- Cuenta en MongoDB Atlas
- Cuenta en Cloudinary
- Cuenta en Groq
- Gmail con contraseña de aplicación

```bash
git clone https://github.com/shernandez92-cmd/SecuPyme.git
cd SecuPyme
npm install
cp .env.example .env   # completar variables
npm start              # http://localhost:3000
```

Para correr los tests:
```bash
npm test
```

---

## Variables de entorno

Ver `.env.example` para la lista completa documentada. Variables requeridas:

```
PORT, MONGODB_URI, JWT_SECRET,
EMAIL_USER, EMAIL_PASS,
FRONTEND_URL, CLIENT_URL,
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
GROQ_API_KEY, SHODAN_KEY, VIRUSTOTAL_KEY,
CRON_SECRET, LOG_LEVEL (opcional)
```

---

## API — Endpoints

### Autenticación (`/api/auth`)
```
POST   /registro                   Registrar usuario
POST   /login                      Iniciar sesión
POST   /logout                     Revocar token (JWT blacklist)
POST   /forgot-password            Solicitar reset de contraseña
POST   /reset-password             Establecer nueva contraseña
POST   /2fa/setup                  Configurar 2FA
POST   /2fa/verify                 Activar 2FA
POST   /2fa/login                  Login con código TOTP
GET    /usuarios                   Listar usuarios (admin)
PUT    /usuarios/:id/plan          Cambiar plan (admin)
PUT    /usuarios/:id/rol           Cambiar rol (admin)
DELETE /usuarios/:id               Eliminar usuario (admin)
POST   /apikey                     Generar API key (devuelta una sola vez)
DELETE /apikey                     Revocar API key
GET    /apikey/status              Estado de API key + IPs monitoreadas
```

### Reportes (`/api/reportes`)
```
POST   /                           Crear reporte
GET    /                           Listar (paginado: ?page=1&limit=20)
GET    /:id                        Ver reporte
PUT    /:id                        Actualizar (admin)
PUT    /:id/estado                 Cambiar estado (admin)
DELETE /:id                        Eliminar
```

### Autoevaluaciones (`/api/autoevaluaciones`)
```
POST   /                           Enviar autoevaluación
GET    /                           Historial (paginado)
GET    /preguntas                  Preguntas activas para el formulario
GET    /preguntas/todas            Todas las preguntas (admin)
POST   /preguntas                  Crear pregunta (admin)
PUT    /preguntas/:id              Editar pregunta (admin)
PUT    /preguntas/:id/toggle       Activar/desactivar pregunta (admin)
```

### SIEM (`/api/siem`)
```
GET    /events                     Eventos (admin, paginado)
GET    /estadisticas               Estadísticas (admin)
POST   /external/events            Recibir evento externo (x-api-key)
PUT    /bloquear/:empresaId        Bloquear empresa (admin)
PUT    /desbloquear/:empresaId     Desbloquear empresa (admin)
POST   /cron/monitoreo             Trigger cron Shodan (x-cron-secret)
```

### IA (`/api/ia`) — plan básico o premium
```
POST   /explicar                   Explicar evento de seguridad
POST   /analizar-risk              Analizar risk score
POST   /asistente                  Asistente de ciberseguridad
GET    /resumen-semanal            Resumen semanal automático
```

### Otros
```
GET    /api/health                 Health check
GET    /api/risk/mi-score          Risk score propio
GET    /api/risk                   Todos los scores (admin)
GET    /api/integraciones/shodan/:ip        Consultar IP en Shodan
GET    /api/integraciones/virustotal/:hash  Analizar hash en VirusTotal
POST   /api/chat                   Enviar mensaje
GET    /api/chat                   Obtener mensajes
GET    /api/pdf/reportes           PDF consolidado
GET    /api/pdf/reportes/:id       PDF individual
GET    /api/pdf/autoevaluaciones    PDF historial de autoevaluaciones
GET    /api/pdf/ejecutivo           Reporte ejecutivo gerencial (empresa + riesgo + incidentes + plan de acción)
GET    /api/audit                  Logs de auditoría (admin, paginado)
```

---

## Seguridad implementada

- Contraseñas hasheadas con bcryptjs (salt 10)
- API keys hasheadas con SHA-256 — BD solo guarda el hash
- JWT sin prefijo Bearer, expiración 8h, revocación por blacklist con TTL
- 2FA con TOTP (speakeasy) + 10 backup codes hasheados
- Rate limiting: 500 req/15min general, 5 req/15min en login, 10 req/min en IA
- Helmet para headers HTTP de seguridad
- Validación de inputs con Zod en todas las rutas que reciben body
- Bloqueo automático de empresa con risk score > 80
- Logs de auditoría para todas las acciones de administradores
- Sin stack traces expuestos en producción
- Cron de monitoreo autenticado con CRON_SECRET

---

## Modelo de riesgo

El risk score (0–100) se recalcula automáticamente por eventos:

| Evento | Impacto |
|--------|---------|
| Login fallido | +15 |
| Reporte de fuga de datos | +30 |
| Archivo malicioso (VirusTotal) | +40 |
| Reporte de malware | +25 |
| Puerto crítico detectado (Shodan) | +20 |
| Autoevaluación nivel alto | +30 |
| Login exitoso | −2 |
| Autoevaluación nivel bajo | −10 |

| Rango | Nivel |
|-------|-------|
| 0–30 | Normal |
| 31–60 | Monitoreo |
| 61–80 | Alerta |
| 81–100 | Crítico — bloqueo automático |

---

## Planes

| Plan | Reportes | Autoevaluaciones | IA |
|------|----------|------------------|----|
| Free | 3 | 1 | No |
| Básico | 20 | 10 | Sí |
| Premium | Ilimitado | Ilimitado | Sí |

---

## Integración externa — SIEM exógeno

Cualquier sistema externo puede enviar eventos al SIEM de SecuPyme:

```bash
POST https://secupyme.onrender.com/api/siem/external/events
x-api-key: <tu_api_key>
Content-Type: application/json

{
  "description": "Intento de acceso no autorizado detectado",
  "severity": "high",
  "ip": "192.168.1.50",
  "type": "alerta_siem"
}
```

La API key se genera desde el panel SIEM → Integración Externa.  
`severity` acepta: `low`, `medium`, `high`.

---

## Normativa colombiana

La IA referencia las siguientes normas en sus análisis y recomendaciones:

- **Ley 1581 de 2012** — Protección de datos personales (Habeas Data)
- **Ley 1273 de 2009** — Delitos informáticos
- **CONPES 3995 de 2020** — Política Nacional de Confianza y Seguridad Digital

---

## Tests

```bash
npm test                          # Todos los tests (--runInBand)
npx jest auth --runInBand         # Solo auth
npx jest siem --runInBand         # Solo SIEM
```

| Suite | Tests | Cubre |
|-------|-------|-------|
| auth | 12 | Registro, login, logout, 2FA, reset password |
| health | 1 | Health check |
| validation | 10 | Schemas Zod |
| reportes | 6 | CRUD, paginación, límites de plan |
| autoevaluaciones | 8 | Preguntas, evaluaciones, límites de plan |
| siem | 8 | Eventos, estadísticas, integración externa |
| apikeys | 6 | Generación, revocación, estado |

---

## Despliegue

Ver [DEPLOYMENT-RENDER.md](./DEPLOYMENT-RENDER.md) para instrucciones detalladas.

Auto-deploy activo desde rama `main` en Render.com.

---

## Autor

**Sebastián Hernández Erazo**  
Tecnólogo en Análisis y Desarrollo de Software  
SENA · Bogotá, Colombia · 2026

---

*SecuPyme — Ciberseguridad accesible para las PYMES colombianas.*
