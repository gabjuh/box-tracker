import { readFile, stat, writeFile } from 'fs/promises';
import sharp from 'sharp';

export interface OptimizationOptions {
  maxSizeKB?: number
  quality?: number
  maxWidth?: number
  maxHeight?: number
}

export class ImageOptimizer {
  private defaultOptions: Required<OptimizationOptions> = {
    maxSizeKB: 80, // 0.1 MB
    quality: 85,
    maxWidth: 1200,
    maxHeight: 1200
  }

  async optimizeImage(
    inputPath: string, 
    outputPath: string, 
    options: OptimizationOptions = {}
  ): Promise<{ success: boolean; originalSize: number; newSize: number; savings: number }> {
    const opts = { ...this.defaultOptions, ...options }
    
    try {
      // Get original file size
      const originalStats = await stat(inputPath)
      const originalSize = originalStats.size

      // If already small enough, just copy
      if (originalSize <= opts.maxSizeKB * 1024) {
        const buffer = await readFile(inputPath)
        await writeFile(outputPath, buffer)
        return {
          success: true,
          originalSize,
          newSize: originalSize,
          savings: 0
        }
      }

      // Read and process image
      let image = sharp(inputPath)
      
      // Get metadata
      const metadata = await image.metadata()
      
      // Resize if needed
      if (metadata.width && metadata.width > opts.maxWidth || 
          metadata.height && metadata.height > opts.maxHeight) {
        image = image.resize(opts.maxWidth, opts.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }

      // Start with specified quality
      let quality = opts.quality
      let buffer: Buffer
      
      // Progressive optimization to reach target size
      do {
        if (metadata.format === 'jpeg' || inputPath.toLowerCase().endsWith('.jpg') || inputPath.toLowerCase().endsWith('.jpeg')) {
          buffer = await image.jpeg({ quality }).toBuffer()
        } else if (metadata.format === 'png' || inputPath.toLowerCase().endsWith('.png')) {
          buffer = await image.png({ quality }).toBuffer()
        } else if (metadata.format === 'webp' || inputPath.toLowerCase().endsWith('.webp')) {
          buffer = await image.webp({ quality }).toBuffer()
        } else {
          // Convert unknown formats to JPEG
          buffer = await image.jpeg({ quality }).toBuffer()
        }
        
        // If still too large, reduce quality
        if (buffer.length > opts.maxSizeKB * 1024 && quality > 10) {
          quality -= 5
        } else {
          break
        }
      } while (buffer.length > opts.maxSizeKB * 1024 && quality > 10)

      // Write optimized image
      await writeFile(outputPath, buffer)
      
      const newSize = buffer.length
      const savings = Math.round(((originalSize - newSize) / originalSize) * 100)

      return {
        success: true,
        originalSize,
        newSize,
        savings
      }
    } catch (error) {
      console.error('Image optimization failed:', error)
      return {
        success: false,
        originalSize: 0,
        newSize: 0,
        savings: 0
      }
    }
  }

  async optimizeBuffer(
    inputBuffer: Buffer,
    options: OptimizationOptions = {}
  ): Promise<{ success: boolean; buffer: Buffer; originalSize: number; newSize: number; savings: number }> {
    const opts = { ...this.defaultOptions, ...options }
    const originalSize = inputBuffer.length

    try {
      // If already small enough, return as is
      if (originalSize <= opts.maxSizeKB * 1024) {
        return {
          success: true,
          buffer: inputBuffer,
          originalSize,
          newSize: originalSize,
          savings: 0
        }
      }

      let image = sharp(inputBuffer)
      const metadata = await image.metadata()

      // Resize if needed
      if (metadata.width && metadata.width > opts.maxWidth || 
          metadata.height && metadata.height > opts.maxHeight) {
        image = image.resize(opts.maxWidth, opts.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }

      let quality = opts.quality
      let buffer: Buffer

      // Progressive optimization
      do {
        if (metadata.format === 'jpeg') {
          buffer = await image.jpeg({ quality }).toBuffer()
        } else if (metadata.format === 'png') {
          buffer = await image.png({ quality }).toBuffer()
        } else if (metadata.format === 'webp') {
          buffer = await image.webp({ quality }).toBuffer()
        } else {
          // Convert to JPEG for unknown formats
          buffer = await image.jpeg({ quality }).toBuffer()
        }
        
        if (buffer.length > opts.maxSizeKB * 1024 && quality > 10) {
          quality -= 5
        } else {
          break
        }
      } while (buffer.length > opts.maxSizeKB * 1024 && quality > 10)

      const newSize = buffer.length
      const savings = Math.round(((originalSize - newSize) / originalSize) * 100)

      return {
        success: true,
        buffer,
        originalSize,
        newSize,
        savings
      }
    } catch (error) {
      console.error('Buffer optimization failed:', error)
      return {
        success: false,
        buffer: inputBuffer,
        originalSize,
        newSize: originalSize,
        savings: 0
      }
    }
  }
}