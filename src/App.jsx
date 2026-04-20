import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { logout } from './store/authSlice';
import PrivateRoute from './routes/PrivateRoute';
import PublicRoute from './routes/PublicRoute';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import SignUp from './pages/SignUp';
import NotFound from './pages/NotFound';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'persist:auth') {
        if (!e.newValue) {
          dispatch(logout());
          return;
        }
        try {
          const authState = JSON.parse(e.newValue);
          if (authState.isAuthenticated === 'false' || authState.isAuthenticated === false) {
            dispatch(logout());
          }
        } catch (error) {
          console.error('Error parsing persist:auth from storage', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>
        
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
