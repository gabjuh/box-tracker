'use client'

import { useEffect, useState } from 'react';

import BoxCard from '@/components/BoxCard';

import type { Box } from '@/types';

export default function Home() {
  const [boxes, setBoxes] = useState<Box[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBoxes()
  }, [])

  const fetchBoxes = async () => {
    try {
      const response = await fetch('/api/boxes')
      const data = await response.json()
      setBoxes(data)
    } catch (error) {
      console.error('Failed to fetch boxes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading boxes...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Moving Boxes</h1>
        <a 
          href="/add" 
          className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700"
        >
          Add New Box
        </a>
      </div>

      {boxes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No boxes yet. <a href="/add" className="text-blue-500 dark:text-blue-400 hover:underline">Add your first box</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boxes.map((box) => (
            <BoxCard 
              key={box.id} 
              box={box}
              maxItems={5}
            />
          ))}
        </div>
      )}
    </div>
  )
}