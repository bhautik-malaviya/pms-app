import React from 'react';
import { FiSearch } from 'react-icons/fi';

export default function SearchBar({ value, onChange, searchInputRef }) {
  return (
    <div className="relative w-full sm:w-64">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Search tasks..."
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-gray-100"
      />
    </div>
  );
}
