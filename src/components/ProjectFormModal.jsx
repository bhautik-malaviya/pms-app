import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiX } from 'react-icons/fi';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

const schema = yup.object().shape({
  title: yup.string().required('Title is required').min(3, 'Minimum 3 characters'),
  description: yup.string(),
  status: yup.object().shape({
    value: yup.string().required(),
    label: yup.string().required()
  }).required('Status is required'),
  startDate: yup.date().required('Start Date is required'),
  dueDate: yup.date().required('Due Date is required').min(yup.ref('startDate'), 'Due date cannot be before start date'),
  assignees: yup.array().of(yup.object().shape({
    value: yup.string().required(),
    label: yup.string().required()
  })).min(1, 'At least one assignee is required').nullable()
});

export default function ProjectFormModal({ isOpen, onClose, onSubmit, initialData, users = [], isAdmin = false }) {
  const userOptions = React.useMemo(() => users.map(u => ({ value: String(u.id), label: u.name || u.email })), [users]);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      status: statusOptions[0],
      startDate: new Date(),
      assignees: []
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const assignedUsers = initialData.assigneeIds
          ? initialData.assigneeIds.map(id => userOptions.find(u => u.value === String(id))).filter(Boolean)
          : [];
        reset({
          title: initialData.title || '',
          description: initialData.description || '',
          status: statusOptions.find(s => s.value === initialData.status) || statusOptions[0],
          startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
          dueDate: initialData.dueDate ? new Date(initialData.dueDate) : new Date(),
          assignees: assignedUsers
        });
      } else {
        reset({
          title: '',
          description: '',
          status: statusOptions[0],
          startDate: new Date(),
          dueDate: new Date(),
          assignees: []
        });
      }
    }
  }, [isOpen, initialData, reset, userOptions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {initialData ? 'Edit Project' : 'Add New Project'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <FiX className="text-xl" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <input
                {...register('title')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="Project Title"
              />
              {errors.title && <span className="text-red-500 text-xs mt-1 block">{errors.title.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Project description..."
              />
            </div>

            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignees *</label>
                <Controller
                  name="assignees"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      isClearable
                      isMulti
                      options={userOptions}
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{
                        control: (base) => ({ ...base, backgroundColor: 'transparent', borderColor: errors.assignees ? '#ef4444' : '#d1d5db', borderRadius: '0.5rem' }),
                        multiValue: (base) => ({ ...base, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px' }),
                        multiValueLabel: (base) => ({ ...base, color: '#3b82f6', fontWeight: '500' }),
                        multiValueRemove: (base) => ({ ...base, color: '#3b82f6', ':hover': { backgroundColor: '#3b82f6', color: 'white' } }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                      }}
                    />
                  )}
                />
                {errors.assignees && <span className="text-red-500 text-xs mt-1 block">{errors.assignees.message}</span>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={statusOptions}
                    classNamePrefix="react-select"
                    menuPortalTarget={document.body}
                    styles={{
                      control: (base) => ({ ...base, backgroundColor: 'transparent', borderColor: errors.status ? '#ef4444' : '#d1d5db', borderRadius: '0.5rem' }),
                      menuPortal: (base) => ({ ...base, zIndex: 9999 })
                    }}
                  />
                )}
              />
              {errors.status && <span className="text-red-500 text-xs mt-1 block">{errors.status.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={(date) => field.onChange(date)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white ${errors.startDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    dateFormat="MMMM d, yyyy"
                  />
                )}
              />
              {errors.startDate && <span className="text-red-500 text-xs mt-1 block">{errors.startDate.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={(date) => field.onChange(date)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white ${errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    dateFormat="MMMM d, yyyy"
                  />
                )}
              />
              {errors.dueDate && <span className="text-red-500 text-xs mt-1 block">{errors.dueDate.message}</span>}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
              {initialData ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
