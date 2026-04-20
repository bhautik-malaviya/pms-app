import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function PublicRoute() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  return !isAuthenticated ? <Outlet /> : <Navigate to={from} replace />;
}
