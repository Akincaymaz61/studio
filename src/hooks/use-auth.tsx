'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// This is a simplified user object for our custom auth
interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded credentials for shared access
const SHARED_USERNAME = 'admin';
const SHARED_PASSWORD = 'password';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('app_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      // ignore parsing errors
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    // If loading is finished and there's no user, redirect to login,
    // unless we are already on the login page.
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    if (username === SHARED_USERNAME && password === SHARED_PASSWORD) {
      const userObj: User = { username };
      localStorage.setItem('app_user', JSON.stringify(userObj));
      setUser(userObj);
      router.push('/');
      setLoading(false);
      return true;
    }
    setLoading(false);
    return false;
  };

  const logout = () => {
    localStorage.removeItem('app_user');
    setUser(null);
    router.push('/login');
  };

  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
