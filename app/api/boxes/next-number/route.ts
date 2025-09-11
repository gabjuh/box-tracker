import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all existing box numbers and find the next available one
    const boxes = await prisma.box.findMany({
      select: { boxNumber: true },
      orderBy: { boxNumber: 'asc' }
    });

    // Convert box numbers to integers and find the next available one
    const existingNumbers = boxes
      .map(box => parseInt(box.boxNumber))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    let nextNumber = 1;
    for (const num of existingNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }

    // Format with leading zeros (e.g., 001, 002, etc.)
    const formattedNumber = nextNumber.toString().padStart(3, '0');

    return NextResponse.json({ nextBoxNumber: formattedNumber });
  } catch (error) {
    console.error('Error getting next box number:', error);
    return NextResponse.json({ error: 'Failed to get next box number' }, { status: 500 });
  }
}