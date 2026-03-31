import React from 'react';

export const Skeleton = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`animate-pulse bg-neutral-200 rounded ${className}`} {...props} />
);
