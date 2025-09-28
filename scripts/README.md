# Deployment Scripts

This directory contains automated deployment scripts for the Box Tracker application.

## Quick Start

### Prerequisites

1. **SSH Keys Setup**: Ensure you have SSH key-based authentication set up for both servers
2. **Server Access**: Verify you can connect to both servers without password prompts
3. **Docker**: Both target servers need Docker and Docker Compose installed

### Configuration

Before using the deployment scripts, update the configuration variables in each script:

#### Stage Deployment (RPi4)
Edit `deploy-stage.sh` and update:
```bash
RPI_HOST="192.168.8.248"  # Your RPi IP address
RPI_USER="gabor"          # Your RPi username
```

#### Production Deployment (Ubuntu Server)
Edit `deploy-prod.sh` and update:
```bash
PROD_HOST="your-ubuntu-server.com"    # Your server domain/IP
PROD_USER="your-username"              # Your server username
PROD_DOMAIN="your-domain.com"          # Your production domain
```

## Available Commands

### Deploy to Stage (RPi4)
```bash
npm run deploy:stage
```

This command:
- ✅ Commits and pushes local changes to GitHub
- ✅ Copies current database to RPi4 (overwrites existing)
- ✅ Pulls latest code on RPi4
- ✅ Builds and deploys with Docker
- ✅ Sets up HTTPS for camera functionality
- ✅ Shows access URLs

**Access URLs after deployment:**
- HTTPS (with camera): `https://RPI_IP:3443`
- HTTP (fallback): `http://RPI_IP:3001`

### Deploy to Production (Ubuntu Server)
```bash
npm run deploy:prod
```

This command:
- ✅ Creates production branch from main
- ✅ Copies current database to production server
- ✅ Sets up complete production environment
- ✅ Configures Nginx with SSL/TLS
- ✅ Deploys with Docker Compose
- ✅ Sets up Let's Encrypt certificates

**Access URL after deployment:**
- Production: `https://your-domain.com`

### Backup and Deploy to Stage
```bash
npm run deploy:backup
```

This command:
- ✅ Creates compressed backup of current database
- ✅ Manages backup retention (keeps last 10)
- ✅ Deploys to stage with database sync
- ✅ Provides restore instructions if deployment fails

## Deployment Architecture

### Stage Environment (RPi4)
```
┌─────────────────┐    ┌─────────────────┐
│   Local Dev     │───▶│   RPi4 Stage    │
│                 │    │                 │
│ • Development   │    │ • Docker        │
│ • Latest DB     │    │ • HTTPS:3443    │
│ • Source of     │    │ • HTTP:3001     │
│   truth         │    │ • Self-signed   │
└─────────────────┘    │   SSL           │
                       └─────────────────┘
```

### Production Environment (Ubuntu Server)
```
┌─────────────────┐    ┌─────────────────┐
│   GitHub        │───▶│ Ubuntu Server   │
│                 │    │                 │
│ • Production    │    │ • Docker        │
│   branch        │    │ • Nginx         │
│ • Source code   │    │ • Let's Encrypt │
└─────────────────┘    │ • Port 443/80   │
                       └─────────────────┘
```

## File Structure

```
scripts/
├── deploy-stage.sh        # RPi4 stage deployment
├── deploy-prod.sh         # Ubuntu production deployment
├── backup-and-deploy.sh   # Backup + stage deployment
└── README.md              # This file

project-root/
├── docker-compose.stage.yml   # Stage environment config
├── docker-compose.prod.yml    # Created during prod deployment
├── Dockerfile                 # Production Dockerfile
├── Dockerfile.stage          # Stage Dockerfile
└── backups/                  # Database backups directory
```

## SSL/HTTPS Configuration

### Stage (RPi4)
- Uses self-signed certificates for camera functionality
- Accessible via HTTPS on port 3443
- Certificate auto-generated during deployment

### Production (Ubuntu Server)
- Uses Let's Encrypt for valid SSL certificates
- Automatic HTTPS redirect from HTTP
- Nginx handles SSL termination

## Database Management

### Local to Stage
- Local database is copied to RPi4 during deployment
- Overwrites existing stage database (as requested)
- Creates backup before overwriting

### Local to Production
- Local database is copied to production during initial deployment
- Subsequent deployments preserve production database
- Manual backup recommended before production deployments

## Troubleshooting

### SSH Connection Issues
```bash
# Test SSH connection
ssh your-username@your-server "echo 'Connected successfully'"

# If connection fails, check:
# 1. SSH key is added to server
# 2. Server is accessible
# 3. Username and hostname are correct
```

### Docker Issues
```bash
# Check container status on server
ssh your-username@your-server "docker ps"

# View container logs
ssh your-username@your-server "docker compose logs -f"
```

### SSL Certificate Issues
```bash
# Check SSL certificate validity
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Renew Let's Encrypt certificate
ssh your-username@your-server "sudo certbot renew"
```

## Security Notes

1. **SSH Keys**: Use SSH key authentication, never passwords in scripts
2. **Environment Variables**: Never commit sensitive data to repository
3. **SSL/TLS**: Always use HTTPS in production
4. **Database Backups**: Regular backups are essential
5. **Firewall**: Ensure only necessary ports are open

## Monitoring and Maintenance

### Health Checks
```bash
# Check if services are running
curl -f https://your-domain.com/health || echo "Service down"

# Monitor logs
ssh your-username@your-server "docker compose logs -f --tail=50"
```

### Backup Management
```bash
# List available backups
ls -la backups/

# Restore from backup
gunzip backups/dev.db.backup-TIMESTAMP.gz
cp backups/dev.db.backup-TIMESTAMP prisma/dev.db
```

### Updates
```bash
# Update stage environment
npm run deploy:stage

# Update production environment
npm run deploy:prod
```

## Support

For issues with deployment scripts:
1. Check server connectivity and SSH access
2. Verify Docker is installed and running on target servers
3. Ensure configuration variables are correctly set
4. Check server logs for specific error messages

For application-specific issues, refer to the main project documentation.