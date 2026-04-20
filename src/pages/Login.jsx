import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import toast from 'react-hot-toast';
import { FiLoader } from 'react-icons/fi';
import useLocalStorage from '../hooks/useLocalStorage';
import { loginUser } from '../api/usersApi';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const schema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
}).required();

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const [, setStoredUser] = useLocalStorage('protask_user', null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const user = await loginUser(data.email, data.password);

      if (user) {
        const { password: _password, ...userWithoutPassword } = user;
        setStoredUser(userWithoutPassword);
        dispatch(setCredentials(userWithoutPassword));
        toast.success('Login successful!');
        navigate(from, { replace: true });
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      toast.error('Failed to connect to server');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">
          Welcome back
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          Sign in to your ProTask account
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              {...register('email')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.email ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
              placeholder="admin@protask.com"
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <FiLoader className="animate-spin mr-2" /> : null}
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Admin: admin@protask.com / admin123</p>
          <p>User: bhautik@protask.com / bhautik123</p>
          <p className="mt-2">Don't have an account? <Link to="/signup" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
}
