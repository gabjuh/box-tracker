import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET path points for a specific room
export async function GET(request, { params }) {
  try {
    const { roomId } = params;

    const pathPoints = await prisma.mapPathPoint.findMany({
      where: { roomId },
      orderBy: { order: 'asc' }
    });

    const transformedPath = pathPoints.map(point => ({
      x: point.x,
      y: point.y,
      order: point.order
    }));

    return NextResponse.json(transformedPath);
  } catch (error) {
    console.error('Error fetching path points:', error);
    return NextResponse.json({ error: 'Failed to fetch path points' }, { status: 500 });
  }
}

// POST update entire path for a room
export async function POST(request, { params }) {
  try {
    const { roomId } = params;
    const { pathPoints } = await request.json();

    if (!pathPoints || !Array.isArray(pathPoints)) {
      return NextResponse.json({ error: 'Invalid path points data' }, { status: 400 });
    }

    // Check if room exists
    const room = await prisma.mapRoom.findUnique({
      where: { roomId }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Update path points in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Delete existing path points
      await prisma.mapPathPoint.deleteMany({
        where: { roomId }
      });

      // Create new path points
      if (pathPoints.length > 0) {
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

      // Return updated path points
      return await prisma.mapPathPoint.findMany({
        where: { roomId },
        orderBy: { order: 'asc' }
      });
    });

    const transformedPath = result.map(point => ({
      x: point.x,
      y: point.y,
      order: point.order
    }));

    return NextResponse.json(transformedPath);
  } catch (error) {
    console.error('Error updating path points:', error);
    return NextResponse.json({ error: 'Failed to update path points' }, { status: 500 });
  }
}