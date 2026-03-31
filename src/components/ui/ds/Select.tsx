import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-4 py-3 text-lg',
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      size = 'md',
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
          <select
            ref={ref}
            disabled={disabled}
            required={required}
            className={`
              ${sizeStyles[size]}
              w-full
              bg-white
              border border-neutral-300
              rounded-lg
              appearance-none
              focus:outline-none
              focus:ring-2
              focus:ring-primary-500
              focus:border-transparent
              transition-colors duration-200
              disabled:bg-neutral-100
              disabled:text-neutral-500
              disabled:cursor-not-allowed
              pr-10
              min-h-[44px] md:min-h-auto
              ${error ? 'border-error-500 focus:ring-error-500' : ''}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="">{placeholder}</option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
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

Select.displayName = 'Select';
