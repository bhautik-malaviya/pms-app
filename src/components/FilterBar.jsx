import React from 'react';
import Select from 'react-select';
import { FiFilter, FiX } from 'react-icons/fi';

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: '#10B981' }, 
  { value: 'medium', label: 'Medium', color: '#F59E0B' }, 
  { value: 'high', label: 'High', color: '#EF4444' }, 
];

const sortOptions = [
  { value: 'dueDate-asc', label: 'Due Date (Closest)' },
  { value: 'dueDate-desc', label: 'Due Date (Furthest)' },
  { value: 'priority-desc', label: 'Priority (High → Low)' },
  { value: 'priority-asc', label: 'Priority (Low → High)' },
];

const selectStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: 'transparent',
    borderColor: '#d1d5db',
    borderRadius: '0.5rem',
    minWidth: '150px',
    fontSize: '0.875rem'
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 })
};

const customPriorityStyles = {
  ...selectStyles,
  option: (styles, { data, isFocused, isSelected }) => ({
    ...styles,
    backgroundColor: isSelected ? data.color : isFocused ? `${data.color}20` : 'transparent',
    color: isSelected ? 'white' : data.color,
    fontWeight: 'bold',
  }),
  singleValue: (styles, { data }) => ({
    ...styles,
    color: data.color,
    fontWeight: 'bold',
  }),
};

export default function FilterBar({ filters, onFilterChange, onClearFilters, activeCount, sortBy, onSortChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <FiFilter />
        Filters
        {activeCount > 0 && (
          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs py-0.5 px-2 rounded-full font-bold">
            {activeCount}
          </span>
        )}
      </div>

      <Select
        isClearable
        placeholder="Filter Status..."
        options={statusOptions}
        value={filters.status}
        onChange={(option) => onFilterChange('status', option)}
        classNamePrefix="react-select"
        styles={selectStyles}
        menuPortalTarget={document.body}
      />

      <Select
        isClearable
        placeholder="Filter Priority..."
        options={priorityOptions}
        value={filters.priority}
        onChange={(option) => onFilterChange('priority', option)}
        classNamePrefix="react-select"
        styles={customPriorityStyles}
        menuPortalTarget={document.body}
      />

      <Select
        isClearable
        placeholder="Sort By..."
        options={sortOptions}
        value={sortBy}
        onChange={onSortChange}
        classNamePrefix="react-select"
        styles={selectStyles}
        menuPortalTarget={document.body}
      />

      {activeCount > 0 && (
        <button
          onClick={onClearFilters}
          className="text-sm flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <FiX /> Clear
        </button>
      )}
    </div>
  );
}
