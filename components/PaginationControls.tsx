import React from 'react';

const PAGE_SIZES = [12, 24, 48, 'All'] as const;
type PageSize = typeof PAGE_SIZES[number];

interface PaginationControlsProps {
  // Pagination controls
  currentPage: number;
  totalItems: number;
  pageSize: PageSize;
  onPageSizeChange: (pageSize: PageSize) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export default function PaginationControls({
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
            Zurück
          </button>
          <span className="text-gray-700 dark:text-gray-300">
            Seite {currentPage} von {totalPages}
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
            Weiter
          </button>
        </div>
      )}

      {/* Page Size Select (Right) */}
      <div className="w-full md:w-auto flex justify-center md:justify-end">
        <label htmlFor="pageSize" className="mr-2 text-gray-700 dark:text-gray-300">
          Kartons pro Seite:
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