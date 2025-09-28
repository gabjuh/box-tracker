import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET specific room
export async function GET(request, { params }) {
  try {
    const { roomId } = params;

    const room = await prisma.mapRoom.findUnique({
      where: { roomId },
      include: {
        pathPoints: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Transform response
    const transformedRoom = {
      id: room.roomId,
      name: room.name,
      center: { x: room.centerX, y: room.centerY },
      path: room.pathPoints.map(point => ({ x: point.x, y: point.y }))
    };

    return NextResponse.json(transformedRoom);
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
  }
}

// PUT update room and its path
export async function PUT(request, { params }) {
  try {
    const { roomId } = params;
    const { name, centerX, centerY, pathPoints } = await request.json();

    if (!name || centerX === undefined || centerY === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update room and path points in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Check if room exists
      const existingRoom = await prisma.mapRoom.findUnique({
        where: { roomId }
      });

      if (!existingRoom) {
        throw new Error('Room not found');
      }

      // Update room
      const room = await prisma.mapRoom.update({
        where: { roomId },
        data: {
          name,
          centerX: parseFloat(centerX),
          centerY: parseFloat(centerY)
        }
      });

      // Delete existing path points
      await prisma.mapPathPoint.deleteMany({
        where: { roomId }
      });

      // Create new path points if provided
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

      // Fetch the updated room with path points
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

    return NextResponse.json(transformedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    if (error.message === 'Room not found') {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

// DELETE room
export async function DELETE(request, { params }) {
  try {
    const { roomId } = params;

    // Check if room exists
    const existingRoom = await prisma.mapRoom.findUnique({
      where: { roomId }
    });

    if (!existingRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Delete room (path points will be deleted automatically due to cascade)
    await prisma.mapRoom.delete({
      where: { roomId }
    });

    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}