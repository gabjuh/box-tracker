#!/bin/bash

# RPi deployment script
set -e

echo "🍓 Deploying Box Tracker on Raspberry Pi..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Create necessary directories
mkdir -p data uploads

# Pull latest Docker image
echo "📦 Pulling latest Docker image..."
docker-compose -f docker-compose.prod.yml pull

# Stop existing container
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Start new containers
echo "🚀 Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for health check
echo "⏳ Waiting for application to be healthy..."
sleep 30

# Check if service is running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Deployment successful!"
    echo "📱 Box Tracker is running at http://$(hostname -I | cut -d' ' -f1):3000"
else
    echo "❌ Deployment failed!"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi