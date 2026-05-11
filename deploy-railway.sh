#!/bin/bash

# Railway Deployment Script for Zhilon Hospital HMS
# This script automates the deployment of MySQL, Backend, and Frontend

set -e

echo "============================================================"
echo "  RAILWAY DEPLOYMENT - ZHILON HOSPITAL HMS"
echo "============================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
    echo -e "${GREEN}✓ Railway CLI installed${NC}"
else
    echo -e "${GREEN}✓ Railway CLI already installed${NC}"
fi

# Login to Railway
echo ""
echo "============================================================"
echo "STEP 1: Login to Railway"
echo "============================================================"
railway whoami &> /dev/null || {
    echo "Opening browser for authentication..."
    railway login
}
echo -e "${GREEN}✓ Logged in to Railway${NC}"

# Create project
echo ""
echo "============================================================"
echo "STEP 2: Creating Railway Project"
echo "============================================================"
railway init --name "Zhilon-Hospital-HMS" || echo "Project may already exist"
echo -e "${GREEN}✓ Project ready${NC}"

# Add MySQL
echo ""
echo "============================================================"
echo "STEP 3: Adding MySQL Database"
echo "============================================================"
railway add --database mysql || echo "MySQL may already exist"
echo -e "${GREEN}✓ MySQL database added${NC}"
echo "Waiting for MySQL to initialize..."
sleep 15

# Deploy Backend
echo ""
echo "============================================================"
echo "STEP 4: Deploying Backend"
echo "============================================================"
cd backend

# Set backend environment variables
echo "Setting backend environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set DB_DIALECT=mysql
railway variables set DB_POOL_MAX=20
railway variables set DB_POOL_MIN=5
railway variables set DB_POOL_ACQUIRE=60000
railway variables set DB_POOL_IDLE=10000
railway variables set JWT_SECRET="$(openssl rand -hex 32)"
railway variables set JWT_EXPIRES_IN=8h
railway variables set CORS_ORIGIN="*"
railway variables set UPLOAD_DIR=uploads
railway variables set MAX_FILE_SIZE=10485760
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX=500

# Deploy backend
railway up --detach
echo -e "${GREEN}✓ Backend deployed${NC}"

# Get backend URL
echo "Generating backend domain..."
BACKEND_URL=$(railway domain)
echo "Backend URL: https://$BACKEND_URL"

cd ..

# Run migrations
echo ""
echo "============================================================"
echo "STEP 5: Running Database Migrations"
echo "============================================================"
cd backend
railway run npm run migrate || echo "Migrations may have already run"
echo -e "${GREEN}✓ Migrations completed${NC}"
cd ..

# Deploy Frontend
echo ""
echo "============================================================"
echo "STEP 6: Deploying Frontend"
echo "============================================================"
cd frontend

# Install serve package
npm install serve --save

# Set frontend environment variables
echo "Setting frontend environment variables..."
railway variables set VITE_API_BASE_URL="https://$BACKEND_URL/api"

# Deploy frontend
railway up --detach
echo -e "${GREEN}✓ Frontend deployed${NC}"

# Get frontend URL
echo "Generating frontend domain..."
FRONTEND_URL=$(railway domain)
echo "Frontend URL: https://$FRONTEND_URL"

cd ..

# Update CORS
echo ""
echo "============================================================"
echo "STEP 7: Updating CORS Settings"
echo "============================================================"
cd backend
railway variables set CORS_ORIGIN="https://$FRONTEND_URL"
echo -e "${GREEN}✓ CORS updated${NC}"
cd ..

# Complete
echo ""
echo "============================================================"
echo "  DEPLOYMENT COMPLETE!"
echo "============================================================"
echo ""
echo "Your application is now live:"
echo ""
echo "  Frontend: https://$FRONTEND_URL"
echo "  Backend:  https://$BACKEND_URL"
echo ""
echo "Opening frontend in browser..."
if command -v xdg-open &> /dev/null; then
    xdg-open "https://$FRONTEND_URL"
elif command -v open &> /dev/null; then
    open "https://$FRONTEND_URL"
fi

# Save deployment info
cat > deployment-info.txt << EOF
Railway Deployment Information
================================

Deployment Date: $(date)
Project: Zhilon-Hospital-HMS
Repository: https://github.com/Abish133/Zhilon_Hospital
Branch: r.abish

URLs:
Frontend: https://$FRONTEND_URL
Backend:  https://$BACKEND_URL

Services:
- MySQL Database
- Node.js Backend API
- React Frontend

EOF

echo ""
echo "Deployment information saved to deployment-info.txt"
echo ""
