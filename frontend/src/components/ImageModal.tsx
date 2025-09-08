import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
}) => {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [imageRetries, setImageRetries] = useState<Map<number, number>>(new Map());
  // Obsługa klawiatury
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (currentIndex > 0) {
            onIndexChange(currentIndex - 1);
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (currentIndex < images.length - 1) {
            onIndexChange(currentIndex + 1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onIndexChange]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const goToPrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  const handleImageError = (index: number) => {
    const currentRetries = imageRetries.get(index) || 0;
    
    if (currentRetries < 3) {
      // Retry loading the image
      setTimeout(() => {
        setImageRetries(prev => new Map(prev.set(index, currentRetries + 1)));
        setImageErrors(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }, 1000 * (currentRetries + 1)); // Exponential backoff
    } else {
      // Mark as permanently failed
      setImageErrors(prev => new Set(prev.add(index)));
    }
  };

  const retryImage = (index: number) => {
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    setImageRetries(prev => new Map(prev.set(index, 0)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      {/* Przycisk zamknięcia */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
        aria-label="Zamknij"
      >
        <X size={24} />
      </button>

      {/* Przycisk poprzedniego zdjęcia */}
      {images.length > 1 && currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          aria-label="Poprzednie zdjęcie"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Przycisk następnego zdjęcia */}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          aria-label="Następne zdjęcie"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Zdjęcie */}
      <div className="max-w-full max-h-full p-8">
        {imageErrors.has(currentIndex) ? (
          <div className="flex flex-col items-center justify-center text-white text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <div className="text-xl mb-2">Błąd ładowania zdjęcia</div>
            <div className="text-sm mb-4 opacity-75">
              Zdjęcie nie mogło zostać załadowane. Może to być problem z połączeniem lub serwerem.
            </div>
            <button
              onClick={() => retryImage(currentIndex)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              Spróbuj ponownie
            </button>
          </div>
        ) : (
          <img
            src={currentImage}
            alt={`Zdjęcie ${currentIndex + 1} z ${images.length}`}
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: '90vh' }}
            onError={() => handleImageError(currentIndex)}
            onLoad={() => {
              // Clear any previous errors when image loads successfully
              setImageErrors(prev => {
                const newSet = new Set(prev);
                newSet.delete(currentIndex);
                return newSet;
              });
            }}
          />
        )}
        {(imageRetries.get(currentIndex) || 0) > 0 && !imageErrors.has(currentIndex) && (
          <div className="absolute top-4 left-4 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            Próba {imageRetries.get(currentIndex) || 0}/3
          </div>
        )}
      </div>

      {/* Licznik zdjęć */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Kliknięcie w tło zamyka modal */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Zamknij modal"
      />
    </div>
  );
};

export default ImageModal;
