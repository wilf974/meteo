import { useState, useEffect } from 'react';

/**
 * Hook pour détecter si l'utilisateur est sur mobile/tablet
 * Utilise matchMedia pour une meilleure performance qu'un listener resize
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    // Utiliser matchMedia pour une meilleure performance
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Vérifier le match initial
    handleChange(mediaQuery);

    // Écouter les changements
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook pour détecter les différentes tailles d'écran
 */
export function useBreakpoint() {
  const isMobile = useIsMobile(640); // sm
  const isTablet = useIsMobile(1024); // lg
  const isDesktop = !isTablet;

  return {
    isMobile,      // < 640px
    isTablet,      // < 1024px
    isDesktop,     // >= 1024px
    isSmallMobile: useIsMobile(480),  // < 480px
  };
}
