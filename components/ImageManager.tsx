import Image from 'next/image';
import { useState } from 'react';

interface ImageManagerProps {
  existingImages: string[];
  onImagesChange: (images: string[], mainImageIndex: number) => void;
  onNewImagesChange: (files: FileList | null) => void;
  boxNumber: string;
}

export default function ImageManager({ 
  existingImages, 
  onImagesChange, 
  onNewImagesChange,
  boxNumber 
}: ImageManagerProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [newImages, setNewImages] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleRemoveImage = (indexToRemove: number) => {
    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    
    // Adjust main image index if needed
    let newMainIndex = mainImageIndex;
    if (indexToRemove === mainImageIndex && updatedImages.length > 0) {
      newMainIndex = 0; // Set first image as main if current main was removed
    } else if (indexToRemove < mainImageIndex) {
      newMainIndex = mainImageIndex - 1; // Shift main index if an image before it was removed
    } else if (updatedImages.length === 0) {
      newMainIndex = 0;
    }

    setImages(updatedImages);
    setMainImageIndex(newMainIndex);
    onImagesChange(updatedImages, newMainIndex);
  };

  const handleSetMainImage = (index: number) => {
    setMainImageIndex(index);
    onImagesChange(images, index);
  };

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setNewImages(files);
    onNewImagesChange(files);

    // Create preview URLs for new images
    if (files) {
      const urls = Array.from(files).map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    } else {
      setPreviewUrls([]);
    }
  };

  const handleRemoveNewImage = (indexToRemove: number) => {
    if (!newImages) return;

    const filesArray = Array.from(newImages);
    filesArray.splice(indexToRemove, 1);
    
    // Create new FileList-like object
    const dt = new DataTransfer();
    filesArray.forEach(file => dt.items.add(file));
    
    const updatedFiles = dt.files.length > 0 ? dt.files : null;
    setNewImages(updatedFiles);
    onNewImagesChange(updatedFiles);

    // Update preview URLs
    const updatedUrls = previewUrls.filter((_, index) => index !== indexToRemove);
    setPreviewUrls(updatedUrls);
  };

  return (
    <div className="space-y-6">
      {/* Existing Images Section */}
      {images.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
            Current Images ({images.length})
          </label>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                  index === mainImageIndex 
                    ? 'border-blue-500 dark:border-blue-400' 
                    : 'border-gray-200 dark:border-gray-600'
                }`}>
                  <Image
                    src={image}
                    alt={`Box ${boxNumber} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  
                  {/* Main image badge */}
                  {index === mainImageIndex && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Main
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center gap-2">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      {index !== mainImageIndex && (
                        <button
                          type="button"
                          onClick={() => handleSetMainImage(index)}
                          className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                          title="Set as main image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload New Images Section */}
      <div>
        <label htmlFor="newImages" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          {images.length > 0 ? 'Add New Images' : 'Upload Images'}
        </label>
        <input
          type="file"
          id="newImages"
          accept="image/*"
          multiple
          onChange={handleNewImageUpload}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {images.length > 0 
            ? 'Select additional photos to add to this box' 
            : 'Select photos of your packed box contents'
          }
        </p>
      </div>

      {/* New Images Preview */}
      {previewUrls.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
            New Images to Upload ({previewUrls.length})
          </label>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-500 dark:border-green-400">
                  <Image
                    src={url}
                    alt={`New image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  
                  {/* New image badge */}
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    New
                  </div>
                  
                  {/* Remove button */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      title="Remove this new image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Image Management Tips:</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• The <strong>main image</strong> (marked with blue border) will be shown first in searches</li>
          <li>• Hover over existing images to <strong>set as main</strong> or <strong>remove</strong></li>
          <li>• New images (green border) will be uploaded when you save</li>
          <li>• You can remove new images before uploading if you change your mind</li>
        </ul>
      </div>
    </div>
  );
}