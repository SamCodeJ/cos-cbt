import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Responsive table wrapper that provides better mobile experience
 * On desktop: Normal table
 * On mobile: Stacked card layout
 */
export function ResponsiveTableWrapper({ children, className }) {
  return (
    <div className={cn("rounded-lg border border-slate-200 overflow-hidden", className)}>
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

/**
 * Mobile-friendly table card layout
 * Use this for complex tables that are hard to view on mobile
 */
export function MobileTableCard({ data, columns, renderActions }) {
  return (
    <div className="space-y-4 md:hidden">
      {data.map((item, index) => (
        <div key={index} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="flex justify-between items-start gap-4">
              <span className="text-sm font-medium text-slate-600 min-w-[100px]">
                {column.header}:
              </span>
              <span className="text-sm text-slate-900 text-right flex-1">
                {column.cell(item)}
              </span>
            </div>
          ))}
          {renderActions && (
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              {renderActions(item)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ResponsiveTableWrapper;

