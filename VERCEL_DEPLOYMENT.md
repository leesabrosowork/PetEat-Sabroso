# Vercel Deployment Guide

This guide explains how to deploy the PetEat application to Vercel.

## Prerequisites

- Vercel account (https://vercel.com)
- GitHub account with the repository connected
- Backend API deployed and accessible

## Project Structure

This is a monorepo with:
- **frontend/**: Next.js application (deployed to Vercel)
- **backend/**: Express.js API server (deploy separately)

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to https://vercel.com/import
2. Select your GitHub repository
3. Vercel will auto-detect it's a Next.js project

### 2. Configure Environment Variables

In Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-api-url.com
```

**Important:** The `NEXT_PUBLIC_` prefix makes the variable available in the browser.

Replace `https://your-backend-api-url.com` with your actual backend API URL.

### 3. Build Settings

Vercel should automatically detect:
- **Framework**: Next.js
- **Build Command**: `cd frontend && pnpm build`
- **Output Directory**: `frontend/.next`
- **Install Command**: `cd frontend && pnpm install`

If not detected, configure manually:
- Set **Root Directory** to `frontend/` 
- Or update `vercel.json` in the root with the configuration provided

### 4. Deploy Backend

Your backend API must be deployed separately:
- Option 1: Deploy to a service like Railway, Render, or Heroku
- Option 2: Use the same backend for multiple frontends

Once deployed, use that URL for `NEXT_PUBLIC_API_URL`.

### 5. Redeploy After Environment Changes

If you change environment variables:
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Update the values
5. Go to Deployments and click "Redeploy"

## Environment Variables Reference

### Frontend `.env.example`

```
# API Configuration - Required for production
NEXT_PUBLIC_API_URL=https://api.example.com

# Google Maps API (optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Local Development

For local testing:
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your API URL
pnpm dev
```

Open http://localhost:3000

## Troubleshooting

### 404 Error on Root Path
- Check that `NEXT_PUBLIC_API_URL` is set in Vercel
- Verify the backend API is accessible from the frontend
- Check CORS settings in backend

### API Connection Errors
- Ensure backend is deployed and running
- Check network tab in browser DevTools
- Verify `NEXT_PUBLIC_API_URL` in Vercel environment variables

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are installed
- Verify TypeScript errors (frontend has `ignoreBuildErrors: true`)

## Production Checklist

- [ ] Backend API deployed and accessible
- [ ] `NEXT_PUBLIC_API_URL` configured in Vercel
- [ ] CORS enabled on backend for your Vercel domain
- [ ] All environment variables set
- [ ] Test login and main features
- [ ] Check browser console for errors

## More Information

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
