import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch } from 'react-icons/fi';
import Select from 'react-select';
import DataTable from '../components/DataTable';
import { getAllUsers, createUser, updateUser, deleteUser } from '../api/usersApi';
import { getAllProjects, createProject, updateProject } from '../api/projectsApi';
import useDebounce from '../hooks/useDebounce';

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

const schema = yup.object().shape({
  name: yup.string().required('Name is required').min(2, 'Minimum 2 characters'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string(),
  role: yup.object().required('Role is required'),
});

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    context: { isEditing: !!editingId }
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      
      const data = await getAllUsers(params);
      
      let finalUsers = data;
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        finalUsers = data.filter(user => 
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
        );
      }
      
      setUsers(finalUsers);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      toast.error('Only admins can access Users list');
      navigate('/dashboard', { replace: true });
      return;
    }

    fetchUsers();
  }, [currentUser, navigate, fetchUsers]);

  const openAddModal = () => {
    setEditingId(null);
    reset({
      name: '',
      email: '',
      password: '',
      role: roleOptions[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingId(user.id);
    reset({
      name: user.name || '',
      email: user.email,
      password: '',
      role: roleOptions.find(r => r.value === user.role) || roleOptions[0],
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    if (!editingId && (!data.password || data.password.length < 6)) {
      toast.error('Password must be at least 6 characters for new users');
      return;
    }
    if (editingId && data.password && data.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const payload = {
        name: data.name,
        email: data.email,
        role: data.role.value,
        ...(data.password && { password: data.password }),
      };

      if (editingId) {
        await updateUser(editingId, payload);
        toast.success('User updated successfully');
      } else {
        const newUser = await createUser(payload);
        
        const allProjects = await getAllProjects();
        const defaultProject = allProjects.find(p => p.title === 'Protask default');
        
        if (defaultProject) {
          const currentAssignees = defaultProject.assigneeIds || [];
          if (!currentAssignees.includes(String(newUser.id))) {
            await updateProject(defaultProject.id, {
              ...defaultProject,
              assigneeIds: [...currentAssignees, String(newUser.id)]
            });
          }
        } else {
          const allUsers = await getAllUsers();
          await createProject({
            title: 'Protask default',
            description: 'Default project for all users',
            status: 'active',
            startDate: new Date().toISOString(),
            dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            assigneeIds: allUsers.map(u => String(u.id))
          });
        }

        toast.success('User created successfully');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save user');
    }
  };

  const handleDelete = async (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    
    if (userToDelete?.role === 'admin') {
      toast.error('Admin users cannot be deleted');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete user');
    }
  };

  const columns = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span>{row.original.name || '—'}</span> },
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => <span>{row.original.email}</span> },
    { accessorKey: 'role', header: 'Role', cell: ({ row }) => <span className="capitalize">{row.original.role || 'user'}</span> },
    { accessorKey: 'id', header: 'User ID', cell: ({ row }) => <span>{row.original.id}</span> },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(row.original)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
            title="Edit User"
          >
            <FiEdit2 />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Delete User"
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Users</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage all registered users</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
        >
          <FiPlus />
          New User
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 p-4 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <FiSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 md:w-80 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        emptyMessage="No users found"
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                  <input
                    {...register('name')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="Full Name"
                  />
                  {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    {...register('email')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="user@example.com"
                  />
                  {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password {editingId ? '(leave blank to keep current)' : '*'}</label>
                  <input
                    type="password"
                    {...register('password')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="••••••••"
                  />
                  {errors.password && <span className="text-red-500 text-xs mt-1 block">{errors.password.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={roleOptions}
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{
                          control: (base) => ({ ...base, backgroundColor: 'transparent', borderColor: errors.role ? '#ef4444' : '#d1d5db', borderRadius: '0.5rem' }),
                          menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                      />
                    )}
                  />
                  {errors.role && <span className="text-red-500 text-xs mt-1 block">{errors.role.message}</span>}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                  {editingId ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
