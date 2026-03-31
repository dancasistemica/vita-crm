import React, { Button, useState, useEffect } from 'react';

export const Popover = ({ Button, open, onOpenChange, children }: any) => {
  const [isOpen, setIsOpen] = useState(open || false);

  useEffect(() => {
    if (open !== undefined) setIsOpen(open);
  }, [open]);

  const handleOpenChange = (val: boolean) => {
    if (open === undefined) setIsOpen(val);
    if (onOpenChange) onOpenChange(val);
  };
  
  return (
    <div className="relative inline-block">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { Button, isOpen, setIsOpen: handleOpenChange });
        }
        return child;
      })}
    </div>
  );
};

export const PopoverTrigger = ({ Button, children, setIsOpen }: any) => {
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

export const PopoverContent = ({ Button, children, isOpen, className = '' }: any) => {
  if (!isOpen) return null;
  return (
    <div className={`absolute z-50 mt-2 p-4 bg-white border border-neutral-200 rounded-lg shadow-lg ${className}`}>
      {children}
    </div>
  );
};
