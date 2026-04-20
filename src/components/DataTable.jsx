import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { FiLoader, FiInbox } from 'react-icons/fi';

export default function DataTable({ 
  columns, 
  data, 
  loading = false, 
  emptyMessage = "No data available" 
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <FiLoader className="animate-spin text-blue-500 text-3xl mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-xs uppercase font-medium text-gray-500 dark:text-gray-400">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-6 py-4">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr 
                key={row.id} 
                className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center justify-center">
                  <FiInbox className="text-4xl mb-3 text-gray-300 dark:text-gray-600" />
                  <p>{emptyMessage}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
