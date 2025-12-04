
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/mockBackend';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  signIn: (name: string) => Promise<void>;
  signUp: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    isLoading: true, 
    refreshUser: async () => {},
    signIn: async () => {},
    signUp: async () => {},
    signOut: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
    } catch (e) {
        // Not authenticated
        setUser(null);
    }
  };

  const signIn = async (name: string) => {
      const user = await api.signIn(name);
      setUser(user);
  };

  const signUp = async (name: string) => {
      const user = await api.signUp(name);
      setUser(user);
  };

  const signOut = async () => {
      await api.signOut();
      setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      await refreshUser();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
