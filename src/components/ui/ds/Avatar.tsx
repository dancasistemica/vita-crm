import React from 'react';

export const Avatar = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-100 ${className}`}>
    {children}
  </div>
);

export const AvatarImage = ({ src, alt, className = '' }: { src?: string; alt?: string; className?: string }) => {
  if (!src) return null;
  return (
    <img src={src} alt={alt} className={`aspect-square h-full w-full object-cover ${className}`} 
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};

export const AvatarFallback = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-neutral-100 text-neutral-500 font-medium ${className}`}>
    {children}
  </div>
);
