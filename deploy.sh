#!/bin/bash

# Deploy script for Box Tracker
set -e

echo "🚀 Starting deployment..."

# Build and tag the Docker image
echo "📦 Building Docker image..."
docker build -t box-tracker:latest .

# Tag for Docker Hub (replace with your username)
docker tag box-tracker:latest your-dockerhub-username/box-tracker:latest

# Push to Docker Hub
echo "📤 Pushing to Docker Hub..."
docker push your-dockerhub-username/box-tracker:latest

echo "✅ Deployment complete!"
echo "To deploy on RPi, run:"
echo "  git pull origin main"
echo "  docker-compose -f docker-compose.prod.yml pull"
echo "  docker-compose -f docker-compose.prod.yml up -d"