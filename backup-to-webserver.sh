#!/bin/bash

# Box Tracker Backup to Web Server
# Creates timestamped ZIP backups and uploads them safely

# Load environment variables from .env file
if [ -f .env.backup ]; then
    set -a
    source .env.backup
    set +a
else
    echo ".env.backup file not found. Please create one with the required variables." >&2
    exit 1
fi

# Create timestamp for backup filename
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_NAME="box-tracker-backup_${TIMESTAMP}.zip"
TEMP_DIR="/tmp/box-tracker-backup-$$"

echo "🗜️  Creating Box Tracker backup: $BACKUP_NAME"

# Create temporary directory
mkdir -p "$TEMP_DIR"

# Create backup directory structure
mkdir -p "$TEMP_DIR/data"
mkdir -p "$TEMP_DIR/uploads"

# Copy database if it exists
if [ -f "$LOCAL_DB_PATH" ]; then
    echo "📁 Copying database..."
    cp "$LOCAL_DB_PATH" "$TEMP_DIR/data/"
    if [ $? -ne 0 ]; then
        echo "❌ Failed to copy database" >&2
        rm -rf "$TEMP_DIR"
        exit 1
    fi
else
    echo "⚠️  Warning: Database not found at $LOCAL_DB_PATH"
fi

# Copy uploads if directory exists
if [ -d "$LOCAL_UPLOADS_PATH" ]; then
    echo "🖼️  Copying uploaded images..."
    cp -r "$LOCAL_UPLOADS_PATH"/* "$TEMP_DIR/uploads/" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "ℹ️  No images found in uploads directory"
    fi
else
    echo "⚠️  Warning: Uploads directory not found at $LOCAL_UPLOADS_PATH"
fi

# Create info file with backup details
cat > "$TEMP_DIR/backup-info.txt" << EOF
Box Tracker Backup
==================
Backup Date: $(date)
Hostname: $(hostname)
Database: $LOCAL_DB_PATH
Uploads: $LOCAL_UPLOADS_PATH
Box Tracker Version: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

Contents:
- data/: SQLite database files
- uploads/: User uploaded images
- backup-info.txt: This information file
EOF

# Count files for verification
DB_COUNT=$(find "$TEMP_DIR/data" -type f | wc -l)
IMG_COUNT=$(find "$TEMP_DIR/uploads" -type f | wc -l)

echo "📊 Backup contents: $DB_COUNT database files, $IMG_COUNT images"

# Create ZIP archive
echo "🗜️  Creating ZIP archive..."
cd "$TEMP_DIR"
zip -r "../$BACKUP_NAME" . > /dev/null

if [ $? -ne 0 ]; then
    echo "❌ Failed to create ZIP archive" >&2
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Move ZIP to local backups directory
LOCAL_BACKUP_DIR="${LOCAL_BACKUP_DIR:-./backups}"
mkdir -p "$LOCAL_BACKUP_DIR"
mv "../$BACKUP_NAME" "$LOCAL_BACKUP_DIR/"

# Get backup size for reporting
BACKUP_SIZE=$(du -h "$LOCAL_BACKUP_DIR/$BACKUP_NAME" | cut -f1)
echo "✅ Local backup created: $BACKUP_SIZE"

# Upload to web server
echo "📤 Uploading backup to web server..."

# Create remote backup directory
ssh "$WEBSERVER_USER@$WEBSERVER_HOST" "mkdir -p $WEBSERVER_BACKUP_DIR"

if [ $? -ne 0 ]; then
    echo "❌ Failed to create remote backup directory" >&2
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Upload the backup
scp "$LOCAL_BACKUP_DIR/$BACKUP_NAME" "$WEBSERVER_USER@$WEBSERVER_HOST:$WEBSERVER_BACKUP_DIR/"
UPLOAD_STATUS=$?

# Clean up temporary directory
rm -rf "$TEMP_DIR"

if [ $UPLOAD_STATUS -eq 0 ]; then
    echo "✅ Backup uploaded successfully to $WEBSERVER_HOST:$WEBSERVER_BACKUP_DIR/"
    
    # Optional: Clean up old local backups
    if [ "$KEEP_LOCAL_BACKUPS" = "false" ]; then
        echo "🧹 Removing local backup (KEEP_LOCAL_BACKUPS=false)"
        rm "$LOCAL_BACKUP_DIR/$BACKUP_NAME"
    fi
    
    # Optional: Clean up old remote backups
    if [ -n "$KEEP_REMOTE_BACKUPS" ] && [ "$KEEP_REMOTE_BACKUPS" -gt 0 ]; then
        echo "🧹 Cleaning up old remote backups (keeping $KEEP_REMOTE_BACKUPS newest)"
        ssh "$WEBSERVER_USER@$WEBSERVER_HOST" "
            cd $WEBSERVER_BACKUP_DIR && 
            ls -t box-tracker-backup_*.zip | tail -n +$((KEEP_REMOTE_BACKUPS + 1)) | xargs rm -f
        "
    fi
    
    echo "🎉 Backup completed successfully!"
    echo "📁 Local: $LOCAL_BACKUP_DIR/$BACKUP_NAME"
    echo "☁️  Remote: $WEBSERVER_HOST:$WEBSERVER_BACKUP_DIR/$BACKUP_NAME"
    
else
    echo "❌ Failed to upload backup to web server" >&2
    exit 1
fi