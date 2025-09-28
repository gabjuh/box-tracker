const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Function to convert German room names to IDs
function generateRoomId(name) {
  return name
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
}

// Hardcoded room data from the component
const roomsData = [
  {
    name: 'Wohnzimmer',
    center: { x: 830, y: 420 },
    path: [
      { x: 370, y: 400 },
      { x: 570, y: 400 },
      { x: 750, y: 400 },
      { x: 830, y: 420 }
    ]
  },
  {
    name: 'Schlafzimmer',
    center: { x: 890, y: 200 },
    path: [
      { x: 370, y: 400 },
      { x: 570, y: 400 },
      { x: 570, y: 325 },
      { x: 750, y: 325 },
      { x: 890, y: 200 }
    ]
  },
  {
    name: 'Küche',
    center: { x: 570, y: 470 },
    path: [
      { x: 370, y: 400 },
      { x: 500, y: 400 },
      { x: 500, y: 470 },
      { x: 570, y: 470 }
    ]
  },
  {
    name: 'Badezimmer',
    center: { x: 730, y: 150 },
    path: [
      { x: 370, y: 400 },
      { x: 570, y: 400 },
      { x: 570, y: 325 },
      { x: 650, y: 325 },
      { x: 650, y: 150 },
      { x: 730, y: 150 }
    ]
  },
  {
    name: 'Arbeitszimmer',
    center: { x: 570, y: 150 },
    path: [
      { x: 370, y: 400 },
      { x: 570, y: 400 },
      { x: 570, y: 325 },
      { x: 570, y: 200 },
      { x: 570, y: 150 }
    ]
  },
  {
    name: 'Abstellraum',
    center: { x: 500, y: 215 },
    path: [
      { x: 370, y: 400 },
      { x: 570, y: 400 },
      { x: 570, y: 325 },
      { x: 500, y: 325 },
      { x: 500, y: 215 }
    ]
  },
  {
    name: 'Balkon',
    center: { x: 1080, y: 410 },
    path: [
      { x: 370, y: 400 },
      { x: 570, y: 400 },
      { x: 750, y: 400 },
      { x: 950, y: 400 },
      { x: 1080, y: 410 }
    ]
  },
  {
    name: 'Kinderzimmer',
    center: { x: 250, y: 150 },
    path: [
      { x: 370, y: 400 },
      { x: 300, y: 400 },
      { x: 300, y: 250 },
      { x: 250, y: 250 },
      { x: 250, y: 150 }
    ]
  },
  {
    name: 'Garderobe',
    center: { x: 380, y: 270 },
    path: [
      { x: 370, y: 400 },
      { x: 380, y: 400 },
      { x: 380, y: 325 },
      { x: 380, y: 270 }
    ]
  },
  {
    name: 'WC',
    center: { x: 420, y: 150 },
    path: [
      { x: 370, y: 400 },
      { x: 380, y: 400 },
      { x: 380, y: 325 },
      { x: 380, y: 200 },
      { x: 420, y: 200 },
      { x: 420, y: 150 }
    ]
  },
  {
    name: 'Flur',
    center: { x: 570, y: 325 },
    path: [
      { x: 370, y: 400 },
      { x: 570, y: 400 },
      { x: 570, y: 325 }
    ]
  }
];

const entrancePoint = { x: 370, y: 400 };

async function migrateMapData() {
  try {
    console.log('🗺️  Starting map data migration...');

    // Clear existing map data
    await prisma.mapPathPoint.deleteMany();
    await prisma.mapRoom.deleteMany();
    await prisma.mapEntrance.deleteMany();

    // Insert entrance point
    console.log('📍 Creating entrance point...');
    await prisma.mapEntrance.create({
      data: {
        x: entrancePoint.x,
        y: entrancePoint.y,
        isActive: true
      }
    });

    // Insert rooms and their path points
    console.log('🏠 Creating rooms and paths...');
    for (const roomData of roomsData) {
      const roomId = generateRoomId(roomData.name);
      console.log(`  • ${roomData.name} (${roomId})`);

      // Create room
      const room = await prisma.mapRoom.create({
        data: {
          roomId,
          name: roomData.name,
          centerX: roomData.center.x,
          centerY: roomData.center.y
        }
      });

      // Create path points
      for (let i = 0; i < roomData.path.length; i++) {
        await prisma.mapPathPoint.create({
          data: {
            roomId,
            x: roomData.path[i].x,
            y: roomData.path[i].y,
            order: i
          }
        });
      }
    }

    console.log('✅ Map data migration completed successfully!');

    // Verify the migration
    const roomCount = await prisma.mapRoom.count();
    const pathPointCount = await prisma.mapPathPoint.count();
    const entranceCount = await prisma.mapEntrance.count();

    console.log(`📊 Migration summary:`);
    console.log(`   • ${roomCount} rooms created`);
    console.log(`   • ${pathPointCount} path points created`);
    console.log(`   • ${entranceCount} entrance points created`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateMapData();