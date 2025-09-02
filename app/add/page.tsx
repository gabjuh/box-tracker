'use client'

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function AddBox() {
  const [boxNumber, setBoxNumber] = useState('')
  const [items, setItems] = useState('')
  const [keywords, setKeywords] = useState('')
  const [images, setImages] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('boxNumber', boxNumber)
      formData.append('items', JSON.stringify(items.split(',').map(item => item.trim())))
      formData.append('keywords', keywords)
      
      // Append all selected images
      if (images) {
        Array.from(images).forEach(image => {
          formData.append('images', image)
        })
      }

      const response = await fetch('/api/boxes', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        router.push('/')
      } else {
        alert('Failed to create box')
      }
    } catch (error) {
      console.error('Error creating box:', error)
      alert('Failed to create box')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImages(e.target.files)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Add New Box</h1>
      
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

        <div>
          <label htmlFor="images" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Box Photos
          </label>
          <input
            type="file"
            id="images"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Select multiple photos of your packed box contents. You can slide through them later!
          </p>
          {images && images.length > 0 && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              {images.length} image{images.length !== 1 ? 's' : ''} selected
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
            disabled={loading}
            className="flex-1 bg-blue-500 dark:bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Box'}
          </button>
          
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}