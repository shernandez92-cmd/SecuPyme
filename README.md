# SecuPyme

Plataforma de ciberseguridad diseñada para pequeñas y medianas empresas (PYMES) colombianas. Ciberseguridad simplificada.

## Demo en producción
 https://secupyme.onrender.com

## ¿Qué es SecuPyme?
SecuPyme permite a las PYMES reportar incidentes de seguridad, recibir asistencia especializada, conocer su nivel de exposición al riesgo y monitorear eventos de seguridad en tiempo real.

## Funcionalidades

### Seguridad y Autenticación
- Login con JWT y roles (cliente / admin)
- Autenticación de dos factores (2FA) con TOTP
- Rate limiting para prevenir fuerza bruta
- Cierre de sesión automático por inactividad
- Headers de seguridad con Helmet.js

### Gestión de Incidentes
- Reporte de incidentes por empresa registrada
- Cambio de estado y prioridad por admin
- Notas internas y pasos a seguir
- Archivar y eliminar reportes
- Filtros por estado desde el dashboard
- Exportar reportes en PDF

### Autoevaluación de Seguridad
- Cuestionario con puntaje ponderado (0-20)
- Niveles de riesgo: bajo, medio, alto
- Recomendaciones automáticas personalizadas
- Alertas por correo si el riesgo es alto
- Historial de evaluaciones
- Exportar historial en PDF

### Comunicación
- Chat flotante general por empresa
- Chat por reporte en vista de detalle
- Notificaciones por correo automáticas
- Mensaje de bienvenida automático

### SIEM
- Registro automático de eventos de seguridad
- Tipos: login exitoso, login fallido, nuevo reporte
- Filtros por tipo y severidad
- Actualización en tiempo real

### Integraciones Externas
- Shodan — consulta de IPs y puertos expuestos
- VirusTotal — análisis de archivos por hash
- Nodemailer — notificaciones por Gmail

### Administración
- Panel de usuarios con cambio de rol y plan
- Sistema de membresías: free, básico, premium
- API pública con autenticación por API key
- Exportar reportes en PDF

## Tecnologías
- **Backend:** Node.js + Express
- **Base de datos:** MongoDB Atlas
- **Frontend:** HTML, CSS, JavaScript
- **Autenticación:** JWT + bcrypt + speakeasy (2FA)
- **Notificaciones:** Nodemailer + Gmail
- **Seguridad:** Helmet.js + express-rate-limit
- **PDF:** PDFKit
- **Integraciones:** Shodan API + VirusTotal API

## Instalación

1. Clona el repositorio
2. Instala dependencias: `npm install`
3. Crea `.env` con estas variables:
PORT=3000
MONGODB_URI=mongodb+srv://secupyme:Lenny2021.@sharedcluster.z1hddur.mongodb.net/?appName=SharedCluster
JWT_SECRET=secupyme_secret_2024
EMAIL_USER=secupyme.notificaciones@gmail.com
EMAIL_PASS=perf ldxd rutn tshx
SHODAN_KEY=ip9gZONMkFRWjzdqySHGKscO6mKSOYuX
VIRUSTOTAL_KEY=74439078ce9d9dfdc18d00e5b0ab64cdb470c3e71effb1ee2e59f11b10291eda

4. Corre el servidor: `node src/index.js`
5. Abre: `http://localhost:3000`

## Credenciales de prueba
- **Admin:** sebastian@secupyme.com / 123456
- **Cliente:** demo@empresa.com / 123456

## 🔒 Seguridad - Auditoría Completa (Mayo 2026)

### Vulnerabilidades Críticas Corregidas
Se realizó una auditoría de seguridad exhaustiva que identificó y corrigió **47 problemas**, incluyendo **10 vulnerabilidades críticas**:

✅ **Autorización** - Validación en TODOS los endpoints protegidos  
✅ **Validación de Entrada** - Prevención de XSS, SQL injection, path traversal  
✅ **Autenticación** - Bearer tokens (NO query parameters), JWT mejorado  
✅ **SSRF Prevention** - Validación de IPs, bloqueo de rangos privados  
✅ **Headers de Seguridad** - Helmet.js, CORS, rate limiting  
✅ **Errores Seguros** - Sin exposición de stack traces  
✅ **Límites de Cuerpo** - Prevención de DoS (10MB max)  
✅ **Fortaleza de Contraseña** - 8+ chars, mayúscula, minúscula, número, carácter especial  
✅ **Manejo Global de Errores** - Centralized error handler  
✅ **API Segura** - Validación exhaustiva en integraciones externas

### Nuevas Características de Seguridad

**Validadores Completos** (`src/utils/validators.js`):
- Email validation (RFC-compliant)
- Password strength enforcement
- IP validation (con SSRF prevention)
- MongoDB ObjectID validation
- XSS prevention via HTML escaping
- Filename sanitization
- String length validation

**Manejo Centralizado de Errores** (`src/utils/errorHandler.js`):
- Respuestas seguras sin información sensible
- Detección de tipos de error
- Global error middleware
- Async route wrapper

**Gestión de Email Segura** (`src/utils/emailConfig.js`):
- Transporte centralizado
- Sanitización de entrada
- Manejo de errores robusto

### Mejoras de Seguridad por Sección

**Authentication & Authorization**:
- ✅ Validación de token en header Authorization (Bearer)
- ✅ Verificación de pertenencia en TODOS los recursos
- ✅ Roles enforcement (admin/user)
- ✅ Validación de usuario activo
- ✅ Contraseñas hasheadas con bcrypt (salt 10)

**API Pública**:
- ✅ Autenticación por API key (header x-api-key)
- ✅ Solo usuarios pueden generar sus propias keys
- ✅ Admins pueden generar keys para otros
- ✅ Validación de parámetros requeridos

**Integraciones Externas**:
- ✅ Shodan: Validación de IP + bloqueo de rangos privados
- ✅ VirusTotal: Validación de formato de hash (MD5/SHA1/SHA256)
- ✅ Timeout de 10 segundos en llamadas externas
- ✅ Validación de códigos HTTP
- ✅ Rate limiting (1000 req/hora)

**Reportes**:
- ✅ Solo propietario o admin pueden ver/editar
- ✅ Solo admin puede cambiar estado/prioridad
- ✅ Validación de longitud de campos
- ✅ Sanitización de entrada XSS
- ✅ Notas de admin solo visibles por admin

**Documentación de Seguridad**:
- 📄 `SECURITY_FIXES_REPORT.md` - Reporte detallado de 47 fixes
- 📄 `API_USAGE_GUIDE.md` - Guía de API con best practices

### Rate Limiting
| Endpoint | Límite |
|----------|--------|
| General API | 100 requests / 15 minutos |
| Login | 5 intentos / 15 minutos |
| Integraciones (Shodan/VT) | 1000 requests / 1 hora |
| Todos | 10MB max body size |

### Recomendaciones Futuras
- [ ] Agregar `express-csurf` para CSRF adicional
- [ ] Implementar rotation de refresh tokens
- [ ] Audit logging para operaciones sensibles
- [ ] Rate limiting por usuario
- [ ] Políticas de rotación de API keys
- [ ] Hardening de 2FA

## 📖 Documentación de Seguridad

Revisa estos archivos para más detalles:
- **SECURITY_FIXES_REPORT.md** - Informe completo de auditoría (47 issues)
- **API_USAGE_GUIDE.md** - Guía de uso API con ejemplos cURL, JS, Python

## Autor
Sebastián Hernández — Análisis y Desarrollo de Software, SENA 2026
