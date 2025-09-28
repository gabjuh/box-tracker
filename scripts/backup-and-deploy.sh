#!/bin/bash

# Backup and Deploy Script
# This script creates a backup of the current database and deploys to stage with database sync

set -e

echo "💾 Starting backup and deployment process..."

# Configuration
BACKUP_DIR="./backups"
DB_PATH="./prisma/dev.db"
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/dev.db.backup-${TIMESTAMP}"

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

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Step 1: Create local database backup
echo_info "Creating database backup..."
if [[ -f "${DB_PATH}" ]]; then
    cp "${DB_PATH}" "${BACKUP_FILE}"
    echo_success "Database backed up to: ${BACKUP_FILE}"

    # Compress backup to save space
    gzip "${BACKUP_FILE}"
    echo_success "Backup compressed: ${BACKUP_FILE}.gz"

    # Keep only last 10 backups
    echo_info "Cleaning up old backups (keeping last 10)..."
    ls -t "${BACKUP_DIR}"/dev.db.backup-*.gz | tail -n +11 | xargs -r rm

    # Show backup info
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo_info "Backup size: ${BACKUP_SIZE}"
else
    echo_warning "Database file not found at ${DB_PATH}"
    echo_warning "Proceeding with deployment without backup..."
fi

# Step 2: Show current database stats
if [[ -f "${DB_PATH}" ]]; then
    echo_info "Current database statistics:"

    # Use sqlite3 if available, otherwise skip stats
    if command -v sqlite3 &> /dev/null; then
        BOX_COUNT=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM Box;" 2>/dev/null || echo "N/A")
        echo "   📦 Total boxes: ${BOX_COUNT}"

        RECENT_BOXES=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM Box WHERE datetime(createdAt) > datetime('now', '-7 days');" 2>/dev/null || echo "N/A")
        echo "   📅 Boxes added in last 7 days: ${RECENT_BOXES}"

        DB_SIZE=$(du -h "${DB_PATH}" | cut -f1)
        echo "   💾 Database size: ${DB_SIZE}"
    else
        echo_warning "sqlite3 not available, skipping database statistics"
    fi
fi

# Step 3: Verify stage deployment script exists
if [[ ! -f "./scripts/deploy-stage.sh" ]]; then
    echo_error "Stage deployment script not found: ./scripts/deploy-stage.sh"
    exit 1
fi

# Step 4: Run stage deployment
echo_info "Starting stage deployment..."
echo ""

# Execute stage deployment
if bash ./scripts/deploy-stage.sh; then
    echo ""
    echo_success "🎉 Backup and stage deployment completed successfully!"
    echo ""
    echo_info "📊 Deployment Summary:"
    echo "   💾 Backup created: ${BACKUP_FILE}.gz"
    echo "   📅 Timestamp: ${TIMESTAMP}"
    echo "   🍓 Stage deployment: Success"
    echo ""
    echo_info "🔄 To restore from backup if needed:"
    echo "   gunzip ${BACKUP_FILE}.gz"
    echo "   cp ${BACKUP_FILE} ${DB_PATH}"
else
    echo_error "Stage deployment failed!"
    echo ""
    echo_info "🔄 To restore from backup:"
    echo "   gunzip ${BACKUP_FILE}.gz"
    echo "   cp ${BACKUP_FILE} ${DB_PATH}"
    exit 1
fi

# Step 5: Verify deployment health
echo_info "Verifying deployment health..."
sleep 5

# You can add health check logic here if needed
# For example, curl to check if the stage server responds

echo_success "✅ Backup and deployment process completed!"
echo ""
echo_warning "📋 Next steps:"
echo "   1. Test the stage deployment thoroughly"
echo "   2. If everything works, run 'npm run deploy:prod' for production"
echo "   3. Backup files are stored in: ${BACKUP_DIR}/"
echo ""
echo_info "🗂️  Available backups:"
ls -lah "${BACKUP_DIR}"/dev.db.backup-*.gz 2>/dev/null | tail -5 || echo "No backups found"