#!/bin/bash

# Simple sync script to copy project to Raspberry Pi

RPI_HOST="${RPI_HOST:-gabor@192.168.178.31}"
RPI_PATH="/home/gabor/Projects/box-tracker-stage"

echo "📦 Syncing project to Pi..."

# Create directory on Pi if it doesn't exist
ssh $RPI_HOST "mkdir -p $RPI_PATH"

# Sync project files
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'prisma/dev.db*' \
  --exclude 'uploads' \
  --exclude 'public/uploads_backup' \
  --exclude 'temp' \
  --exclude '*.log' \
  "$(pwd)/" "$RPI_HOST:$RPI_PATH/"

echo "✅ Sync complete!"
echo "🐳 To start with Docker: ssh $RPI_HOST 'cd $RPI_PATH && docker compose up -d'"
