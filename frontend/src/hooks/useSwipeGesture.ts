import { useRef, useCallback, useEffect } from 'react';
import type { TouchEvent as ReactTouchEvent, MouseEvent as ReactMouseEvent } from 'react';

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number; // Minimum distance pour déclencher le swipe (px)
  preventDefaultTouchmoveEvent?: boolean;
  trackMouse?: boolean; // Support du drag avec la souris
}

/**
 * Hook pour gérer les swipe gestures sur mobile
 * Best practice 2025 pour les interactions tactiles
 */
export function useSwipeGesture(
  callbacks: SwipeCallbacks,
  options: SwipeOptions = {}
) {
  const {
    threshold = 50,
    preventDefaultTouchmoveEvent = false,
    trackMouse = false,
  } = options;

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  const handleSwipe = useCallback(() => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;

    // Déterminer la direction du swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Swipe horizontal
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && callbacks.onSwipeRight) {
          callbacks.onSwipeRight();
        } else if (deltaX < 0 && callbacks.onSwipeLeft) {
          callbacks.onSwipeLeft();
        }
      }
    } else {
      // Swipe vertical
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0 && callbacks.onSwipeDown) {
          callbacks.onSwipeDown();
        } else if (deltaY < 0 && callbacks.onSwipeUp) {
          callbacks.onSwipeUp();
        }
      }
    }
  }, [callbacks, threshold]);

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
    touchStartY.current = e.changedTouches[0].screenY;
  }, []);

  const handleTouchMove = useCallback(
    (e: ReactTouchEvent) => {
      if (preventDefaultTouchmoveEvent) {
        e.preventDefault();
      }
    },
    [preventDefaultTouchmoveEvent]
  );

  const handleTouchEnd = useCallback(
    (e: ReactTouchEvent) => {
      touchEndX.current = e.changedTouches[0].screenX;
      touchEndY.current = e.changedTouches[0].screenY;
      handleSwipe();
    },
    [handleSwipe]
  );

  // Support de la souris pour le dev/desktop
  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    if (!trackMouse) return;
    touchStartX.current = e.screenX;
    touchStartY.current = e.screenY;
  }, [trackMouse]);

  const handleMouseUp = useCallback(
    (e: ReactMouseEvent) => {
      if (!trackMouse) return;
      touchEndX.current = e.screenX;
      touchEndY.current = e.screenY;
      handleSwipe();
    },
    [trackMouse, handleSwipe]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    ...(trackMouse && {
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
    }),
  };
}

/**
 * Hook pour détecter le pull-to-refresh
 * Pattern moderne 2025
 */
export function usePullToRefresh(onRefresh: () => void | Promise<void>) {
  const startY = useRef<number>(0);
  const pulling = useRef<boolean>(false);
  const threshold = 80; // Distance pour trigger le refresh

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Seulement si on est en haut de la page
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    // Si on tire vers le bas
    if (distance > 0 && distance < threshold * 2) {
      // Empêcher le scroll natif pendant le pull
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(
    async (e: TouchEvent) => {
      if (!pulling.current) return;

      const endY = e.changedTouches[0].clientY;
      const distance = endY - startY.current;

      if (distance > threshold) {
        // Trigger le refresh
        await onRefresh();
      }

      pulling.current = false;
    },
    [onRefresh, threshold]
  );

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { pulling: pulling.current };
}
