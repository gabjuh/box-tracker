import React from 'react';

const PAGE_SIZES = [12, 24, 48, 'All'] as const;
type PageSize = typeof PAGE_SIZES[number];

interface PaginationControlsProps {
  // Sort controls
  sortOrder: 'asc' | 'desc';
  onSort: () => void;
  
  // Pagination controls
  currentPage: number;
  totalItems: number;
  pageSize: PageSize;
  onPageSizeChange: (pageSize: PageSize) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export default function PaginationControls({
  sortOrder,
  onSort,
  currentPage,
  totalItems,
  pageSize,
  onPageSizeChange,
  onPrevPage,
  onNextPage,
}: PaginationControlsProps) {
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'All' ? 'All' : Number(e.target.value) as PageSize;
    onPageSizeChange(value);
  };

  const totalPages = pageSize === 'All' 
    ? 1 
    : Math.max(1, Math.ceil(totalItems / (pageSize as number)));

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
      {/* Sort Button (Left) */}
      <button
        type="button"
        onClick={onSort}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-full md:w-auto"
      >
        {sortOrder === 'asc' ? 'Descending' : 'Ascending'}
      </button>

      {/* Pagination (Center) */}
      {pageSize !== 'All' && (
        <div className="flex items-center gap-2 justify-center w-full md:w-auto">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${
              currentPage === 1 
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Prev
          </button>
          <span className="text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className={`px-3 py-1 rounded ${
              currentPage >= totalPages 
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Page Size Select (Right) */}
      <div className="w-full md:w-auto flex justify-end">
        <label htmlFor="pageSize" className="mr-2 text-gray-700 dark:text-gray-300">
          Boxes per page:
        </label>
        <select
          id="pageSize"
          value={pageSize}
          onChange={handlePageSizeChange}
          className="p-2 translate-y-[-7px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}