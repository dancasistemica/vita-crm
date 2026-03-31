import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const sizeStyles = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-4 py-3 text-lg',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      icon,
      className = '',
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            required={required}
            className={`
              ${sizeStyles[size]}
              ${icon ? 'pl-10' : ''}
              w-full
              bg-white
              border border-neutral-300
              rounded-lg
              focus:outline-none
              focus:ring-2
              focus:ring-primary-500
              focus:border-transparent
              transition-colors duration-200
              disabled:bg-neutral-100
              disabled:text-neutral-500
              disabled:cursor-not-allowed
              min-h-[44px] md:min-h-auto
              ${error ? 'border-error-500 focus:ring-error-500' : ''}
              ${className}
            `}
            {...props}
          />
        </div>

        {error && (
          <p className="text-sm text-error-600 mt-2">{error}</p>
        )}

        {helperText && !error && (
          <p className="text-sm text-neutral-500 mt-2">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
