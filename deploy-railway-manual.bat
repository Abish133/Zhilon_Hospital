@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   RAILWAY DEPLOYMENT - ZHILON HOSPITAL HMS
echo   Automated Deployment Script
echo ============================================================
echo.
echo This script will deploy your application to Railway with:
echo   - MySQL Database
echo   - Node.js Backend API
echo   - React Frontend
echo.
echo Prerequisites:
echo   1. Railway account (free tier available)
echo   2. GitHub account connected to Railway
echo   3. Internet connection
echo.
pause

REM Step 1: Install Railway CLI
echo.
echo ============================================================
echo STEP 1: Installing Railway CLI
echo ============================================================
where railway >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Railway CLI is already installed
) else (
    echo Installing Railway CLI globally...
    call npm install -g @railway/cli
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Failed to install Railway CLI
        echo Please run manually: npm install -g @railway/cli
        pause
        exit /b 1
    )
    echo [SUCCESS] Railway CLI installed successfully
)
echo.
pause

REM Step 2: Login to Railway
echo.
echo ============================================================
echo STEP 2: Login to Railway
echo ============================================================
echo This will open your browser for authentication...
echo Please login with your GitHub account (Abish133)
echo.
echo IMPORTANT: After logging in successfully in the browser,
echo            come back to this window and press any key.
echo.
pause

railway login
if !ERRORLEVEL! NEQ 0 (
    echo [ERROR] Railway login failed
    echo Please try again or login manually: railway login
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Successfully logged in to Railway
echo.
echo Verifying login status...
railway whoami
if !ERRORLEVEL! NEQ 0 (
    echo [ERROR] Login verification failed
    pause
    exit /b 1
)
echo.
pause

REM Step 3: Create Project
echo.
echo ============================================================
echo STEP 3: Creating Railway Project
echo ============================================================
echo Project Name: Zhilon-Hospital-HMS
echo.
echo NOTE: If you already have a project, you can skip this step.
echo       Just press Ctrl+C when prompted and continue manually.
echo.
pause

railway init
if !ERRORLEVEL! NEQ 0 (
    echo [WARNING] Project creation may have failed or already exists
    echo You can continue manually or create project at railway.app
    echo.
    set /p CONTINUE="Do you want to continue? (y/n): "
    if /i "!CONTINUE!" NEQ "y" (
        echo Exiting...
        pause
        exit /b 1
    )
)

echo [SUCCESS] Railway project ready
echo.
pause

REM Step 4: Link to GitHub Repository
echo.
echo ============================================================
echo STEP 4: Linking to GitHub Repository
echo ============================================================
echo Repository: Abish133/Zhilon_Hospital
echo Branch: r.abish
echo.

railway link
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Auto-link failed. You may need to link manually.
    echo.
    echo Manual steps:
    echo 1. Go to railway.app dashboard
    echo 2. Select your project
    echo 3. Click "New" - "GitHub Repo"
    echo 4. Select Abish133/Zhilon_Hospital
    echo.
    pause
)

echo [SUCCESS] Repository linked
echo.
pause

REM Step 5: Add MySQL Database
echo.
echo ============================================================
echo STEP 5: Adding MySQL Database
echo ============================================================
echo.

echo Please follow these manual steps:
echo.
echo 1. Go to https://railway.app/dashboard
echo 2. Open your "Zhilon-Hospital-HMS" project
echo 3. Click "+ New"
echo 4. Select "Database"
echo 5. Choose "Add MySQL"
echo 6. Wait for provisioning to complete
echo.
echo Press any key after MySQL is added...
pause >nul

echo [SUCCESS] MySQL database should be ready
echo.

REM Step 6: Deploy Backend
echo.
echo ============================================================
echo STEP 6: Deploying Backend Service
echo ============================================================
echo.

echo Please follow these manual steps in Railway Dashboard:
echo.
echo 1. Click "+ New" - "GitHub Repo"
echo 2. Select "Abish133/Zhilon_Hospital"
echo 3. Click on the new service
echo 4. Go to "Settings"
echo 5. Set "Root Directory" to: backend
echo 6. Set "Start Command" to: npm start
echo 7. Click "Variables" tab
echo 8. Add these variables:
echo.
echo    NODE_ENV=production
echo    PORT=5000
echo    DB_HOST=${{MySQL.MYSQLHOST}}
echo    DB_PORT=${{MySQL.MYSQLPORT}}
echo    DB_NAME=${{MySQL.MYSQLDATABASE}}
echo    DB_USER=${{MySQL.MYSQLUSER}}
echo    DB_PASS=${{MySQL.MYSQLPASSWORD}}
echo    DB_DIALECT=mysql
echo    DB_POOL_MAX=20
echo    DB_POOL_MIN=5
echo    DB_POOL_ACQUIRE=60000
echo    DB_POOL_IDLE=10000
echo    JWT_SECRET=your_super_secret_jwt_key_change_this
echo    JWT_EXPIRES_IN=8h
echo    CORS_ORIGIN=*
echo    UPLOAD_DIR=uploads
echo    MAX_FILE_SIZE=10485760
echo    RATE_LIMIT_WINDOW_MS=900000
echo    RATE_LIMIT_MAX=500
echo.
echo 9. Go to "Settings" - "Networking"
echo 10. Click "Generate Domain"
echo 11. Copy the backend URL
echo.
set /p BACKEND_URL="Enter your backend URL (e.g., backend-production-xxxx.up.railway.app): "
echo.
echo Backend URL saved: %BACKEND_URL%
echo.
pause

REM Step 7: Run Migrations
echo.
echo ============================================================
echo STEP 7: Running Database Migrations
echo ============================================================
echo.

echo In Railway Dashboard:
echo 1. Click on your Backend service
echo 2. Go to "Settings" - "Deploy"
echo 3. Under "Custom Start Command" add: npm run migrate ^&^& npm start
echo 4. Click "Deploy" to redeploy
echo.
echo Press any key after migrations are complete...
pause >nul

echo [SUCCESS] Database migrations completed
echo.

REM Step 8: Deploy Frontend
echo.
echo ============================================================
echo STEP 8: Deploying Frontend Service
echo ============================================================
echo.

echo Please follow these manual steps in Railway Dashboard:
echo.
echo 1. Click "+ New" - "GitHub Repo"
echo 2. Select "Abish133/Zhilon_Hospital" again
echo 3. Click on the new service
echo 4. Go to "Settings"
echo 5. Set "Root Directory" to: frontend
echo 6. Set "Build Command" to: npm run build
echo 7. Set "Start Command" to: npx serve -s dist -l $PORT
echo 8. Click "Variables" tab
echo 9. Add this variable:
echo.
echo    VITE_API_BASE_URL=https://%BACKEND_URL%/api
echo.
echo 10. Go to "Settings" - "Networking"
echo 11. Click "Generate Domain"
echo 12. Copy the frontend URL
echo.
set /p FRONTEND_URL="Enter your frontend URL (e.g., frontend-production-xxxx.up.railway.app): "
echo.
echo Frontend URL saved: %FRONTEND_URL%
echo.
pause

REM Step 9: Update CORS
echo.
echo ============================================================
echo STEP 9: Updating CORS Settings
echo ============================================================
echo.

echo In Railway Dashboard:
echo 1. Go to Backend service
echo 2. Click "Variables"
echo 3. Update CORS_ORIGIN to: https://%FRONTEND_URL%
echo 4. Save changes
echo.
echo Press any key after CORS is updated...
pause >nul

echo [SUCCESS] CORS updated
echo.

REM Step 10: Complete
echo.
echo ============================================================
echo   DEPLOYMENT COMPLETE!
echo ============================================================
echo.
echo Your Hospital Management System is now live at:
echo.
echo   Frontend: https://%FRONTEND_URL%
echo   Backend:  https://%BACKEND_URL%
echo.
echo Next Steps:
echo   1. Test the application
echo   2. Login with default credentials
echo   3. Monitor logs in Railway dashboard
echo   4. Set up custom domain (optional)
echo.
echo Opening frontend in browser...
start https://%FRONTEND_URL%
echo.
echo Deployment information saved to deployment-info.txt
echo.

REM Save deployment info
(
echo Railway Deployment Information
echo ================================
echo.
echo Deployment Date: %date% %time%
echo Project: Zhilon-Hospital-HMS
echo Repository: https://github.com/Abish133/Zhilon_Hospital
echo Branch: r.abish
echo.
echo URLs:
echo Frontend: https://%FRONTEND_URL%
echo Backend:  https://%BACKEND_URL%
echo.
echo Services:
echo - MySQL Database
echo - Node.js Backend API
echo - React Frontend
echo.
) > deployment-info.txt

echo.
echo Thank you for using Railway Deployment Script!
echo.
pause
