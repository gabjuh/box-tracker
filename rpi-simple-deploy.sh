#!/bin/bash

echo "🍓 Simple Box Tracker deployment on RPi..."

# Pull latest code
git pull origin main

# Create directories
mkdir -p data public/uploads

# Stop any existing containers
docker compose -f docker-compose.simple.yml down

# Build and start
docker compose -f docker-compose.simple.yml up -d --build

echo "✅ Box Tracker should be running at http://localhost:3000"
echo "📱 Or access from other devices at http://$(hostname -I | cut -d' ' -f1):3000"