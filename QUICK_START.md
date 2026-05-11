# 🚀 QUICK START - Railway Deployment

## One-Command Deployment (Easiest Way)

### For Windows:
```bash
deploy-railway-manual.bat
```

### For Linux/Mac:
```bash
chmod +x deploy-railway.sh
./deploy-railway.sh
```

---

## What You Need to Do (3 Simple Steps):

### 1️⃣ Install Railway CLI (One Time Only)
```bash
npm install -g @railway/cli
```

### 2️⃣ Login to Railway (One Time Only)
```bash
railway login
```
This opens your browser - login with GitHub (Abish133)

### 3️⃣ Run the Deployment Script
```bash
# Windows
deploy-railway-manual.bat

# Linux/Mac
./deploy-railway.sh
```

---

## What the Script Does Automatically:

✅ Creates Railway project "Zhilon-Hospital-HMS"  
✅ Adds MySQL database  
✅ Deploys Node.js backend  
✅ Sets all environment variables  
✅ Runs database migrations  
✅ Deploys React frontend  
✅ Configures CORS  
✅ Generates public URLs  
✅ Opens your app in browser  

---

## After Deployment:

Your app will be live at:
- **Frontend**: `https://your-app-xxxx.up.railway.app`
- **Backend**: `https://your-api-xxxx.up.railway.app`

The script will:
1. Display both URLs
2. Open the frontend in your browser
3. Save deployment info to `deployment-info.txt`

---

## Troubleshooting:

### If Railway CLI installation fails:
```bash
# Try with sudo (Linux/Mac)
sudo npm install -g @railway/cli

# Or use npx (no installation needed)
npx @railway/cli login
```

### If login fails:
- Make sure you have a Railway account at https://railway.app
- Connect your GitHub account in Railway settings
- Try: `railway logout` then `railway login` again

### If deployment fails:
- Check your internet connection
- Verify you're logged in: `railway whoami`
- Check Railway dashboard: https://railway.app/dashboard
- View logs: `railway logs`

---

## Manual Deployment (If Scripts Don't Work):

Follow the detailed guide in `RAILWAY_DEPLOYMENT.md`

---

## Cost:

- Railway offers **$5 free credit per month**
- Typical usage for this app: ~$3-5/month
- Monitor usage at: https://railway.app/account/usage

---

## Support:

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: https://github.com/Abish133/Zhilon_Hospital/issues

---

## Ready to Deploy?

Run this command now:

```bash
deploy-railway-manual.bat
```

That's it! Your Hospital Management System will be live in ~5 minutes! 🎉
