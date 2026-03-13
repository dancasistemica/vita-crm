import { useRef } from 'react';

/**
 * Hook reutilizável para salvar e restaurar posição do scroll.
 * Funciona com Radix UI Dialog que interfere no scroll.
 *
 * const { savePosition, restorePosition } = useScrollPosition('leads-page');
 * savePosition() antes de abrir modal
 * restorePosition() no onOpenChange quando open === false
 */
export function useScrollPosition(pageKey: string) {
  const scrollPositionRef = useRef<number>(0);

  const savePosition = () => {
    scrollPositionRef.current = window.scrollY;
  };

  const restorePosition = () => {
    const pos = scrollPositionRef.current;
    if (pos > 0) {
      // Radix Dialog restores focus/scroll asynchronously, so we need a small delay
      requestAnimationFrame(() => {
        window.scrollTo(0, pos);
      });
      scrollPositionRef.current = 0;
    }
  };

  return { savePosition, restorePosition };
}
