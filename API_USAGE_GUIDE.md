# 🔐 Secupyme API - Updated Security Best Practices

## Authentication

### Register User
```bash
POST /api/auth/registro
Content-Type: application/json

{
  "nombre": "John Doe",
  "email": "john@example.com",
  "contraseña": "SecurePass123!",  # Must be: 8+ chars, uppercase, lowercase, number, special
  "empresa": "Acme Corp"
}
```

**Response**:
```json
{
  "mensaje": "Usuario registrado exitosamente",
  "usuario": {
    "id": "...",
    "nombre": "John Doe",
    "email": "john@example.com",
    "empresa": "Acme Corp"
  }
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "contraseña": "SecurePass123!"
}
```

**Response**:
```json
{
  "mensaje": "Login exitoso",
  "token": "eyJhbGc...",
  "usuario": {
    "id": "...",
    "nombre": "John Doe",
    "rol": "user",
    "email": "john@example.com"
  }
}
```

---

## Protected Endpoints - Authentication

All protected endpoints require the Bearer token in Authorization header:

```bash
curl http://localhost:3000/api/reportes \
  -H "Authorization: Bearer eyJhbGc..."
```

⚠️ **IMPORTANT**: Never pass tokens in query parameters (e.g., `?token=...`)

---

## Reports API

### Create Report
```bash
POST /api/reportes
Authorization: Bearer [token]
Content-Type: application/json

{
  "empresa": "Company Name",
  "tipoVulnerabilidad": "XSS",
  "descripcion": "Detailed description of the security issue (10-5000 chars)"
}
```

### Get All Reports
```bash
GET /api/reportes
Authorization: Bearer [token]
```

### Get Single Report
```bash
GET /api/reportes/[report-id]
Authorization: Bearer [token]
```

### Update Report (Admin Only)
```bash
PUT /api/reportes/[report-id]
Authorization: Bearer [token]
Content-Type: application/json

{
  "estado": "en_progreso",  # nuevo, en_progreso, resuelto, rechazado
  "prioridad": "alta",      # baja, media, alta, crítica
  "notasAdmin": "Admin notes here"
}
```

### Update Report State Only
```bash
PATCH /api/reportes/[report-id]/estado
Authorization: Bearer [token]
Content-Type: application/json

{
  "estado": "resuelto"
}
```

### Delete Report (Admin Only)
```bash
DELETE /api/reportes/[report-id]
Authorization: Bearer [token]
```

### Archive Report (Admin Only)
```bash
PATCH /api/reportes/[report-id]/archivar
Authorization: Bearer [token]
```

---

## Public API (API Key Authentication)

### Generate API Key
```bash
POST /api/public/apikey
Authorization: Bearer [token]
Content-Type: application/json

{
  "userId": "[your-user-id]"  # Admin can generate for others
}
```

**Response**:
```json
{
  "mensaje": "API key generada exitosamente",
  "apiKey": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Use API Key
For API key authentication, use the `x-api-key` header:

```bash
curl http://localhost:3000/api/public/reportes \
  -H "x-api-key: 550e8400-e29b-41d4-a716-446655440000"
```

### Get Reports via API Key
```bash
GET /api/public/reportes
x-api-key: [api-key]
```

### Create Report via API Key
```bash
POST /api/public/reportes
x-api-key: [api-key]
Content-Type: application/json

{
  "empresa": "Company",
  "tipoVulnerabilidad": "SQL Injection",
  "descripcion": "Vulnerability description..."
}
```

---

## Chat API

### Send Message
```bash
POST /api/chat
Authorization: Bearer [token]
Content-Type: application/json

{
  "texto": "Message text (1-5000 chars)",
  "reporteRelacionado": "[optional-report-id]"  # Can only link to own reports
}
```

### Get Messages
```bash
GET /api/chat
Authorization: Bearer [token]
```

### Get Your Reports
```bash
GET /api/chat/reportes
Authorization: Bearer [token]
```

### Delete Your Chat History
```bash
DELETE /api/chat/borrar
Authorization: Bearer [token]
```

### Delete All Chat (Admin Only)
```bash
DELETE /api/chat/borrar?confirm=true
Authorization: Bearer [token]
```

---

## Integration APIs (Security Scanning)

### Check IP on Shodan
```bash
GET /api/integraciones/shodan/[valid-ip]
Authorization: Bearer [token]

# Example:
GET /api/integraciones/shodan/8.8.8.8
Authorization: Bearer [token]
```

**Response**:
```json
{
  "ip": "8.8.8.8",
  "paises": "United States",
  "puertos": [53, 443],
  "organizacion": "Google",
  "sistema": "Linux",
  "vulnerabilidades": [...]
}
```

### Check File Hash on VirusTotal
```bash
GET /api/integraciones/virustotal/[hash]
Authorization: Bearer [token]

# Examples:
GET /api/integraciones/virustotal/d41d8cd98f00b204e9800998ecf8427e
GET /api/integraciones/virustotal/5d41402abc4b2a76b9719d911017c592
GET /api/integraciones/virustotal/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

**Response**:
```json
{
  "nombre": "malware.exe",
  "malicioso": 5,
  "sospechoso": 2,
  "limpio": 50,
  "riesgo": "ALTO",
  "tipo": "PE executable",
  "tamaño": 102400,
  "ultimoAnalisis": "2026-05-10T10:30:00Z"
}
```

**Security Notes**:
- ✅ Only accepts valid public IPs (blocks 192.168.x, 10.x, 127.x, etc.)
- ✅ Supports MD5 (32 chars), SHA1 (40 chars), SHA256 (64 chars) hashes
- ✅ 10 second timeout on external API calls
- ✅ 1000 requests/hour rate limit

---

## PDF Export API

### Export All Your Reports
```bash
GET /api/pdf/reportes
Authorization: Bearer [token]
```

### Export Single Report
```bash
GET /api/pdf/reportes/[report-id]
Authorization: Bearer [token]
```

### Export Your Autoevaluaciones
```bash
GET /api/pdf/autoevaluaciones
Authorization: Bearer [token]
```

**Security Notes**:
- ✅ Token must be in Authorization header (NOT query parameter)
- ✅ Filenames are sanitized
- ✅ 50 MB max file size
- ✅ Admin can see admin notes, users cannot

---

## Error Response Format

All error responses follow this format:

```json
{
  "mensaje": "Human-readable error message in Spanish",
  "errorCode": "MACHINE_READABLE_CODE"
}
```

**Common Error Codes**:
- `INVALID_CREDENTIALS` - Login failed
- `MISSING_FIELDS` - Required fields missing
- `INVALID_EMAIL` - Email format invalid
- `WEAK_PASSWORD` - Password doesn't meet requirements
- `DUPLICATE_EMAIL` - Email already registered
- `UNAUTHORIZED` - No permission for this action
- `NOT_FOUND` - Resource not found
- `INVALID_ID` - MongoDB ID format invalid
- `INVALID_IP` - IP format invalid or private IP
- `PRIVATE_IP` - Request to private IP not allowed
- `RATE_LIMIT` - Too many requests to third-party API
- `TOKEN_EXPIRED` - JWT token has expired
- `INVALID_TOKEN` - JWT token is malformed

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| General API | 100 requests / 15 minutes |
| Login | 5 attempts / 15 minutes (skips on success) |
| Shodan/VirusTotal | 1000 requests / 1 hour |
| All endpoints | 10MB max request body |

**Status Code**: `429` when limit exceeded

---

## Security Best Practices

### 1. ✅ Tokens
- Store tokens securely (localStorage in development, secure httpOnly cookie in production)
- Never pass tokens in URL query parameters
- Use Authorization header: `Authorization: Bearer [token]`

### 2. ✅ Passwords
- Minimum 8 characters
- Must include: uppercase, lowercase, number, special character
- Examples of valid passwords:
  - `MyPassword123!`
  - `Secure#Pass99`
  - `Complex@2026Pass`

### 3. ✅ API Keys
- Store securely (never commit to git)
- Use `x-api-key` header for API key authentication
- Regenerate if compromised
- Consider rotating regularly

### 4. ✅ Data Validation
- All user input is validated server-side
- Filenames are sanitized
- Messages are HTML-escaped to prevent XSS
- Email addresses are validated

### 5. ✅ External APIs
- IP addresses validated to prevent SSRF
- Private IP ranges blocked
- Hash format validated (MD5/SHA1/SHA256)
- 10 second timeout on API calls

---

## Integration Examples

### JavaScript/Node.js
```javascript
const token = 'eyJhbGc...';

// Get reports
const response = await fetch('http://localhost:3000/api/reportes', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Create report
const newReport = await fetch('http://localhost:3000/api/reportes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    empresa: 'My Company',
    tipoVulnerabilidad: 'SQL Injection',
    descripcion: 'Found SQL injection in login form'
  })
});
```

### Python
```python
import requests

headers = {'Authorization': f'Bearer {token}'}

# Get reports
response = requests.get('http://localhost:3000/api/reportes', headers=headers)
reports = response.json()

# Create report
new_report = requests.post(
    'http://localhost:3000/api/reportes',
    headers=headers,
    json={
        'empresa': 'My Company',
        'tipoVulnerabilidad': 'XSS',
        'descripcion': 'Stored XSS in user profile'
    }
)
```

### cURL
```bash
# Register
curl -X POST http://localhost:3000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "John",
    "email": "john@example.com",
    "contraseña": "SecurePass123!",
    "empresa": "Acme"
  }'

# Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","contraseña":"SecurePass123!"}' \
  | jq -r '.token')

# Create report
curl -X POST http://localhost:3000/api/reportes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": "Acme",
    "tipoVulnerabilidad": "XSS",
    "descripcion": "Test report"
  }'
```

---

## Support & Troubleshooting

### Token Invalid/Expired?
- Re-login to get a fresh token
- Tokens expire after 8 hours (configurable via JWT_EXPIRY env var)

### Getting "Unauthorized"?
- Check Authorization header format: `Bearer [token]` (case-sensitive)
- Verify token hasn't expired
- Confirm you have permission for the action

### API Key Not Working?
- Verify header is `x-api-key` (lowercase, hyphen)
- Confirm API key is correct
- Check user account is active

### "Too Many Requests"?
- Wait 15 minutes for general endpoints
- Wait 1 hour for Shodan/VirusTotal
- Implement exponential backoff in your client

---

**Last Updated**: May 10, 2026  
**API Version**: 1.0  
**Security Level**: 🔒 Production Ready
