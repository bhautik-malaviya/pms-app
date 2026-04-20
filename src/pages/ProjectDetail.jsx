import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';

import DataTable from '../components/DataTable';
import { getProjectById } from '../api/projectsApi';
import { getTasksByProjectId, deleteTask } from '../api/tasksApi';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = useSelector(state => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    const fetchProjectAndTasks = async () => {
      setIsLoading(true);
      try {
        const [projectData, tasksData] = await Promise.all([
          getProjectById(id),
          getTasksByProjectId(id)
        ]);
        setProject(projectData);
        setTasks(isAdmin ? tasksData : tasksData.filter(t => t.assigneeIds?.includes(String(currentUser?.id))));
      } catch (error) {
        console.error(error);
        toast.error('Failed to load project details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectAndTasks();
  }, [id, currentUser?.id, isAdmin]);

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      toast.success('Task deleted successfully');
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete task');
    }
  };

  const taskColumns = [
    {
      accessorKey: 'title',
      header: 'Task Title',
      cell: ({ row }) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const statuses = {
          'todo': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          'in-progress': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
          'review': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
          'done': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        };
        const status = row.original.status || 'todo';
        return (
           <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${statuses[status] || statuses['todo']}`}>
             {status.replace('-', ' ').toUpperCase()}
           </span>
        );
      }
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => row.original.startDate ? format(new Date(row.original.startDate), 'MMM dd, yyyy') : 'N/A',
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => row.original.dueDate ? format(new Date(row.original.dueDate), 'MMM dd, yyyy') : 'N/A',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            to="/tasks"
            state={{ openTaskId: row.original.id }}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
            title="Edit Task"
          >
            <FiEdit2 />
          </Link>
          <button
            onClick={() => handleDeleteTask(row.original.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Delete Task"
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    }
  ];

  if (isLoading && !project) {
    return <div className="p-8 text-center text-gray-500">Loading project details...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-red-500">Project not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          to="/projects"
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <FiArrowLeft className="text-gray-600 dark:text-gray-300" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{project.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Project Tasks</h3>
          <Link 
            to="/tasks"
            state={{ openTaskModal: true, prefillProject: project.id }}
            className="text-sm bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            + Add Task
          </Link>
        </div>
        <DataTable 
          columns={taskColumns} 
          data={tasks} 
          loading={isLoading} 
          emptyMessage="No tasks found for this project." 
        />
      </div>
    </div>
  );
}
