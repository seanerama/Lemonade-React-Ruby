# Deploying Lemonade Game to Render.com

This guide walks you through deploying the Lemonade Game (Rails API + React frontend) to Render.com.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Method 1: Blueprint Deployment (Recommended)](#method-1-blueprint-deployment-recommended)
- [Method 2: Manual Deployment](#method-2-manual-deployment)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Troubleshooting](#troubleshooting)
- [Updating After Changes](#updating-after-changes)
- [Monitoring](#monitoring)
- [Cost Optimization](#cost-optimization)

---

## Prerequisites

- GitHub account with your repository
- Render.com account (free tier works)
- Your `lemonade-backend/config/master.key` file (needed for Rails credentials)
- Code pushed to GitHub on the `main` branch

---

## Architecture Overview

The app deploys as 3 Render services:
1. **PostgreSQL Database** - Managed database service
2. **Backend Web Service** - Rails API (Docker container)
3. **Frontend Static Site** - React SPA (static files)

---

# Method 1: Blueprint Deployment (Recommended)

This method uses the `render.yaml` file to automatically create all services at once.

## Step 1: Prepare Your Code

Ensure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## Step 2: Update Frontend Configuration

Before deploying, update the frontend to point to your production backend:

1. Edit `lemonade-frontend/public/config.js`:
   ```javascript
   window.ENV = {
     REACT_APP_API_URL: 'https://lemonade-backend.onrender.com/api'
   };
   ```

2. Commit and push:
   ```bash
   git add lemonade-frontend/public/config.js
   git commit -m "Configure for production deployment"
   git push
   ```

## Step 3: Deploy via Blueprint

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and show all services to be created
5. Click **"Apply"**

Render will now create:
- PostgreSQL database
- Backend web service
- Frontend static site

## Step 4: Configure Backend Environment Variable

**IMPORTANT**: The backend won't start without the Rails master key.

1. While services are deploying, go to the backend service
2. Click **"Environment"** tab
3. Add `RAILS_MASTER_KEY`:
   ```bash
   # On your local machine, get the master key:
   cat lemonade-backend/config/master.key
   ```
4. Copy the output and add it as `RAILS_MASTER_KEY` in Render
5. Save - the backend will automatically redeploy

## Step 5: Update CORS Configuration

After both services are deployed, note your actual frontend URL (it may have a suffix like `-4zsp`).

1. Go to backend service → **Environment** tab
2. Find `CORS_ORIGINS` variable
3. Update it to your actual frontend URL:
   ```
   CORS_ORIGINS=https://lemonade-frontend-XXXX.onrender.com
   ```
   (Replace `XXXX` with your actual URL suffix)
4. Save - backend will redeploy

## Step 6: Update Frontend API URL (if needed)

If your backend URL has a suffix, update the frontend:

1. Edit `lemonade-frontend/public/config.js`:
   ```javascript
   window.ENV = {
     REACT_APP_API_URL: 'https://lemonade-backend-XXXX.onrender.com/api'
   };
   ```
2. Commit and push - frontend will auto-redeploy

## Step 7: Verify Deployment

**Check Backend:**
Visit: `https://your-backend.onrender.com/api/leaderboard`
- You should see JSON response (empty array is fine)

**Check Frontend:**
Visit: `https://your-frontend.onrender.com`
- You should see the game interface
- Try registering and logging in

✅ **Deployment Complete!**

---

# Method 2: Manual Deployment

If you prefer to create each service manually instead of using the Blueprint.

## Step 1: Prepare Your Code

Ensure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## Step 2: Update Frontend Configuration

Edit `lemonade-frontend/public/config.js`:
```javascript
window.ENV = {
  REACT_APP_API_URL: 'https://lemonade-backend.onrender.com/api'
};
```

Commit and push:
```bash
git add lemonade-frontend/public/config.js
git commit -m "Configure for production deployment"
git push
```

## Step 3: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `lemonade-db`
   - **Database**: `lemonade_production`
   - **User**: `lemonade_user`
   - **Region**: `Ohio` (or your preference)
   - **Plan**: `Free`
4. Click **Create Database**
5. **Copy the Internal Database URL** (you'll need this for the backend)

## Step 4: Create Backend Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `lemonade-backend`
   - **Root Directory**: `lemonade-backend`
   - **Environment**: `Docker`
   - **Region**: `Ohio` (match database region)
   - **Branch**: `main`
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: `Free`

4. Click **Advanced** and add environment variables:
   ```
   RAILS_ENV=production
   DATABASE_URL=<paste-your-internal-database-url>
   RAILS_MASTER_KEY=<paste-from-local-file>
   RAILS_LOG_TO_STDOUT=true
   RAILS_SERVE_STATIC_FILES=true
   CORS_ORIGINS=https://lemonade-frontend.onrender.com
   ```

5. Set **Health Check Path**: `/api/leaderboard`

6. Click **Create Web Service**

## Step 5: Create Frontend Service

1. Click **New +** → **Static Site**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `lemonade-frontend`
   - **Root Directory**: `lemonade-frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `build`
   - **Branch**: `main`
   - **Plan**: `Free`

4. Click **Advanced** and add environment variable:
   ```
   NODE_VERSION=18
   ```

5. Click **Create Static Site**

## Step 6: Update CORS After Frontend Deploys

Once the frontend finishes deploying, note its actual URL.

1. Go to backend service → **Environment** tab
2. Update `CORS_ORIGINS` to your actual frontend URL:
   ```
   CORS_ORIGINS=https://lemonade-frontend-XXXX.onrender.com
   ```
3. Save - backend will redeploy

## Step 7: Update Frontend API URL (if needed)

If your backend URL has a suffix, update the frontend:

1. Edit `lemonade-frontend/public/config.js`:
   ```javascript
   window.ENV = {
     REACT_APP_API_URL: 'https://lemonade-backend-XXXX.onrender.com/api'
   };
   ```
2. Commit and push - frontend will auto-redeploy

## Step 8: Verify Deployment

**Check Backend:**
Visit: `https://your-backend.onrender.com/api/leaderboard`
- You should see JSON response

**Check Frontend:**
Visit: `https://your-frontend.onrender.com`
- Try registering and logging in

✅ **Deployment Complete!**

---

# Post-Deployment Configuration

## Important URLs

After deployment, note these URLs:
- **Backend**: `https://lemonade-backend-XXXX.onrender.com`
- **Frontend**: `https://lemonade-frontend-XXXX.onrender.com`
- **Database**: Internal URL (auto-configured)

## Free Tier Limitations

- Services **spin down after 15 minutes** of inactivity
- First request after spin-down takes **30-60 seconds** to wake up
- Database has **1GB storage limit**
- **750 hours/month** total across all services

## Database Migrations

Database migrations run **automatically** on backend startup via the Docker entrypoint script.

## Viewing Logs

In Render Dashboard:
- **Backend**: Click on service → "Logs" tab
- **Frontend**: Click on service → "Logs" tab (shows build logs)

---

# Troubleshooting

## Backend Won't Start

**Symptoms**: Backend service shows errors, never goes green

**Solutions**:
- Check `RAILS_MASTER_KEY` is set correctly (no extra spaces)
- Check `DATABASE_URL` is connected to the database
- View logs for specific error messages
- Ensure database is in the same region as backend

## Frontend Can't Connect to Backend

**Error**: "Network error - please check your connection"

**Most Common Issue**: The frontend was built with the wrong API URL.

**Solutions**:

1. **Check the config file**: `lemonade-frontend/public/config.js` should contain:
   ```javascript
   window.ENV = {
     REACT_APP_API_URL: 'https://lemonade-backend-XXXX.onrender.com/api'
   };
   ```
2. **Update the URL** if your backend URL is different
3. **Commit and push** to trigger a rebuild
4. **Clear browser cache** or test in incognito mode

Other checks:
- Verify backend URL has no trailing slash
- Check CORS settings in backend allow frontend domain
- Check backend is running (visit `/api/leaderboard`)
- Check browser console for the actual URL being called

## CORS Errors

**Error**: "Access to XMLHttpRequest has been blocked by CORS policy"

**Solutions**:
- Update `CORS_ORIGINS` environment variable in backend
- Must include frontend URL **without** trailing slash
- Correct: `https://lemonade-frontend-4zsp.onrender.com`
- Wrong: `https://lemonade-frontend-4zsp.onrender.com/`
- Save and wait for backend to redeploy

## Database Connection Issues

**Symptoms**: Backend crashes with database errors

**Solutions**:
- Ensure backend and database are in the **same region**
- Check `DATABASE_URL` is properly set in backend environment
- Check database service is running and healthy

## First Load is Very Slow

**Why**: Free tier services spin down after 15 minutes of inactivity

**Solutions**:
- Wait 30-60 seconds for services to wake up
- Upgrade to paid plans ($7/month each) to prevent spin-down
- Consider using a service like UptimeRobot to ping your app regularly

---

# Updating After Changes

## Automatic Deployment

Render automatically redeploys when you push to the `main` branch.

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Both backend and frontend will automatically rebuild and redeploy.

## Manual Deployment

If auto-deploy is disabled or you want to force a redeploy:

1. Go to the service in Render Dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

## Reverting to a Previous Version

1. Go to the service in Render Dashboard
2. Click **"Events"** tab
3. Find the successful deployment you want to revert to
4. Click **"Rollback to this version"**

---

# Monitoring

## Render Dashboard

Access at: https://dashboard.render.com

**Available Metrics**:
- CPU usage
- Memory usage
- Bandwidth usage
- Request counts
- Error rates

## Logs

Real-time logs available for each service:
1. Click on the service
2. Click **"Logs"** tab
3. Use filters to search logs

## Alerts

Configure email alerts:
1. Go to service settings
2. Enable notifications for:
   - Deploy failures
   - Service crashes
   - High resource usage

---

# Cost Optimization

## Free Tier (Current)

**Pros**:
- $0/month
- Great for development and testing
- Full feature access

**Cons**:
- Services spin down after 15 minutes
- Slow wake-up time (30-60 seconds)
- 1GB database storage limit
- 750 hours/month across all services

## Production Tier (Recommended for Live)

**Database**: Starter plan - $7/month
- 10GB storage
- No sleep/spin-down
- Better performance

**Backend**: Starter plan - $7/month
- No sleep/spin-down
- Better CPU/memory
- Faster response times

**Frontend**: Free tier - $0/month
- Static sites don't spin down
- Free tier is perfect

**Total Production Cost**: ~$14/month

## When to Upgrade

Upgrade when you:
- Have regular users
- Need consistent response times
- Can't tolerate 30-60 second wake-up delays
- Need more than 1GB database storage

---

# Support

- **Render Docs**: https://render.com/docs
- **GitHub Issues**: Create an issue in your repository
- **Render Support**: Available via dashboard chat

---

# Quick Reference

## Important Files

- `render.yaml` - Blueprint configuration
- `lemonade-frontend/public/config.js` - Frontend API URL
- `lemonade-backend/config/master.key` - Rails encryption key (keep secret!)
- `lemonade-backend/config/initializers/cors.rb` - CORS configuration

## Common Commands

```bash
# Get Rails master key
cat lemonade-backend/config/master.key

# Push changes to deploy
git add .
git commit -m "Your message"
git push origin main

# Test backend locally
cd lemonade-backend
rails server -p 3001

# Test frontend locally
cd lemonade-frontend
npm start
```

## Service URLs

Replace `XXXX` with your actual URL suffix:

- Backend API: `https://lemonade-backend-XXXX.onrender.com/api`
- Frontend: `https://lemonade-frontend-XXXX.onrender.com`
- Backend Health: `https://lemonade-backend-XXXX.onrender.com/api/leaderboard`
