import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import toast from 'react-hot-toast';
import { FiLoader } from 'react-icons/fi';
import useLocalStorage from '../hooks/useLocalStorage';
import { getAllUsers, createUser } from '../api/usersApi';
import { getAllProjects, createProject, updateProject } from '../api/projectsApi';
import { useNavigate, Link } from 'react-router-dom';

const schema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Minimum 2 characters'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
}).required();

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const [, setStoredUser] = useLocalStorage('protask_user', null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const existingUsers = await getAllUsers();
      const emailExists = existingUsers.find(u => u.email === data.email);

      if (emailExists) {
        toast.error('An account with this email already exists');
        setIsLoading(false);
        return;
      }

      const newUser = await createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'user'
      });

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

      const { password: _password, ...userWithoutPassword } = newUser;
      setStoredUser(userWithoutPassword);
      dispatch(setCredentials(userWithoutPassword));
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error('Failed to create account');
      console.error('SignUp error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">
          Create Account
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          Join ProTask to manage your projects
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              {...register('name')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.name ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
              placeholder="John Doe"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              {...register('email')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.email ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              {...register('password')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.password ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              {...register('confirmPassword')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.confirmPassword ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <FiLoader className="animate-spin mr-2" /> : null}
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Already have an account? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
