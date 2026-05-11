@echo off
echo ========================================
echo Railway Deployment Script
echo Hospital Management System
echo ========================================
echo.

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Railway CLI is not installed!
    echo.
    echo Installing Railway CLI...
    npm install -g @railway/cli
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install Railway CLI
        echo Please install manually: npm install -g @railway/cli
        pause
        exit /b 1
    )
    echo [SUCCESS] Railway CLI installed!
    echo.
)

echo [STEP 1] Checking Railway login status...
railway whoami >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo You need to login to Railway first.
    echo Opening browser for authentication...
    railway login
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Railway login failed
        pause
        exit /b 1
    )
)
echo [SUCCESS] Logged in to Railway
echo.

echo [STEP 2] Creating new Railway project...
railway init --name "Zhilon-Hospital-HMS"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to create project
    pause
    exit /b 1
)
echo [SUCCESS] Project created
echo.

echo [STEP 3] Adding MySQL database...
railway add --database mysql
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to add MySQL
    pause
    exit /b 1
)
echo [SUCCESS] MySQL database added
echo.

echo Waiting for MySQL to be ready...
timeout /t 10 /nobreak >nul
echo.

echo [STEP 4] Deploying Backend Service...
cd backend
railway up --service backend
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend deployment failed
    cd ..
    pause
    exit /b 1
)
echo [SUCCESS] Backend deployed
cd ..
echo.

echo [STEP 5] Setting backend environment variables...
call :set_backend_env
echo.

echo [STEP 6] Getting backend URL...
cd backend
for /f "delims=" %%i in ('railway domain') do set BACKEND_URL=%%i
cd ..
echo Backend URL: %BACKEND_URL%
echo.

echo [STEP 7] Deploying Frontend Service...
cd frontend
railway up --service frontend
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend deployment failed
    cd ..
    pause
    exit /b 1
)
echo [SUCCESS] Frontend deployed
cd ..
echo.

echo [STEP 8] Setting frontend environment variables...
cd frontend
railway variables --set VITE_API_BASE_URL=https://%BACKEND_URL%/api
cd ..
echo.

echo [STEP 9] Getting frontend URL...
cd frontend
for /f "delims=" %%i in ('railway domain') do set FRONTEND_URL=%%i
cd ..
echo Frontend URL: %FRONTEND_URL%
echo.

echo [STEP 10] Updating backend CORS...
cd backend
railway variables --set CORS_ORIGIN=https://%FRONTEND_URL%
cd ..
echo.

echo [STEP 11] Running database migrations...
cd backend
railway run npm run migrate
cd ..
echo.

echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Your application is now live:
echo Frontend: https://%FRONTEND_URL%
echo Backend:  https://%BACKEND_URL%
echo.
echo Opening frontend in browser...
start https://%FRONTEND_URL%
echo.
pause
exit /b 0

:set_backend_env
cd backend
railway variables --set NODE_ENV=production
railway variables --set PORT=5000
railway variables --set DB_DIALECT=mysql
railway variables --set DB_POOL_MAX=20
railway variables --set DB_POOL_MIN=5
railway variables --set DB_POOL_ACQUIRE=60000
railway variables --set DB_POOL_IDLE=10000
railway variables --set JWT_SECRET=%RANDOM%%RANDOM%%RANDOM%%RANDOM%_super_secret_key
railway variables --set JWT_EXPIRES_IN=8h
railway variables --set CORS_ORIGIN=*
railway variables --set UPLOAD_DIR=uploads
railway variables --set MAX_FILE_SIZE=10485760
railway variables --set RATE_LIMIT_WINDOW_MS=900000
railway variables --set RATE_LIMIT_MAX=500
cd ..
exit /b 0
