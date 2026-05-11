# Railway Deployment Guide - Hospital Management System

## Overview
This guide will help you deploy your HMS application with 3 services on Railway:
1. **MySQL Database**
2. **Node.js Backend API**
3. **React Frontend**

---

## Step 1: Create Railway Account & Project

1. Go to [Railway.app](https://railway.app)
2. Sign up/Login with GitHub (use Abish133 account)
3. Click **"New Project"**
4. Select **"Empty Project"**
5. Name it: `Zhilon-Hospital-HMS`

---

## Step 2: Deploy MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will automatically provision a MySQL database
4. Click on the MySQL service to see connection details
5. Note down these variables (you'll need them):
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLDATABASE`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`

---

## Step 3: Deploy Backend (Node.js API)

### 3.1: Add Backend Service
1. Click **"+ New"** → **"GitHub Repo"**
2. Connect your GitHub account if not already connected
3. Select repository: **`Abish133/Zhilon_Hospital`**
4. Railway will detect the repository

### 3.2: Configure Backend Service
1. Click on the newly created service
2. Go to **"Settings"**
3. Set **Root Directory**: `backend`
4. Set **Start Command**: `npm start`

### 3.3: Add Environment Variables
Click on **"Variables"** tab and add these:

```
NODE_ENV=production
PORT=5000

# Database (use values from MySQL service)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASS=${{MySQL.MYSQLPASSWORD}}
DB_DIALECT=mysql

# Connection Pool
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_ACQUIRE=60000
DB_POOL_IDLE=10000

# Auth
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string
JWT_EXPIRES_IN=8h

# CORS (will update after frontend deployment)
CORS_ORIGIN=*

# File Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=500
```

**Note**: Railway automatically references MySQL variables using `${{MySQL.VARIABLE_NAME}}` syntax.

### 3.4: Deploy Backend
1. Click **"Deploy"** or wait for auto-deploy
2. Once deployed, click on **"Settings"** → **"Networking"**
3. Click **"Generate Domain"** to get a public URL
4. Copy the backend URL (e.g., `https://your-backend.up.railway.app`)

### 3.5: Run Database Migrations
1. Go to backend service
2. Click on **"Settings"** → **"Deploy"**
3. Add a **"Deploy Command"**: `npm run migrate && npm start`
4. Redeploy the service

---

## Step 4: Deploy Frontend (React)

### 4.1: Add Frontend Service
1. Click **"+ New"** → **"GitHub Repo"**
2. Select the same repository: **`Abish133/Zhilon_Hospital`**
3. Railway will create another service

### 4.2: Configure Frontend Service
1. Click on the frontend service
2. Go to **"Settings"**
3. Set **Root Directory**: `frontend`
4. Set **Build Command**: `npm run build`
5. Set **Start Command**: `npx serve -s dist -l $PORT`

### 4.3: Add Environment Variables
Click on **"Variables"** tab and add:

```
VITE_API_URL=https://your-backend-url.up.railway.app
```

Replace `your-backend-url.up.railway.app` with the actual backend URL from Step 3.4.

### 4.4: Deploy Frontend
1. Click **"Deploy"** or wait for auto-deploy
2. Once deployed, go to **"Settings"** → **"Networking"**
3. Click **"Generate Domain"** to get the frontend URL
4. Copy the frontend URL (e.g., `https://your-frontend.up.railway.app`)

---

## Step 5: Update CORS Settings

1. Go back to **Backend Service**
2. Click on **"Variables"**
3. Update `CORS_ORIGIN` variable:
   ```
   CORS_ORIGIN=https://your-frontend-url.up.railway.app
   ```
4. Save and redeploy

---

## Step 6: Verify Deployment

1. Open your frontend URL in a browser
2. Try logging in with default credentials
3. Check if API calls are working
4. Monitor logs in Railway dashboard for any errors

---

## Important Notes

### Database Initialization
- The backend should automatically run migrations on first deploy
- If not, you can manually run migrations using Railway CLI or add a deploy script

### Environment Variables
- Never commit `.env` files to Git
- Railway automatically injects environment variables
- Use `${{SERVICE.VARIABLE}}` to reference other service variables

### Custom Domains (Optional)
- You can add custom domains in Railway
- Go to service → Settings → Networking → Custom Domain

### Monitoring
- Check logs in Railway dashboard
- Each service has its own logs tab
- Monitor resource usage and costs

### Costs
- Railway offers $5 free credit per month
- After that, you pay for usage
- Monitor your usage in the dashboard

---

## Troubleshooting

### Backend won't start
- Check environment variables are set correctly
- Verify MySQL connection details
- Check logs for specific errors

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is deployed and running

### Database connection errors
- Verify MySQL service is running
- Check DB credentials in backend variables
- Ensure connection pool settings are appropriate

### Build failures
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Check build logs for specific errors

---

## Railway CLI (Optional)

Install Railway CLI for easier management:

```bash
npm i -g @railway/cli
railway login
railway link
railway logs
```

---

## Next Steps After Deployment

1. ✅ Test all features thoroughly
2. ✅ Set up custom domain (optional)
3. ✅ Configure backups for MySQL
4. ✅ Set up monitoring and alerts
5. ✅ Update documentation with production URLs
6. ✅ Share access with team members

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/Abish133/Zhilon_Hospital/issues

---

**Deployment Date**: $(date)
**Deployed By**: Abish133
**Repository**: https://github.com/Abish133/Zhilon_Hospital
**Branch**: r.abish
