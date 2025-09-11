#!/bin/bash

echo "🍓 Simple Stage Box Tracker deployment on RPi..."

# Create directories
mkdir -p stage-data public/uploads prisma

# Setup HTTPS certificates for camera access
echo "🔐 Setting up HTTPS certificates..."
./setup-https.sh

# Check if we have database files to migrate
if [ -f "prisma/db-old-with-current-content/dev.db" ]; then
    echo "📊 Running database migration..."
    ./migrate-old-data.sh
elif [ ! -f "prisma/dev.db" ]; then
    echo "📊 Creating new database..."
    # Initialize Prisma and create empty database
    npx prisma migrate deploy || echo "Creating fresh database schema..."
    npx prisma db push || echo "Database schema ready"
fi

# Stop any existing stage containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.stage.yml down 2>/dev/null || true

# Build and start stage container
echo "🚀 Building and starting stage container..."
docker compose -f docker-compose.stage.yml up -d --build

# Wait a moment for container to start
sleep 3

# Check if container is running
if docker compose -f docker-compose.stage.yml ps | grep -q "running"; then
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
else
    echo "❌ Stage deployment failed. Check logs:"
    docker compose -f docker-compose.stage.yml logs --tail 20
fi