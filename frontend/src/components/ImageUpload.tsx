import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Clipboard } from 'lucide-react';
import { filesApi } from '../services/api';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  images, 
  onImagesChange, 
  maxImages = 5 
}) => {
  const [uploading, setUploading] = useState(false);
  const [pasteSupported, setPasteSupported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Sprawdzenie limitu zdjęć
    if (images.length + files.length > maxImages) {
      alert(`Możesz dodać maksymalnie ${maxImages} zdjęć`);
      return;
    }

    setUploading(true);
    try {
      console.log('=== IMAGE UPLOAD DEBUG ===');
      console.log('Uploading files:', files);
      const response = await filesApi.upload(files);
      console.log('Upload response:', response.data);
      const newImages = [...images, ...response.data.files];
      console.log('New images array:', newImages);
      onImagesChange(newImages);
    } catch (error: any) {
      console.error('Błąd podczas uploadu:', error);
      alert(error.response?.data?.error || 'Błąd podczas uploadu zdjęć');
    } finally {
      setUploading(false);
      // Resetowanie input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (imageToRemove: string) => {
    try {
      await filesApi.delete(imageToRemove);
      const newImages = images.filter(img => img !== imageToRemove);
      onImagesChange(newImages);
    } catch (error) {
      console.error('Błąd podczas usuwania zdjęcia:', error);
      // Usuń z listy nawet jeśli nie udało się usunąć z serwera
      const newImages = images.filter(img => img !== imageToRemove);
      onImagesChange(newImages);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Sprawdzenie czy przeglądarka obsługuje wklejanie
  useEffect(() => {
    const checkPasteSupport = () => {
      setPasteSupported(!!navigator.clipboard?.read);
    };
    checkPasteSupport();
  }, []);

  // Obsługa wklejania ze schowka
  const handlePaste = async (event: ClipboardEvent) => {
    event.preventDefault();
    
    if (images.length >= maxImages) {
      alert(`Możesz dodać maksymalnie ${maxImages} zdjęć`);
      return;
    }

    const items = event.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length === 0) return;

    setUploading(true);
    try {
      // Konwersja File[] na FileList
      const dataTransfer = new DataTransfer();
      imageFiles.forEach(file => dataTransfer.items.add(file));
      
      const response = await filesApi.upload(dataTransfer.files);
      const newImages = [...images, ...response.data.files];
      onImagesChange(newImages);
    } catch (error: any) {
      console.error('Błąd podczas wklejania:', error);
      alert(error.response?.data?.error || 'Błąd podczas wklejania zdjęć');
    } finally {
      setUploading(false);
    }
  };

  // Dodanie event listenera dla wklejania
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('paste', handlePaste);
    return () => {
      container.removeEventListener('paste', handlePaste);
    };
  }, [images, maxImages]);

  return (
    <div ref={containerRef} className="space-y-3" tabIndex={0}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Zdjęcia ({images.length}/{maxImages})
      </label>
      
      {/* Upload Buttons */}
      {images.length < maxImages && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={triggerFileSelect}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-[#404040] rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 text-gray-700 dark:text-gray-300"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Dodaj zdjęcia</span>
              </>
            )}
          </button>
          
          {pasteSupported && (
            <button
              type="button"
              onClick={() => {
                // Fokus na kontenerze, żeby wklejanie działało
                containerRef.current?.focus();
                alert('Kliknij tutaj i wklej zdjęcie (Ctrl+V)');
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-gray-700 dark:text-gray-300"
            >
              <Clipboard size={16} />
              <span>Wklej</span>
            </button>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={filesApi.getImageUrl(image)}
                alt={`Zdjęcie ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-[#404040]"
                onError={(e) => {
                  // Fallback jeśli zdjęcie się nie załaduje
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              
              {/* Fallback icon */}
              <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#212121] rounded-lg border border-gray-200 dark:border-[#404040]">
                <ImageIcon size={20} className="text-gray-400 dark:text-gray-500" />
              </div>
              
              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeImage(image)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Dozwolone formaty: JPG, PNG, GIF, WebP. Maksymalny rozmiar: 5MB na zdjęcie.
        {pasteSupported && " Możesz też wkleić zdjęcie ze schowka (Ctrl+V)."}
      </p>
    </div>
  );
};

export default ImageUpload;
