import { useEffect, useRef, useState, ReactNode } from 'react';
import { X } from 'lucide-react';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  height?: 'auto' | 'half' | 'full';
}

/**
 * Bottom Sheet moderne pour mobile
 * Pattern 2025 - Remplace les modals traditionnelles sur mobile
 */
export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  height = 'auto',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [translateY, setTranslateY] = useState(0);

  const swipeHandlers = useSwipeGesture({
    onSwipeDown: () => {
      if (translateY > 100) {
        onClose();
      }
    },
  }, { threshold: 50 });

  useEffect(() => {
    if (isOpen) {
      // Empêcher le scroll du body
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setTranslateY(0);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getMaxHeight = () => {
    switch (height) {
      case 'half':
        return '50vh';
      case 'full':
        return '90vh';
      default:
        return '70vh';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998] transition-opacity"
        style={{
          opacity: isOpen ? 1 : 0,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="bottom-sheet fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl z-[9999] transition-transform"
        style={{
          maxHeight: getMaxHeight(),
          transform: `translateY(${isOpen ? translateY : 100}%)`,
          transitionDuration: isDragging ? '0ms' : '300ms',
        }}
        {...swipeHandlers}
      >
        {/* Handle pour drag */}
        <div
          className="bottom-sheet-handle w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto my-3 cursor-grab active:cursor-grabbing"
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
        />

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          {children}
        </div>
      </div>
    </>
  );
}
