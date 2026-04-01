import React from 'react';
import { Textarea } from "@/components/ui/ds";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-2 border border-neutral-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary-500
            focus:border-transparent transition-colors duration-200
            disabled:bg-neutral-100 disabled:text-neutral-500
            ${error ? 'border-error-500 focus:ring-error-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-error-600 mt-2">{error}</p>}
        {helperText && !error && <p className="text-sm text-neutral-500 mt-2">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
