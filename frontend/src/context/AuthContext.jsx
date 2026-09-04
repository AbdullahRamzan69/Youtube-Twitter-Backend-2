import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on initial load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/users/current-user');
        // The backend returns user data in response.data.data
        setUser(response.data.data);
      } catch (error) {
        console.log('User is not logged in');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/users/logout');
      setUser(null);
      // Optional: force reload or redirect to clear any sensitive state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {/* We only render children once the initial auth check is done */}
      {!loading && children}
    </AuthContext.Provider>
  );
};
