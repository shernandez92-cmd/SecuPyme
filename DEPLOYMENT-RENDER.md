# Deployment to Render.com - Secupyme

This guide explains how to deploy your Secupyme Node.js + Express + MongoDB Atlas application to Render.com.

## Prerequisites

- A [Render.com](https://render.com) account (free tier available)
- MongoDB Atlas cluster URL (`MONGODB_URI`)
- JWT secret key for authentication (`JWT_SECRET`)
- Email configuration (`EMAIL_USER`, `EMAIL_PASS`) for notifications
- GitHub repository with your code pushed

## Step 1: Prepare Your Repository

### 1.1 Add `.gitignore` (if not already present)

Ensure sensitive files are not committed:

```
node_modules/
.env
.env.local
.DS_Store
*.log
```

### 1.2 Verify `package.json`

Ensure your package.json has the correct main entry point and start script:

```json
{
  "name": "secupyme",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "engines": {
    "node": "18.x"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "mongoose": "^9.6.1",
    "nodemailer": "^8.0.7",
    "pdfkit": "^0.18.0"
  }
}
```

### 1.3 Verify Environment Variables

Create `.env.example` for reference (do NOT commit the actual `.env`):

```
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/secupyme
JWT_SECRET=your_super_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Step 2: Deploy to Render

### 2.1 Connect GitHub Repository

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Select **Build and deploy from a Git repository**
4. Click **Connect account** and authorize GitHub
5. Select your `secupyme` repository
6. Click **Connect**

### 2.2 Configure the Web Service

Fill in the deployment form:

| Field | Value |
|-------|-------|
| **Name** | `secupyme` |
| **Environment** | `Node` |
| **Region** | `Ohio` (or closest to your users) |
| **Branch** | `main` or `master` |
| **Build Command** | `npm install` |
| **Start Command** | `node src/index.js` |
| **Instance Type** | `Free` (or Starter for production) |

### 2.3 Add Environment Variables

1. Scroll down to **Environment** section
2. Click **Add Environment Variable** for each:

```
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/secupyme
JWT_SECRET=your_super_secure_random_key_here_min_32_chars
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password_from_gmail
```

### 2.4 Review and Deploy

1. Click **Create Web Service**
2. Wait for the deployment to complete (3-5 minutes)
3. View logs in real-time
4. Once deployed, you'll get a URL like: `https://secupyme.onrender.com`

## Step 3: Verify Deployment

### 3.1 Test API Endpoint

```bash
curl https://secupyme.onrender.com/
# Should return: {"mensaje": "Secupyme API funcionando"}
```

### 3.2 Test Authentication

```bash
curl -X POST https://secupyme.onrender.com/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "nombre": "Test User",
    "rol": "client"
  }'
```

### 3.3 Monitor Logs

In Render dashboard:
1. Go to your service
2. Click **Logs** tab
3. Monitor for errors in real-time

## Step 4: MongoDB Atlas Configuration

### 4.1 Whitelist Render IP

Render uses dynamic IPs, so:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Navigate to **Network Access**
3. Click **Add IP Address**
4. Add `0.0.0.0/0` (allows all IPs - only safe with strong authentication)
5. Click **Confirm**

### 4.2 Test Connection

Once deployed, check MongoDB logs to confirm connection:

1. In your Render logs, look for:
   ```
   Conectado a MongoDB
   Servidor corriendo en puerto 3000
   ```

## Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain

1. In Render dashboard, go to your service
2. Click **Settings** → **Custom Domain**
3. Enter your domain (e.g., `api.secupyme.com`)
4. Add the CNAME record to your DNS provider:
   ```
   CNAME: onrender.com
   ```

## Step 6: Troubleshooting

### Common Issues

#### 1. **Port Binding Error**
- **Problem**: Service crashes with port error
- **Solution**: Render sets PORT env var automatically; ensure you use `process.env.PORT`

#### 2. **MongoDB Connection Timeout**
- **Problem**: Cannot connect to MongoDB Atlas
- **Solution**: 
  - Verify connection string in `MONGODB_URI`
  - Check IP whitelist in MongoDB Atlas
  - Ensure credentials are correct

#### 3. **PDF Generation Fails**
- **Problem**: PDF export returns error
- **Solution**: 
  - Ensure `pdfkit` is in dependencies
  - Check file write permissions
  - Verify sufficient disk space (Render has 50GB per instance)

#### 4. **Email Notifications Not Working**
- **Problem**: Emails not sending
- **Solution**:
  - Use Gmail App Password (not account password)
  - Enable "Less secure app access" if needed
  - Check firewall allows SMTP (port 587)

#### 5. **Static Files Not Loading**
- **Problem**: CSS/JS files return 404
- **Solution**:
  - Ensure `app.use(express.static('public'))` is in `src/index.js`
  - Verify files exist in `public/` folder
  - Check build logs for errors

### View Detailed Logs

```bash
# SSH into service (if available on plan)
# Or use Render dashboard Logs tab
# Look for error messages and stack traces
```

## Step 7: Continuous Deployment

### Auto-Deploy on Push

Render automatically redeploys when you push to your repository:

1. Push code to GitHub: `git push origin main`
2. Render detects changes
3. Automatically runs build and deploy
4. Service updates live (0 downtime with scaling)

## Step 8: Monitoring & Maintenance

### Enable Notifications

1. Go to **Account Settings** → **Notifications**
2. Enable alerts for:
   - Service failures
   - Out of memory
   - High CPU usage

### View Metrics

1. In service dashboard, click **Metrics**
2. Monitor:
   - CPU usage
   - Memory consumption
   - Request count
   - Response times

### Automatic Restart

Free tier services auto-restart if idle for 15 minutes:
- This is normal behavior
- Upgrade to Starter plan to prevent restarts

## Deployment Checklist

- [ ] `.env.example` created with all required variables
- [ ] `package.json` has correct start command
- [ ] `.gitignore` includes `.env` and `node_modules`
- [ ] MongoDB Atlas whitelist configured
- [ ] All environment variables added to Render
- [ ] Deployment successful (check logs)
- [ ] API endpoint tested and working
- [ ] Authentication tested
- [ ] PDF export tested
- [ ] Email notifications tested
- [ ] Custom domain configured (if applicable)

## Production Recommendations

1. **Enable CORS** if frontend is on different domain
2. **Add rate limiting** to prevent abuse
3. **Implement request logging** for debugging
4. **Set up error tracking** (Sentry, LogRocket)
5. **Regular backups** of MongoDB data
6. **Monitor resource usage** and upgrade plan if needed
7. **Update dependencies** monthly for security patches
8. **Use HTTPS** (automatic with Render)

## Useful Commands

```bash
# Check Node version
node -v

# Check dependencies locally
npm list

# Install specific version
npm install package@version

# Test build locally
npm run build

# Start application
npm start
```

## Support & Resources

- **Render Documentation**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Express.js Guide**: https://expressjs.com
- **Node.js Best Practices**: https://nodejs.org/en/docs/guides

## Security Best Practices

1. **Rotate JWT_SECRET** periodically
2. **Use strong EMAIL_PASS** (generate app-specific password)
3. **Keep dependencies updated**: `npm audit` and `npm update`
4. **Monitor access logs** for suspicious activity
5. **Enable MongoDB encryption** at rest and in transit
6. **Use HTTPS only** (automatic with Render)
7. **Implement rate limiting** on API endpoints
8. **Regular security audits** of code

---

**Questions?** Check Render's support or MongoDB Atlas documentation.

**Last Updated**: May 8, 2026
