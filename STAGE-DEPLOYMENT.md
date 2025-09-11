# Stage Deployment Guide

This guide explains how to deploy the Box Tracker stage environment on your Raspberry Pi.

## Overview

The stage deployment runs alongside your production version:
- **Production**: http://localhost:3000 (untouched)  
- **Stage**: https://localhost:3443 (with camera support)
- **Stage HTTP**: http://localhost:3001 (fallback)

## Setup on Raspberry Pi

### 1. Clone Stage Repository

```bash
cd /home/gabor/Projects/
git clone https://github.com/gabjuh/box-tracker.git box-tracker-stage
cd box-tracker-stage
git checkout stage-deployment
```

### 2. Run Stage Deployment

```bash
./stage-deploy.sh
```

This script will:
- Pull latest changes from `stage-deployment` branch
- Set up HTTPS certificates for camera access
- Run database migration (from old to new structure)
- Build and start the stage container on ports 3001/3443

### 3. Access Stage Environment

- **HTTPS** (recommended): https://your-rpi-ip:3443
- **HTTP** (fallback): http://your-rpi-ip:3001

## Camera Support

The stage environment includes HTTPS support to enable camera functionality:

### Why HTTPS is needed
- Modern browsers require HTTPS for camera access (except localhost)
- The stage deployment uses self-signed certificates for local network access

### First-time setup
1. Navigate to https://your-rpi-ip:3443
2. Browser will show security warning for self-signed certificate
3. Click "Advanced" → "Proceed to [ip] (unsafe)"
4. Camera should now work in the application

## Database Migration

The stage deployment automatically migrates data from your old database structure to the new one:

- Preserves all existing box data (81 records → new structure)
- Adds missing `mainImageIndex` field (default: 0)  
- Creates backup before migration
- Rollback available if migration fails

## File Structure

```
/home/gabor/Projects/box-tracker-stage/
├── stage-deploy.sh           # Main deployment script
├── setup-https.sh           # HTTPS certificate generation
├── migrate-old-data.sh      # Database migration
├── docker-compose.stage.yml # Stage container configuration
├── Dockerfile.stage         # Stage container with HTTPS
├── https-server.js          # HTTPS server implementation
└── certs/                   # Generated SSL certificates
    ├── cert.pem
    └── key.pem
```

## Development Workflow

### Mac → RPi Stage Deployment

1. **Develop on Mac**:
   ```bash
   # Make changes, test locally
   npm run dev
   ```

2. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feature: new functionality"
   git push origin stage-deployment
   ```

3. **Deploy to RPi Stage**:
   ```bash
   # On RPi
   cd /home/gabor/Projects/box-tracker-stage
   ./stage-deploy.sh
   ```

4. **Test on Stage**: 
   - Visit https://rpi-ip:3443
   - Test camera functionality
   - Verify all features work

5. **Promote to Production** (when ready):
   ```bash
   git checkout main
   git merge stage-deployment
   git push origin main
   # Deploy to production environment
   ```

## Troubleshooting

### Camera not working
1. Ensure you're using HTTPS (port 3443)
2. Accept the self-signed certificate
3. Grant camera permissions when prompted
4. Check browser console for errors

### Port conflicts
- Production: 3000
- Stage HTTPS: 3443  
- Stage HTTP: 3001
- All ports should be unique

### Container issues
```bash
# View logs
docker compose -f docker-compose.stage.yml logs -f

# Restart stage
docker compose -f docker-compose.stage.yml restart

# Rebuild stage
docker compose -f docker-compose.stage.yml up -d --build
```

### Database issues
- Backup is created before migration: `prisma/dev.db.backup.[timestamp]`
- Restore if needed: `cp backup.db prisma/dev.db`
- Re-run migration: `./migrate-old-data.sh`

## Security Notes

- Self-signed certificates are only for local network use
- Don't use these certificates in production
- Camera permissions are granted per-domain
- HTTPS is required for camera access on modern browsers

## Next Steps

Once stage deployment is working:

1. Test all camera functionality
2. Verify database migration worked correctly  
3. Test image uploads and QR scanning
4. Performance test with multiple users
5. Ready for production promotion