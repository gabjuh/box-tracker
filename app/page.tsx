'use client'

import { useEffect, useState } from 'react';

import BoxCard from '@/components/BoxCard';
import PaginationControls from '@/components/PaginationControls';
import { useSearch } from '@/contexts/SearchContext';

const PAGE_SIZES = [12, 24, 48, 'All'] as const;
type PageSize = typeof PAGE_SIZES[number];

import type { Box } from '@/types';

export default function Search() {
  const { searchTerm, setSearchTerm, refreshKey, setIsRefreshing } = useSearch();
  const [boxes, setBoxes] = useState<Box[]>([])
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [sortBy, setSortBy] = useState<'id' | 'boxNumber' | 'updatedAt'>('updatedAt')
  const [filteredBoxes, setFilteredBoxes] = useState<Box[]>([])
  const [numberFilter, setNumberFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [pageSize, setPageSize] = useState<PageSize>(PAGE_SIZES[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedBoxes, setPaginatedBoxes] = useState<Box[]>();

  const handleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const applySorting = (boxList: Box[]) => {
    return [...boxList].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'boxNumber') {
        // Sort by box number numerically
        const aNum = parseInt(a.boxNumber) || 0;
        const bNum = parseInt(b.boxNumber) || 0;
        comparison = aNum - bNum;
      } else if (sortBy === 'updatedAt') {
        // Sort by last modified date
        comparison = new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime();
      } else {
        // Default: sort by ID
        comparison = a.id - b.id;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  useEffect(() => {
    fetchBoxes()
  }, [refreshKey])

  useEffect(() => {
    let filtered = [...boxes];
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(box => 
        box.boxNumber.toLowerCase().includes(searchLower) ||
        box.keywords.toLowerCase().includes(searchLower) ||
        box.items.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply number range filter
    if (numberFilter.trim() !== '') {
      const [start, end] = numberFilter.split('-').map(n => parseInt(n.trim()) || 0);
      if (end && end > 0) {
        // Range filter: e.g., "1-100"
        filtered = filtered.filter(box => {
          const boxNum = parseInt(box.boxNumber) || 0;
          return boxNum >= start && boxNum <= end;
        });
      } else if (start > 0) {
        // Single number filter
        filtered = filtered.filter(box => {
          const boxNum = parseInt(box.boxNumber) || 0;
          return boxNum === start;
        });
      }
    }
    
    // Apply date filter
    if (dateFilter.trim() !== '') {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(box => {
        const boxDate = new Date(box.updatedAt || box.createdAt);
        return boxDate.toDateString() === filterDate.toDateString();
      });
    }
    
    // Apply sorting
    const sortedFiltered = applySorting(filtered);
    setFilteredBoxes(sortedFiltered);
  }, [searchTerm, boxes, numberFilter, dateFilter, sortBy, sortOrder])

  const fetchBoxes = async () => {
    const isRefresh = refreshKey > 0;
    const startTime = Date.now();
    
    if (isRefresh) {
      setIsRefreshing(true);
    }
    
    try {
      const response = await fetch('/api/boxes')
      const data = await response.json()
      // Sort the initial data in descending order by default
      const sortedData = [...data].sort((a, b) => b.id - a.id)
      setBoxes(sortedData)
      setFilteredBoxes(sortedData)
    } catch (error) {
      console.error('Failed to fetch boxes:', error)
    } finally {
      if (isRefresh) {
        // Ensure loading shows for at least 3 seconds
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 3000 - elapsedTime);
        
        setTimeout(() => {
          setIsRefreshing(false);
        }, remainingTime);
      } else {
        setLoading(false);
      }
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
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search Boxes</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Found {filteredBoxes.length} box{filteredBoxes.length !== 1 ? 'es' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      </div>

      {/* Filter Controls */}
      <div className="mb-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Filter & Sortieren</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Number Range Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Box Nummer
            </label>
            <input
              type="text"
              value={numberFilter}
              onChange={(e) => setNumberFilter(e.target.value)}
              placeholder="z.B. 1-100 oder 5"
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Geändert am
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Sortieren nach
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'id' | 'boxNumber' | 'updatedAt')}
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="updatedAt">Zuletzt bearbeitet</option>
              <option value="boxNumber">Box Nummer</option>
              <option value="id">Erstellungsreihenfolge</option>
            </select>
          </div>

          {/* Sort Direction & Clear */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Aktionen
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleSort}
                className="flex-1 p-2 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              >
                {sortOrder === 'asc' ? '↑ Aufsteigend' : '↓ Absteigend'}
              </button>
              <button
                onClick={() => {
                  setNumberFilter('');
                  setDateFilter('');
                  setSearchTerm('');
                }}
                className="px-3 py-2 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
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