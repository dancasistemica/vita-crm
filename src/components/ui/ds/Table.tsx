import React from 'react';

export const Table = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`w-full overflow-auto ${className}`}>
    <table className="w-full text-left border-collapse">
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold text-sm">
    {children}
  </thead>
);

export const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="divide-y divide-neutral-100">
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <tr 
    onClick={onClick}
    className={`hover:bg-neutral-50 transition-colors duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </tr>
);

export const TableHead = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-4 py-3 font-medium ${className}`}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: (e: any) => void }) => (
  <td 
    onClick={onClick}
    className={`px-4 py-3 text-sm ${className}`}
  >
    {children}
  </td>
);
