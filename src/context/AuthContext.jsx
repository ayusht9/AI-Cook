import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../db';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is saved in localStorage (mock session)
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      db.users.get(parseInt(savedUserId)).then(foundUser => {
        if (foundUser) {
          setUser(foundUser);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username) => {
    // Mock login: find or create user
    let existingUser = await db.users.where('username').equals(username).first();
    if (!existingUser) {
      const id = await db.users.add({ username });
      existingUser = { id, username };
    }
    localStorage.setItem('userId', existingUser.id);
    setUser(existingUser);
  };

  const logout = () => {
    localStorage.removeItem('userId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
