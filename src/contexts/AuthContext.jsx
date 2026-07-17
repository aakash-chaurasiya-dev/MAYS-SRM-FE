import { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Initialize auth state from local storage on load
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            logout();
          } else {
            setUser(decoded);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Invalid token format', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      // TODO: Replace '/auth/login' with your actual login endpoint
      const response = await api.post('/auth/login', credentials);
      
      // TODO: Adjust 'response.data.token' based on your API's response structure
      const { token } = response.data; 
      localStorage.clear();
      localStorage.setItem('token', token);
      
      const decoded = jwtDecode(token);
      setUser(decoded);
      setIsAuthenticated(true);
      console.log('Login successful, user:', decoded);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear(); // Clear all cached data (like profiles) on logout
  };

  if (loading) {
    // You could render a loading spinner here while checking auth state
    return <div>Loading...</div>; 
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
