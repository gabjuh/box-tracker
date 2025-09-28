#!/bin/bash

# Deploy to Production (Ubuntu Server) Script
# This script deploys the box-tracker application to the Ubuntu production server

set -e

echo "🚀 Starting deployment to Production (Ubuntu Server)..."

# Configuration - Update these values for your setup
PROD_HOST="your-ubuntu-server.com"    # Replace with your Ubuntu server domain/IP
PROD_USER="your-username"              # Replace with your Ubuntu server username
PROD_PROJECT_PATH="/home/your-username/box-tracker"
PROD_DOMAIN="your-domain.com"          # Replace with your actual domain
LOCAL_DB_PATH="./prisma/dev.db"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Validate configuration
if [[ "$PROD_HOST" == "your-ubuntu-server.com" || "$PROD_USER" == "your-username" || "$PROD_DOMAIN" == "your-domain.com" ]]; then
    echo_error "Please update the configuration variables at the top of this script:"
    echo "  - PROD_HOST: Your Ubuntu server IP or domain"
    echo "  - PROD_USER: Your Ubuntu server username"
    echo "  - PROD_DOMAIN: Your production domain"
    echo "  - PROD_PROJECT_PATH: Project path on Ubuntu server"
    exit 1
fi

# Check if we can connect to Ubuntu server
echo_info "Checking connection to Ubuntu server..."
if ! ssh -o ConnectTimeout=5 "${PROD_USER}@${PROD_HOST}" "echo 'Connection successful'" &>/dev/null; then
    echo_error "Cannot connect to Ubuntu server at ${PROD_HOST}. Please check:"
    echo "  - Server is running and accessible"
    echo "  - SSH keys are set up correctly"
    echo "  - Host address is correct: ${PROD_HOST}"
    exit 1
fi
echo_success "Connected to Ubuntu server successfully"

# Step 1: Create production branch and push
echo_info "Creating production branch..."
git checkout -b production 2>/dev/null || git checkout production
git merge main
git push origin production --force

# Step 2: Copy database to production
echo_info "Preparing database for production..."
if [[ -f "${LOCAL_DB_PATH}" ]]; then
    echo_info "Copying local database to production server..."
    scp "${LOCAL_DB_PATH}" "${PROD_USER}@${PROD_HOST}:/tmp/dev.db.prod"
else
    echo_warning "Local database not found at ${LOCAL_DB_PATH}"
fi

# Step 3: Deploy to Ubuntu server
echo_info "Deploying to Ubuntu server..."
ssh "${PROD_USER}@${PROD_HOST}" << ENDSSH
    set -e

    # Install Docker and Docker Compose if not installed
    if ! command -v docker &> /dev/null; then
        echo "📦 Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker \$USER
        echo "✅ Docker installed"
    fi

    if ! command -v docker compose &> /dev/null; then
        echo "📦 Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo "✅ Docker Compose installed"
    fi

    # Create project directory
    mkdir -p ${PROD_PROJECT_PATH}
    cd ${PROD_PROJECT_PATH}

    # Clone or pull project
    if [[ ! -d ".git" ]]; then
        echo "📥 Cloning project..."
        git clone https://github.com/gabjuh/box-tracker.git .
    else
        echo "📥 Pulling latest changes..."
        git fetch origin
    fi
    git checkout production
    git reset --hard origin/production

    # Create necessary directories
    mkdir -p data public/uploads

    # Handle database
    if [[ -f "/tmp/dev.db.prod" ]]; then
        if [[ -f "./data/dev.db" ]]; then
            cp "./data/dev.db" "./data/dev.db.backup-\$(date +%Y%m%d-%H%M%S)"
            echo "✅ Created database backup"
        fi
        mv /tmp/dev.db.prod ./data/dev.db
        echo "✅ Database updated from local"
    fi

    # Create production docker-compose.yml
    cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  box-tracker:
    build: .
    restart: unless-stopped
    volumes:
      - ./data:/app/data
      - ./public/uploads:/app/public/uploads
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/dev.db
    networks:
      - web

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - box-tracker
    networks:
      - web

networks:
  web:
    external: false
EOF

    # Create Nginx configuration
    cat > nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream app {
        server box-tracker:3000;
    }

    server {
        listen 80;
        server_name ${PROD_DOMAIN};
        return 301 https://\\\$server_name\\\$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name ${PROD_DOMAIN};

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        client_max_body_size 50M;

        location / {
            proxy_pass http://app;
            proxy_set_header Host \\\$host;
            proxy_set_header X-Real-IP \\\$remote_addr;
            proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \\\$scheme;
        }

        location /uploads/ {
            proxy_pass http://app;
            proxy_set_header Host \\\$host;
            proxy_set_header X-Real-IP \\\$remote_addr;
            proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \\\$scheme;
        }
    }
}
EOF

    # Setup SSL certificates (Let's Encrypt)
    mkdir -p ssl
    if [[ ! -f "ssl/cert.pem" ]]; then
        echo "🔐 Setting up SSL certificates..."
        if command -v certbot &> /dev/null; then
            sudo certbot certonly --standalone -d ${PROD_DOMAIN} --non-interactive --agree-tos --email admin@${PROD_DOMAIN}
            sudo cp /etc/letsencrypt/live/${PROD_DOMAIN}/fullchain.pem ssl/cert.pem
            sudo cp /etc/letsencrypt/live/${PROD_DOMAIN}/privkey.pem ssl/key.pem
            sudo chown \$USER:\$USER ssl/*.pem
        else
            echo "⚠️  Certbot not installed. Creating self-signed certificate..."
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout ssl/key.pem \
                -out ssl/cert.pem \
                -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=${PROD_DOMAIN}"
        fi
        echo "✅ SSL certificates ready"
    fi

    # Stop existing containers
    echo "🛑 Stopping existing containers..."
    docker compose -f docker-compose.prod.yml down || true

    # Build and start new containers
    echo "🏗️  Building and starting production containers..."
    docker compose -f docker-compose.prod.yml up -d --build

    # Wait for containers to be ready
    echo "⏳ Waiting for containers to be ready..."
    sleep 15

    # Check if services are running
    if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        echo "✅ Production containers started successfully"
    else
        echo "❌ Containers failed to start"
        docker compose -f docker-compose.prod.yml logs --tail=20
        exit 1
    fi
ENDSSH

echo ""
echo_success "🚀 Production deployment completed successfully!"
echo ""
echo -e "${BLUE}🌐 Production URLs:${NC}"
echo "   🌍 HTTPS: https://${PROD_DOMAIN}"
echo "   🌍 HTTP:  http://${PROD_DOMAIN} (redirects to HTTPS)"
echo ""
echo_success "📸 Camera functionality available via HTTPS!"
echo ""
echo_info "🔍 To check logs: ssh ${PROD_USER}@${PROD_HOST} 'cd ${PROD_PROJECT_PATH} && docker compose -f docker-compose.prod.yml logs -f'"
echo_info "🛑 To stop: ssh ${PROD_USER}@${PROD_HOST} 'cd ${PROD_PROJECT_PATH} && docker compose -f docker-compose.prod.yml down'"
echo ""
echo_warning "⚠️  Don't forget to:"
echo "   1. Update DNS records to point ${PROD_DOMAIN} to your server"
echo "   2. Configure firewall to allow ports 80 and 443"
echo "   3. Set up SSL certificate renewal (certbot renew)"