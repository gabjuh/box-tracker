import Link from 'next/link';

import ImageCarousel from './ImageCarousel';

interface Box {
  id: number
  boxNumber: string
  images: string | null
  items: string
  keywords: string
  createdAt: string
}

interface BoxCardProps {
  box: Box
  searchTerm?: string
  maxItems?: number
}

export default function BoxCard({ box, searchTerm = '', maxItems = 5 }: BoxCardProps) {
  const parseItems = (items: string): string[] => {
    try {
      return JSON.parse(items)
    } catch {
      return items.split(',').map(item => item.trim())
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

  const highlightMatch = (text: string, search: string) => {
    if (!search) return text
    
    const regex = new RegExp(`(${search})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-600">{part}</mark>
      ) : (
        part
      )
    )
  }

  const items = parseItems(box.items)
  const images = parseImages(box.images)
  const displayItems = items.slice(0, maxItems)
  const remainingCount = items.length - maxItems

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-md bg-white dark:bg-gray-800">
      <div className="mb-4">
        <ImageCarousel 
          images={images}
          boxNumber={box.boxNumber}
        />
      </div>
      
      <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
        <Link 
          href={`/edit/${box.id}`}
          className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer"
        >
          Box #{searchTerm ? highlightMatch(box.boxNumber, searchTerm) : box.boxNumber}
        </Link>
      </h3>
      
      <div className="mb-2">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Items:</h4>
        <div className="flex flex-wrap gap-1 mt-1">
          {displayItems.map((item, index) => (
            <span 
              key={index}
              className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-800 dark:text-gray-200"
            >
              {searchTerm ? highlightMatch(item, searchTerm) : item}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{remainingCount} more
            </span>
          )}
        </div>
      </div>
      
      <div className="mb-2">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Keywords:</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {searchTerm ? highlightMatch(box.keywords, searchTerm) : box.keywords}
        </p>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Added: {new Date(box.createdAt).toLocaleDateString()}
      </div>
    </div>
  )
}