import { useAuth } from '../contexts/AuthContext';
import { canAccess, getUserRole, isRole, hasAnyRole } from './featureAccess';

export function useCan(feature) {
  const { user } = useAuth();
  return canAccess(user, feature);
}

export function useUserRole() {
  const { user } = useAuth();
  return getUserRole(user);
}

export function useIsRole(role) {
  const { user } = useAuth();
  return isRole(user, role);
}

export function useHasAnyRole(roles) {
  const { user } = useAuth();
  return hasAnyRole(user, roles);
}
