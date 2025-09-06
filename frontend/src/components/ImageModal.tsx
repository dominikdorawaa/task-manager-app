import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

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
        <img
          src={currentImage}
          alt={`Zdjęcie ${currentIndex + 1} z ${images.length}`}
          className="max-w-full max-h-full object-contain"
          style={{ maxHeight: '90vh' }}
        />
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
