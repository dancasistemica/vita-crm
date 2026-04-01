import React from 'react';

export const Table = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`w-full overflow-auto ${className}`} {...props}>
    <table className="w-full text-left border-collapse">
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={`bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold text-sm ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={`divide-y divide-neutral-100 ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', onClick, ...props }: { children: React.ReactNode; className?: string; onClick?: () => void } & React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr 
    onClick={onClick}
    className={`hover:bg-neutral-50 transition-colors duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead = ({ children, className = '', onClick, ...props }: { children: React.ReactNode; className?: string; onClick?: () => void } & React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th 
    onClick={onClick}
    className={`px-4 py-3 font-medium ${className} ${onClick ? 'cursor-pointer' : ''}`}
    {...props}
  >
    {children}
  </th>
);

export const TableCell = ({ children, className = '', onClick, ...props }: { children: React.ReactNode; className?: string; onClick?: (e: any) => void } & React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td 
    onClick={onClick}
    className={`px-4 py-3 text-sm ${className} ${onClick ? 'cursor-pointer' : ''}`}
    {...props}
  >
    {children}
  </td>
);
