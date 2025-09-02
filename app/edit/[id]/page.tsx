'use client'

import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import ImageCarousel from '@/components/ImageCarousel';

import type { Box } from '@/types';

export default function EditBox() {
  const [box, setBox] = useState<Box | null>(null)
  const [boxNumber, setBoxNumber] = useState('')
  const [items, setItems] = useState('')
  const [keywords, setKeywords] = useState('')
  const [newImages, setNewImages] = useState<FileList | null>(null)
  const [keepExistingImages, setKeepExistingImages] = useState(true)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    fetchBox()
  }, [id])

  const fetchBox = async () => {
    try {
      const response = await fetch(`/api/boxes/${id}`)
      if (response.ok) {
        const boxData = await response.json()
        setBox(boxData)
        setBoxNumber(boxData.boxNumber)
        setKeywords(boxData.keywords)
        
        // Parse items back to comma-separated string
        try {
          const parsedItems = JSON.parse(boxData.items)
          setItems(Array.isArray(parsedItems) ? parsedItems.join(', ') : boxData.items)
        } catch {
          setItems(boxData.items)
        }
      } else {
        alert('Box not found')
        router.push('/')
      }
    } catch (error) {
      console.error('Failed to fetch box:', error)
      alert('Failed to fetch box')
      router.push('/')
    } finally {
      setInitialLoading(false)
    }
  }

  const parseImages = (images: string | null): string[] => {
    if (!images) return []
    try {
      return JSON.parse(images)
    } catch {
      return []
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('boxNumber', boxNumber)
      formData.append('items', JSON.stringify(items.split(',').map(item => item.trim())))
      formData.append('keywords', keywords)
      formData.append('keepExistingImages', keepExistingImages.toString())
      
      // Append new images
      if (newImages) {
        Array.from(newImages).forEach(image => {
          formData.append('images', image)
        })
      }

      const response = await fetch(`/api/boxes/${id}`, {
        method: 'PUT',
        body: formData
      })

      if (response.ok) {
        router.push('/')
      } else {
        alert('Failed to update box')
      }
    } catch (error) {
      console.error('Error updating box:', error)
      alert('Failed to update box')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this box? This action cannot be undone.')) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/boxes/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/')
      } else {
        alert('Failed to delete box')
      }
    } catch (error) {
      console.error('Error deleting box:', error)
      alert('Failed to delete box')
    } finally {
      setDeleting(false)
    }
  }

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewImages(e.target.files)
  }

  if (initialLoading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading box...</div>
  }

  if (!box) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Box not found</div>
  }

  const existingImages = parseImages(box.images)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Edit Box</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="boxNumber" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Box Number *
          </label>
          <input
            type="text"
            id="boxNumber"
            value={boxNumber}
            onChange={(e) => setBoxNumber(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="e.g., 001, Kitchen-1, etc."
          />
        </div>

        {/* Current Images */}
        {existingImages.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Current Images
            </label>
            <div className="mb-4 max-w-md">
              <ImageCarousel 
                images={existingImages}
                boxNumber={box.boxNumber}
                className="h-64"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {existingImages.length} current image{existingImages.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="keepExistingImages"
                checked={keepExistingImages}
                onChange={(e) => setKeepExistingImages(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="keepExistingImages" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Keep existing images
              </label>
            </div>
            
            {!keepExistingImages && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Warning: Unchecking this will permanently delete all current images when you save.
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <label htmlFor="newImages" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            {existingImages.length > 0 ? 'Add New Images' : 'Box Photos'}
          </label>
          <input
            type="file"
            id="newImages"
            accept="image/*"
            multiple
            onChange={handleNewImageChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {existingImages.length > 0 
              ? 'Select additional photos to add to this box' 
              : 'Select photos of your packed box contents'
            }
          </p>
          {newImages && newImages.length > 0 && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              {newImages.length} new image{newImages.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        <div>
          <label htmlFor="items" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Items List *
          </label>
          <textarea
            id="items"
            value={items}
            onChange={(e) => setItems(e.target.value)}
            required
            rows={4}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Enter items separated by commas: books, lamp, picture frames, cables"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Separate each item with a comma
          </p>
        </div>

        <div>
          <label htmlFor="keywords" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Keywords/Tags *
          </label>
          <input
            type="text"
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="e.g., kitchen, fragile, electronics, bedroom"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Add searchable keywords to help find this box later
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || deleting}
            className="flex-1 bg-blue-500 dark:bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Box'}
          </button>
          
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || deleting}
            className="bg-red-500 dark:bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          
          <button
            type="button"
            onClick={() => router.push('/')}
            disabled={loading || deleting}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}