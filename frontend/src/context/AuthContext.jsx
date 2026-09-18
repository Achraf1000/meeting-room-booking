import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Essayer de récurpérer le profil via refresh token au chargement
  useEffect(() => {
    const initAuth = async () => {
      try {
        const refreshRes = await api.post('/api/auth/refresh');
        if (refreshRes.data.access_token) {
          setAccessToken(refreshRes.data.access_token);
          const profileRes = await api.get('/api/users/me');
          setUser(profileRes.data);
        }
      } catch {
        // Pas de session valide
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleGlobalLogout = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth:logout', handleGlobalLogout);
    return () => window.removeEventListener('auth:logout', handleGlobalLogout);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    setAccessToken(res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (fullName, email, password, department) => {
    const res = await api.post('/api/auth/register', {
      full_name: fullName,
      email,
      password,
      department,
    });
    setAccessToken(res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (fullName, department) => {
    const res = await api.put('/api/users/me', {
      full_name: fullName,
      department,
    });
    setUser(res.data);
    return res.data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await api.put('/api/users/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé au sein d'un AuthProvider");
  }
  return context;
};
