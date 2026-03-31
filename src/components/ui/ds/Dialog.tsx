import React from 'react';
import { Card } from './Card';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Dialog = ({ isOpen, onClose, title, children }: DialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card variant="default" padding="lg" className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-neutral-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
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
