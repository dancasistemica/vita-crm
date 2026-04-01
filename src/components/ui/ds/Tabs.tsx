import React, { useState, useEffect, createContext, useContext } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

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
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={`space-y-4 ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = '' }: any) => (
  <div className={`flex border-b border-neutral-200 ${className}`}>
    {children}
  </div>
);

export const TabsTrigger = ({ value, children, className = '' }: any) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within a Tabs component');
  
  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 -mb-px ${
        isActive
          ? 'border-primary-500 text-primary-600'
          : 'border-transparent text-neutral-500 hover:text-neutral-700'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className = '' }: any) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within a Tabs component');
  
  if (context.activeTab !== value) return null;
  return <div className={`py-4 ${className}`}>{children}</div>;
};
