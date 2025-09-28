import { unlink, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { ImageOptimizer } from '@/lib/imageOptimizer';
import { prisma } from '@/lib/prisma';

const imageOptimizer = new ImageOptimizer();

// GET single box
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const box = await prisma.box.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!box) {
      return NextResponse.json({ error: 'Box not found' }, { status: 404 })
    }
    
    return NextResponse.json(box)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch box' }, { status: 500 })
  }
}

// PUT update box
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData()
    const boxNumber = formData.get('boxNumber') as string
    const items = formData.get('items') as string
    const keywords = formData.get('keywords') as string
    const weightStr = formData.get('weight') as string
    const weight = weightStr ? parseFloat(weightStr) : null
    const mainImageIndex = parseInt(formData.get('mainImageIndex') as string) || 0
    
    // Parse image management data
    const existingImagesStr = formData.get('existingImages') as string
    const removedImagesStr = formData.get('removedImages') as string
    const existingImages = existingImagesStr ? JSON.parse(existingImagesStr) : []
    const removedImages = removedImagesStr ? JSON.parse(removedImagesStr) : []

    // Get current box to check existing images
    const currentBox = await prisma.box.findUnique({
      where: { id: parseInt(id) }
    })

    if (!currentBox) {
      return NextResponse.json({ error: 'Box not found' }, { status: 404 })
    }

    // Start with existing images that weren't removed
    let images: string[] = [...existingImages]

    // Delete removed images from filesystem
    for (const removedImagePath of removedImages) {
      try {
        const filename = path.basename(removedImagePath)
        const filepath = path.join(process.cwd(), 'public/uploads', filename)
        await unlink(filepath)
        console.log(`Deleted image: ${filename}`)
      } catch (error) {
        console.log(`Could not delete image: ${removedImagePath}`, error)
      }
    }

    // Handle new images
    const newImageFiles = formData.getAll('images') as File[]
    
    for (const image of newImageFiles) {
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

    // Update the box in database
    const box = await prisma.box.update({
      where: { id: parseInt(id) },
      data: {
        boxNumber,
        items,
        keywords,
        weight,
        images: images.length > 0 ? JSON.stringify(images) : null,
        mainImageIndex
      }
    })
    
    return NextResponse.json(box)
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Failed to update box' }, { status: 500 })
  }
}

// DELETE box
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get current box to delete associated images
    const currentBox = await prisma.box.findUnique({
      where: { id: parseInt(id) }
    })

    if (!currentBox) {
      return NextResponse.json({ error: 'Box not found' }, { status: 404 })
    }

    // Delete the box from database
    await prisma.box.delete({
      where: { id: parseInt(id) }
    })

    // Delete associated image files if they exist
    if (currentBox.images) {
      try {
        const images = JSON.parse(currentBox.images)
        for (const imagePath of images) {
          try {
            const fullPath = path.join(process.cwd(), 'public', imagePath)
            await unlink(fullPath)
          } catch (error) {
            console.error('Failed to delete image file:', error)
          }
        }
      } catch (error) {
        console.error('Failed to parse images for deletion:', error)
      }
    }

    return NextResponse.json({ message: 'Box deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete box' }, { status: 500 })
  }
}