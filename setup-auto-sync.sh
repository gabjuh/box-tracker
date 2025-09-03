#!/bin/bash

# Setup automatic syncing with cron
# This script sets up a cron job to automatically sync data

echo "Setting up automatic Box Tracker sync..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNC_SCRIPT="$SCRIPT_DIR/backup-sync-to-webserver.sh"

# Make sure sync script is executable
chmod +x "$SYNC_SCRIPT"

# Create log directory
mkdir -p "$SCRIPT_DIR/logs"

# Create wrapper script for cron (cron needs full paths)
cat > "$SCRIPT_DIR/cron-sync.sh" << EOF
#!/bin/bash
cd "$SCRIPT_DIR"
./backup-sync-to-webserver.sh >> "$SCRIPT_DIR/logs/sync.log" 2>&1
EOF

chmod +x "$SCRIPT_DIR/cron-sync.sh"

echo "Choose sync frequency:"
echo "1) Every hour"
echo "2) Every 6 hours"
echo "3) Daily at 2 AM"
echo "4) Custom"
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        CRON_SCHEDULE="0 * * * *"
        DESCRIPTION="every hour"
        ;;
    2)
        CRON_SCHEDULE="0 */6 * * *"
        DESCRIPTION="every 6 hours"
        ;;
    3)
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="daily at 2 AM"
        ;;
    4)
        read -p "Enter custom cron schedule (e.g., '0 */4 * * *'): " CRON_SCHEDULE
        DESCRIPTION="custom schedule"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Add to crontab
(crontab -l 2>/dev/null; echo "$CRON_SCHEDULE $SCRIPT_DIR/cron-sync.sh") | crontab -

echo "✅ Automatic sync set up successfully!"
echo "📅 Will sync $DESCRIPTION"
echo "📝 Logs will be saved to: $SCRIPT_DIR/logs/sync.log"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To remove auto-sync: crontab -e (then delete the line)"
echo "To test sync now: ./backup-sync-to-webserver.sh"