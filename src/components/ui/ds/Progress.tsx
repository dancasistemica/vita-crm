import React from 'react';

export const Progress = ({ value = 0, className = '' }: { value?: number; className?: string }) => (
  <div className={`w-full bg-neutral-100 rounded-full h-2.5 ${className}`}>
    <div 
      className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
      style={{ width: `${value}%` }}
    />
  </div>
);
