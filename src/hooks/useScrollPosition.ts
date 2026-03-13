import { useEffect, useRef } from 'react';

/**
 * Hook reutilizável para salvar e restaurar posição do scroll.
 * Uso: const { savePosition } = useScrollPosition('leads-page');
 * Chamar savePosition() ANTES de abrir modal.
 * Ao fechar, posição é restaurada automaticamente.
 */
export function useScrollPosition(pageKey: string) {
  const savedPosition = useRef<number | null>(null);

  useEffect(() => {
    if (savedPosition.current !== null) {
      const pos = savedPosition.current;
      savedPosition.current = null;
      setTimeout(() => {
        window.scrollTo({ top: pos, behavior: 'auto' });
      }, 0);
    }
  });

  const savePosition = () => {
    savedPosition.current = window.scrollY;
  };

  return { savePosition };
}
