import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  interactive?: boolean;
}

const variantStyles = {
  default: 'bg-white border border-neutral-200 rounded-lg',
  elevated: 'bg-white rounded-lg shadow-md',
  outlined: 'bg-transparent border-2 border-primary-500 rounded-lg',
};

const paddingStyles = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      interactive = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${interactive ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
