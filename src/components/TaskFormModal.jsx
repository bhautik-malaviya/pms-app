import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiX } from 'react-icons/fi';

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

const customStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: 'transparent',
    borderColor: '#d1d5db',
    borderRadius: '0.5rem',
  }),
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
  menuPortal: (base) => ({ ...base, zIndex: 9999 })
};

const schema = yup.object().shape({
  title: yup.string().required('Title is required').min(3, 'Minimum 3 characters'),
  description: yup.string(),
  project: yup.object().shape({
    value: yup.string().required(),
    label: yup.string().required()
  }).required('Project is required'),
  assignee: yup.array().of(yup.object().shape({
    value: yup.string().required(),
    label: yup.string().required()
  })).min(1, 'At least one assignee is required').nullable(),
  priority: yup.object().required('Priority is required'),
  startDate: yup.date().required('Start Date is required'),
  dueDate: yup.date().required('Due Date is required').min(yup.ref('startDate'), 'Due date cannot be before start date'),
  status: yup.object().required('Status is required')
});

export default function TaskFormModal({ isOpen, onClose, onSubmit, initialData, projects, users }) {
  const currentUser = useSelector(state => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';
  const projectOptions = useMemo(() => projects.map(p => ({ value: p.id, label: p.title })), [projects]);
  const userOptions = useMemo(() => users.map(u => ({ value: u.id, label: u.name || u.email, role: u.role })), [users]);
  const assignableOptions = useMemo(() => isAdmin ? userOptions : userOptions.filter(u => u.role !== 'admin'), [isAdmin, userOptions]);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const assignedProject = projects.find(p => p.id === initialData.projectId);
        const assignedUsers = initialData.assigneeIds
          ? initialData.assigneeIds.map(id => userOptions.find(u => u.value === id)).filter(Boolean)
          : [];
        const currentAssignees = assignedUsers.length > 0 ? assignedUsers : (userOptions.find(u => u.value === currentUser?.id) ? [userOptions.find(u => u.value === currentUser?.id)] : []);

        reset({
          title: initialData.title || '',
          description: initialData.description || '',
          project: assignedProject ? { value: assignedProject.id, label: assignedProject.title } : null,
          assignee: currentAssignees || [],
          priority: priorityOptions.find(p => p.value === initialData.priority) || priorityOptions[1],
          status: statusOptions.find(s => s.value === initialData.status) || statusOptions[0],
          startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
          dueDate: initialData.dueDate ? new Date(initialData.dueDate) : new Date(),
        });
      } else {
        const defaultAssignees = isAdmin
          ? (userOptions.length ? [userOptions[0]] : [])
          : (userOptions.find(u => u.value === currentUser?.id) ? [userOptions.find(u => u.value === currentUser?.id)] : []);

        reset({
          title: '',
          description: '',
          project: projectOptions.length ? projectOptions[0] : null,
          assignee: defaultAssignees,
          priority: priorityOptions[1],
          status: statusOptions[0],
          startDate: new Date(),
          dueDate: new Date(),
        });
      }
    }
  }, [isOpen, initialData, projects, users, reset, projectOptions, userOptions, currentUser, isAdmin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {initialData ? 'Edit Task' : 'Add New Task'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <FiX className="text-xl" />
          </button>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="px-6 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium text-center">
            Please correct the errors before submitting.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <input
                {...register('title')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="Task Title"
              />
              {errors.title && <span className="text-red-500 text-xs mt-1 block">{errors.title.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Task description..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project *</label>
                <Controller
                  name="project"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      isClearable
                      options={projectOptions}
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{
                        control: (base) => ({ ...base, backgroundColor: 'transparent', borderColor: errors.project ? '#ef4444' : '#d1d5db', borderRadius: '0.5rem' }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                      }}
                    />
                  )}
                />
                {errors.project && <span className="text-red-500 text-xs mt-1 block">{errors.project.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignees *</label>
                <Controller
                  name="assignee"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      isClearable
                      isMulti
                      options={assignableOptions}
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{
                        control: (base) => ({ ...base, backgroundColor: 'transparent', borderColor: errors.assignee ? '#ef4444' : '#d1d5db', borderRadius: '0.5rem' }),
                        multiValue: (base) => ({ ...base, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px' }),
                        multiValueLabel: (base) => ({ ...base, color: '#3b82f6', fontWeight: '500' }),
                        multiValueRemove: (base) => ({ ...base, color: '#3b82f6', ':hover': { backgroundColor: '#3b82f6', color: 'white' } }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                      }}
                    />
                  )}
                />
                {errors.assignee && <span className="text-red-500 text-xs mt-1 block">{errors.assignee.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      isClearable
                      options={priorityOptions}
                      classNamePrefix="react-select"
                      styles={customStyles}
                      menuPortalTarget={document.body}
                    />
                  )}
                />
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
                      minDate={new Date()}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
                      dateFormat="MMMM d, yyyy"
                    />
                  )}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      isClearable
                      options={statusOptions}
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{
                        control: (base) => ({ ...base, backgroundColor: 'transparent', borderColor: '#d1d5db', borderRadius: '0.5rem' }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                      }}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
              {initialData ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
