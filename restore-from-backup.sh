#!/bin/bash

# Box Tracker Restore Script
# Restores data from a backup ZIP file

# Load environment variables
if [ -f .env.backup ]; then
    set -a
    source .env.backup
    set +a
fi

echo "🔄 Box Tracker Restore Utility"
echo "================================"

# Function to list available backups
list_backups() {
    echo "Available local backups:"
    if [ -d "./backups" ]; then
        ls -la ./backups/box-tracker-backup_*.zip 2>/dev/null | awk '{print NR". "$9" ("$5" bytes, "$6" "$7" "$8")"}'
    else
        echo "No local backups found"
    fi
    
    echo ""
    echo "Available remote backups:"
    if [ -n "$WEBSERVER_USER" ] && [ -n "$WEBSERVER_HOST" ]; then
        ssh "$WEBSERVER_USER@$WEBSERVER_HOST" "ls -la $WEBSERVER_BACKUP_DIR/box-tracker-backup_*.zip 2>/dev/null" | awk '{print NR". "$9" ("$5" bytes, "$6" "$7" "$8")"}'
    else
        echo "Remote server not configured"
    fi
}

# Function to restore from backup
restore_backup() {
    local backup_file="$1"
    local temp_dir="/tmp/box-tracker-restore-$$"
    
    echo "🗂️  Restoring from: $backup_file"
    
    # Create temporary directory
    mkdir -p "$temp_dir"
    
    # Extract backup
    echo "📦 Extracting backup..."
    cd "$temp_dir"
    unzip -q "$backup_file"
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to extract backup"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Show backup info
    if [ -f "backup-info.txt" ]; then
        echo "📄 Backup Information:"
        cat backup-info.txt
        echo ""
    fi
    
    # Confirm restore
    read -p "⚠️  This will overwrite current data. Continue? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "❌ Restore cancelled"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Stop Docker container if running
    echo "🛑 Stopping Box Tracker container..."
    docker compose down 2>/dev/null || true
    
    # Backup current data (just in case)
    if [ -f "./data/dev.db" ] || [ -d "./public/uploads" ]; then
        local safety_backup="./backups/pre-restore-backup_$(date +%Y%m%d_%H%M%S).zip"
        mkdir -p ./backups
        echo "💾 Creating safety backup: $safety_backup"
        zip -r "$safety_backup" ./data ./public/uploads 2>/dev/null || true
    fi
    
    # Restore database
    if [ -d "$temp_dir/data" ] && [ "$(ls -A $temp_dir/data)" ]; then
        echo "💾 Restoring database..."
        mkdir -p ./data
        cp -r "$temp_dir/data"/* ./data/
    fi
    
    # Restore uploads
    if [ -d "$temp_dir/uploads" ] && [ "$(ls -A $temp_dir/uploads)" ]; then
        echo "🖼️  Restoring images..."
        mkdir -p ./public/uploads
        cp -r "$temp_dir/uploads"/* ./public/uploads/
    fi
    
    # Clean up
    rm -rf "$temp_dir"
    
    # Restart container
    echo "🚀 Starting Box Tracker container..."
    docker compose up -d
    
    echo "✅ Restore completed successfully!"
    echo "🌐 Box Tracker should be available at http://localhost:3000"
}

# Main menu
case "$1" in
    "list"|"l")
        list_backups
        ;;
    "local"|"")
        # Interactive local restore
        echo "Local backups:"
        if [ ! -d "./backups" ]; then
            echo "❌ No local backup directory found"
            exit 1
        fi
        
        backups=(./backups/box-tracker-backup_*.zip)
        if [ ! -e "${backups[0]}" ]; then
            echo "❌ No backup files found"
            exit 1
        fi
        
        echo "Select backup to restore:"
        select backup in "${backups[@]}"; do
            if [ -n "$backup" ]; then
                restore_backup "$backup"
                break
            fi
        done
        ;;
    "remote"|"r")
        # Download and restore from remote
        if [ -z "$WEBSERVER_USER" ] || [ -z "$WEBSERVER_HOST" ]; then
            echo "❌ Remote server not configured in .env.backup"
            exit 1
        fi
        
        echo "📥 Fetching remote backup list..."
        remote_backups=$(ssh "$WEBSERVER_USER@$WEBSERVER_HOST" "ls $WEBSERVER_BACKUP_DIR/box-tracker-backup_*.zip 2>/dev/null")
        
        if [ -z "$remote_backups" ]; then
            echo "❌ No remote backups found"
            exit 1
        fi
        
        echo "Available remote backups:"
        echo "$remote_backups" | nl
        
        read -p "Enter backup number to download and restore: " choice
        selected_backup=$(echo "$remote_backups" | sed -n "${choice}p")
        
        if [ -n "$selected_backup" ]; then
            local_copy="./backups/$(basename "$selected_backup")"
            mkdir -p ./backups
            
            echo "📥 Downloading backup..."
            scp "$WEBSERVER_USER@$WEBSERVER_HOST:$selected_backup" "$local_copy"
            
            if [ $? -eq 0 ]; then
                restore_backup "$local_copy"
            else
                echo "❌ Failed to download backup"
            fi
        fi
        ;;
    *)
        echo "Usage: $0 [list|local|remote]"
        echo "  list   - List available backups"
        echo "  local  - Restore from local backup (default)"
        echo "  remote - Download and restore from remote backup"
        ;;
esac