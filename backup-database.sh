#!/bin/bash

# Configuration
# Load environment variables from .env file
if [ -f .env ]; then
  set -a
  source .env
  set +a
else
  echo ".env file not found. Please create one with the required variables." >&2
  exit 1
fi

# Create remote backup directory if it doesn't exist
ssh "${RPI_USER}@${RPI_HOST}" "mkdir -p ${RPI_DEST_DIR}"

# Copy SQLite database
rsync -avz "${LOCAL_DB_PATH}" "${RPI_USER}@${RPI_HOST}:${RPI_DEST_DIR}/"
DB_STATUS=$?

# Copy uploaded files
rsync -avz "${LOCAL_UPLOADS_PATH}/" "${RPI_USER}@${RPI_HOST}:${RPI_DEST_DIR}/uploads/"
UPLOADS_STATUS=$?

if [ $DB_STATUS -eq 0 ] && [ $UPLOADS_STATUS -eq 0 ]; then
  echo "Backup completed successfully."
else
  echo "Backup failed." >&2
  exit 1
fi