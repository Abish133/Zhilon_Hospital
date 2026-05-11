# 🏥 Zhilon Hospital Management System - Railway Deployment

## 📦 What's Included

This repository contains everything you need to deploy a complete Hospital Management System on Railway:

- **MySQL Database** - Patient records, billing, inventory
- **Node.js Backend API** - RESTful API with authentication
- **React Frontend** - Modern responsive UI

---

## 🚀 FASTEST WAY TO DEPLOY (5 Minutes)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```
*(Opens browser - login with your GitHub account)*

### Step 3: Run Deployment Script
```bash
# Windows
deploy-railway-manual.bat

# Linux/Mac
chmod +x deploy-railway.sh
./deploy-railway.sh
```

**That's it!** Your app will be live in ~5 minutes! 🎉

---

## 📁 Deployment Files Created

All these files are ready in your repository:

| File | Purpose |
|------|---------|
| `deploy-railway-manual.bat` | Windows deployment script |
| `deploy-railway.sh` | Linux/Mac deployment script |
| `QUICK_START.md` | Quick start guide |
| `RAILWAY_DEPLOYMENT.md` | Detailed deployment guide |
| `RAILWAY_ENV_VARIABLES.txt` | Environment variables template |
| `railway-config.json` | Railway project configuration |
| `backend/nixpacks.toml` | Backend build configuration |
| `frontend/nixpacks.toml` | Frontend build configuration |
| `frontend/.env.production` | Production environment template |

---

## 🎯 What the Script Does

✅ **Automatically**:
1. Installs Railway CLI (if needed)
2. Logs you into Railway
3. Creates project "Zhilon-Hospital-HMS"
4. Provisions MySQL database
5. Deploys backend with all environment variables
6. Runs database migrations
7. Deploys frontend
8. Configures CORS
9. Generates public URLs
10. Opens your app in browser

---

## 🌐 After Deployment

Your app will be accessible at:
- **Frontend**: `https://your-app-xxxx.up.railway.app`
- **Backend API**: `https://your-api-xxxx.up.railway.app`
- **Health Check**: `https://your-api-xxxx.up.railway.app/health`

The script saves all URLs to `deployment-info.txt`

---

## 💰 Cost

- **Free Tier**: $5 credit/month
- **Typical Usage**: $3-5/month for this app
- **Monitor**: https://railway.app/account/usage

---

## 🔧 Manual Deployment (Alternative)

If scripts don't work, follow the detailed guide:

1. Open `RAILWAY_DEPLOYMENT.md`
2. Follow step-by-step instructions
3. Copy environment variables from `RAILWAY_ENV_VARIABLES.txt`

---

## 📊 Project Structure

```
HMS_FIXED/
├── backend/                    # Node.js API
│   ├── src/
│   │   ├── controllers/       # Business logic
│   │   ├── models/            # Database models
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth, RBAC, etc.
│   │   └── migrations/        # Database migrations
│   ├── nixpacks.toml          # Railway build config
│   └── package.json
│
├── frontend/                   # React App
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── store/             # State management
│   ├── nixpacks.toml          # Railway build config
│   ├── .env.production        # Production env template
│   └── package.json
│
├── deploy-railway-manual.bat  # Windows deployment
├── deploy-railway.sh          # Linux/Mac deployment
├── QUICK_START.md             # Quick start guide
├── RAILWAY_DEPLOYMENT.md      # Detailed guide
└── RAILWAY_ENV_VARIABLES.txt  # Env variables
```

---

## 🔐 Default Credentials

After deployment, login with:
- **Username**: (Check your database seed file)
- **Password**: (Check your database seed file)

**⚠️ IMPORTANT**: Change default credentials immediately after first login!

---

## 🛠️ Troubleshooting

### Railway CLI won't install
```bash
# Try with sudo (Linux/Mac)
sudo npm install -g @railway/cli

# Or use npx (no installation)
npx @railway/cli login
```

### Login fails
- Ensure you have a Railway account: https://railway.app
- Connect GitHub in Railway settings
- Try: `railway logout` then `railway login`

### Deployment fails
- Check internet connection
- Verify login: `railway whoami`
- Check Railway dashboard: https://railway.app/dashboard
- View logs: `railway logs`

### Database connection errors
- Wait 30 seconds for MySQL to initialize
- Check environment variables in Railway dashboard
- Verify MySQL service is running

### Frontend can't reach backend
- Check `VITE_API_BASE_URL` in frontend variables
- Verify backend URL is correct
- Check CORS settings in backend

---

## 📚 Documentation

- **Quick Start**: `QUICK_START.md`
- **Full Guide**: `RAILWAY_DEPLOYMENT.md`
- **Environment Variables**: `RAILWAY_ENV_VARIABLES.txt`
- **Railway Docs**: https://docs.railway.app

---

## 🔄 Updating Your Deployment

After making code changes:

```bash
# Commit and push to GitHub
git add .
git commit -m "Your changes"
git push origin r.abish

# Railway auto-deploys on push!
```

Or manually trigger:
```bash
railway up
```

---

## 📈 Monitoring

### View Logs
```bash
# Backend logs
cd backend
railway logs

# Frontend logs
cd frontend
railway logs
```

### Check Health
```bash
curl https://your-api-url.up.railway.app/health
```

### Railway Dashboard
- Monitor resource usage
- View deployment history
- Check service status
- Manage environment variables

Visit: https://railway.app/dashboard

---

## 🎓 Features

### Backend Features
- ✅ RESTful API
- ✅ JWT Authentication
- ✅ Role-Based Access Control (RBAC)
- ✅ Hospital Multi-tenancy
- ✅ Audit Logging
- ✅ Rate Limiting
- ✅ XSS Protection
- ✅ CORS Configuration
- ✅ File Upload Support
- ✅ Database Migrations
- ✅ Health Check Endpoints

### Frontend Features
- ✅ Modern React UI
- ✅ Ant Design Components
- ✅ Responsive Design
- ✅ State Management (Zustand)
- ✅ API Integration (Axios)
- ✅ Form Validation
- ✅ Charts & Analytics
- ✅ PDF Generation
- ✅ Excel Export

### Database Features
- ✅ MySQL 8.0
- ✅ Automated Backups
- ✅ Connection Pooling
- ✅ Migration System
- ✅ Seed Data

---

## 🤝 Support

### Railway Support
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

### Project Support
- GitHub: https://github.com/Abish133/Zhilon_Hospital
- Issues: https://github.com/Abish133/Zhilon_Hospital/issues

---

## 📝 License

[Your License Here]

---

## 👨‍💻 Author

**Abish133**
- GitHub: [@Abish133](https://github.com/Abish133)
- Repository: [Zhilon_Hospital](https://github.com/Abish133/Zhilon_Hospital)

---

## 🎉 Ready to Deploy?

Run this command now:

```bash
deploy-railway-manual.bat
```

Your Hospital Management System will be live in minutes! 🚀

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
