import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canAccess } from './featureAccess';

/**
 * Unified access gate.
 * - mode="hide" (default): render children or null — sidebar / UI blocks
 * - mode="redirect": for nested routes; renders <Outlet /> or redirects to /dashboard
 * - feature: key in FEATURES; if omitted with allowedRoles, falls back to role list
 * - allowedRoles: optional raw role list (prefer feature)
 */
export default function Can({ feature, allowedRoles, mode = 'hide', children, redirectTo = '/dashboard' }) {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  if (mode === 'redirect' && !isAuthenticated) {
    logout();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let allowed = true;
  if (feature) {
    allowed = canAccess(user, feature);
  } else if (allowedRoles) {
    const rawRole = user?.roles?.[0]?.authority || user?.role || 'ROLE_USER';
    allowed = allowedRoles.includes(rawRole);
  }

  if (!allowed) {
    if (mode === 'redirect') {
      return <Navigate to={redirectTo} replace />;
    }
    return null;
  }

  if (mode === 'redirect') {
    return children !== undefined ? children : <Outlet />;
  }

  return children;
}
