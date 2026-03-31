import React, { useState, useEffect } from 'react';

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs = ({ defaultValue, value, onValueChange, children, className = '' }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(value || defaultValue || '');

  useEffect(() => {
    if (value !== undefined) setActiveTab(value);
  }, [value]);

  const handleTabChange = (val: string) => {
    if (value === undefined) setActiveTab(val);
    if (onValueChange) onValueChange(val);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab: handleTabChange });
        }
        return child;
      })}
    </div>
  );
};

export const TabsList = ({ children, activeTab, setActiveTab, className = '' }: any) => (
  <div className={`flex border-b border-neutral-200 ${className}`}>
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab });
      }
      return child;
    })}
  </div>
);

export const TabsTrigger = ({ value, children, activeTab, setActiveTab, className = '' }: any) => (
  <button
    onClick={() => setActiveTab(value)}
    className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 -mb-px ${
      activeTab === value
        ? 'border-primary-500 text-primary-600'
        : 'border-transparent text-neutral-500 hover:text-neutral-700'
    } ${className}`}
  >
    {children}
  </button>
);

export const TabsContent = ({ value, children, activeTab, className = '' }: any) => {
  if (activeTab !== value) return null;
  return <div className={`py-4 ${className}`}>{children}</div>;
};
