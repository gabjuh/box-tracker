import { unlink, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { prisma } from '@/lib/prisma';

// GET single box
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const box = await prisma.box.findUnique({
      where: { id: parseInt(params.id) }
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
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const boxNumber = formData.get('boxNumber') as string
    const items = formData.get('items') as string
    const keywords = formData.get('keywords') as string
    const keepExistingImages = formData.get('keepExistingImages') === 'true'

    // Get current box to check existing images
    const currentBox = await prisma.box.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!currentBox) {
      return NextResponse.json({ error: 'Box not found' }, { status: 404 })
    }

    let images: string[] = []

    // Keep existing images if requested
    if (keepExistingImages && currentBox.images) {
      try {
        images = JSON.parse(currentBox.images)
      } catch {
        images = []
      }
    }

    // Handle new images
    const newImageFiles = formData.getAll('images') as File[]
    
    for (const image of newImageFiles) {
      if (image && image.size > 0) {
        const bytes = await image.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Create unique filename
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${image.name}`
        const filepath = path.join(process.cwd(), 'public/uploads', filename)
        
        await writeFile(filepath, buffer)
        images.push(`/uploads/${filename}`)
      }
    }

    // If not keeping existing images, delete old ones
    if (!keepExistingImages && currentBox.images) {
      try {
        const oldImages = JSON.parse(currentBox.images)
        for (const oldImagePath of oldImages) {
          try {
            const fullPath = path.join(process.cwd(), 'public', oldImagePath)
            await unlink(fullPath)
          } catch (error) {
            console.error('Failed to delete old image:', error)
          }
        }
      } catch (error) {
        console.error('Failed to parse old images:', error)
      }
    }

    const box = await prisma.box.update({
      where: { id: parseInt(params.id) },
      data: {
        boxNumber,
        items,
        keywords,
        images: images.length > 0 ? JSON.stringify(images) : null
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
  { params }: { params: { id: string } }
) {
  try {
    // Get current box to delete associated images
    const currentBox = await prisma.box.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!currentBox) {
      return NextResponse.json({ error: 'Box not found' }, { status: 404 })
    }

    // Delete the box from database
    await prisma.box.delete({
      where: { id: parseInt(params.id) }
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