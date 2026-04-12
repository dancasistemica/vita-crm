import React from 'react';
import { Card } from './Card';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  modal?: boolean;
  className?: string;
}

export const Dialog = ({ isOpen, open, onClose, onOpenChange, title, children, className }: DialogProps) => {
  const isCurrentlyOpen = open ?? isOpen;
  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  if (!isCurrentlyOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <Card variant="primary" padding="md" className={cn("w-full max-w-xl relative max-h-[90vh] overflow-y-auto", className)}>
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 py-2">
          {title && <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>}
          <button
            onClick={handleClose}
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
            aria-label="Fechar"
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
