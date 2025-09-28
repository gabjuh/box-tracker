const { PrismaClient } = require('@prisma/client');
const path = require('path');
const Database = require('better-sqlite3');

const prisma = new PrismaClient();

async function migrateData() {
  console.log('Starting migration from old database...');

  // Open old database
  const oldDbPath = path.join(__dirname, '..', 'prisma', 'db-old-with-current-content', 'dev.db');
  const oldDb = new Database(oldDbPath, { readonly: true });

  try {
    // Get all boxes from old database
    const oldBoxes = oldDb.prepare('SELECT * FROM Box ORDER BY CAST(boxNumber AS INTEGER)').all();
    console.log(`Found ${oldBoxes.length} boxes in old database`);

    // Get all current boxes
    const currentBoxes = await prisma.box.findMany();
    console.log(`Found ${currentBoxes.length} boxes in current database`);

    const currentBoxNumbers = new Set(currentBoxes.map(box => box.boxNumber));

    let updatedCount = 0;
    let addedCount = 0;

    for (const oldBox of oldBoxes) {
      if (currentBoxNumbers.has(oldBox.boxNumber)) {
        // Update existing box with data from old database
        await prisma.box.update({
          where: { boxNumber: oldBox.boxNumber },
          data: {
            images: oldBox.images,
            items: oldBox.items,
            keywords: oldBox.keywords,
            mainImageIndex: oldBox.mainImageIndex || 0,
            // Keep existing zielraum if it exists, otherwise set to null
          }
        });
        updatedCount++;
        console.log(`Updated box ${oldBox.boxNumber}`);
      } else {
        // Add new box from old database
        await prisma.box.create({
          data: {
            boxNumber: oldBox.boxNumber,
            images: oldBox.images,
            items: oldBox.items,
            keywords: oldBox.keywords,
            mainImageIndex: oldBox.mainImageIndex || 0,
            zielraum: null, // New field, set to null for migrated boxes
            createdAt: new Date(oldBox.createdAt),
            updatedAt: new Date(oldBox.updatedAt)
          }
        });
        addedCount++;
        console.log(`Added new box ${oldBox.boxNumber}`);
      }
    }

    console.log(`\nMigration completed successfully!`);
    console.log(`- Updated ${updatedCount} existing boxes`);
    console.log(`- Added ${addedCount} new boxes`);
    console.log(`- Total boxes in database: ${oldBoxes.length}`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    oldDb.close();
    await prisma.$disconnect();
  }
}

// Run migration
migrateData()
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });