import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Can from '../Can';
import { useAuth } from '../../contexts/AuthContext';

describe('Can', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { roles: [{ authority: 'ROLE_MANAGER' }] },
      logout: jest.fn(),
    });
  });

  it('renders children when user has feature access', () => {
    render(
      <MemoryRouter>
        <Can feature="maintenance">
          <div>Allowed Content</div>
        </Can>
      </MemoryRouter>
    );
    expect(screen.getByText('Allowed Content')).toBeInTheDocument();
  });

  it('hides children when user lacks access', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { roles: [{ authority: 'ROLE_ENGINEER' }] },
      logout: jest.fn(),
    });
    render(
      <MemoryRouter>
        <Can feature="maintenance">
          <div>Hidden Content</div>
        </Can>
      </MemoryRouter>
    );
    expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
  });
});
