import { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Setting up auth state listener');
    const unsubscribe = authService.onAuthStateChanged((user) => {
      console.log('useAuth: Auth state changed, user:', user ? user.email : 'null');
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const user = await authService.signIn(email, password);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const user = await authService.signUp(name, email, password);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const user = await authService.signInWithGoogle();
      return user;
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, signIn, signUp, signOut, signInWithGoogle };
};