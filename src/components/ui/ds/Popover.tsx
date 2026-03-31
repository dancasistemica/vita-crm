import React, { useState } from 'react';

export const Popover = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative inline-block">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { isOpen, setIsOpen });
        }
        return child;
      })}
    </div>
  );
};

export const PopoverTrigger = ({ children, setIsOpen }: any) => {
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: any) => {
        setIsOpen((v: boolean) => !v);
        if (children.props.onClick) children.props.onClick(e);
      }
    });
  }
  return <div onClick={() => setIsOpen((v: boolean) => !v)}>{children}</div>;
};

export const PopoverContent = ({ children, isOpen, className = '' }: any) => {
  if (!isOpen) return null;
  return (
    <div className={`absolute z-50 mt-2 p-4 bg-white border border-neutral-200 rounded-lg shadow-lg ${className}`}>
      {children}
    </div>
  );
};
