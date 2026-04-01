import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog';
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
            <Button variant={variant as any} onClick={onConfirm} loading={isLoading} className="flex-1">
              {confirmText}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
};

// Shims for compound components
export const AlertDialogContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  {children}
);

export const AlertDialogHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className="mb-4">{children}</div>
);

export const AlertDialogTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className="text-2xl font-semibold">{children}</h2>
);

export const AlertDialogDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <DialogDescription className={className}>{children}</DialogDescription>
);

export const AlertDialogFooter = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <DialogFooter className={className}>{children}</DialogFooter>
);

export const AlertDialogAction = ({ children, asChild, ...props }: any) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, props);
  }
  return <Button {...props}>{children}</Button>;
};

export const AlertDialogCancel = ({ children, asChild, ...props }: any) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, { variant: 'secondary', ...props });
  }
  return <Button variant="secondary" {...props}>{children}</Button>;
};

export const AlertDialogTrigger = ({ children, asChild, ...props }: any) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, props);
  }
  return <div {...props}>{children}</div>;
};
