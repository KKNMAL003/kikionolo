import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { authService } from '../services/auth/AuthService';
import type { User } from '../services/interfaces/IAuthService';

// Auth Context Types
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;

  // Auth methods
  login: (email: string, password: string) => Promise<boolean>;
  loginAsGuest: () => Promise<void>;
  createNewGuestSession: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Refs for cleanup
  const isMountedRef = useRef(true);
  const authSubscriptionRef = useRef<any>(null);

  // Computed properties
  const isAuthenticated = !!user && !user.isGuest;
  const isGuest = !!user && user.isGuest;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Initializing auth state...');
        
        // Get current user
        const currentUser = await authService.getCurrentUser();
        if (currentUser && isMountedRef.current) {
          setUser(currentUser);
        }

        // Set up auth state listener
        const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
          if (!isMountedRef.current) return;
          
          console.log('AuthContext: Auth state changed:', event, session?.user?.email);
          
          if (session?.user && event !== 'TOKEN_REFRESHED') {
            const user = await authService.getCurrentUser();
            if (user && isMountedRef.current) {
              setUser(user);
            }
          } else if (!session?.user) {
            setUser(null);
          }
          
          if (isMountedRef.current) {
            setIsLoading(false);
          }
        });

        authSubscriptionRef.current = subscription;
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
  }, []);

  // Auth methods
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await authService.login({ email, password });
      
      if (result.success && result.user) {
        setUser(result.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const loginAsGuest = useCallback(async (): Promise<void> => {
    try {
      const result = await authService.loginAsGuest();

      if (result.success && result.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error('AuthContext: Guest login error:', error);
    }
  }, []);

  const createNewGuestSession = useCallback(async (): Promise<void> => {
    try {
      const result = await authService.createNewGuestSession();

      if (result.success && result.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error('AuthContext: Create new guest session error:', error);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await authService.register({ name, email, password });
      
      if (result.success && result.user) {
        setUser(result.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      console.log('AuthContext: Starting logout process for user:', user?.isGuest ? 'guest' : 'registered');

      // Set logout state to trigger smooth transition
      setIsLoggingOut(true);

      if (user?.isGuest) {
        await authService.logoutGuest(user.id);
        console.log('AuthContext: Guest logout completed');
      } else {
        await authService.logout();
        console.log('AuthContext: Registered user logout completed');
      }

      // Longer delay for registered users to ensure Supabase logout completes
      const delay = user?.isGuest ? 150 : 250;
      await new Promise(resolve => setTimeout(resolve, delay));

      setUser(null);
      console.log('AuthContext: User state cleared');

      // Brief delay before clearing logout state to allow navigation
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsLoggingOut(false);
          console.log('AuthContext: Logout transition completed');
        }
      }, 400);

    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      // Clear logout state on error
      setIsLoggingOut(false);
    }
  }, [user]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser && isMountedRef.current) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('AuthContext: Refresh user error:', error);
    }
  }, []);

  // Memoize methods separately to prevent unnecessary re-renders
  const methods = useMemo(() => ({
    login,
    loginAsGuest,
    createNewGuestSession,
    register,
    logout,
    refreshUser,
  }), [
    login,
    loginAsGuest,
    createNewGuestSession,
    register,
    logout,
    refreshUser,
  ]);

  // Memoize the context value with optimized dependencies
  const value: AuthContextType = useMemo(() => ({
    user,
    isLoading,
    isLoggingOut,
    isAuthenticated,
    isGuest,
    ...methods,
  }), [
    user,
    isLoading,
    isLoggingOut,
    isAuthenticated,
    isGuest,
    methods,
  ]);

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