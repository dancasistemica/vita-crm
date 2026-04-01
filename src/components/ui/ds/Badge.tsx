import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'neutral' | 'outline' | 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
}

const variantStyles = {
  default: 'bg-primary-50 text-primary-700 border-primary-200',
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  secondary: 'bg-neutral-50 text-neutral-700 border-neutral-200',
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  error: 'bg-error-50 text-error-700 border-error-200',
  neutral: 'bg-neutral-50 text-neutral-700 border-neutral-200',
  outline: 'bg-transparent text-neutral-600 border-neutral-300',
  ghost: 'bg-transparent text-neutral-500 border-transparent',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center font-medium border rounded-full
          ${variantStyles[variant as keyof typeof variantStyles] || variantStyles.default}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
