'use client'

import { useEffect, useState } from 'react';

import BoxCard from '@/components/BoxCard';

import type { Box } from '@/types';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('')
  const [boxes, setBoxes] = useState<Box[]>([])
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleSort = () => {
    console.log('runs')
    setBoxes(prev =>
      [...prev].sort((a, b) =>
        sortOrder === 'asc' ? a.id - b.id : b.id - a.id
      )
    )
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }
  const [filteredBoxes, setFilteredBoxes] = useState<Box[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBoxes()
    handleSort()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBoxes(boxes)
    } else {
      const filtered = boxes.filter(box => {
        const searchLower = searchTerm.toLowerCase()
        return (
          box.boxNumber.toLowerCase().includes(searchLower) ||
          box.keywords.toLowerCase().includes(searchLower) ||
          box.items.toLowerCase().includes(searchLower)
        )
      })
      setFilteredBoxes(filtered)
    }
  }, [searchTerm, boxes])

  const fetchBoxes = async () => {
    try {
      const response = await fetch('/api/boxes')
      const data = await response.json()
      setBoxes(data)
      setFilteredBoxes(data)
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
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Search Boxes</h1>
      
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by box number, items, or keywords..."
            className="w-full p-4 pr-12 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Found {filteredBoxes.length} box{filteredBoxes.length !== 1 ? 'es' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      </div>

      <button
        type="button"
        onClick={handleSort}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        {sortOrder === 'asc' ? 'Descending' : 'Ascending'}
      </button>

      {filteredBoxes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchTerm ? (
            <>No boxes found matching {searchTerm}</>
          ) : (
            <>No boxes yet. <a href="/add" className="text-blue-500 dark:text-blue-400 hover:underline">Add your first box</a></>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {filteredBoxes.map((box) => (
            <BoxCard 
              key={box.id} 
              box={box}
              searchTerm={searchTerm}
              maxItems={8}
            />
          ))}
        </div>
      )}
    </div>
  )
}