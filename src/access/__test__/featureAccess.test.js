import {
  getUserRole,
  canAccess,
  isRole,
  hasAnyRole,
} from '../featureAccess';

describe('featureAccess', () => {
  const manager = { roles: [{ authority: 'ROLE_MANAGER' }] };
  const engineer = { roles: [{ authority: 'ROLE_ENGINEER' }] };

  it('resolves user role from roles array or fallback', () => {
    expect(getUserRole(manager)).toBe('ROLE_MANAGER');
    expect(getUserRole({ role: 'ROLE_USER' })).toBe('ROLE_USER');
    expect(getUserRole(null)).toBe('ROLE_USER');
  });

  it('checks feature access by role', () => {
    expect(canAccess(manager, 'maintenance')).toBe(true);
    expect(canAccess(engineer, 'maintenance')).toBe(false);
    expect(canAccess(engineer, 'unknown-feature')).toBe(true);
  });

  it('checks single and multiple roles', () => {
    expect(isRole(manager, 'ROLE_MANAGER')).toBe(true);
    expect(hasAnyRole(manager, ['ROLE_ADMIN', 'ROLE_MANAGER'])).toBe(true);
  });
});
