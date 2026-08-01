import { useAuth } from '../contexts/AuthContext';

export function getUserRole(user) {
  return user?.roles?.[0]?.authority || user?.role || 'ROLE_USER';
}

export default function RoleGuard({ allowedRoles, children }) {
  const { user } = useAuth();
  const rawRole = getUserRole(user);

  if (allowedRoles && !allowedRoles.includes(rawRole)) {
    return null;
  }

  return children;
}
