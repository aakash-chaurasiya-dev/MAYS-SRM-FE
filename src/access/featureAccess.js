/** Known ROLE_* catalog — keep in sync with backend DepartmentRoleResolver.KNOWN_ROLES */
export const KNOWN_ROLES = [
  'ROLE_MANAGER',
  'ROLE_EXECUTIVE',
  'ROLE_ENGINEER',
  'ROLE_PURCHASE',
  'ROLE_ADMIN',
  'ROLE_USER',
  'ROLE_VENDOR',
];

/** Single policy map for routes, sidebar, and page gates */
export const FEATURES = {
  enquiries: ['ROLE_MANAGER', 'ROLE_EXECUTIVE', 'ROLE_ADMIN', 'ROLE_USER', 'ROLE_VENDOR'],
  newTicket: ['ROLE_MANAGER', 'ROLE_EXECUTIVE', 'ROLE_ADMIN', 'ROLE_USER', 'ROLE_VENDOR'],
  inventory: ['ROLE_MANAGER', 'ROLE_EXECUTIVE', 'ROLE_PURCHASE'],
  diagnosis: ['ROLE_MANAGER', 'ROLE_EXECUTIVE', 'ROLE_ENGINEER'],
  maintenance: ['ROLE_MANAGER', 'ROLE_EXECUTIVE'],
  billing: ['ROLE_MANAGER', 'ROLE_EXECUTIVE'],
  reports: ['ROLE_MANAGER', 'ROLE_EXECUTIVE'],
  employees: ['ROLE_MANAGER', 'ROLE_EXECUTIVE'],
  users: ['ROLE_MANAGER', 'ROLE_EXECUTIVE'],
  vendors: ['ROLE_MANAGER', 'ROLE_EXECUTIVE'],
};

export function getUserRole(user) {
  return user?.roles?.[0]?.authority || user?.role || 'ROLE_USER';
}

export function canAccess(user, feature) {
  const allowed = FEATURES[feature];
  if (!allowed) return true;
  return allowed.includes(getUserRole(user));
}

export function isRole(user, role) {
  return getUserRole(user) === role;
}

export function hasAnyRole(user, roles) {
  return roles.includes(getUserRole(user));
}
