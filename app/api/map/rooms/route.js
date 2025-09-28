import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

// GET all rooms with their path points
export async function GET() {
  try {
    const rooms = await prisma.mapRoom.findMany({
      include: {
        pathPoints: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform to match frontend interface
    const transformedRooms = rooms.map(room => ({
      id: room.roomId,
      name: room.name,
      center: { x: room.centerX, y: room.centerY },
      path: room.pathPoints.map(point => ({ x: point.x, y: point.y }))
    }));

    return NextResponse.json(transformedRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

// POST create new room
export async function POST(request) {
  try {
    const { name, centerX, centerY, pathPoints } = await request.json();

    if (!name || centerX === undefined || centerY === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const roomId = generateRoomId(name);

    // Check if room with this ID already exists
    const existingRoom = await prisma.mapRoom.findUnique({
      where: { roomId }
    });

    if (existingRoom) {
      return NextResponse.json({ error: 'Room with this name already exists' }, { status: 409 });
    }

    // Create room with path points in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create the room
      const room = await prisma.mapRoom.create({
        data: {
          roomId,
          name,
          centerX: parseFloat(centerX),
          centerY: parseFloat(centerY)
        }
      });

      // Create path points if provided
      if (pathPoints && Array.isArray(pathPoints) && pathPoints.length > 0) {
        const pathPointsData = pathPoints.map((point, index) => ({
          roomId,
          x: parseFloat(point.x),
          y: parseFloat(point.y),
          order: index
        }));

        await prisma.mapPathPoint.createMany({
          data: pathPointsData
        });
      }

      // Fetch the complete room with path points
      return await prisma.mapRoom.findUnique({
        where: { roomId },
        include: {
          pathPoints: {
            orderBy: {
              order: 'asc'
            }
          }
        }
      });
    });

    // Transform response
    const transformedRoom = {
      id: result.roomId,
      name: result.name,
      center: { x: result.centerX, y: result.centerY },
      path: result.pathPoints.map(point => ({ x: point.x, y: point.y }))
    };

    return NextResponse.json(transformedRoom, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}