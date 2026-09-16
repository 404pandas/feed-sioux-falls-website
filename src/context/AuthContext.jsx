import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, clearToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = guest / logged out
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore a session on page load.
    (async () => {
      try {
        const me = await api.me();
        setUser(me);
      } catch {
        // No valid session - stay logged out / guest. Not an error state.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(userId, pin) {
    const { token, user: loggedInUser } = await api.login(userId, pin);
    setToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isGuest: !user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
