#!/bin/bash

# Database migration script
# Migrates data from old database structure to new structure

set -e  # Exit on any error

CURRENT_DB="prisma/dev.db"
OLD_DB="prisma/db-old-with-current-content/dev.db"
BACKUP_DB="prisma/dev.db.backup.$(date +%s)"
TEMP_SQL="/tmp/migration.sql"

echo "🚀 Starting data migration..."

# 1. Create backup of current database
echo "📦 Creating backup: $BACKUP_DB"
cp "$CURRENT_DB" "$BACKUP_DB"

# 2. Check record counts
echo "📊 Checking record counts..."
CURRENT_COUNT=$(sqlite3 "$CURRENT_DB" "SELECT COUNT(*) FROM Box;")
OLD_COUNT=$(sqlite3 "$OLD_DB" "SELECT COUNT(*) FROM Box;")
echo "Current database: $CURRENT_COUNT records"
echo "Old database: $OLD_COUNT records"

# 3. Export data from old database and transform it
echo "📤 Exporting data from old database..."
sqlite3 "$OLD_DB" <<EOF > "$TEMP_SQL"
.mode insert Box
SELECT id, boxNumber, images, items, keywords, 0 as mainImageIndex, createdAt, updatedAt FROM Box ORDER BY id;
EOF

# 4. Clear current database (keeping schema)
echo "🗑️  Clearing current data..."
sqlite3 "$CURRENT_DB" <<EOF
DELETE FROM Box;
DELETE FROM sqlite_sequence WHERE name = 'Box';
EOF

# 5. Import data into current database
echo "📥 Importing data into current database..."
sqlite3 "$CURRENT_DB" < "$TEMP_SQL"

# 6. Update sequence to maintain ID continuity
echo "🔢 Updating ID sequence..."
MAX_ID=$(sqlite3 "$OLD_DB" "SELECT MAX(id) FROM Box;")
sqlite3 "$CURRENT_DB" "INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('Box', $MAX_ID);"

# 7. Verify migration
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