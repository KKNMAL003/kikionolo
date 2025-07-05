import { supabase, supabaseRequest } from '../../lib/supabase';
import type { 
  IAuthService, 
  AuthResult, 
  User, 
  LoginRequest, 
  RegisterRequest 
} from '../interfaces/IAuthService';
import type { SupabaseProfile } from './types';

export class AuthService implements IAuthService {
  private static instance: AuthService;
  
  // Singleton pattern to ensure one instance
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Authenticate user with email and password
   */
  async login(request: LoginRequest): Promise<AuthResult> {
    try {
      console.log('AuthService: Attempting login for:', request.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: request.email,
        password: request.password,
      });

      if (error || !data.user) {
        console.error('AuthService: Login failed:', error?.message);
        return {
          success: false,
          error: error?.message || 'Login failed',
        };
      }

      // Load user profile
      const user = await this.loadUserProfile(data.user.id);
      if (!user) {
        console.error('AuthService: Failed to load user profile after login');
        return {
          success: false,
          error: 'Failed to load user profile',
        };
      }

      console.log('AuthService: Login successful for:', user.email);
      return {
        success: true,
        user,
      };
    } catch (error: any) {
      console.error('AuthService: Login error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Create a new user account
   */
  async register(request: RegisterRequest): Promise<AuthResult> {
    try {
      console.log('AuthService: Attempting registration for:', request.email);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: request.email,
        password: request.password,
      });

      if (authError || !authData.user) {
        console.error('AuthService: Registration failed:', authError?.message);
        return {
          success: false,
          error: authError?.message || 'Registration failed',
        };
      }

      // Create profile
      const nameParts = request.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          role: 'customer',
        });

      if (profileError) {
        console.error('AuthService: Profile creation failed:', profileError.message);
        // Clean up auth user if profile creation fails
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Failed to create user profile',
        };
      }

      // Create user object
      const user: User = {
        id: authData.user.id,
        name: request.name,
        email: request.email,
        phone: '',
        address: '',
        isGuest: false,
      };

      console.log('AuthService: Registration successful for:', request.email);
      return {
        success: true,
        user,
      };
    } catch (error: any) {
      console.error('AuthService: Registration error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    try {
      console.log('AuthService: Logging out user');
      await supabase.auth.signOut();
      console.log('AuthService: Logout successful');
    } catch (error: any) {
      console.error('AuthService: Logout error:', error);
      // Don't throw error for logout, just log it
    }
  }

  /**
   * Clear guest session and associated data
   */
  async logoutGuest(guestUserId?: string): Promise<void> {
    try {
      console.log('AuthService: Clearing guest session for:', guestUserId);

      if (guestUserId) {
        // Import AsyncStorage dynamically to avoid issues
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;

        // Clear guest-specific orders
        const ordersKey = `@onolo_orders_${guestUserId}`;
        await AsyncStorage.removeItem(ordersKey);
        console.log('AuthService: Cleared guest orders for:', guestUserId);

        // Clear any other guest-specific data if needed
        // Add more cleanup here as needed
      }

      console.log('AuthService: Guest session cleared');
    } catch (error: any) {
      console.error('AuthService: Guest logout error:', error);
      // Don't throw error for logout, just log it
    }
  }

  /**
   * Create a guest session
   */
  async loginAsGuest(): Promise<AuthResult> {
    try {
      console.log('AuthService: Creating guest session');

      const guestUser: User = {
        id: 'guest-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        name: 'Guest User',
        email: '',
        phone: '',
        address: '',
        isGuest: true,
      };

      console.log('AuthService: Created guest user with ID:', guestUser.id);
      return {
        success: true,
        user: guestUser,
      };
    } catch (error: any) {
      console.error('AuthService: Guest login error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create guest session',
      };
    }
  }

  /**
   * Create a new guest session (for switching guest sessions)
   */
  async createNewGuestSession(): Promise<AuthResult> {
    console.log('AuthService: Creating new guest session');
    return this.loginAsGuest();
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('AuthService: Error getting session:', error);
        return null;
      }

      if (!session?.user) {
        return null;
      }

      return await this.loadUserProfile(session.user.id);
    } catch (error: any) {
      console.error('AuthService: Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session?.user;
    } catch (error: any) {
      console.error('AuthService: Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('AuthService: Token refresh failed:', error);
        return false;
      }

      return !!data.session;
    } catch (error: any) {
      console.error('AuthService: Token refresh error:', error);
      return false;
    }
  }

  /**
   * Load user profile from database with enhanced error handling
   * @private
   */
  private async loadUserProfile(userId: string): Promise<User | null> {
    try {
      console.log('AuthService: Loading profile for user:', userId);
      
      // Use enhanced error handling wrapper
      const { data: profile, error } = await supabaseRequest(async () => 
        await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
      );

      if (error) {
        // Check for CORS error and provide clearer guidance
        if (error.isCorsError) {
          console.error('AuthService: CORS error loading profile. Please configure CORS in Supabase dashboard.');
          // Return fallback profile with limited data
          return this.createFallbackProfile(userId);
        }
        
        console.error('AuthService: Error loading profile:', error.message);
        return null;
      }

      if (!profile) {
        console.error('AuthService: Profile not found for user:', userId);
        return null;
      }

      // Get email from auth user with enhanced error handling
      const authResult = await supabaseRequest(async () => 
        await supabase.auth.getUser()
      );
      
      const authUser = authResult.data?.user;
      const email = authUser?.email || '';

      const user: User = {
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
        email,
        phone: profile.phone || '',
        address: profile.address || '',
        isGuest: false,
      };

      console.log('AuthService: Profile loaded successfully');
      return user;
    } catch (error: any) {
      console.error('AuthService: Error in loadUserProfile:', error);
      
      // Create a fallback profile with minimal data to prevent app crashes
      return this.createFallbackProfile(userId);
    }
  }
  
  /**
   * Create a fallback profile when profile loading fails
   * @private
   */
  private createFallbackProfile(userId: string): User {
    console.log('AuthService: Creating fallback profile for:', userId);
    
    // Create a minimal user object to prevent app crashes
    return {
      id: userId,
      name: 'User',
      email: '',
      phone: '',
      address: '',
      isGuest: false,
      // Flag indicating this is a fallback profile that should be refreshed
      _fallback: true,
    };
  }

  /**
   * Set up auth state change listener
   */
  public onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();