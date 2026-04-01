import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  icon?: React.ReactNode;
}

const variantStyles = {
  info: 'bg-primary-50 text-primary-700 border-primary-200',
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  error: 'bg-error-50 text-error-700 border-error-200',
};

const icons = {
  info: <Info className="w-5 h-5 text-primary-500" />,
  success: <CheckCircle className="w-5 h-5 text-success-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning-500" />,
  error: <AlertCircle className="w-5 h-5 text-error-500" />,
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'info', title, icon, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          flex gap-3 p-4 border rounded-lg
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      >
        <div className="shrink-0">{icon || icons[variant]}</div>
        <div>
          {title && <h5 className="font-semibold mb-1">{title}</h5>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export const AlertTitle = ({ children, className = '' }: any) => (
  <h5 className={`font-semibold mb-1 ${className}`}>{children}</h5>
);

export const AlertDescription = ({ children, className = '' }: any) => (
  <div className={`text-sm opacity-90 ${className}`}>{children}</div>
);
