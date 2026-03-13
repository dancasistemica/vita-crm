import { useRef } from 'react';

/**
 * Hook para salvar e restaurar posição do scroll.
 * Compatível com Radix Dialog (incluindo fechamento por ESC/backdrop).
 */
export function useScrollPosition(pageKey: string) {
  const scrollPositionRef = useRef<number>(0);
  const isRestoringRef = useRef<boolean>(false);

  const applyScroll = (position: number) => {
    window.scrollTo({ top: position, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = position;
    document.body.scrollTop = position;
  };

  const savePosition = () => {
    scrollPositionRef.current =
      window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    console.log(`[useScrollPosition] ✅ SALVO (${pageKey}): ${scrollPositionRef.current}px`);
  };

  const restorePosition = () => {
    if (isRestoringRef.current) {
      console.log(`[useScrollPosition] ⏭️ RESTORE ignorado (${pageKey}): já em progresso`);
      return;
    }

    const savedPosition = scrollPositionRef.current;
    if (savedPosition <= 0) {
      console.log(`[useScrollPosition] ℹ️ RESTORE ignorado (${pageKey}): sem posição salva`);
      return;
    }

    isRestoringRef.current = true;
    console.log(`[useScrollPosition] 🔄 RESTAURANDO (${pageKey}): ${savedPosition}px`);

    applyScroll(savedPosition);
    requestAnimationFrame(() => {
      applyScroll(savedPosition);
      requestAnimationFrame(() => {
        applyScroll(savedPosition);
        scrollPositionRef.current = 0;
        isRestoringRef.current = false;
        console.log(`[useScrollPosition] ✅ RESTAURADO (${pageKey}): ${savedPosition}px`);
      });
    });
  };

  return { savePosition, restorePosition };
}

