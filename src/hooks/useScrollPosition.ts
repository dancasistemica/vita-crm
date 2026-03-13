import { useRef } from 'react';

export function useScrollPosition(pageKey: string) {
  const scrollPositionRef = useRef<number>(0);

  const savePosition = () => {
    scrollPositionRef.current = window.scrollY;
    console.log(`[useScrollPosition] ✅ SALVO (${pageKey}): ${scrollPositionRef.current}px`);
  };

  const restorePosition = () => {
    const savedPosition = scrollPositionRef.current;
    if (savedPosition > 0) {
      window.scrollTo(0, savedPosition);
      console.log(`[useScrollPosition] ✅ RESTAURADO (${pageKey}): ${savedPosition}px`);
    }
  };

  return { savePosition, restorePosition };
}
