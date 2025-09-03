#!/bin/bash

# Box Tracker Data Sync to Web Server
# Configuration

# Load environment variables from .env file
if [ -f .env.sync ]; then
    set -a
    source .env.sync
    set +a
else
    echo ".env.sync file not found. Please create one with the required variables." >&2
    exit 1
fi

# Timestamp for logging
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting Box Tracker data sync to web server..."

# Create remote backup directory if it doesn't exist
echo "Creating remote directory structure..."
ssh "${WEBSERVER_USER}@${WEBSERVER_HOST}" "mkdir -p ${WEBSERVER_DEST_DIR}/data ${WEBSERVER_DEST_DIR}/uploads"

if [ $? -ne 0 ]; then
    echo "Failed to create remote directories" >&2
    exit 1
fi

# Sync SQLite database
echo "Syncing database..."
rsync -avz --progress "${LOCAL_DB_PATH}" "${WEBSERVER_USER}@${WEBSERVER_HOST}:${WEBSERVER_DEST_DIR}/data/"
DB_STATUS=$?

# Sync uploaded files
echo "Syncing uploaded images..."
rsync -avz --progress --delete "${LOCAL_UPLOADS_PATH}/" "${WEBSERVER_USER}@${WEBSERVER_HOST}:${WEBSERVER_DEST_DIR}/uploads/"
UPLOADS_STATUS=$?

# Optional: Sync the entire project (useful for updates)
# if [ "${SYNC_PROJECT}" = "true" ]; then
#     echo "Syncing project files..."
#     rsync -avz --progress --exclude 'node_modules' --exclude '.git' --exclude 'data' --exclude 'public/uploads' \
#         "${LOCAL_PROJECT_PATH}/" "${WEBSERVER_USER}@${WEBSERVER_HOST}:${WEBSERVER_DEST_DIR}/"
#     PROJECT_STATUS=$?
# else
#     PROJECT_STATUS=0
# fi

# Check results and report
if [ $DB_STATUS -eq 0 ] && [ $UPLOADS_STATUS -eq 0 ] && [ $PROJECT_STATUS -eq 0 ]; then
    echo "[$TIMESTAMP] ✅ Sync completed successfully to ${WEBSERVER_HOST}"
    
    # Optional: Restart the service on web server
    if [ "${RESTART_SERVICE}" = "true" ]; then
        echo "Restarting Box Tracker service on web server..."
        ssh "${WEBSERVER_USER}@${WEBSERVER_HOST}" "cd ${WEBSERVER_DEST_DIR} && docker compose restart"
        if [ $? -eq 0 ]; then
            echo "✅ Service restarted successfully"
        else
            echo "⚠️  Service restart failed"
        fi
    fi
    
else
    echo "[$TIMESTAMP] ❌ Sync failed!" >&2
    [ $DB_STATUS -ne 0 ] && echo "  - Database sync failed"
    [ $UPLOADS_STATUS -ne 0 ] && echo "  - Uploads sync failed" 
    [ $PROJECT_STATUS -ne 0 ] && echo "  - Project sync failed"
    exit 1
fi

echo "[$TIMESTAMP] Sync operation completed."