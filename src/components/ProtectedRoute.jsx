import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to the login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page. 
      logout();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles) {
    const rawRole = user?.roles?.[0]?.authority || user?.role || 'ROLE_USER';
    if (!allowedRoles.includes(rawRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
