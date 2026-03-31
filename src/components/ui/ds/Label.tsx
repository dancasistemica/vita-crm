import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = ({ children, required, className = '', ...props }: LabelProps) => {
  return (
    <label
      className={`block text-sm font-medium text-neutral-700 mb-2 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-error-500 ml-1">*</span>}
    </label>
  );
};
