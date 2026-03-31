import React, { useState } from 'react';

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

export const Tabs = ({ defaultValue, children, className = '' }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={`space-y-4 ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
};

export const TabsList = ({ children, activeTab, setActiveTab }: any) => (
  <div className="flex border-b border-neutral-200">
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab });
      }
      return child;
    })}
  </div>
);

export const TabsTrigger = ({ value, children, activeTab, setActiveTab }: any) => (
  <button
    onClick={() => setActiveTab(value)}
    className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 -mb-px ${
      activeTab === value
        ? 'border-primary-500 text-primary-600'
        : 'border-transparent text-neutral-500 hover:text-neutral-700'
    }`}
  >
    {children}
  </button>
);

export const TabsContent = ({ value, children, activeTab }: any) => {
  if (activeTab !== value) return null;
  return <div className="py-4">{children}</div>;
};
