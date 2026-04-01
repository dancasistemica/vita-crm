import React from 'react';

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const Tooltip = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const TooltipTrigger = ({ children, asChild, ...props }: any) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, props);
  }
  return <div {...props}>{children}</div>;
};
export const TooltipContent = ({ children, ...props }: any) => null;