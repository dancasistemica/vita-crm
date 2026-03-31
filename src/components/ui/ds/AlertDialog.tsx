import React from 'react';
import { Button, Dialog } from './Dialog';
import { Button } from './Button';

interface AlertDialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'error';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const AlertDialog = ({
  isOpen,
  open,
  onClose,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary',
  isLoading = false,
  children
}: AlertDialogProps) => {
  const isCurrentlyOpen = open ?? isOpen;
  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  if (!isCurrentlyOpen) return null;

  return (
    <Dialog isOpen={isCurrentlyOpen} onClose={handleClose} title={title}>
      {children ? children : (
        <div className="space-y-4">
          <div className="text-neutral-600">
            {description}
          </div>
          <div className="flex gap-3 pt-4 border-t border-neutral-100">
            <Button variant="secondary" onClick={handleClose} disabled={isLoading} className="flex-1">
              {cancelText}
            </Button>
            <Button variant={variant} onClick={onConfirm} isLoading={isLoading} className="flex-1">
              {confirmText}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
};

// Shims for compound components
export const AlertDialogContent = ({ Button, children }: { Button, children: React.ReactNode }) => <div>{children}</div>;
export const AlertDialogHeader = ({ Button, children }: { Button, children: React.ReactNode }) => <div className="mb-4">{children}</div>;
export const AlertDialogTitle = ({ Button, children }: { Button, children: React.ReactNode }) => <div className="text-xl font-semibold">{children}</div>;
export const AlertDialogDescription = ({ Button, children }: { Button, children: React.ReactNode }) => <p className="text-sm text-neutral-500 mt-2">{children}</p>;
export const AlertDialogFooter = ({ Button, children, className = '' }: { Button, children: React.ReactNode; className?: string }) => <div className={`mt-6 flex justify-end gap-3 ${className}`}>{children}</div>;
export const AlertDialogAction = ({ Button, children, asChild }: any) => children;
export const AlertDialogCancel = ({ Button, children, asChild }: any) => children;
export const AlertDialogTrigger = ({ Button, children, asChild }: any) => children;
