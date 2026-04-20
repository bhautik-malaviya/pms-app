import React from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { FiLogOut } from 'react-icons/fi';
import useLocalStorage from '../hooks/useLocalStorage';

export default function MainLayout() {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [, setStoredUser] = useLocalStorage('protask_user', null);

  const handleLogout = () => {
    setStoredUser(null);
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-200">
      <nav className="p-4 bg-white dark:bg-gray-800 shadow flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ProTask</h1>
          <div className="hidden md:flex items-center gap-6 ml-8">
            <NavLink to="/" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'}`} end>Dashboard</NavLink>
            <NavLink to="/projects" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'}`}>Projects</NavLink>
            <NavLink to="/tasks" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'}`}>Tasks</NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/users" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'}`}>Users</NavLink>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline font-medium text-gray-600 dark:text-gray-300">
                {user.name}
              </span>
              {user.role === 'admin' && (
                <span className="hidden sm:inline px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold rounded-full">
                  Admin
                </span>
              )}
              <div className="h-9 w-9 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white dark:ring-gray-800">
                {user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
              </div>
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium text-sm"
          >
            Toggle Theme
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg transition-colors font-medium text-sm"
          >
            <FiLogOut />
            Logout
          </button>
        </div>
      </nav>
      <main className="p-6 grow max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
