import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiLoader } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

import DataTable from '../components/DataTable';
import ProjectFormModal from '../components/ProjectFormModal';
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../api/projectsApi';
import { deleteTasksByProjectId } from '../api/tasksApi';
import { getAllUsers } from '../api/usersApi';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingIds, setDeletingIds] = useState({});
  const currentUser = useSelector(state => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
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
      toast.error('Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isAdmin]);

  useEffect(() => {
    document.title = 'Projects | ProTask';
    fetchProjects();
  }, [fetchProjects]);

  const openAddModal = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingId(project.id);
    setIsModalOpen(true);
  };

  const onSubmit = useCallback(async (data) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        status: data.status.value,
        startDate: data.startDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        assigneeIds: isAdmin && data.assignees ? data.assignees.map(a => a.value) : (editingId ? projects.find(p => p.id === editingId).assigneeIds : [String(currentUser?.id)])
      };

      if (editingId) {
        await updateProject(editingId, payload);
        toast.success('Project updated successfully');
      } else {
        await createProject(payload);
        toast.success('Project created successfully');
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save project');
    }
  }, [editingId, isAdmin, projects, currentUser?.id, fetchProjects]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all associated tasks.')) {
      return;
    }
    
    setDeletingIds(prev => ({ ...prev, [id]: true }));
    try {
      await deleteTasksByProjectId(id);
      await deleteProject(id);
      toast.success('Project and associated tasks deleted');
      fetchProjects();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete project');
    } finally {
      setDeletingIds(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, [fetchProjects]);

  const columns = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <p className="truncate max-w-xs">{row.original.description}</p>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const statusColors = {
          'active': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          'on-hold': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
          'completed': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        };
        const status = row.original.status || 'active';
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status] || statusColors['active']}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => format(new Date(row.original.startDate), 'MMM dd, yyyy'),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => row.original.dueDate ? format(new Date(row.original.dueDate), 'MMM dd, yyyy') : 'N/A',
    },
    {
      accessorKey: 'assigneeIds',
      header: 'Assignees',
      cell: ({ row }) => {
        const assignedUsers = row.original.assigneeIds?.map(id => users.find(u => String(u.id) === String(id))).filter(Boolean) || [];
        return (
          <div className="flex -space-x-2 overflow-hidden py-1">
            {assignedUsers.length > 0 ? assignedUsers.map(u => (
              <div key={u.id} className="inline-flex h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-200 dark:bg-gray-700 items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300" title={u.name || u.email}>
                {(u.name || u.email).charAt(0).toUpperCase()}
              </div>
            )) : <span className="text-gray-400 text-sm">None</span>}
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
            <Link 
              to={`/projects/${row.original.id}`}
              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              title="View Details"
            >
              <FiEye />
            </Link>
            {isAdmin && (
              <>
                <button
                  onClick={() => openEditModal(row.original)}
                  disabled={isDeleting}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors disabled:opacity-50"
                  title="Edit Project"
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={() => handleDelete(row.original.id)}
                  disabled={isDeleting}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
                  title="Delete Project"
                >
                  {isDeleting ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Projects</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your projects and their details</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            <FiPlus />
            New Project
          </button>
        )}
      </div>

      <DataTable 
        columns={columns} 
        data={projects} 
        loading={isLoading} 
        emptyMessage="No projects found. Create one to get started!" 
      />

      <ProjectFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={onSubmit} 
        initialData={editingId ? projects.find(p => p.id === editingId) : null} 
        users={users}
        isAdmin={isAdmin}
      />
    </div>
  );
}
