import React from 'react';
import { Button, Card } from './Card';
import { Button, X } from 'lucide-react';

interface DialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  modal?: boolean;
}

export const Dialog = ({ Button, isOpen, open, onClose, onOpenChange, title, children }: DialogProps) => {
  const isCurrentlyOpen = open ?? isOpen;
  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  if (!isCurrentlyOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card variant="default" padding="lg" className="w-full max-w-md relative">
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-2xl font-semibold text-neutral-900">{title}</h2>}
          <button
            onClick={handleClose}
            className="text-neutral-500 hover:text-neutral-700 transition-colors absolute right-4 top-4"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
};

// Shims for compound components
export const DialogContent = ({ Button, children, className = '' }: any) => (
  <div className={className}>{children}</div>
);
export const DialogHeader = ({ Button, children, className = '' }: any) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);
export const DialogTitle = ({ Button, children, className = '' }: any) => (
  <div className={`text-xl font-semibold ${className}`}>{children}</div>
);
export const DialogFooter = ({ Button, children, className = '' }: any) => (
  <div className={`mt-6 flex justify-end gap-3 ${className}`}>{children}</div>
);
export const DialogTrigger = ({ Button, children, asChild }: any) => children;
export const DialogDescription = ({ Button, children, className = '' }: any) => (
  <p className={`text-sm text-neutral-500 mt-2 ${className}`}>{children}</p>
);
