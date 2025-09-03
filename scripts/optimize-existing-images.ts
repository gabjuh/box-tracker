#!/usr/bin/env tsx

import { mkdir, readdir, stat } from 'fs/promises';
import path from 'path';

import { ImageOptimizer } from '../lib/imageOptimizer';

const optimizer = new ImageOptimizer()

async function optimizeExistingImages() {
  const uploadsDir = path.join(process.cwd(), 'public/uploads')
  const backupDir = path.join(process.cwd(), 'public/uploads_backup')
  
  console.log('🖼️  Starting image optimization...')
  console.log(`📁 Processing: ${uploadsDir}`)
  
  try {
    // Check if uploads directory exists
    await stat(uploadsDir)
  } catch {
    console.log('❌ Uploads directory not found')
    return
  }

  // Create backup directory
  try {
    await mkdir(backupDir, { recursive: true })
    console.log(`💾 Created backup directory: ${backupDir}`)
  } catch (error) {
    console.log('⚠️  Could not create backup directory:', error)
  }

  try {
    const files = await readdir(uploadsDir)
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|webp|gif)$/i.test(file)
    )

    if (imageFiles.length === 0) {
      console.log('ℹ️  No image files found to optimize')
      return
    }

    console.log(`📊 Found ${imageFiles.length} images to process`)
    
    let totalOriginalSize = 0
    let totalNewSize = 0
    let processedCount = 0
    let skippedCount = 0

    for (const file of imageFiles) {
      const filePath = path.join(uploadsDir, file)
      const backupPath = path.join(backupDir, file)
      
      try {
        console.log(`🔄 Processing: ${file}`)
        
        // Create backup first
        await optimizer.optimizeImage(filePath, backupPath, { maxSizeKB: 999999 }) // Just copy for backup
        
        // Optimize the original file
        const result = await optimizer.optimizeImage(filePath, filePath, {
          maxSizeKB: 100, // 0.1 MB target
          quality: 85,
          maxWidth: 1200,
          maxHeight: 1200
        })

        if (result.success) {
          totalOriginalSize += result.originalSize
          totalNewSize += result.newSize
          processedCount++
          
          const originalKB = Math.round(result.originalSize / 1024)
          const newKB = Math.round(result.newSize / 1024)
          
          if (result.savings > 0) {
            console.log(`  ✅ ${originalKB}KB → ${newKB}KB (${result.savings}% smaller)`)
          } else {
            console.log(`  ℹ️  Already optimized: ${newKB}KB`)
            skippedCount++
          }
        } else {
          console.log(`  ❌ Failed to optimize ${file}`)
        }
      } catch (error) {
        console.log(`  ❌ Error processing ${file}:`, error)
      }
    }

    // Summary
    console.log('\n📊 Optimization Summary:')
    console.log(`✅ Processed: ${processedCount} images`)
    console.log(`ℹ️  Already optimal: ${skippedCount} images`)
    
    if (totalOriginalSize > 0) {
      const totalOriginalMB = (totalOriginalSize / 1024 / 1024).toFixed(2)
      const totalNewMB = (totalNewSize / 1024 / 1024).toFixed(2)
      const totalSavings = Math.round(((totalOriginalSize - totalNewSize) / totalOriginalSize) * 100)
      
      console.log(`💾 Total size: ${totalOriginalMB}MB → ${totalNewMB}MB`)
      console.log(`🎉 Total savings: ${totalSavings}% (${((totalOriginalSize - totalNewSize) / 1024 / 1024).toFixed(2)}MB saved)`)
    }
    
    console.log(`\n💾 Original images backed up to: ${backupDir}`)
    console.log('🔄 You can delete the backup folder once you\'re satisfied with the results')

  } catch (error) {
    console.error('❌ Error during optimization:', error)
  }
}

// Run if called directly
if (require.main === module) {
  optimizeExistingImages()
}

export default optimizeExistingImages