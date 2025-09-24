#!/bin/bash

# Database migration script
# Migrates data from old database structure to new structure

set -e  # Exit on any error

CURRENT_DB="prisma/dev.db"
OLD_DB="prisma/db-old-with-current-content/dev.db"
BACKUP_DB="prisma/dev.db.backup.$(date +%s)"
TEMP_SQL="/tmp/migration.sql"

echo "🚀 Starting data migration..."

# 1. Create backup of current database (if exists)
if [ -f "$CURRENT_DB" ]; then
    echo "📦 Creating backup: $BACKUP_DB"
    cp "$CURRENT_DB" "$BACKUP_DB"
else
    echo "📦 No current database found, will create new one"
    mkdir -p "$(dirname "$CURRENT_DB")"
    # Create an empty database with proper schema
    touch "$CURRENT_DB"
fi

# 2. Check if old database exists
if [ ! -f "$OLD_DB" ]; then
    echo "❌ Old database not found at: $OLD_DB"
    echo "Please make sure the old database is located at: prisma/db-old-with-current-content/dev.db"
    exit 1
fi

# 3. Check record counts
echo "📊 Checking record counts..."
CURRENT_COUNT=$(sqlite3 "$CURRENT_DB" "SELECT COUNT(*) FROM Box;" 2>/dev/null || echo "0")
OLD_COUNT=$(sqlite3 "$OLD_DB" "SELECT COUNT(*) FROM Box;" 2>/dev/null || echo "0")
echo "Current database: $CURRENT_COUNT records"
echo "Old database: $OLD_COUNT records"

# 4. Export data from old database and transform it
echo "📤 Exporting data from old database..."
sqlite3 "$OLD_DB" <<EOF > "$TEMP_SQL"
.mode insert Box
SELECT id, boxNumber, images, items, keywords, 0 as mainImageIndex, createdAt, updatedAt FROM Box ORDER BY id;
EOF

# 5. Clear current database (keeping schema) and ensure schema exists
echo "🗑️  Preparing current database..."
sqlite3 "$CURRENT_DB" <<EOF
DELETE FROM Box WHERE 1=1;
DELETE FROM sqlite_sequence WHERE name = 'Box';
EOF

# 6. Import data into current database
echo "📥 Importing data into current database..."
sqlite3 "$CURRENT_DB" < "$TEMP_SQL"

# 7. Update sequence to maintain ID continuity
echo "🔢 Updating ID sequence..."
MAX_ID=$(sqlite3 "$OLD_DB" "SELECT MAX(id) FROM Box;")
sqlite3 "$CURRENT_DB" "INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('Box', $MAX_ID);"

# 8. Verify migration
echo "✅ Verifying migration..."
NEW_COUNT=$(sqlite3 "$CURRENT_DB" "SELECT COUNT(*) FROM Box;")
echo "New database: $NEW_COUNT records"

if [ "$NEW_COUNT" -eq "$OLD_COUNT" ]; then
    echo "✅ Migration successful! All $OLD_COUNT records migrated."
    echo "💾 Backup saved at: $BACKUP_DB"
    rm -f "$TEMP_SQL"
else
    echo "❌ Migration failed: Expected $OLD_COUNT records, got $NEW_COUNT"
    echo "🔄 Restoring from backup..."
    cp "$BACKUP_DB" "$CURRENT_DB"
    rm -f "$TEMP_SQL"
    exit 1
fi

echo "🎉 Migration completed successfully!"