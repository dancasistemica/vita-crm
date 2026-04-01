import React from 'react';

// Compatibility components to ensure build passes
export const Calendar = ({ ...props }: any) => (
  <div className="p-3 border rounded-md bg-white">
    <input type="date" className="w-full text-sm border-neutral-300 rounded-md" {...props} />
  </div>
);

export const ToggleGroup = ({ children, className = '', ...props }: any) => (
  <div className={`flex items-center gap-1 p-1 bg-neutral-100 rounded-lg ${className}`} {...props}>
    {children}
  </div>
);

export const ToggleGroupItem = ({ children, className = '', ...props }: any) => (
  <button className={`px-3 py-1 text-sm font-medium rounded-md hover:bg-white transition-all ${className}`} {...props}>
    {children}
  </button>
);

export const DropdownMenu = ({ children }: any) => <div className="relative inline-block text-left">{children}</div>;
export const DropdownMenuTrigger = ({ children, asChild }: any) => <div className="cursor-pointer">{children}</div>;
export const DropdownMenuContent = ({ children, className = '' }: any) => (
  <div className={`absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${className}`}>
    <div className="py-1">{children}</div>
  </div>
);
export const DropdownMenuItem = ({ children, onClick, className = '' }: any) => (
  <button
    onClick={onClick}
    className={`block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 ${className}`}
  >
    {children}
  </button>
);
export const DropdownMenuLabel = ({ children }: any) => <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase">{children}</div>;
export const DropdownMenuSeparator = () => <div className="h-px bg-neutral-100 my-1" />;

export const Slider = (props: any) => (
  <input type="range" className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600" {...props} />
)

export const Collapsible = ({ children }: any) => <div>{children}</div>;
export const CollapsibleTrigger = ({ children }: any) => <div className="cursor-pointer">{children}</div>;
export const CollapsibleContent = ({ children }: any) => <div>{children}</div>;

export const Sheet = ({ open, onOpenChange, children }: any) => open ? (
  <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50">
    <div className="w-full max-w-md bg-white h-full shadow-xl p-6 relative overflow-y-auto">
      <button onClick={() => onOpenChange(false)} className="absolute right-4 top-4 p-2 text-2xl">×</button>
      {children}
    </div>
  </div>
) : null;
export const SheetContent = ({ children, className = '' }: any) => <div className={className}>{children}</div>;
export const SheetHeader = ({ children, className = '' }: any) => <div className={`mb-4 ${className}`}>{children}</div>;
export const SheetTitle = ({ children, className = '' }: any) => <h2 className={`text-xl font-bold ${className}`}>{children}</h2>;
export const SheetTrigger = ({ children, asChild }: any) => children;
export const SheetDescription = ({ children, className = '' }: any) => <p className={`text-sm text-neutral-500 ${className}`}>{children}</p>;

export const Switch = ({ checked, onCheckedChange, ...props }: any) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={e => onCheckedChange(e.target.checked)} className="sr-only peer" {...props} />
    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
  </label>
);

export const Command = ({ children }: any) => <div>{children}</div>;
export const CommandInput = (props: any) => <input className="w-full p-2 border-b" {...props} />;
export const CommandList = ({ children }: any) => <div>{children}</div>;
export const CommandEmpty = ({ children }: any) => <div className="p-4 text-center text-sm text-neutral-500">{children}</div>;
export const CommandGroup = ({ children, heading }: any) => (
  <div className="p-2">
    {heading && <div className="px-2 mb-1 text-xs font-semibold text-neutral-400 uppercase">{heading}</div>}
    {children}
  </div>
);
export const CommandItem = ({ children, onSelect }: any) => (
  <div onClick={onSelect} className="px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-neutral-100">{children}</div>
);

export const Accordion = ({ children }: any) => <div className="space-y-2">{children}</div>;
export const AccordionItem = ({ children }: any) => <div className="border border-neutral-200 rounded-lg">{children}</div>;
export const AccordionTrigger = ({ children, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 font-medium text-left">
    {children}
  </button>
);
export const AccordionContent = ({ children }: any) => <div className="p-4 pt-0 border-t border-neutral-100">{children}</div>;
