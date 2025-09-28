#!/bin/bash

# Deploy to Stage (RPi4) Script
# This script deploys the box-tracker application to the RPi4 stage server

set -e

echo "🍓 Starting deployment to Stage (RPi4)..."

# Configuration - Update these values for your setup
RPI_HOST="192.168.8.31"  # Replace with your RPi IP
RPI_USER="gabor"          # Replace with your RPi username
RPI_PROJECT_PATH="/home/gabor/Projects/box-tracker"
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

# Check if we can connect to RPi
echo_info "Checking connection to RPi..."
if ! ssh -o ConnectTimeout=5 "${RPI_USER}@${RPI_HOST}" "echo 'Connection successful'" &>/dev/null; then
    echo_error "Cannot connect to RPi at ${RPI_HOST}. Please check:"
    echo "  - RPi is running and connected to network"
    echo "  - SSH keys are set up correctly"
    echo "  - IP address is correct: ${RPI_HOST}"
    exit 1
fi
echo_success "Connected to RPi successfully"

# Step 1: Commit and push local changes
echo_info "Committing local changes..."
if [[ -n $(git status --porcelain) ]]; then
    git add .
    git commit -m "Pre-deployment commit $(date '+%Y-%m-%d %H:%M:%S')" || true
fi

echo_info "Pushing to GitHub..."
git push origin main

# Step 2: Copy database to stage (overwrite as requested)
echo_info "Backing up and copying database to stage..."
if [[ -f "${LOCAL_DB_PATH}" ]]; then
    echo_info "Copying local database to RPi..."
    scp "${LOCAL_DB_PATH}" "${RPI_USER}@${RPI_HOST}:/tmp/dev.db.new"
else
    echo_warning "Local database not found at ${LOCAL_DB_PATH}"
fi

# Step 3: Deploy to RPi
echo_info "Deploying to RPi..."
ssh "${RPI_USER}@${RPI_HOST}" << 'ENDSSH'
    set -e

    # Navigate to project directory
    cd /home/gabor/Projects/box-tracker

    # Create backup of current database
    if [[ -f "./data/dev.db" ]]; then
        cp "./data/dev.db" "./data/dev.db.backup-$(date +%Y%m%d-%H%M%S)"
        echo "✅ Created database backup"
    fi

    # Replace with new database if available
    if [[ -f "/tmp/dev.db.new" ]]; then
        mkdir -p ./data
        mv /tmp/dev.db.new ./data/dev.db
        echo "✅ Database updated from local"
    fi

    # Pull latest changes
    echo "📥 Pulling latest changes..."
    git fetch origin
    git reset --hard origin/main

    # Create necessary directories
    mkdir -p data public/uploads certs

    # Stop existing containers
    echo "🛑 Stopping existing containers..."
    docker compose -f docker-compose.stage.yml down || true

    # Build and start new containers
    echo "🏗️  Building and starting containers..."
    docker compose -f docker-compose.stage.yml up -d --build

    # Wait for container to be ready
    echo "⏳ Waiting for container to be ready..."
    sleep 10

    # Check if service is running
    if docker compose -f docker-compose.stage.yml ps | grep -q "Up"; then
        echo "✅ Container started successfully"
    else
        echo "❌ Container failed to start"
        docker compose -f docker-compose.stage.yml logs --tail=20
        exit 1
    fi
ENDSSH

# Step 4: Get RPi IP and show access URLs
RPI_LOCAL_IP=$(ssh "${RPI_USER}@${RPI_HOST}" "hostname -I | cut -d' ' -f1")

echo ""
echo_success "🍓 Stage deployment completed successfully!"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "   📱 HTTPS (with camera): https://${RPI_LOCAL_IP}:3443"
echo "   📱 HTTPS (localhost):   https://localhost:3443 (from RPi)"
echo "   🔧 HTTP (fallback):     http://${RPI_LOCAL_IP}:3001"
echo ""
echo_warning "📸 Camera functionality requires HTTPS URLs!"
echo_warning "⚠️  You may need to accept the self-signed certificate in your browser"
echo ""
echo_info "🔍 To check logs: ssh ${RPI_USER}@${RPI_HOST} 'cd /home/gabor/Projects/box-tracker && docker compose -f docker-compose.stage.yml logs -f'"
echo_info "🛑 To stop: ssh ${RPI_USER}@${RPI_HOST} 'cd /home/gabor/Projects/box-tracker && docker compose -f docker-compose.stage.yml down'"
