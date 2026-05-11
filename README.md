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

## Autor
Sebastián Hernández — Análisis y Desarrollo de Software, SENA 2026
