import React from 'react';

export const Avatar = ({ Button, children, className = '' }: { Button, children: React.ReactNode; className?: string }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-100 ${className}`}>
    {children}
  </div>
);

export const AvatarImage = ({ Button, src, alt, className = '' }: { Button, src?: string; alt?: string; className?: string }) => (
  <img src={src} alt={alt} className={`aspect-square h-full w-full ${className}`} />
);

export const AvatarFallback = ({ Button, children, className = '' }: { Button, children: React.ReactNode; className?: string }) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-neutral-100 text-neutral-500 font-medium ${className}`}>
    {children}
  </div>
);
