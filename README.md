# SecuPyme

Plataforma de ciberseguridad diseñada para pequeñas y medianas empresas (PYMES) colombianas que necesitan proteger sus activos digitales a bajo costo.

## ¿Qué es SecuPyme?

SecuPyme permite a las PYMES reportar incidentes de seguridad, recibir asistencia especializada y conocer su nivel de exposición al riesgo mediante un módulo de autoevaluación inteligente.

## Funcionalidades

- Autenticación segura con JWT y roles (cliente / admin)
- Reporte de incidentes de seguridad
- Módulo de autoevaluación con puntaje ponderado y recomendaciones automáticas
- Historial de evaluaciones para monitorear evolución
- Notificaciones por correo automáticas al admin y al cliente
- Panel de administración con gestión de usuarios
- Dashboard con métricas en tiempo real

## Tecnologías

- **Backend:** Node.js + Express
- **Base de datos:** MongoDB Atlas
- **Frontend:** HTML, CSS, JavaScript
- **Autenticación:** JWT + bcrypt
- **Notificaciones:** Nodemailer + Gmail

## Instalación

1. Clona el repositorio
2. Instala dependencias con `npm install`
3. Crea un archivo `.env` con las siguientes variables:

PORT=3000

MONGODB_URI = Tu connection string
JWT_SECRET = Tu secret
EMAIL_USER= Tu correo
EMAIL_PASS= Tu contraseña de aplicacion

4. Corre el servidor con `node src/index.js`
5. Abre `http://localhost:3000`

## Autor

Sebastián Hernández — Análisis y Desarrollo de Software, SENA
