# SecuPyme

Plataforma de ciberseguridad diseñada para pequeñas y medianas empresas (PYMES) colombianas. Permite reportar incidentes de seguridad, realizar autoevaluaciones, monitorear el nivel de riesgo en tiempo real y recibir asistencia especializada con inteligencia artificial.

**Proyecto de Grado — Análisis y Desarrollo de Software, SENA 2026**  
**Deploy:** https://secupyme.onrender.com

---

## Funcionalidades

### Para empresas clientes
- Registro e inicio de sesión con JWT y autenticación de doble factor (2FA)
- Reporte de incidentes de seguridad con seguimiento de estado
- Autoevaluación de seguridad con puntaje automático y recomendaciones
- Historial de evaluaciones para visualizar evolución en el tiempo
- Dashboard con score de riesgo en tiempo real
- Chat en tiempo real con el equipo de seguridad
- Descarga de reportes en PDF
- Centro de notificaciones por categorías

### Para administradores
- Panel de gestión de usuarios (cambiar plan, rol, eliminar)
- Panel SIEM con eventos de seguridad en tiempo real
- Monitor de risk scores de todas las empresas
- Bloqueo y desbloqueo manual de empresas
- Chat con cada empresa de forma independiente
- Integración con Shodan y VirusTotal
- Resumen semanal generado con IA

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Node.js + Express |
| Base de datos | MongoDB Atlas + Mongoose |
| Autenticación | JWT + bcryptjs + speakeasy (2FA) |
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Tiempo real | Socket.IO |
| IA | Groq (llama-3.3-70b-versatile) |
| Archivos | Cloudinary (imágenes y PDFs) |
| PDF | PDFKit |
| Correos | Nodemailer + Gmail |
| Seguridad | Helmet + express-rate-limit |
| Deploy | Render.com |

---

## Estructura del proyecto

```
secupyme/
├── src/
│   ├── index.js                    # Entrada del servidor + Socket.IO
│   ├── controllers/                # Lógica de negocio
│   │   ├── authController.js       # Registro, login, usuarios
│   │   ├── riskController.js       # Cálculo y gestión de risk score
│   │   ├── siemController.js       # Registro de eventos de seguridad
│   │   ├── iaController.js         # Integración con Groq
│   │   ├── autoevaluacionController.js
│   │   ├── reporteController.js
│   │   ├── chatController.js
│   │   ├── uploadController.js     # Cloudinary
│   │   ├── pdfController.js        # Generación de PDFs
│   │   ├── twoFactorController.js  # 2FA con speakeasy
│   │   └── integracionController.js
│   ├── models/                     # Schemas de MongoDB
│   │   ├── Usuario.js
│   │   ├── Reporte.js
│   │   ├── Autoevaluacion.js
│   │   ├── RiskScore.js
│   │   ├── SecurityEvent.js
│   │   ├── ChatGeneral.js
│   │   └── Conversation.js
│   ├── routes/                     # Endpoints de la API
│   └── middleware/
│       ├── auth.js                 # verificarToken, verificarAdmin
│       └── checkPlan.js            # Límites por plan
├── public/                         # Frontend
│   ├── index.html                  # Landing / login
│   ├── dashboard.html              # Dashboard cliente
│   ├── admin.html                  # Panel administrador
│   ├── siem.html                   # Panel SIEM
│   ├── autoevaluacion.html
│   ├── reportes.html
│   ├── historial.html
│   ├── sidebar.js                  # Sidebar compartido + Socket.IO
│   ├── chat.js                     # Chat en tiempo real
│   ├── notifications.js            # Centro de notificaciones
│   └── styles.css
├── seed.js                         # Script de datos demo
├── package.json
├── .env                            # Variables de entorno (no commitear)
├── TECHNICAL-DOCS.md
└── DEPLOYMENT-RENDER.md
```

---

## Instalación local

### Requisitos
- Node.js 18 o superior
- Cuenta en MongoDB Atlas
- Cuenta en Cloudinary
- Cuenta en Groq (para IA)
- Gmail con contraseña de aplicación

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/shernandez92-cmd/SecuPyme.git
cd SecuPyme

# 2. Instalar dependencias
npm install

# 3. Crear archivo .env con las variables necesarias

# 4. Iniciar el servidor
npm start

# 5. Opcional: poblar con datos demo
node seed.js
```

El servidor queda disponible en http://localhost:3000

---

## Variables de entorno

Crear un archivo `.env` en la raíz con:

```
PORT=3000
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/secupyme
JWT_SECRET=clave_secreta_minimo_32_caracteres
EMAIL_USER=tucorreo@gmail.com
EMAIL_PASS=contraseña_de_aplicacion_gmail
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
GROQ_API_KEY=tu_groq_api_key
SHODAN_KEY=tu_shodan_key
VIRUSTOTAL_KEY=tu_virustotal_key
CLIENT_URL=https://secupyme.onrender.com
```

---

## API — Endpoints principales

### Autenticación
```
POST   /api/auth/registro              Registrar usuario
POST   /api/auth/login                 Iniciar sesión
POST   /api/auth/2fa/setup             Configurar 2FA
POST   /api/auth/2fa/verify            Verificar y activar 2FA
POST   /api/auth/2fa/login             Login con código 2FA
GET    /api/auth/usuarios              Listar usuarios (admin)
PUT    /api/auth/usuarios/:id/plan     Cambiar plan (admin)
PUT    /api/auth/usuarios/:id/rol      Cambiar rol (admin)
DELETE /api/auth/usuarios/:id          Eliminar usuario (admin)
```

### Reportes
```
POST   /api/reportes                   Crear reporte
GET    /api/reportes                   Listar reportes
GET    /api/reportes/:id               Ver reporte
PUT    /api/reportes/:id               Actualizar reporte (admin)
PUT    /api/reportes/:id/estado        Cambiar estado (admin)
DELETE /api/reportes/:id               Eliminar reporte
```

### Risk Score
```
GET    /api/risk                       Ver todos los scores (admin)
GET    /api/risk/mi-score              Ver score propio
PUT    /api/risk/desbloquear/:id       Desbloquear empresa (admin)
```

### SIEM
```
GET    /api/siem/events                Ver eventos de seguridad (admin)
GET    /api/siem/estadisticas          Estadísticas SIEM (admin)
PUT    /api/siem/bloquear/:id          Bloquear empresa (admin)
PUT    /api/siem/desbloquear/:id       Desbloquear empresa (admin)
```

### Inteligencia Artificial
```
POST   /api/ia/explicar                Explicar evento de seguridad
POST   /api/ia/analizar-risk           Analizar risk score
POST   /api/ia/asistente               Asistente de ciberseguridad
GET    /api/ia/resumen-semanal         Resumen semanal automático
```

### Otros
```
POST   /api/autoevaluaciones           Enviar autoevaluación
GET    /api/autoevaluaciones           Ver historial
GET    /api/chat                       Obtener mensajes
POST   /api/chat                       Enviar mensaje
POST   /api/upload                     Subir archivo (Cloudinary)
GET    /api/upload/descargar           Proxy de descarga PDF
GET    /api/pdf/reportes               Exportar PDF consolidado
GET    /api/pdf/reportes/:id           Exportar reporte individual
GET    /api/integraciones/shodan/:ip   Consultar Shodan
GET    /api/integraciones/virustotal/:hash  Consultar VirusTotal
```

---

## Modelo de riesgo

El risk score (0-100) se calcula automáticamente según eventos:

| Evento | Impacto |
|--------|---------|
| Login fallido | +15 |
| Reporte de fuga de datos | +30 |
| Archivo malicioso (VirusTotal) | +40 |
| Reporte de malware | +25 |
| Reporte de phishing | +20 |
| Autoevaluación nivel alto | +30 |
| Login exitoso | -2 |
| Autoevaluación nivel bajo | -10 |

| Rango | Nivel |
|-------|-------|
| 0 – 30 | Normal |
| 31 – 60 | Monitoreo |
| 61 – 80 | Alerta |
| 81 – 100 | Crítico (bloqueo automático) |

---

## Datos demo

Para poblar la base de datos con 6 empresas ficticias colombianas realistas:

```bash
node seed.js
```

Crea usuarios, reportes, autoevaluaciones, risk scores, eventos SIEM y conversaciones de chat con fechas distribuidas en los últimos 60 días.

---

## Seguridad implementada

- Contraseñas hasheadas con bcryptjs (salt 10)
- Autenticación JWT con expiración de 8 horas
- Doble factor de autenticación (TOTP con speakeasy)
- Rate limiting: 500 req/15min general, 5 req/15min en login
- Helmet para headers de seguridad HTTP
- Bloqueo automático por score de riesgo mayor a 80
- Verificación de rol en todos los endpoints protegidos
- Límites de uso por plan (free: 3 reportes, básico: 20, premium: ilimitado)

---

## Planes disponibles

| Plan | Reportes | Funcionalidades |
|------|----------|-----------------|
| Free | 3 | Básico |
| Básico | 20 | + Historial, Chat |
| Premium | Ilimitado | + SIEM, IA, Integraciones |

---

## Despliegue

Ver [DEPLOYMENT-RENDER.md](./DEPLOYMENT-RENDER.md) para instrucciones detalladas.

**URL de producción:** https://secupyme.onrender.com

---

## Autor

**Sebastián Hernández Erazo**  
Tecnólogo en Análisis y Desarrollo de Software  
SENA
Bogotá, Colombia · 2026

---

*SecuPyme — Ciberseguridad accesible para las PYMES colombianas.*
