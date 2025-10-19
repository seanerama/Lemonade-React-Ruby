# Deploying Lemonade Game to Render.com

This guide walks you through deploying the Lemonade Game (Rails API + React frontend) to Render.com.

## Prerequisites

- GitHub account with repository: `seanerama/Lemonade-React-Ruby`
- Render.com account (free tier works)
- Your `lemonade-backend/config/master.key` file (needed for Rails credentials)

## Architecture

The app deploys as 3 Render services:
1. **PostgreSQL Database** - Managed database service
2. **Backend Web Service** - Rails API (Docker container)
3. **Frontend Static Site** - React SPA (static files)

---

## Step 1: Push to GitHub

From the project root directory:

```bash
git init
git add .
git commit -m "Initial commit - ready for Render deployment"
git branch -M main
git remote add origin https://github.com/seanerama/Lemonade-React-Ruby.git
git push -u origin main
```

---

## Step 2: Deploy Using Render Blueprint

### Option A: One-Click Deploy (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository: `seanerama/Lemonade-React-Ruby`
4. Render will detect `render.yaml` and create all services automatically
5. **IMPORTANT**: Before clicking "Apply", you'll need to:
   - Set `RAILS_MASTER_KEY` environment variable for the backend
   - Update `REACT_APP_API_URL` with your backend URL (see step 3)

### Option B: Manual Setup

If you prefer manual setup, see the detailed instructions below.

---

## Step 3: Configure Environment Variables

After deployment starts, configure these:

### Backend (lemonade-backend)

1. Go to the backend service in Render Dashboard
2. Go to **Environment** tab
3. Add `RAILS_MASTER_KEY`:
   ```bash
   # On your local machine, get the master key:
   cat lemonade-backend/config/master.key
   ```
   Copy the output and add it as `RAILS_MASTER_KEY` in Render

4. Add `CORS_ORIGINS` (after frontend deploys):
   ```
   CORS_ORIGINS=https://lemonade-frontend.onrender.com
   ```
   (Replace with your actual frontend URL)

### Frontend (lemonade-frontend)

1. Go to the frontend service in Render Dashboard
2. Go to **Environment** tab
3. Update `REACT_APP_API_URL`:
   ```
   REACT_APP_API_URL=https://lemonade-backend.onrender.com/api
   ```
   (Replace with your actual backend URL)

4. **Trigger Redeploy** after changing this variable (Manual Deploy → Deploy Latest Commit)

---

## Step 4: Verify Deployment

### Check Backend

Visit: `https://lemonade-backend.onrender.com/api/leaderboard`

You should see JSON response (empty array is fine).

### Check Frontend

Visit: `https://lemonade-frontend.onrender.com`

You should see the Lemonade Game interface.

---

## Important Notes

### Free Tier Limitations

- Services **spin down after 15 minutes** of inactivity
- First request after spin-down takes **30-60 seconds** to wake up
- Database has **1GB storage limit**
- **750 hours/month** total across all services

### URLs to Update

After deployment, you'll have these URLs:
- Backend: `https://lemonade-backend.onrender.com`
- Frontend: `https://lemonade-frontend.onrender.com`
- Database: Internal URL (auto-configured)

Make sure to update:
1. `CORS_ORIGINS` in backend environment variables
2. `REACT_APP_API_URL` in frontend environment variables

### Database Migrations

Database migrations run **automatically** on backend startup via the Docker entrypoint script.

### Logs

View logs in Render Dashboard:
- Backend: Click on service → "Logs" tab
- Frontend: Build logs available during deployment

---

## Troubleshooting

### Backend won't start
- Check `RAILS_MASTER_KEY` is set correctly
- Check `DATABASE_URL` is connected to the database
- View logs for specific error messages

### Frontend can't connect to backend
- Verify `REACT_APP_API_URL` points to correct backend URL
- Check CORS settings in backend allow frontend domain
- Check backend is running and responding

### CORS errors
- Update `CORS_ORIGINS` environment variable in backend
- Must include frontend URL without trailing slash
- Restart backend after changing CORS settings

### Database connection issues
- Ensure backend and database are in the **same region**
- Check `DATABASE_URL` is properly connected in backend environment

---

## Manual Deployment Steps (Alternative to Blueprint)

If you prefer to set up services manually instead of using `render.yaml`:

### 1. Create PostgreSQL Database

1. Dashboard → New + → PostgreSQL
2. Configure:
   - Name: `lemonade-db`
   - Database: `lemonade_production`
   - User: `lemonade_user`
   - Region: `Ohio` (or your preference)
   - Plan: `Free`
3. Create Database
4. **Copy the Internal Database URL** (needed for backend)

### 2. Create Backend Service

1. Dashboard → New + → Web Service
2. Connect GitHub repo: `seanerama/Lemonade-React-Ruby`
3. Configure:
   - Name: `lemonade-backend`
   - Root Directory: `lemonade-backend`
   - Environment: `Docker`
   - Region: `Ohio` (match database)
   - Branch: `main`
   - Dockerfile Path: `lemonade-backend/Dockerfile`
4. Add Environment Variables:
   ```
   RAILS_ENV=production
   DATABASE_URL=<paste-internal-database-url>
   RAILS_MASTER_KEY=<from-local-file>
   RAILS_LOG_TO_STDOUT=true
   CORS_ORIGINS=https://lemonade-frontend.onrender.com
   ```
5. Advanced: Set Health Check Path: `/api/leaderboard`
6. Create Web Service

### 3. Create Frontend Service

1. Dashboard → New + → Static Site
2. Connect GitHub repo: `seanerama/Lemonade-React-Ruby`
3. Configure:
   - Name: `lemonade-frontend`
   - Root Directory: `lemonade-frontend`
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `build`
   - Branch: `main`
4. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://lemonade-backend.onrender.com/api
   NODE_VERSION=18
   ```
5. Create Static Site

---

## Updating After Changes

### Backend Changes
```bash
git add .
git commit -m "Backend updates"
git push
```
Render auto-deploys on push to `main` branch.

### Frontend Changes
```bash
git add .
git commit -m "Frontend updates"
git push
```
Render auto-deploys and rebuilds static assets.

---

## Monitoring

- **Dashboard**: https://dashboard.render.com
- **Metrics**: Each service has CPU, Memory, Bandwidth graphs
- **Logs**: Real-time logs available in each service
- **Alerts**: Configure email alerts for service failures

---

## Cost Optimization

Free tier is fine for development, but for production consider:

- **Database**: Starter plan ($7/mo) - 10GB storage, no sleep
- **Backend**: Starter plan ($7/mo) - No sleep, better performance
- **Frontend**: Free tier is fine (static sites don't sleep)

**Estimated production cost**: ~$14/month

---

## Support

- Render Docs: https://render.com/docs
- GitHub Issues: https://github.com/seanerama/Lemonade-React-Ruby/issues
