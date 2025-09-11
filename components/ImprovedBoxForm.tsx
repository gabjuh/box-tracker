'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState, useEffect, useRef } from 'react';

interface BoxItem {
  id: string;
  text: string;
  inBox: boolean;
}

interface ImprovedBoxFormProps {
  mode?: 'add' | 'edit';
  existingBox?: any;
}

const ROOM_NAMES = [
  'Badezimmer',
  'Balkon', 
  'Büro',
  'Garage',
  'Kinderzimmer',
  'Küche',
  'Lagerraum',
  'Schlafzimmer',
  'Wohnzimmer'
].sort();

export default function ImprovedBoxForm({ mode = 'add', existingBox }: ImprovedBoxFormProps) {
  const [boxNumber, setBoxNumber] = useState('');
  const [items, setItems] = useState<BoxItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingBoxNumber, setLoadingBoxNumber] = useState(false);
  const [existingKeywords, setExistingKeywords] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const newItemInputRef = useRef<HTMLInputElement>(null);

  // Load box data for edit mode or generate box number for add mode
  useEffect(() => {
    const loadData = async () => {
      if (mode === 'edit' && existingBox) {
        // Edit mode - load existing data
        setBoxNumber(existingBox.boxNumber);
        setSelectedRoom(existingBox.keywords || '');
        setExistingKeywords(existingBox.keywords || '');
        
        // Parse existing items
        if (existingBox.items) {
          try {
            const itemsArray = JSON.parse(existingBox.items);
            const boxItems: BoxItem[] = itemsArray.map((item: string, index: number) => ({
              id: `item-${index}`,
              text: item,
              inBox: true
            }));
            setItems(boxItems);
          } catch {
            // Fallback for comma-separated items
            const itemsArray = existingBox.items.split(',').map((item: string) => item.trim());
            const boxItems: BoxItem[] = itemsArray.map((item: string, index: number) => ({
              id: `item-${index}`,
              text: item,
              inBox: true
            }));
            setItems(boxItems);
          }
        }
        
        // Parse existing images
        if (existingBox.images) {
          try {
            const imagesArray = JSON.parse(existingBox.images);
            setExistingImages(imagesArray);
          } catch {
            setExistingImages([]);
          }
        }

        // Set main image index
        setMainImageIndex(existingBox.mainImageIndex || 0);
      } else {
        // Add mode - get next box number or use scanned one
        const urlBoxNumber = searchParams.get('boxNumber');
        if (urlBoxNumber) {
          setBoxNumber(urlBoxNumber);
        } else {
          setLoadingBoxNumber(true);
          try {
            const response = await fetch('/api/boxes/next-number');
            const data = await response.json();
            setBoxNumber(data.nextBoxNumber);
          } catch (error) {
            console.error('Failed to get next box number:', error);
            setBoxNumber('001'); // Fallback
          } finally {
            setLoadingBoxNumber(false);
          }
        }
      }
    };

    loadData();
  }, [mode, existingBox, searchParams]);

  const addItem = () => {
    const trimmedText = newItemText.trim();
    if (trimmedText) {
      // Check for duplicates
      const isDuplicate = items.some(item => item.text.toLowerCase() === trimmedText.toLowerCase());
      if (isDuplicate) {
        // Focus the existing item briefly to show it exists
        alert('Dieser Gegenstand ist bereits in der Liste');
        setNewItemText('');
        newItemInputRef.current?.focus();
        return;
      }

      const newItem: BoxItem = {
        id: `item-${Date.now()}`,
        text: trimmedText,
        inBox: true
      };
      setItems(prev => [...prev, newItem]);
      setNewItemText('');
      newItemInputRef.current?.focus();
    }
  };

  const toggleItem = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, inBox: !item.inBox } : item
    ));
  };


  const handleImageAdd = (files: FileList) => {
    const newFiles = Array.from(files);
    
    // Check for duplicates based on file size and name
    const filteredFiles = newFiles.filter(newFile => {
      // Check against existing new images
      const isDuplicateNew = newImages.some(existingFile => 
        existingFile.name === newFile.name && existingFile.size === newFile.size
      );
      
      if (isDuplicateNew) {
        alert(`Bild "${newFile.name}" ist bereits ausgewählt`);
        return false;
      }
      
      return true;
    });
    
    if (filteredFiles.length > 0) {
      setNewImages(prev => [...prev, ...filteredFiles]);
    }
  };

  const removeExistingImage = (imagePath: string) => {
    const imageIndex = existingImages.findIndex(img => img === imagePath);
    
    setExistingImages(prev => prev.filter(img => img !== imagePath));
    setRemovedImages(prev => [...prev, imagePath]);
    
    // Adjust main image index if needed
    if (imageIndex === mainImageIndex && existingImages.length > 1) {
      setMainImageIndex(0); // Reset to first image
    } else if (imageIndex < mainImageIndex) {
      setMainImageIndex(prev => prev - 1); // Adjust index
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('boxNumber', boxNumber);
      
      // Only include items that are "in the box" (checked)
      const itemsInBox = items.filter(item => item.inBox).map(item => item.text);
      formData.append('items', JSON.stringify(itemsInBox));
      formData.append('keywords', selectedRoom);

      // Add new images
      newImages.forEach(image => {
        formData.append('images', image);
      });

      // Include existing images that weren't removed
      formData.append('existingImages', JSON.stringify(existingImages));
      formData.append('removedImages', JSON.stringify(removedImages));
      formData.append('mainImageIndex', mainImageIndex.toString());

      const url = mode === 'edit' ? `/api/boxes/${existingBox.id}` : '/api/boxes';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData
      });

      if (response.ok) {
        router.push('/');
      } else {
        alert(`Failed to ${mode} box`);
      }
    } catch (error) {
      console.error(`Error ${mode}ing box:`, error);
      alert(`Failed to ${mode} box`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBox = async () => {
    if (!existingBox) return;
    
    const confirmed = confirm('Möchten Sie diese Box wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/boxes/${existingBox.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/');
      } else {
        alert('Fehler beim Löschen der Box');
      }
    } catch (error) {
      console.error('Error deleting box:', error);
      alert('Fehler beim Löschen der Box');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {mode === 'edit' ? 'Box bearbeiten' : 'Neue Box'}
        </h1>
        {searchParams.get('boxNumber') && mode === 'add' && (
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <div className="flex items-center text-blue-700 dark:text-blue-300">
              <span className="text-lg mr-2">📱</span>
              <span className="text-sm font-medium">QR-Code erkannt</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Box Number - Read Only */}
        <div>
          <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">
            Box Nummer
          </label>
          <div className="relative">
            <input
              type="text"
              value={loadingBoxNumber ? 'Lade...' : boxNumber}
              readOnly
              className="w-full p-4 text-lg font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <span className="text-gray-400 text-sm">🔒</span>
            </div>
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">
            Fotos
          </label>
          
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">Vorhandene Bilder:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {existingImages.map((imagePath, index) => (
                  <div key={index} className="relative group">
                    <button
                      type="button"
                      onClick={() => setMainImageIndex(index)}
                      className={`w-full h-48 rounded-lg border-2 transition-all ${
                        index === mainImageIndex 
                          ? 'border-green-500 ring-2 ring-green-200' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                      }`}
                    >
                      <img 
                        src={imagePath} 
                        alt={`Box image ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </button>
                    {index === mainImageIndex && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                        HAUPTBILD
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingImage(imagePath)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images */}
          {newImages.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">Neue Bilder:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {newImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`New image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-blue-200 dark:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Images */}
          <label className="block w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-colors">
            <div className="text-center">
              <div className="text-4xl mb-2">📸</div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bilder hinzufügen
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Mehrere Dateien möglich
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleImageAdd(e.target.files)}
              className="hidden"
            />
          </label>
        </div>

        {/* Items */}
        <div>
          <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">
            Inhalt
          </label>

          {/* Items List */}
          {items.length > 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                    <input
                      type="checkbox"
                      checked={item.inBox}
                      onChange={() => toggleItem(item.id)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                    />
                    <span className={`text-sm ${item.inBox ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
              <div className="text-2xl mb-2">📦</div>
              <div className="text-sm">Noch keine Gegenstände hinzugefügt</div>
            </div>
          )}
          
          {/* Add Item Input - Now Below List */}
          <div className="flex gap-2">
            <input
              ref={newItemInputRef}
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
              placeholder="Gegenstand hinzufügen..."
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={addItem}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Room Selection */}
        <div>
          <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">
            Zielraum
          </label>
          
          {/* Show existing keywords temporarily for migration */}
          {mode === 'edit' && existingKeywords && !ROOM_NAMES.includes(existingKeywords) && (
            <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Aktueller Wert:</strong> {existingKeywords}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Bitte wählen Sie einen der neuen Räume unten aus.
              </div>
            </div>
          )}
          
          {/* Room Selection Grid */}
          <div className="grid grid-cols-2 gap-3">
            {ROOM_NAMES.map((room) => (
              <button
                key={room}
                type="button"
                onClick={() => setSelectedRoom(selectedRoom === room ? '' : room)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedRoom === room
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="text-sm font-medium">{room}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="space-y-4 pt-4">
          {/* Main Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !selectedRoom}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-4 px-6 rounded-xl font-bold text-lg disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Speichere...' : mode === 'edit' ? 'Änderungen speichern' : 'Box erstellen'}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-8 py-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              Abbrechen
            </button>
          </div>
          
          {/* Delete Button (Edit Mode Only) */}
          {mode === 'edit' && (
            <div className="pt-6 mt-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
              <button
                type="button"
                onClick={handleDeleteBox}
                className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span>🗑️</span>
                Box löschen
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}