import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Select from 'react-select';
import { FiCheckCircle, FiClock, FiAlertCircle, FiFolder, FiPlus, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { getAllProjects } from '../api/projectsApi';
import { getAllTasks, createTask } from '../api/tasksApi';
import { getAllUsers } from '../api/usersApi';

const priorityOptions = [
  { value: 'low', label: 'Low', color: '#10B981' }, 
  { value: 'medium', label: 'Medium', color: '#F59E0B' }, 
  { value: 'high', label: 'High', color: '#EF4444' }, 
];

const statusStyles = {
  todo: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  review: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  done: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const schema = yup.object().shape({
  title: yup.string().required('Title is required').min(3, 'Minimum 3 characters'),
  project: yup.object().nullable().required('Project is required'),
  priority: yup.object().nullable().required('Priority is required'),
});

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = useSelector(state => state.auth.user);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      project: null,
      priority: priorityOptions[1]
    }
  });

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [tasksData, projectsData, usersData] = await Promise.all([
        getAllTasks(),
        getAllProjects(),
        getAllUsers()
      ]);


      const isAdmin = currentUser?.role === 'admin';
      const filteredTasks = isAdmin ? tasksData : tasksData.filter(task => task.assigneeIds?.includes(String(currentUser?.id)));
      const userProjectIds = new Set(filteredTasks.map(task => task.projectId));
      const filteredProjects = isAdmin ? projectsData : projectsData.filter(project => userProjectIds.has(project.id));

      setTasks(filteredTasks);
      setProjects(filteredProjects);
      setUsers(usersData);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const {
    totalProjects,
    totalTasks,
    totalUsers,
    tasksDueToday,
    overdueTasks,
    statusCounts,
    recentTasks
  } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dueToday = 0;
    let overdue = 0;
    const counts = { todo: 0, 'in-progress': 0, review: 0, done: 0 };

    tasks.forEach(task => {
      counts[task.status] = (counts[task.status] || 0) + 1;
      
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (task.status !== 'done') {
        if (dueDate.getTime() === today.getTime()) {
          dueToday++;
        } else if (dueDate.getTime() < today.getTime()) {
          overdue++;
        }
      }
    });

    const recent = [...tasks].sort((a, b) => b.id - a.id).slice(0, 5);

    return {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      totalUsers: users.length,
      tasksDueToday: dueToday,
      overdueTasks: overdue,
      statusCounts: counts,
      recentTasks: recent
    };
  }, [tasks, projects, users]);

  const onQuickAdd = async (data) => {
    try {
      const payload = {
        title: data.title,
        description: '',
        projectId: data.project.value,
        assigneeIds: [String(currentUser?.id || 1)],
        priority: data.priority.value,
        status: 'todo',
        dueDate: new Date().toISOString(),
      };
      await createTask(payload);
      toast.success('Task quickly added!');
      reset({
        title: '',
        project: null,
        priority: priorityOptions[1]
      });
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to quick-add task');
    }
  };

  const projectOptions = useMemo(() => projects.map(p => ({ value: p.id, label: p.title })), [projects]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Here's your bird's-eye view of everything</p>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${currentUser?.role === 'admin' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
        <Link to="/projects" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 rounded-lg">
            <FiFolder className="text-2xl" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Projects</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalProjects}</h3>
          </div>
        </Link>
        
        <Link to="/tasks" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-lg">
            <FiCheckCircle className="text-2xl" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalTasks}</h3>
          </div>
        </Link>

        <Link to="/tasks" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-3 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400 rounded-lg">
            <FiClock className="text-2xl" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Today</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{tasksDueToday}</h3>
          </div>
        </Link>

        <Link to="/tasks" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 rounded-lg">
            <FiAlertCircle className="text-2xl" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue Tasks</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{overdueTasks}</h3>
          </div>
        </Link>

        {currentUser?.role === 'admin' && (
          <Link to="/users" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 rounded-lg">
              <FiUsers className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsers}</h3>
            </div>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Tasks by Status</h3>
          
          <div className="grow flex flex-col gap-5">
            {Object.entries(statusCounts).map(([status, count]) => {
              const percentage = totalTasks === 0 ? 0 : Math.round((count / totalTasks) * 100);
              const colorMaps = {
                todo: 'bg-gray-300 dark:bg-gray-600',
                'in-progress': 'bg-blue-500',
                review: 'bg-purple-500',
                done: 'bg-green-500'
              };
              return (
                <div key={status} className="w-full">
                  <div className="flex justify-between text-sm mb-1.5 items-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${status === 'todo' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : status === 'in-progress' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' : status === 'review' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>{status.replace('-', ' ')}</span>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{count} <span className="text-gray-400 text-xs ml-1">({percentage}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full ${colorMaps[status]} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Tasks</h3>
          
          {recentTasks.length === 0 ? (
            <div className="grow flex items-center justify-center text-gray-400">No tasks created yet</div>
          ) : (
            <div className="grow space-y-3">
              {recentTasks.map(task => {
                const project = projects.find(p => p.id === task.projectId);
                const priority = priorityOptions.find(p => p.value === task.priority) || priorityOptions[1];
                const statusClass = statusStyles[task.status] || statusStyles['todo'];
                
                return (
                  <div
                    key={task.id}
                    onClick={() => navigate('/tasks', { state: { openTaskId: task.id } })}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/80 rounded-lg border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-900 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-gray-800 dark:text-gray-200 leading-tight">{task.title}</span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{project ? project.title : 'No Project'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-3 sm:mt-0">
                      <span style={{ color: priority.color }} className="text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-gray-900 px-2 py-1 rounded shadow-sm">
                        {priority.label}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${statusClass}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 relative z-10">Quick Add Task</h3>
        <form onSubmit={handleSubmit(onQuickAdd)} className="flex flex-col md:flex-row items-stretch md:items-end gap-4 w-full relative z-10">
          <div className="w-full md:flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Task Title <span className="text-red-400">*</span></label>
            <input
              {...register('title', { required: true, minLength: 3 })}
              placeholder="What needs to be done?"
              className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all ${errors.title ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}
            />
          </div>
          <div className="w-full md:w-56">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Project <span className="text-red-400">*</span></label>
            <Controller
              name="project"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={projectOptions}
                  placeholder="Select Project"
                  classNamePrefix="react-select"
                  menuPortalTarget={document.body}
                  styles={{
                    control: (base) => ({ ...base, minHeight: '42px', backgroundColor: 'var(--bg-gray-50, #f9fafb)', borderColor: errors.project ? '#ef4444' : '#e5e7eb', borderRadius: '0.5rem' }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 })
                  }}
                />
              )}
            />
          </div>
          <div className="w-full md:w-36">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority <span className="text-red-400">*</span></label>
            <Controller
              name="priority"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={priorityOptions}
                  placeholder="Priority"
                  classNamePrefix="react-select"
                  menuPortalTarget={document.body}
                  styles={{
                    control: (base) => ({ ...base, minHeight: '42px', backgroundColor: 'var(--bg-gray-50, #f9fafb)', borderColor: errors.priority ? '#ef4444' : '#e5e7eb', borderRadius: '0.5rem' }),
                    option: (styles, { data }) => ({ ...styles, color: data.color, fontWeight: 'bold' }),
                    singleValue: (styles, { data }) => ({ ...styles, color: data.color, fontWeight: 'bold' }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 })
                  }}
                />
              )}
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-sm md:mt-0 mt-2"
          >
            <FiPlus className="text-xl" />
            Add Task
          </button>
        </form>
      </div>

    </div>
  );
}
