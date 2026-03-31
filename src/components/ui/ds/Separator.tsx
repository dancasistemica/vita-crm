import React from 'react';

export const Separator = ({ className = '', orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) => (
  <div 
    className={`bg-neutral-200 ${orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full'} ${className}`} 
  />
);
