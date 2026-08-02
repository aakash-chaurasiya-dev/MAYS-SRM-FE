import { renderHook } from '@testing-library/react';
import { useCan, useUserRole, useIsRole, useHasAnyRole } from '../useCan';
import { useAuth } from '../../contexts/AuthContext';

describe('useCan hooks', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: { roles: [{ authority: 'ROLE_MANAGER' }] },
    });
  });

  it('useCan returns access for a feature', () => {
    const { result } = renderHook(() => useCan('maintenance'));
    expect(result.current).toBe(true);
  });

  it('useUserRole returns resolved role', () => {
    const { result } = renderHook(() => useUserRole());
    expect(result.current).toBe('ROLE_MANAGER');
  });

  it('useIsRole checks a specific role', () => {
    const { result } = renderHook(() => useIsRole('ROLE_MANAGER'));
    expect(result.current).toBe(true);
  });

  it('useHasAnyRole checks role list membership', () => {
    const { result } = renderHook(() => useHasAnyRole(['ROLE_ADMIN', 'ROLE_MANAGER']));
    expect(result.current).toBe(true);
  });
});
