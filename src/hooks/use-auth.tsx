
'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, defaultAdminUser } from '@/lib/schema';

const USERS_STORAGE_KEY = 'app_users';
const CURRENT_USER_STORAGE_KEY = 'app_current_user';

type AuthContextType = {
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addUser: (user: User) => void;
  deleteUser: (userId: string) => boolean;
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
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    try {
        let storedUsers = null;
        if (typeof window !== 'undefined') {
            storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        }
        
        if (storedUsers) {
            const parsedUsers = JSON.parse(storedUsers);
            const adminExists = parsedUsers.some((u: User) => u.id === defaultAdminUser.id);
            if (!adminExists) {
                setUsers([defaultAdminUser, ...parsedUsers.filter((u:User) => u.id !== defaultAdminUser.id)]);
            } else {
                setUsers(parsedUsers);
            }
        } else {
            setUsers([defaultAdminUser]);
            if (typeof window !== 'undefined') {
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([defaultAdminUser]));
            }
        }

        let storedCurrentUser = null;
        if (typeof window !== 'undefined') {
            storedCurrentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
        }
        if (storedCurrentUser) {
            setCurrentUser(JSON.parse(storedCurrentUser));
        }
    } catch (e) {
        console.error("localStorage'dan kullanıcı verisi okunurken hata", e);
        setUsers([defaultAdminUser]);
        setCurrentUser(null);
    } finally {
        setIsAuthLoading(false);
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  };
  
  const addUser = (user: User) => {
    setUsers(prevUsers => {
      const userExists = prevUsers.some(u => u.id === user.id);
      const newUsers = userExists
        ? prevUsers.map(u => u.id === user.id ? user : u)
        : [...prevUsers, user];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
      return newUsers;
    });
  };

  const deleteUser = (userId: string): boolean => {
    if (userId === defaultAdminUser.id) {
        return false; // Can't delete the default admin
    }
    setUsers(prevUsers => {
        const newUsers = prevUsers.filter(u => u.id !== userId);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
        return newUsers;
    });
    return true;
  };

  const value = {
    users,
    currentUser,
    isAuthenticated: !!currentUser,
    isAuthLoading,
    login,
    logout,
    addUser,
    deleteUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
