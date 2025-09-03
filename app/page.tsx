'use client'

import { useEffect, useState } from 'react';

import BoxCard from '@/components/BoxCard';
import PaginationControls from '@/components/PaginationControls';

const PAGE_SIZES = [12, 24, 48, 'All'] as const;
type PageSize = typeof PAGE_SIZES[number];

import type { Box } from '@/types';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('')
  const [boxes, setBoxes] = useState<Box[]>([])
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filteredBoxes, setFilteredBoxes] = useState<Box[]>([])
  const [loading, setLoading] = useState(true)
  const [pageSize, setPageSize] = useState<PageSize>(PAGE_SIZES[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedBoxes, setPaginatedBoxes] = useState<Box[]>();

  const handleSort = () => {
    setBoxes(prev =>
      [...prev].sort((a, b) =>
        sortOrder === 'asc' ? a.id - b.id : b.id - a.id
      )
    )
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

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
      // Sort the initial data in ascending order by default
      const sortedData = [...data].sort((a, b) => a.id - b.id)
      setBoxes(sortedData)
      setFilteredBoxes(sortedData)
    } catch (error) {
      console.error('Failed to fetch boxes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageSizeChange = (newPageSize: PageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    const totalPages =
      pageSize === 'All'
        ? 1
        : Math.ceil(filteredBoxes.length / (pageSize as number));
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  useEffect(() => {
    const paginated =
      pageSize === 'All'
        ? filteredBoxes
        : filteredBoxes.slice(
            (currentPage - 1) * (pageSize as number),
            currentPage * (pageSize as number)
          );
    setPaginatedBoxes(paginated);
  }, [filteredBoxes, pageSize, currentPage]);

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading boxes...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Search Boxes</h1>
      
      {/* Search */}
      <div className="mb-12">
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

      {/* Pagination Controls */}
      <PaginationControls
        sortOrder={sortOrder}
        onSort={handleSort}
        currentPage={currentPage}
        totalItems={filteredBoxes.length}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
      />

      {paginatedBoxes?.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchTerm ? (
            <>No boxes found matching {searchTerm}</>
          ) : (
            <>No boxes yet. <a href="/add" className="text-blue-500 dark:text-blue-400 hover:underline">Add your first box</a></>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 mb-12 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedBoxes?.map((box) => (
            <BoxCard 
              key={box.id} 
              box={box}
              searchTerm={searchTerm}
              maxItems={8}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <PaginationControls
        sortOrder={sortOrder}
        onSort={handleSort}
        currentPage={currentPage}
        totalItems={filteredBoxes.length}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
      />

    </div>
  )
}