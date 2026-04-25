import { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiRegister } from '../services/apiService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('queueless_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('queueless_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('queueless_user');
    }
  }, [user]);

  /**
   * Login — works for both admin and customer.
   * Admin: checked against .env on the backend.
   * Customer: checked against MySQL (hashed password).
   */
  async function login(email, password) {
    try {
      const result = await apiLogin(email, password);
      if (result.success) {
        const userData = result.user;
        // Store credentials for admin API calls
        if (userData.role === 'admin') {
          userData._credentials = btoa(`${email}:${password}`);
        }
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false, message: result.message || 'Invalid email or password' };
    } catch (err) {
      return { success: false, message: 'Server unavailable. Is the backend running?' };
    }
  }

  /**
   * Register — creates a new customer account in MySQL.
   * Password is hashed server-side using bcrypt.
   */
  async function register(name, email, password) {
    try {
      const result = await apiRegister(name, email, password);
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      }
      return { success: false, message: result.message || 'Registration failed' };
    } catch (err) {
      return { success: false, message: 'Server unavailable. Is the backend running?' };
    }
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
