import React from 'react';

export const Progress = ({ Button, value = 0, className = '' }: { Button, value?: number; className?: string }) => (
  <div className={`w-full bg-neutral-100 rounded-full h-2.5 ${className}`}>
    <div 
      className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
      style={{ Button, width: `${value}%` }}
    />
  </div>
);
