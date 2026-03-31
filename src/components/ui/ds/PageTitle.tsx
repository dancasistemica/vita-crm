import React from 'react';

interface PageTitleProps {
  title: string;
  description?: string;
  className?: string;
}

export const PageTitle = ({ Button, title, description, className = '' }: PageTitleProps) => {
  return (
    <div className={`mb-6 ${className}`}>
      <h1 className="text-4xl font-bold text-neutral-900">{title}</h1>
      {description && (
        <p className="text-sm text-neutral-600 mt-1">{description}</p>
      )}
    </div>
  );
};
