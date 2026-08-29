import { createContext } from 'react';

export const defaultAuthValue = {
  user: { roles: [{ authority: 'ROLE_ADMIN' }], role: 'ROLE_ADMIN', sub: 'test-user' },
  isAuthenticated: true,
  login: jest.fn().mockResolvedValue({ success: true }),
  logout: jest.fn(),
};

const AuthContext = createContext(defaultAuthValue);

export const AuthProvider = ({ children, value = defaultAuthValue }) => (
  <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
);

export const useAuth = jest.fn(() => defaultAuthValue);
