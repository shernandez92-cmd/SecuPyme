# Secupyme

**Cybersecurity Platform for Colombian Small & Medium Enterprises (PYMEs)**

---

## Overview

Secupyme is a specialized web platform designed to help Colombian SMEs manage security incidents, conduct self-assessments, and generate compliance reports. Built with modern web technologies, it provides an intuitive interface for both security consultants and business owners.

### Key Features

- **Incident Reporting**: Report and track security incidents with detailed information
- **Security Assessment**: Automated self-assessment with weighted scoring (0-10 scale)
- **PDF Reports**: Generate professional security reports for stakeholders
- **Real-Time Chat**: Communicate with security team about incidents
- **Role-Based Access**: Separate dashboards for admins and clients
- **Email Notifications**: Automatic alerts for incident updates
- **Dark Cybersecurity Theme**: Professional, security-focused interface

---

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- MongoDB Atlas account (free tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/secupyme.git
cd secupyme

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
# - MONGODB_URI
# - JWT_SECRET
# - EMAIL_USER
# - EMAIL_PASS
# - PORT (optional, defaults to 3000)

# Start development server
npm run dev

# Server runs on http://localhost:3000
```

---

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** + **Mongoose** - Database with ODM
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **PDFKit** - PDF generation
- **Nodemailer** - Email notifications

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with dark theme
- **Vanilla JavaScript (ES6+)** - Interactivity
- **localStorage** - Client-side token storage

### Infrastructure
- **MongoDB Atlas** - Cloud database
- **Render.com** - Application hosting
- **GitHub** - Version control

---

## Project Structure

```
secupyme/
├── src/
│   ├── index.js                 # Server entry point
│   ├── controllers/             # Business logic
│   ├── models/                  # MongoDB schemas
│   ├── routes/                  # API endpoints
│   └── middleware/              # Authentication & validation
├── public/                      # Frontend assets
│   ├── *.html                  # Views
│   ├── styles.css              # Global styles
│   └── *.js                    # Frontend scripts
├── package.json
├── .env                        # Environment variables
├── TECHNICAL-DOCS.md           # Detailed documentation
├── DEPLOYMENT-RENDER.md        # Deployment guide
└── README.md                   # This file
```

---

## API Endpoints

### Authentication

```http
POST /api/auth/registro          # Register new user
POST /api/auth/login             # Login user
```

### Reports

```http
POST /api/reportes               # Create incident report
GET /api/reportes                # Get reports (filtered by role)
GET /api/reportes/:id            # Get single report
PUT /api/reportes/:id            # Update report (admin only)
```

### Security Assessment

```http
POST /api/autoevaluaciones       # Submit assessment
```

### PDF Export

```http
GET /api/pdf/reportes            # Export all reports as PDF
GET /api/pdf/reportes/:id        # Export single report as PDF
```

### Messaging

```http
POST /api/mensajes/:reporteId    # Send message
GET /api/mensajes/:reporteId     # Get report messages
```

### Chat

```http
GET /api/chat                    # Get chat messages
POST /api/chat                   # Send chat message
```

---

## Features in Detail

### 1. Incident Reporting

Users can report security incidents with:
- Company name
- Vulnerability type (Phishing, Malware, Unauthorized Access, Data Leak, Other)
- Detailed description
- Automatic timestamp

Admin can:
- Review all reports
- Set status (Open, In Progress, Resolved)
- Assign priority (High, Medium, Low)
- Add notes and recommendations

### 2. Security Self-Assessment

10-question evaluation covering:
- Password security practices
- Two-factor authentication
- System updates
- Software licensing
- Backup procedures
- External backups
- Employee training
- Phishing recognition
- Firewall protection
- WiFi security

**Scoring**: 0-10 points with automated risk level and recommendations

### 3. PDF Report Generation

Professional reports include:
- Report details (company, vulnerability type, status)
- Full incident description
- Admin notes and recommendations
- Timestamp and confidentiality notice
- Color-coded status indicators

### 4. Real-Time Communication

Floating chat system for:
- Discussion about incidents
- Asking questions
- Sharing updates
- Real-time notifications

---

## User Roles

### Client
- Report incidents
- View their own reports
- Complete security assessments
- Communicate with admin team
- Download their reports

### Admin
- View all reports from all companies
- Update report status and priority
- Add notes and recommendations
- Send notifications
- Generate consolidated reports

---

## Environment Variables

Create `.env` file with:

```env
# Server
PORT=3000

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/secupyme

# Authentication
JWT_SECRET=your_super_secret_key_minimum_32_characters_long

# Email (for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password-from-gmail
```

**Important**: Never commit `.env` file to git!

---

## Deployment

### Deploy to Render.com

See [DEPLOYMENT-RENDER.md](./DEPLOYMENT-RENDER.md) for detailed instructions.

**Quick steps**:
1. Push code to GitHub
2. Connect repository to Render
3. Add environment variables
4. Deploy!

**Live URL**: `https://secupyme.onrender.com`

---

## Security

**Implemented Security Features**:
- Password hashing with bcryptjs
- JWT token-based authentication
- MongoDB injection prevention (Mongoose)
- HTTPS in production
- Environment variable isolation
- Role-based access control

**Recommended Enhancements**:
- Add rate limiting
- Implement CORS
- Add request validation
- Sanitize user input
- Regular security audits

See [TECHNICAL-DOCS.md](./TECHNICAL-DOCS.md#security-considerations) for detailed security info.

---

## Performance

- **Database Indexing**: Optimized queries
- **Lean Queries**: Read-only operations use .lean()
- **JWT Auth**: Stateless authentication
- **PDF Generation**: Efficient streaming
- **Responsive Design**: Works on mobile & desktop

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Development

### Available Scripts

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# Install dependencies
npm install

# Update dependencies
npm update

# Check for vulnerabilities
npm audit
```

### Code Style

- ES6+ JavaScript
- Async/await for asynchronous operations
- Meaningful variable names
- Comments for complex logic

---

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure credentials are correct

2. **Email Not Sending**
   - Use Gmail App Password (not account password)
   - Enable 2FA on Gmail
   - Check SMTP settings

3. **JWT Token Error**
   - Verify JWT_SECRET environment variable
   - Check token expiration
   - Clear localStorage and re-login

4. **PDF Generation Fails**
   - Ensure pdfkit is installed
   - Check file permissions
   - Verify disk space

See [TECHNICAL-DOCS.md](./TECHNICAL-DOCS.md#troubleshooting) for more solutions.

---

## Testing Checklist

Before deployment:
- [ ] User registration works
- [ ] Login authentication works
- [ ] Report creation succeeds
- [ ] PDF download works
- [ ] Assessment submission works
- [ ] Chat messaging works
- [ ] Admin updates work
- [ ] Email notifications send
- [ ] Mobile responsive design works

---

## Performance Tips

1. **Database**: Use MongoDB indexing
2. **API**: Implement pagination for large datasets
3. **Frontend**: Minimize CSS/JS, lazy load images
4. **Caching**: Cache frequently accessed data
5. **Compression**: Enable gzip compression

---

## Future Enhancements

- Push notifications
- Mobile app (React Native)
- Advanced analytics dashboard
- Two-factor authentication for users
- Multi-language support
- Enhanced accessibility
- Custom report templates
- Integration with third-party security tools

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Commit: `git commit -m "feat: Add new feature"`
5. Push: `git push origin feature/new-feature`
6. Create Pull Request

---

## License

© 2026 Secupyme. All rights reserved.

---

## Support

- Read [TECHNICAL-DOCS.md](./TECHNICAL-DOCS.md) for detailed documentation
- See [DEPLOYMENT-RENDER.md](./DEPLOYMENT-RENDER.md) for deployment help
- Contact: support@secupyme.com
- GitHub Issues: Report bugs and request features

---

## Author

**Sebastian Hernandez**  
Secupyme Developer  
May 2026

---

## Changelog

### v1.0.0 (May 8, 2026)
- Initial release
- Incident reporting system
- Security self-assessment
- PDF report generation
- Real-time chat
- Role-based access control
- Email notifications

---

**Secure your business. Report incidents. Stay protected.**
