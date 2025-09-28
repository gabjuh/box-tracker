import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET active entrance point
export async function GET() {
  try {
    const entrance = await prisma.mapEntrance.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!entrance) {
      return NextResponse.json({ error: 'No entrance point found' }, { status: 404 });
    }

    return NextResponse.json({
      x: entrance.x,
      y: entrance.y
    });
  } catch (error) {
    console.error('Error fetching entrance:', error);
    return NextResponse.json({ error: 'Failed to fetch entrance' }, { status: 500 });
  }
}

// POST create or update entrance point
export async function POST(request) {
  try {
    const { x, y } = await request.json();

    if (x === undefined || y === undefined) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    // Deactivate all existing entrance points and create new active one
    await prisma.$transaction(async (prisma) => {
      // Deactivate all existing entrances
      await prisma.mapEntrance.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      // Create new active entrance
      await prisma.mapEntrance.create({
        data: {
          x: parseFloat(x),
          y: parseFloat(y),
          isActive: true
        }
      });
    });

    return NextResponse.json({
      x: parseFloat(x),
      y: parseFloat(y)
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating entrance:', error);
    return NextResponse.json({ error: 'Failed to create entrance' }, { status: 500 });
  }
}

// PUT update active entrance point
export async function PUT(request) {
  try {
    const { x, y } = await request.json();

    if (x === undefined || y === undefined) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const activeEntrance = await prisma.mapEntrance.findFirst({
      where: { isActive: true }
    });

    if (!activeEntrance) {
      return NextResponse.json({ error: 'No active entrance found' }, { status: 404 });
    }

    const updatedEntrance = await prisma.mapEntrance.update({
      where: { id: activeEntrance.id },
      data: {
        x: parseFloat(x),
        y: parseFloat(y)
      }
    });

    return NextResponse.json({
      x: updatedEntrance.x,
      y: updatedEntrance.y
    });
  } catch (error) {
    console.error('Error updating entrance:', error);
    return NextResponse.json({ error: 'Failed to update entrance' }, { status: 500 });
  }
}