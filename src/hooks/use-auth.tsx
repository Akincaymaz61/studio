
'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { User, appUsers } from '@/lib/schema';

const CURRENT_USER_STORAGE_KEY = 'app_current_user';

type AuthContextType = {
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // On component mount, check if a user is logged in from a previous session
  useEffect(() => {
    try {
        let storedCurrentUser = null;
        if (typeof window !== 'undefined') {
            storedCurrentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
        }
        if (storedCurrentUser) {
            const potentialUser = JSON.parse(storedCurrentUser);
            // Verify that the stored user is still a valid user in our static list
            const isValid = appUsers.some(u => u.id === potentialUser.id && u.username === potentialUser.username);
            if (isValid) {
                setCurrentUser(potentialUser);
            } else {
                localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
            }
        }
    } catch (e) {
        console.error("Error reading current user from localStorage", e);
        // Clear potentially corrupted storage
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    } finally {
        setIsAuthLoading(false);
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const user = appUsers.find(u => u.username === username && u.password === password);
    if (user) {
      const userToStore = { id: user.id, username: user.username, role: user.role };
      setCurrentUser(userToStore);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(userToStore));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  };
  
  const value: AuthContextType = {
    users: appUsers, // Provide the static list of users
    currentUser,
    isAuthenticated: !!currentUser,
    isAuthLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
