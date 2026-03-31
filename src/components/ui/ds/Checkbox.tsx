import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col">
        <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
          <input
            type="checkbox"
            ref={ref}
            className={`
              w-4 h-4 rounded border-neutral-300 text-primary-600
              focus:ring-primary-500 focus:ring-offset-0
              transition-colors duration-200
              ${error ? 'border-error-500' : ''}
            `}
            {...props}
          />
          {label && <span className="text-sm font-medium text-neutral-700">{label}</span>}
        </label>
        {error && <p className="text-xs text-error-600 mt-1">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
