import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiLoader } from 'react-icons/fi';
import { format } from 'date-fns';

import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import SearchBar from '../components/SearchBar';
import TaskFormModal from '../components/TaskFormModal';
import axiosInstance from '../api/axiosInstance';
import { getAllProjects } from '../api/projectsApi';
import { getAllTasks, createTask, updateTask, deleteTask } from '../api/tasksApi';
import { getAllUsers } from '../api/usersApi';
import useDebounce from '../hooks/useDebounce';

const statusOptions = [
  { value: 'todo', label: 'To Do', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', color: '#3B82F6' },
  { value: 'in-progress', label: 'In Progress', bg: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300', color: '#0EA5E9' },
  { value: 'review', label: 'Review', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', color: '#8B5CF6' },
  { value: 'done', label: 'Done', bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', color: '#10B981' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: '#10B981' }, 
  { value: 'medium', label: 'Medium', color: '#F59E0B' }, 
  { value: 'high', label: 'High', color: '#EF4444' }, 
];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState({}); 
  const [statusUpdatingIds, setStatusUpdatingIds] = useState({});
  
  const [editingId, setEditingId] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = useSelector(state => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';
  const [sortBy, setSortBy] = useState(null);
  const [filters, setFilters] = useState({
    status: null,
    priority: null
  });

  const location = useLocation();

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const searchInputRef = useRef(null);


  useEffect(() => {
    document.title = 'Tasks | ProTask';

    const fetchRefs = async () => {
      try {
        const [projectsData, usersData] = await Promise.all([
          getAllProjects(),
          getAllUsers()
        ]);
        
        const filteredProjects = isAdmin ? projectsData : projectsData.filter(project => project.assigneeIds?.includes(String(currentUser?.id)));
        
        setProjects(filteredProjects);
        setUsers(usersData);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load references');
      }
    };

    fetchRefs();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdmin, currentUser]);

  useEffect(() => {
    const fetchTasksData = async () => {
      setIsLoading(true);
      try {
        const params = {};
        
        if (filters.status) params.status = filters.status.value;
        if (filters.status) params.status = filters.status.value;
        if (filters.priority) params.priority = filters.priority.value;

        if (sortBy) {
          if (sortBy.value === 'dueDate-asc') { params._sort = 'dueDate'; params._order = 'asc'; }
          if (sortBy.value === 'dueDate-desc') { params._sort = 'dueDate'; params._order = 'desc'; }
        }

        const tasksData = await getAllTasks(params);
        let finalTasks = isAdmin ? tasksData : tasksData.filter(task => task.assigneeIds?.includes(String(currentUser?.id)));

        if (debouncedSearchQuery) {
          finalTasks = finalTasks.filter(task => task.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
        }

        if (sortBy && sortBy.value.startsWith('priority')) {
          const priorityMap = { high: 3, medium: 2, low: 1 };
          finalTasks.sort((a, b) => {
            const pA = priorityMap[a.priority] || 0;
            const pB = priorityMap[b.priority] || 0;
            return sortBy.value === 'priority-desc' ? pB - pA : pA - pB;
          });
        }

        setTasks(finalTasks);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasksData();
  }, [debouncedSearchQuery, filters, sortBy, isAdmin, currentUser]);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!location.state || isLoading) return;
    if (location.state.openTaskId) {
      const taskId = location.state.openTaskId;
      setEditingId(taskId);
      setIsModalOpen(true);
      window.history.replaceState({}, '');
    } else if (location.state.openTaskModal) {
      setEditingId(null);
      setIsModalOpen(true);
      window.history.replaceState({}, '');
    }
  }, [location.state, isLoading]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== null).length;
  }, [filters]);

  const handleFilterChange = useCallback((filterType, option) => {
    setFilters(prev => ({ ...prev, [filterType]: option }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ status: null, priority: null });
    setSortBy(null);
    setSearchQuery('');
  }, []);

  const handleSortChange = useCallback((option) => {
    setSortBy(option);
  }, []);

  const handleDelete = useCallback(async (taskOriginal) => {
    const taskId = taskOriginal.id;
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    setDeletingIds(prev => ({ ...prev, [taskId]: true }));
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== taskId));
    
    try {
      await deleteTask(taskId);
      toast.success('Task deleted optimistically');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete task. Reverting changes.');
      setTasks(previousTasks); 
    } finally {
      setDeletingIds(prev => {
        const newObj = { ...prev };
        delete newObj[taskId];
        return newObj;
      });
    }
  }, [tasks]);

  const handleStatusInlineEdit = useCallback(async (taskOriginal, newStatusOption) => {
    if (!newStatusOption) return;
    const taskId = taskOriginal.id;
    const previousStatus = taskOriginal.status;
    const newStatus = newStatusOption.value;
    
    if (previousStatus === newStatus) return;

    setStatusUpdatingIds(prev => ({ ...prev, [taskId]: true }));
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await axiosInstance.patch(`/tasks/${taskId}`, { status: newStatus });
      toast.success('Task status updated inline');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status. Reverting changes.');
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: previousStatus } : t));
    } finally {
      setStatusUpdatingIds(prev => {
        const newObj = { ...prev };
        delete newObj[taskId];
        return newObj;
      });
    }
  }, []);

  const onSubmitTask = useCallback(async (data) => {
    
    try {
      const defaultAssigneeIds = isAdmin
        ? (data.assignee ? data.assignee.map(a => a.value) : [])
        : [String(currentUser?.id)];

      const payload = {
        title: data.title,
        description: data.description || "",
        projectId: data.project.value,
        assigneeIds: defaultAssigneeIds,
        priority: data.priority.value,
        status: data.status.value,
        startDate: data.startDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
      };

      if (editingId) {
        const updatedTask = await updateTask(editingId, payload);
        setTasks(prev => prev.map(t => t.id === editingId ? updatedTask : t));
        toast.success('Task updated successfully');
      } else {
        const newTask = await createTask(payload);
        setTasks(prev => [...prev, newTask]);
        toast.success('Task created successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save task');
    }
  }, [editingId, currentUser, isAdmin]);

  const openAddModal = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingId(task.id);
    setIsModalOpen(true);
  };

  const filteredAndSortedTasks = useMemo(() => tasks, [tasks]);

  const columns = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">{row.original.title}</span>
      ),
    },
    {
      accessorKey: 'projectId',
      header: 'Project',
      cell: ({ row }) => {
        const p = projects.find(pr => pr.id === row.original.projectId);
        return <span className="text-gray-600 dark:text-gray-400">{p ? p.title : 'Unknown'}</span>;
      }
    },
    {
      accessorKey: 'assigneeIds',
      header: 'Assignees',
      cell: ({ row }) => {
        const assignedUsers = row.original.assigneeIds?.map(id => users.find(user => String(user.id) === String(id))).filter(Boolean) || [];
        return (
          <div className="flex -space-x-2 overflow-hidden py-1">
            {assignedUsers.length > 0 ? assignedUsers.map(u => (
              <div key={u.id} className="inline-flex h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-200 dark:bg-gray-700 items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300" title={u.name || u.email}>
                {(u.name || u.email).charAt(0).toUpperCase()}
              </div>
            )) : <span className="text-gray-400 text-sm">Unassigned</span>}
          </div>
        );
      }
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const p = priorityOptions.find(opt => opt.value === row.original.priority);
        if (!p) return 'N/A';
        return <span style={{ color: p.color, fontWeight: 'bold' }}>{p.label}</span>;
      }
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => row.original.startDate ? format(new Date(row.original.startDate), 'MMM dd, yyyy') : 'N/A'
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => format(new Date(row.original.dueDate), 'MMM dd, yyyy')
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const currentStatusOpt = statusOptions.find(s => s.value === row.original.status) || statusOptions[0];
        const isUpdating = statusUpdatingIds[row.original.id];

        return (
          <div className="relative">
            <Select
              value={currentStatusOpt}
              onChange={(opt) => handleStatusInlineEdit(row.original, opt)}
              options={statusOptions}
              isDisabled={isUpdating}
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: currentStatusOpt.color,
                  borderColor: 'transparent',
                  borderRadius: '0.5rem',
                  boxShadow: 'none',
                  minHeight: '32px',
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: '600',
                  '&:hover': {
                    backgroundColor: currentStatusOpt.color,
                    opacity: 0.8,
                  }
                }),
                singleValue: (base) => ({
                  ...base,
                  color: 'white',
                  fontWeight: '600',
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: 'rgb(31 41 55)',
                  border: '1px solid rgb(55 65 81)',
                  borderRadius: '0.5rem',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected ? 'rgb(59 130 246)' : state.isFocused ? 'rgb(75 85 99)' : 'transparent',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgb(75 85 99)',
                  }
                }),
                input: (base) => ({
                  ...base,
                  caretColor: 'transparent',
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }}
            />
            {isUpdating && (
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-lg">
                <FiLoader className="animate-spin text-blue-500" />
              </div>
            )}
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const isDeleting = deletingIds[row.original.id];
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEditModal(row.original)}
              disabled={isDeleting}
              className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors disabled:opacity-50"
              title="Edit Task"
            >
              <FiEdit2 />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              disabled={isDeleting}
              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
              title="Delete Task"
            >
              {isDeleting ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
            </button>
          </div>
        );
      },
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tasks</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage all your cross-project tasks</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all whitespace-nowrap"
        >
          <FiPlus />
          New Task
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 p-4 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
        <SearchBar 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          searchInputRef={searchInputRef}
        />
        <FilterBar 
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          activeCount={activeFilterCount}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />
      </div>

      <DataTable 
        columns={columns} 
        data={filteredAndSortedTasks} 
        loading={isLoading} 
        emptyMessage={(debouncedSearchQuery || activeFilterCount > 0) ? "No tasks match your selection." : "No tasks found. Create one!"} 
      />

      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onSubmitTask}
        initialData={editingId ? tasks.find(t => t.id === editingId) : null}
        projects={projects}
        users={users}
      />
    </div>
  );
}
