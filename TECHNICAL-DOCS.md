# Secupyme - Technical Documentation

**Version**: 1.0.0  
**Last Updated**: May 8, 2026  
**Status**: Active Development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Setup & Installation](#setup--installation)
6. [API Documentation](#api-documentation)
7. [Authentication & Authorization](#authentication--authorization)
8. [Core Features](#core-features)
9. [Database Schema](#database-schema)
10. [Frontend Architecture](#frontend-architecture)
11. [Deployment](#deployment)
12. [Security Considerations](#security-considerations)
13. [Performance Optimization](#performance-optimization)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Secupyme** is a specialized cybersecurity platform designed for Colombian Small and Medium Enterprises (PYMEs). It provides a comprehensive solution for security incident reporting, self-assessment, and management with specialized features for SME contexts.

### Key Objectives

- **Incident Management**: Report and track security incidents
- **Security Assessment**: Automated self-assessment with weighted scoring
- **Compliance Reporting**: Generate PDF reports for stakeholders
- **Communication**: Real-time chat system for incident discussion
- **Role-Based Access**: Separate admin and client interfaces
- **Notifications**: Email alerts for incident updates

### Target Users

- **Admins**: Security consultants/team managing reports
- **Clients**: PYMEs reporting incidents and managing their security

---

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (Vanilla JS)               │
│  ├─ Login/Register (index.html)                    │
│  ├─ Reports Dashboard (reportes.html)             │
│  ├─ Report Details (reporte-detalle.html)         │
│  ├─ Assessments (autoevaluacion.html)             │
│  ├─ Chat (floating-chat.js)                       │
│  └─ Sidebar Navigation (sidebar.js)               │
└─────────────────────────────────────────────────────┘
                          ↓ (HTTPS)
┌─────────────────────────────────────────────────────┐
│            Express.js API Server (Port 3000)        │
├─ Routes /api/auth         (Authentication)          │
├─ Routes /api/reportes     (Incident Management)    │
├─ Routes /api/autoevaluaciones (Security Assessment)│
├─ Routes /api/mensajes     (Messaging)              │
├─ Routes /api/chat         (Real-time Chat)         │
└─ Routes /api/pdf          (PDF Generation)         │
                          ↓
┌─────────────────────────────────────────────────────┐
│        MongoDB Atlas (Cloud Database)               │
├─ Users Collection        (Authentication)           │
├─ Reportes Collection     (Incident Reports)        │
├─ Autoevaluaciones        (Assessment Results)      │
├─ Mensajes               (Messages)                  │
└─ ChatGeneral            (Chat History)             │
└─────────────────────────────────────────────────────┘
```

### Request Flow

```
Client Browser
     ↓
localStorage (JWT Token)
     ↓
HTTP Request + Authorization Header
     ↓
Express Server
     ↓
Middleware (verificarToken)
     ↓
JWT Verification
     ↓
Route Handler (Controller)
     ↓
MongoDB Query
     ↓
Response (JSON/PDF/Stream)
     ↓
Browser
```

---

## Technology Stack

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 18.x | Server runtime |
| Framework | Express.js | 5.2.1 | HTTP server & routing |
| Database | MongoDB | 9.6 (Mongoose) | Document database |
| Authentication | JWT (jsonwebtoken) | 9.0.3 | Token-based auth |
| Password Hashing | bcryptjs | 3.0.3 | Secure password storage |
| Email | Nodemailer | 8.0.7 | Email notifications |
| PDF Generation | PDFKit | 0.18.0 | PDF document creation |
| Environment | dotenv | 17.4.2 | Environment variable management |

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Markup | HTML5 | Structure |
| Styling | CSS3 | Design & Layout |
| JavaScript | Vanilla JS (ES6+) | Interactivity |
| Storage | localStorage | Client-side JWT storage |
| Fonts | Google Fonts | Typography |
| Icons | Unicode/Emoji | Visual indicators |

### Infrastructure

| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Cloud database hosting |
| Render.com | Application hosting |
| SMTP (Gmail) | Email delivery |
| GitHub | Version control |

---

## Project Structure

```
secupyme/
├── src/
│   ├── index.js                 # Main server entry point
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── reporteController.js # Incident management
│   │   ├── autoevaluacionController.js # Self-assessment
│   │   ├── mensajeController.js # Messaging
│   │   ├── chatController.js   # Chat system
│   │   └── pdfController.js    # PDF generation
│   ├── models/
│   │   ├── Usuario.js          # User schema
│   │   ├── Reporte.js          # Incident report schema
│   │   ├── Autoevaluacion.js   # Assessment schema
│   │   ├── Mensaje.js          # Message schema
│   │   └── ChatGeneral.js      # Chat history schema
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth routes
│   │   ├── reporteRoutes.js    # /api/reportes routes
│   │   ├── autoevaluacionRoutes.js # /api/autoevaluaciones routes
│   │   ├── mensajeRoutes.js    # /api/mensajes routes
│   │   ├── chatRoutes.js       # /api/chat routes
│   │   └── pdfRoutes.js        # /api/pdf routes
│   └── middleware/
│       └── auth.js             # JWT verification middleware
├── public/
│   ├── index.html              # Login page
│   ├── dashboard.html          # Admin dashboard
│   ├── reportes.html           # Reports list & form
│   ├── reporte-detalle.html    # Single report view
│   ├── autoevaluacion.html     # Self-assessment form
│   ├── historial.html          # Report history
│   ├── admin.html              # Admin panel
│   ├── sidebar.js              # Navigation component
│   ├── styles.css              # Global styles
│   └── chat-component.js       # Chat system
├── .env                        # Environment variables (NOT in git)
├── .env.example                # Example env variables
├── package.json                # Dependencies
├── DEPLOYMENT-RENDER.md        # Render deployment guide
├── TECHNICAL-DOCS.md           # This file
└── README.md                   # Project overview
```

---

## Setup & Installation

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- MongoDB Atlas account
- Gmail account (for email notifications)
- GitHub account (for version control)

### Local Development Setup

#### 1. Clone Repository

```bash
git clone https://github.com/your-username/secupyme.git
cd secupyme
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Create `.env` File

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/secupyme
JWT_SECRET=your_super_secret_key_min_32_characters_long
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password-from-gmail
```

#### 4. Start Server

```bash
# Development (with auto-reload)
npm install --save-dev nodemon
npm run dev

# Production
npm start
```

#### 5. Access Application

- **API**: http://localhost:3000
- **Frontend**: http://localhost:3000 (served from public/)

### MongoDB Setup

1. Create MongoDB Atlas account: https://www.mongodb.com/cloud/atlas
2. Create a cluster (free tier available)
3. Create a database user with strong password
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/secupyme`
5. Add your IP to IP Whitelist (or 0.0.0.0/0 for development)

### Gmail Setup (Email Notifications)

1. Enable 2FA on Gmail account
2. Generate App Password:
   - Go to myaccount.google.com/security
   - Click "App passwords"
   - Select "Mail" and "Windows Computer"
   - Copy generated password
3. Use as `EMAIL_PASS` in `.env`

---

## API Documentation

### Authentication Endpoints

#### Register User

```http
POST /api/auth/registro
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "nombre": "John Doe",
  "rol": "client"  // "client" or "admin"
}
```

**Response (201)**:
```json
{
  "mensaje": "Usuario registrado exitosamente",
  "usuario": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "nombre": "John Doe",
    "rol": "client"
  }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "nombre": "John Doe",
    "rol": "client"
  }
}
```

### Incident Reporting Endpoints

#### Create Report

```http
POST /api/reportes
Authorization: Bearer <token>
Content-Type: application/json

{
  "empresa": "Mi Empresa SAS",
  "tipoVulnerabilidad": "phishing",
  "descripcion": "Recibimos correos sospechosos solicitando credenciales..."
}
```

#### Get All Reports

```http
GET /api/reportes
Authorization: Bearer <token>
```

**Admin sees all reports; clients see only their own.**

#### Get Single Report

```http
GET /api/reportes/:id
Authorization: Bearer <token>
```

#### Update Report

```http
PUT /api/reportes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "estado": "en proceso",
  "prioridad": "alta",
  "notasAdmin": "Equipo investigando..."
}
```

### Self-Assessment Endpoints

#### Submit Assessment

```http
POST /api/autoevaluaciones
Authorization: Bearer <token>
Content-Type: application/json

{
  "respuestas": {
    "contraseñasSeguras": true,
    "dobleAutenticacion": false,
    "equiposActualizados": true,
    "softwareLicenciado": true,
    "copiasSeguridad": true,
    "copiasEnLugarSeguro": true,
    "capacitacionEmpleados": false,
    "identificaPhishing": true,
    "firewallActivo": true,
    "redProtegida": true
  }
}
```

**Response**:
```json
{
  "nivelRiesgo": "medio",
  "puntaje": 16,
  "recomendaciones": [
    "Implementar autenticación de dos factores",
    "Capacitar empleados en seguridad...",
    "Revisar políticas de acceso..."
  ]
}
```

### PDF Export Endpoints

#### Export Single Report

```http
GET /api/pdf/reportes/:id?token=<jwt_token>
```

**Returns**: PDF file download

#### Export All Reports

```http
GET /api/pdf/reportes?token=<jwt_token>
```

**Returns**: PDF file with all reports

### Chat Endpoints

#### Send Message

```http
POST /api/mensajes/:reporteId
Authorization: Bearer <token>
Content-Type: application/json

{
  "contenido": "¿Qué recomendaciones tienen?"
}
```

#### Get Messages for Report

```http
GET /api/mensajes/:reporteId
Authorization: Bearer <token>
```

---

## Authentication & Authorization

### JWT Implementation

#### Token Structure

```
Header.Payload.Signature

Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "rol": "client",
  "iat": 1630703240,
  "exp": 1630789640
}
```

#### Middleware - src/middleware/auth.js

```javascript
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(401).json({ mensaje: 'Token requerido' });
  }
  
  try {
    const verificado = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = verificado;
    next();
  } catch (error) {
    res.status(401).json({ mensaje: 'Token inválido' });
  }
};
```

### Role-Based Access Control

```javascript
const verificarAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado' });
  }
  next();
};
```

### Frontend Token Storage

```javascript
// Login - Save token
localStorage.setItem('token', response.token);
localStorage.setItem('rol', response.usuario.rol);

// API Calls - Include token
const response = await fetch('/api/reportes', {
  headers: { 'authorization': localStorage.getItem('token') }
});

// Logout - Clear token
localStorage.removeItem('token');
localStorage.removeItem('rol');
```

### Token Security

✅ **Best Practices Implemented**:
- Tokens stored in localStorage (accessible via browser storage API only)
- 24-hour expiration
- HTTPS-only transmission (in production)
- Strong JWT secret (min 32 characters)
- Server-side verification on every protected route

⚠️ **Considerations**:
- localStorage is vulnerable to XSS attacks
- Consider httpOnly cookies for higher security
- Implement refresh token rotation for long-term sessions
- Add logout endpoint to invalidate tokens server-side (optional)

---

## Core Features

### 1. Incident Reporting System

**Purpose**: Allow companies to report security incidents

**Flow**:
1. User fills form (empresa, tipo, descripción)
2. Submit → POST /api/reportes
3. Report saved to MongoDB
4. Email notification to admin
5. Report visible in dashboard

**Data Model**:
```javascript
{
  usuario: ObjectId,
  empresa: String,
  tipoVulnerabilidad: String (enum),
  descripcion: String,
  estado: String (abierto|en proceso|resuelto),
  prioridad: String (alta|media|baja),
  notasAdmin: String,
  fecha: Date
}
```

### 2. Security Self-Assessment

**Purpose**: Automated security evaluation with scoring

**Questions (10 total)**:
- Secure passwords usage
- Two-factor authentication
- System updates
- Software licensing
- Backup practices
- External backups
- Employee training
- Phishing recognition
- Firewall protection
- WiFi security

**Scoring Algorithm**:
- 1 point per "YES" answer
- Maximum 10 points
- **Risk Levels**:
  - 0-3: CRITICAL (🔴)
  - 4-6: ALTO (🟠)
  - 7-8: MEDIO (🟡)
  - 9-10: BAJO (🟢)

**Recommendations Engine**:
```javascript
const recomendaciones = {
  contraseñasSeguras: "Implementar política de contraseñas complejas",
  dobleAutenticacion: "Habilitar autenticación de dos factores",
  // ... más recomendaciones
};

// Returns only recommendations for unanswered questions
```

### 3. PDF Report Generation

**Features**:
- Professional formatting with app theme colors
- Support for individual and bulk export
- Includes incident details + admin notes
- Timestamp and confidentiality notice
- Color-coded status badges
- Permission-based access

**PDF Sections**:
- Header with Secupyme branding
- Report information (empresa, tipo, estado, prioridad)
- Full incident description
- Admin notes and recommendations
- Generated date and footer

### 4. Real-Time Chat System

**Purpose**: Communication between admins and clients

**Features**:
- Floating chat widget (bottom-right)
- Per-report conversation threads
- Real-time message loading
- User identification
- Timestamp tracking

**Technical**:
- Polling-based (queries for new messages every 2 seconds)
- Socket.io integration possible for future enhancement

### 5. Email Notifications

**Triggered Events**:
- User registration confirmation
- Report submission notification
- Admin report updates
- Assessment completion
- Message notifications

**Implementation**:
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Sends HTML formatted emails
```

---

## Database Schema

### Users (Usuario)

```javascript
{
  _id: ObjectId,
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    bcrypted
  },
  nombre: String,
  empresa: String,
  rol: {
    type: String,
    enum: ['admin', 'client'],
    default: 'client'
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Reports (Reporte)

```javascript
{
  _id: ObjectId,
  usuario: {
    type: ObjectId,
    ref: 'Usuario',
    required: true
  },
  empresa: String,
  tipoVulnerabilidad: {
    type: String,
    enum: ['phishing', 'malware', 'acceso no autorizado', 'fuga de datos', 'otro']
  },
  descripcion: String,
  estado: {
    type: String,
    enum: ['abierto', 'en proceso', 'resuelto'],
    default: 'abierto'
  },
  prioridad: {
    type: String,
    enum: ['alta', 'media', 'baja'],
    default: 'media'
  },
  notasAdmin: String,
  fecha: {
    type: Date,
    default: Date.now
  }
}
```

### Self-Assessments (Autoevaluacion)

```javascript
{
  _id: ObjectId,
  usuario: ObjectId,
  respuestas: {
    contraseñasSeguras: Boolean,
    dobleAutenticacion: Boolean,
    equiposActualizados: Boolean,
    softwareLicenciado: Boolean,
    copiasSeguridad: Boolean,
    copiasEnLugarSeguro: Boolean,
    capacitacionEmpleados: Boolean,
    identificaPhishing: Boolean,
    firewallActivo: Boolean,
    redProtegida: Boolean
  },
  puntaje: Number,
  nivelRiesgo: String,
  recomendaciones: [String],
  fecha: Date
}
```

### Messages (Mensaje)

```javascript
{
  _id: ObjectId,
  reporte: ObjectId,
  usuario: ObjectId,
  contenido: String,
  createdAt: Date
}
```

### Chat History (ChatGeneral)

```javascript
{
  _id: ObjectId,
  usuario: ObjectId,
  mensaje: String,
  timestamp: Date
}
```

---

## Frontend Architecture

### File Structure

```
public/
├── index.html              # Login/Register page
├── dashboard.html          # Admin dashboard
├── reportes.html          # Reports management
├── reporte-detalle.html   # Single report view
├── autoevaluacion.html    # Self-assessment form
├── admin.html             # Admin controls
├── historial.html         # Report history
├── styles.css             # Global styles
├── sidebar.js             # Navigation component
└── chat-component.js      # Chat widget
```

### Component: Sidebar Navigation

**File**: `public/sidebar.js`

```javascript
async function cargarSidebar(pagina) {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');
  
  const html = `
    <div class="sidebar">
      <div class="sidebar-logo">SECUPYME</div>
      <nav class="sidebar-nav">
        ${rol === 'admin' ? '<a href="/dashboard.html">Dashboard</a>' : ''}
        <a href="/reportes.html">Reportes</a>
        <a href="/autoevaluacion.html">Evaluación</a>
        <a href="/" onclick="logout()">Cerrar Sesión</a>
      </nav>
    </div>
  `;
  
  document.getElementById('sidebar-container').innerHTML = html;
}
```

### Component: Chat Widget

**File**: `public/chat-component.js`

- Floating box (bottom-right corner)
- Auto-loads messages every 2 seconds
- Minimizable interface
- Per-report chat threads

### Styling System

**Colors** (defined in `styles.css`):
```css
--negro: #050508;
--morado-oscuro: #0d0618;
--morado: #4a1a8a;
--morado-claro: #7c3aed;
--acento: #a855f7;
--texto: #e2d9f3;
--texto-suave: #6b5a8a;
--borde: #1a0a2e;
```

**Dark theme** inspired by cybersecurity interfaces
- High contrast for accessibility
- Purple accent matching security/tech aesthetic
- Terminal-like font (Share Tech Mono)

---

## Deployment

See **[DEPLOYMENT-RENDER.md](./DEPLOYMENT-RENDER.md)** for detailed Render deployment instructions.

### Quick Deploy

```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Connect to Render
# https://dashboard.render.com → New Web Service

# 3. Configure
# Build: npm install
# Start: node src/index.js

# 4. Add Environment Variables
# PORT, MONGODB_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASS

# 5. Deploy!
```

---

## Security Considerations

### ✅ Implemented

1. **Password Hashing**: bcryptjs with salt rounds
2. **JWT Authentication**: Secure token-based auth
3. **Environment Variables**: Secrets not in code
4. **MongoDB Injection Prevention**: Mongoose parameterized queries
5. **CORS Protection**: Can be added to Express
6. **HTTPS**: Enforced in production (Render auto-enables)

### ⚠️ To Consider

1. **Rate Limiting**: Add express-rate-limit to prevent brute force
   ```javascript
   const rateLimit = require('express-rate-limit');
   app.use('/api/auth', rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5
   }));
   ```

2. **CORS**: Enable if frontend on different domain
   ```javascript
   const cors = require('cors');
   app.use(cors({ origin: ['https://secupyme.com'] }));
   ```

3. **Helmet**: Add security headers
   ```javascript
   const helmet = require('helmet');
   app.use(helmet());
   ```

4. **Input Validation**: Validate all user inputs
   ```javascript
   // Use libraries like Joi or express-validator
   ```

5. **XSS Protection**: Sanitize HTML input
   ```javascript
   // Use xss library for user-generated content
   ```

6. **SQL/NoSQL Injection**: Already prevented by Mongoose

### Audit Checklist

- [ ] All environment secrets in .env (not in code)
- [ ] Strong JWT_SECRET (min 32 chars, random)
- [ ] MongoDB user has limited permissions
- [ ] HTTPS enabled in production
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Admin functions protected with verificarAdmin middleware
- [ ] Passwords hashed before storage
- [ ] Tokens expire after reasonable time (24h)

---

## Performance Optimization

### Database Optimizations

1. **Indexing**: Create indexes on frequently queried fields
```javascript
// In models, add indexes
usuarioSchema.index({ email: 1 });
reporteSchema.index({ usuario: 1, fecha: -1 });
```

2. **Lean Queries**: Use `.lean()` for read-only queries
```javascript
const reporte = await Reporte.findById(id).lean();
```

3. **Selective Field Selection**: Only fetch needed fields
```javascript
Reporte.find().select('empresa estado fecha').lean();
```

### API Optimizations

1. **Pagination**: Limit results
```javascript
router.get('/reportes', async (req, res) => {
  const page = req.query.page || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  
  const reportes = await Reporte.find()
    .skip(skip)
    .limit(limit);
});
```

2. **Caching**: Cache frequently accessed data
```javascript
const cache = new Map();
const getCachedData = (key, fn, ttl = 5 * 60 * 1000) => {
  if (cache.has(key) && Date.now() < cache.get(key).expires) {
    return cache.get(key).data;
  }
  // Fetch and cache
};
```

3. **Response Compression**: Use gzip
```javascript
const compression = require('compression');
app.use(compression());
```

### Frontend Optimizations

1. **Lazy Load Resources**: Load JS/CSS as needed
2. **Minimize Repaints**: Batch DOM updates
3. **Debounce Events**: Prevent excessive function calls
4. **CSS Optimization**: Minify and autoprefixer

---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
MongooseError: Cannot connect to MongoDB
```

**Solution**:
```bash
# Check connection string
echo $MONGODB_URI

# Verify IP whitelist in MongoDB Atlas
# Test locally with MongoDB Compass
```

#### 2. JWT Token Invalid
```
Token inválido or Token expirado
```

**Solution**:
```bash
# Verify JWT_SECRET matches between token creation and verification
# Check token expiration: jwt.decode(token)
# Clear localStorage and re-login
```

#### 3. Email Not Sending
```
Error: Invalid login - 534
```

**Solution**:
```bash
# Use Gmail App Password (not account password)
# Enable 2FA on Gmail
# Allow "Less secure apps" or use App Password
```

#### 4. PDF Generation Fails
```
PDFDocument is not a function
```

**Solution**:
```bash
npm install pdfkit
# Check pdfkit is properly imported
```

#### 5. Cors Error in Browser
```
Access to XMLHttpRequest blocked by CORS
```

**Solution**:
```javascript
const cors = require('cors');
app.use(cors());
```

#### 6. Port Already in Use
```
Error: listen EADDRINUSE :::3000
```

**Solution**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Debug Mode

Enable verbose logging:

```javascript
// In src/index.js
const debug = process.env.DEBUG === 'true';

if (debug) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}
```

Run with debug:
```bash
DEBUG=true npm start
```

---

## Development Workflow

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create Pull Request on GitHub
# After review, merge to main
git checkout main
git pull origin main
```

### Testing Checklist

Before deploying:

```bash
# ✅ Test login/register
# ✅ Create test report
# ✅ Run assessment
# ✅ Download PDF
# ✅ Send message
# ✅ Update report status (admin)
# ✅ Check email notifications
# ✅ Verify mobile responsiveness
```

---

## Resources & References

- **Express.js**: https://expressjs.com/
- **Mongoose**: https://mongoosejs.com/
- **JWT**: https://jwt.io/
- **MongoDB**: https://docs.mongodb.com/
- **Node.js**: https://nodejs.org/docs/
- **PDFKit**: http://pdfkit.org/

---

## Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Push and create Pull Request
5. Code review and merge

---

## License

© 2026 Secupyme. All rights reserved.

---

**Last Updated**: May 8, 2026  
**Maintainer**: Sebastian Hernandez  
**Questions?** Check GitHub Issues
