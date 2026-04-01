import React from 'react';

export const ScrollArea = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`overflow-auto ${className}`} {...props}>
    {children}
  </div>
);

export const ScrollBar = ({ orientation, ...props }: any) => null;
