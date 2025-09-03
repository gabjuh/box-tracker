import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { ImageOptimizer } from '@/lib/imageOptimizer';
import { prisma } from '@/lib/prisma';

const imageOptimizer = new ImageOptimizer();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  
  try {
    const boxes = await prisma.box.findMany({
      where: search ? {
        OR: [
          { boxNumber: { contains: search } },
          { keywords: { contains: search } },
          { items: { contains: search } }
        ]
      } : undefined,
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(boxes)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch boxes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const boxNumber = formData.get('boxNumber') as string
    const items = formData.get('items') as string
    const keywords = formData.get('keywords') as string
    
    // Handle multiple images
    const images: string[] = []
    const imageFiles = formData.getAll('images') as File[]
    
    for (const image of imageFiles) {
      if (image && image.size > 0) {
        const bytes = await image.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Optimize the image
        const optimized = await imageOptimizer.optimizeBuffer(buffer, {
          maxSizeKB: 100,
          quality: 85,
          maxWidth: 1200,
          maxHeight: 1200
        })
        
        // Create unique filename
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${image.name}`
        const filepath = path.join(process.cwd(), 'public/uploads', filename)
        
        await writeFile(filepath, optimized.buffer)
        images.push(`/uploads/${filename}`)
        
        // Log optimization results
        const originalKB = Math.round(optimized.originalSize / 1024)
        const newKB = Math.round(optimized.newSize / 1024)
        console.log(`Image optimized: ${image.name} - ${originalKB}KB → ${newKB}KB (${optimized.savings}% savings)`)
      }
    }
    
    const box = await prisma.box.create({
      data: {
        boxNumber,
        items,
        keywords,
        images: images.length > 0 ? JSON.stringify(images) : null
      }
    })
    
    return NextResponse.json(box)
  } catch (error) {
    console.error('Create error:', error)
    return NextResponse.json({ error: 'Failed to create box' }, { status: 500 })
  }
}