import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/auth/AuthService';
import type { User } from '../services/interfaces/IAuthService';
import { LoginSchema, RegisterSchema, validateData, getValidationErrors } from '../validation/schemas';

// Auth Context Types
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  
  // Auth methods
  login: (email: string, password: string) => Promise<boolean>;
  loginAsGuest: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
      const validationResult = validateData(LoginSchema, { email, password });
      if (!validationResult.success) {
        const errors = getValidationErrors(validationResult.errors);
        console.error('AuthContext: Login validation errors:', errors);
        return false;
      }
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

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const validationResult = validateData(RegisterSchema, { name, email, password });
      if (!validationResult.success) {
        const errors = getValidationErrors(validationResult.errors);
        console.error('AuthContext: Registration validation errors:', errors);
        return false;
      }
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
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    }
  }, []);

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

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isGuest,
    
    // Auth methods
    login,
    loginAsGuest,
    register,
    logout,
    refreshUser,
  };

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