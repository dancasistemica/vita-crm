import React from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ Button, label, error, className = '', onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) onCheckedChange(e.target.checked);
      if (onChange) onChange(e);
    };

    return (
      <div className="flex flex-col">
        <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
          <input
            type="checkbox"
            ref={ref}
            onChange={handleChange}
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
