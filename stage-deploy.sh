#!/bin/bash

echo "🍓 Stage Box Tracker deployment on RPi..."

# Change to the stage project directory
cd /home/gabor/Projects/box-tracker-stage

# Pull latest changes from stage branch
git fetch origin
git checkout stage-deployment
git pull origin stage-deployment

# Create directories
mkdir -p stage-data public/uploads

# Setup HTTPS certificates for camera access
echo "🔐 Setting up HTTPS certificates..."
./setup-https.sh

# Run database migration if needed
echo "📊 Running database migration..."
./migrate-old-data.sh

# Stop any existing stage containers
docker compose -f docker-compose.stage.yml down

# Build and start stage container
docker compose -f docker-compose.stage.yml up -d --build

LOCAL_IP=$(hostname -I | cut -d' ' -f1)

echo ""
echo "✅ Stage Box Tracker deployed successfully!"
echo ""
echo "🌐 Access URLs:"
echo "   📱 HTTPS (with camera): https://localhost:3443"
echo "   📱 HTTPS (from network): https://${LOCAL_IP}:3443"
echo "   🔧 HTTP (fallback):     http://localhost:3001"
echo ""
echo "📸 Camera will work on HTTPS URLs!"
echo "⚠️  You may need to accept the self-signed certificate in your browser"
echo ""
echo "🔧 Production version still running at http://localhost:3000"