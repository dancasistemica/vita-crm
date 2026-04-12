import React from 'react';

interface PageTitleProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const PageTitle = ({ title, description, icon, className = '' }: PageTitleProps) => {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && <div className="shrink-0">{icon}</div>}
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">{title}</h1>
      </div>
      {description && (
        <p className="text-sm text-neutral-600 mt-2">{description}</p>
      )}
    </div>
  );
};
