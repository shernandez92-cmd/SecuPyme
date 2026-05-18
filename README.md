# 🔒 SecuPyme

**Plataforma de ciberseguridad simplificada para pymes colombianas**

> Proyecto de Grado — SENA, Análisis y Desarrollo de Software
> Desarrollador: Sebastián Hernández
> Deploy: [secupyme.onrender.com](https://secupyme.onrender.com)

---

## 📋 Descripción

SecuPyme es una plataforma SaaS de ciberseguridad diseñada específicamente para pequeñas y medianas empresas colombianas que no cuentan con equipos técnicos especializados. Traduce conceptos complejos de ciberseguridad a acciones concretas y comprensibles.

---

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express |
| Base de datos | MongoDB Atlas |
| Tiempo real | Socket.IO |
| Frontend | Vanilla JS |
| IA | Groq LLaMA 3.3 70B |
| Archivos | Cloudinary |
| Integraciones | Shodan API + VirusTotal API |
| Auth | JWT + bcrypt + speakeasy 2FA |
| Deploy | Render |

---

## ✨ Funcionalidades

### 🔐 Autenticación
- Login seguro con JWT 8h de expiración
- Autenticación de dos factores 2FA con Google Authenticator
- Rate limiting máximo 5 intentos de login por 15 minutos
- Cierre de sesión automático por inactividad 10 minutos
- Roles admin y cliente

### 📊 Dashboard
- Resumen de reportes por estado
- Reportes de las últimas 72 horas
- Gráfica de vulnerabilidades por tipo

### 🚨 Gestión de Incidentes
- Crear editar y eliminar reportes de incidentes
- Estados abierto en proceso resuelto
- Prioridades alta media baja
- Tipos phishing malware acceso no autorizado fuga de datos
- Notas del admin con notificación por correo al cliente
- Exportar reportes a PDF

### 📋 Autoevaluación
- 10 preguntas con puntaje ponderado 0-20
- Niveles de riesgo bajo medio alto
- Recomendaciones automáticas por área de mejora
- Historial con evolución del puntaje
- Exportar historial a PDF
- Alerta por correo si riesgo es alto

### 🔍 SIEM alineado con NIST SP 800-61

Preparación
- Sistema de logs centralizado
- Gestión de usuarios y roles
- Rate limiting y hardening básico

Detección y Análisis
- Timeline de eventos en tiempo real
- Login exitoso y fallido
- Cambio de rol
- Detección de anomalías 3 intentos fallidos bloqueo automático
- Integración con Shodan puertos críticos
- Integración con VirusTotal archivos maliciosos
- Risk score dinámico por empresa 0-100
- Clasificación de severidad baja media alta
- Dashboard visual con gráficas

Contención
- Bloqueo temporal automático score mayor a 80
- Bloqueo manual desde panel admin
- Desbloqueo manual

Post-Incidente
- Historial de eventos por empresa
- Exportar reportes
- Resumen semanal IA

### 📈 Risk Score Dinámico

| Evento | Cambio |
|--------|--------|
| Login fallido | +15 |
| Login exitoso | -2 |
| Reporte phishing | +20 |
| Reporte malware | +25 |
| Reporte acceso no autorizado | +20 |
| Reporte fuga de datos | +30 |
| Autoevaluación alto riesgo | +30 |
| Autoevaluación medio riesgo | +10 |
| Autoevaluación bajo riesgo | -10 |
| Shodan puerto crítico | +10 |
| VirusTotal malicioso | +40 |

Umbrales
- 0-30 Normal
- 31-60 Monitoreo
- 61-80 Alerta
- 81-100 Crítico bloqueo automático

### 🤖 Inteligencia Artificial Groq LLaMA 3.3 70B
- Asistente flotante chat de ciberseguridad en todas las páginas
- Explicador de eventos traduce eventos técnicos a lenguaje simple
- Análisis de risk score diagnóstico y recomendaciones
- Resumen semanal informe ejecutivo automático

### 💬 Chat Multiempresa
- Conversaciones aisladas admin empresa
- Mensajes en tiempo real via Socket.IO
- Contador de mensajes no leídos por conversación
- Subir imágenes y PDFs via Cloudinary
- Sonido de notificación
- Historial persistente

### 🔗 Integraciones Externas
- Shodan consulta de IPs detección de puertos críticos
- VirusTotal análisis de hashes de archivos maliciosos

### 👥 Panel Admin
- Gestión de usuarios y roles
- Cambio de planes free básico premium
- Ver todas las conversaciones
- SIEM completo
- Desbloqueo de empresas

### 💳 Planes

| Plan | Reportes | Precio |
|------|----------|--------|
| Free | 3 | Gratis |
| Básico | 20 | 29900 mes |
| Premium | Ilimitados | 79900 mes |

---

## ⚙️ Variables de Entorno

PORT
MONGODB_URI
JWT_SECRET
EMAIL_USER
EMAIL_PASS
SHODAN_KEY
VIRUSTOTAL_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
GROQ_API_KEY

---

## 🚀 Instalación Local

git clone https://github.com/shernandez92-cmd/SecuPyme.git
cd SecuPyme
npm install
node src/index.js

---

## 👤 Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | sebastian@secupyme.com | 123456 |
| Cliente | demo@empresa.com | 123456 |

El admin tiene 2FA activo usar Google Authenticator.

---

## 🔮 Trabajo Futuro

- Bloqueo por IP
- Refresh tokens
- App móvil nativa
- Backups automáticos
- Monitoreo con health checks
- Centro de notificaciones con categorías
- Onboarding para nuevas empresas
- 2FA obligatorio en registro
- Pagos reales Wompi PSE

---

## 📄 Licencia

Proyecto académico SENA 2026
