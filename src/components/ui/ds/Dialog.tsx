import React from 'react';
import { Card } from './Card';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  children?: React.ReactNode;
  modal?: boolean;
  className?: string;
  [key: string]: any; // Props adicionais
}

export const Dialog = ({ 
  isOpen, 
  open, 
  onClose, 
  onOpenChange, 
  title, 
  children, 
  className = '', 
  ...props 
}: DialogProps) => {
  const isCurrentlyOpen = open ?? isOpen;

  console.log('[Dialog] Inicializando com props:', {
    className,
    isOpen: isCurrentlyOpen,
    hasChildren: !!children,
    propsKeys: Object.keys(props),
  });

  // Validar props obrigatórias
  if (!props || typeof props !== 'object') {
    console.error('[Dialog] Props inválidas recebidas');
  }

  // Validar className
  const safeClassName = className && typeof className === 'string' ? className : '';

  const handleClose = () => {
    console.log('[Dialog] Fechando dialog');
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  if (!isCurrentlyOpen) {
    console.log('[Dialog] Dialog fechado, não renderizando');
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4"
      role="dialog"
      aria-modal="true"
    >
      <Card 
        variant="primary" 
        padding="md" 
        className={cn(
          "w-full max-w-xl relative max-h-[90vh] overflow-y-auto", 
          safeClassName.includes('overflow-visible') ? 'overflow-visible' : '', 
          safeClassName
        )}
        {...props}
      >
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 py-2">
          {title && <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>}
          <button
            onClick={handleClose}
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
            aria-label="Fechar dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="pb-2">
          {children}
        </div>
      </Card>
    </div>
  );
};

// Shims for compound components
export const DialogContent = ({ children, className = '' }: any) => (
  <div className={className}>{children}</div>
);
export const DialogHeader = ({ children, className = '' }: any) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);
export const DialogTitle = ({ children, className = '' }: any) => (
  <div className={`text-xl font-semibold ${className}`}>{children}</div>
);
export const DialogFooter = ({ children, className = '' }: any) => (
  <div className={`mt-6 flex justify-end gap-3 ${className}`}>{children}</div>
);
export const DialogTrigger = ({ children, asChild }: any) => children;
export const DialogDescription = ({ children, className = '' }: any) => (
  <p className={`text-sm text-neutral-500 mt-2 ${className}`}>{children}</p>
);
