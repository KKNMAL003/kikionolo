import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { supabase, testSupabaseConnection, testRawConnection } from '../lib/supabase';
import { validateProfileData, sanitizeProfileData } from '../utils/profileValidation';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isGuest: boolean;
}

// Order interface matching Supabase schema
interface Order {
  id: string;
  date: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'order_received' | 'order_confirmed' | 'preparing' | 'scheduled_for_delivery' | 'driver_dispatched' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: string;
  deliveryAddress: string;
  deliverySchedule?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
}

// Profile update progress tracking
export interface ProfileUpdateProgress {
  step: 'validation' | 'sanitization' | 'auth_update' | 'profile_update' | 'local_update' | 'completed';
  status: 'pending' | 'inProgress' | 'completed' | 'error';
  message?: string;
  error?: string;
}

// Notification Preferences Types
export type NotificationSettings = {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
};
export type NotificationPreferences = {
  orderUpdates?: boolean;
  promotions?: boolean;
  newsletter?: boolean;
};

// Context interface
interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => Promise<{ success: boolean; progress: ProfileUpdateProgress[]; error?: string }>;
  loginAsGuest: () => Promise<void>;
  isAuthenticated: boolean;
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'date'>) => Promise<Order>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  getOrderById: (orderId: string) => Order | undefined;
  loadUserOrders: () => Promise<void>;
  supabaseConnected: boolean;
  resetNavigationState: () => void;
  isProcessingOrder: boolean;
  notificationSettings: NotificationSettings;
  notificationPreferences: NotificationPreferences;
  expoPushToken: string | null;
  fetchNotificationPreferences: () => Promise<void>;
  updateNotificationPreferences: (settings: NotificationSettings, preferences: NotificationPreferences) => Promise<void>;
  registerForPushNotifications: () => Promise<string | null>;
}

// Create context with undefined default value
const UserContext = createContext<UserContextType | undefined>(undefined);

// Timeout wrapper for promises with AbortController support
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 8000, operationName: string = 'Operation'): Promise<T> => {
  const controller = new AbortController();
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    
    // Clean up timeout if the main promise resolves
    promise.finally(() => clearTimeout(timeoutId));
  });

  return Promise.race([promise, timeoutPromise]);
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({ email: true, sms: true, push: true });
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({ orderUpdates: true, promotions: true, newsletter: true });
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // Navigation state reset function
  const resetNavigationState = useCallback(() => {
    console.log('Resetting navigation state...');
    // This function can be called to clear navigation history
    // Implementation will depend on how the app navigation is structured
  }, []);

  // Enhanced Supabase connection testing
  useEffect(() => {
    const checkConnection = async () => {
      console.log('Testing Supabase connection...');
      
      // Test both methods to get better diagnostics
      const [basicConnection, rawConnection] = await Promise.all([
        testSupabaseConnection(),
        testRawConnection()
      ]);
      
      const connected = basicConnection || rawConnection;
      setSupabaseConnected(connected);
      
      if (!connected) {
        console.warn('Supabase connection failed, app will work in offline mode');
        console.warn('To fix this issue:');
        console.warn('1. Check your internet connection');
        console.warn('2. Verify Supabase project settings');
        console.warn('3. Add http://localhost:8081 to CORS allowed origins in Supabase dashboard');
        
        Toast.show({
          type: 'info',
          text1: 'Offline Mode',
          text2: 'Working in offline mode. Some features may be limited.',
          position: 'bottom',
          visibilityTime: 4000,
        });
      } else {
        console.log('Supabase connection successful');
        Toast.show({
          type: 'success',
          text1: 'Connected',
          text2: 'Database connection established successfully.',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    };
    
    checkConnection();
  }, []);

  // Convert Supabase user to our User interface
  const convertSupabaseUser = async (supabaseUser: SupabaseUser): Promise<User> => {
    // Only try to get profile data if Supabase is connected
    let profileData = null;
    if (supabaseConnected) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();
        
        if (error) {
          console.log('Could not fetch profile data:', error.message);
        } else {
          profileData = profile;
        }
      } catch (error: any) {
        console.log('Error fetching profile data:', error.message);
      }
    }

    const name = profileData?.first_name && profileData?.last_name 
      ? `${profileData.first_name} ${profileData.last_name}`.trim()
      : supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User';

    return {
      id: supabaseUser.id,
      name,
      email: supabaseUser.email || '',
      phone: profileData?.phone || supabaseUser.user_metadata?.phone || '',
      address: profileData?.address || supabaseUser.user_metadata?.address || '',
      isGuest: false,
    };
  };

  // Ensure user profile exists in database
  const ensureUserProfile = async (supabaseUser: SupabaseUser) => {
    // Skip profile creation if Supabase is not connected
    if (!supabaseConnected) {
      console.log('Skipping profile creation - Supabase not connected');
      return;
    }

    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', supabaseUser.id)
        .single();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const name = supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User';
        const nameParts = name.split(' ');
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: supabaseUser.id,
              first_name: nameParts[0] || name,
              last_name: nameParts.slice(1).join(' ') || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

        if (profileError) {
          console.warn('Could not create profile automatically:', profileError.message);
          // Don't throw error, profile creation is optional for app functionality
        } else {
          console.log('Profile created successfully for user:', supabaseUser.id);
        }
      }
    } catch (error: any) {
      console.warn('Error ensuring user profile:', error.message);
      // Don't throw error, app should still work without profile table access
    }
  };

  // Load user orders from Supabase
  const loadUserOrders = useCallback(async () => {
    if (!session?.user) {
      console.log('No authenticated user, skipping order load');
      return;
    }

    // Skip if Supabase is not connected
    if (!supabaseConnected) {
      console.log('Supabase not connected, loading orders from storage');
      await loadOrdersFromStorage();
      return;
    }

    try {
      console.log('Loading orders for user:', session.user.id);
      
      // Fetch orders with order items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_id,
            product_name,
            quantity,
            unit_price
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        // Fall back to AsyncStorage if Supabase fails
        await loadOrdersFromStorage();
        return;
      }

      if (ordersData) {
        const formattedOrders: Order[] = ordersData.map(order => ({
          id: order.id,
          date: order.created_at,
          items: order.order_items.map((item: any) => ({
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            price: item.unit_price,
          })),
          totalAmount: order.total_amount,
          status: order.status,
          paymentMethod: order.payment_method,
          deliveryAddress: order.delivery_address,
          deliverySchedule: order.preferred_delivery_window ? 
            `${order.delivery_date || 'TBD'} - ${order.preferred_delivery_window}` : undefined,
          customerName: order.customer_name,
          customerPhone: order.delivery_phone,
          customerEmail: order.customer_email,
          notes: order.notes,
        }));

        console.log('Loaded orders from Supabase:', formattedOrders.length);
        setOrders(formattedOrders);
        
        // Also save to AsyncStorage as backup
        await AsyncStorage.setItem('@onolo_orders_data_v2', JSON.stringify(formattedOrders));
      }
    } catch (error: any) {
      console.error('Error loading user orders:', error.message);
      // Fall back to AsyncStorage
      await loadOrdersFromStorage();
    }
  }, [session?.user, supabaseConnected]);

  // Fallback: Load orders from AsyncStorage
  const loadOrdersFromStorage = async () => {
    try {
      const ordersData = await AsyncStorage.getItem('@onolo_orders_data_v2');
      if (ordersData) {
        console.log('Loaded orders from AsyncStorage fallback');
        setOrders(JSON.parse(ordersData));
      }
    } catch (error: any) {
      console.error('Error loading orders from AsyncStorage:', error.message);
    }
  };

  // Initialize auth state with better error handling
  useEffect(() => {
    console.log('Initializing auth state...');
    setIsLoading(true);

    // Only proceed with auth if Supabase is connected
    if (!supabaseConnected) {
      console.log('Supabase not connected, skipping auth initialization');
      setIsLoading(false);
      return;
    }

    // Get initial session with timeout handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error.message);
          setIsLoading(false);
          return;
        }

        console.log('Initial session:', session?.user?.email || 'No session');
        setSession(session);
        
        if (session?.user) {
          // Ensure profile exists
          await ensureUserProfile(session.user);
          // Convert to our user format
          const convertedUser = await convertSupabaseUser(session.user);
          setUser(convertedUser);
        }
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error initializing auth:', error.message);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes with better error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email || 'No session');
      setSession(session);
      
      try {
        if (session?.user) {
          // Ensure profile exists when user signs in
          await ensureUserProfile(session.user);
          // Convert to our user format
          const convertedUser = await convertSupabaseUser(session.user);
          setUser(convertedUser);
        } else {
          setUser(null);
          setOrders([]); // Clear orders when user logs out
          // Reset navigation state when user logs out
          resetNavigationState();
        }
      } catch (error: any) {
        console.error('Error handling auth state change:', error.message);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabaseConnected, resetNavigationState]);

  // Load orders when user changes
  useEffect(() => {
    if (session?.user && !isLoading) {
      loadUserOrders();
    } else if (!session?.user) {
      // If no authenticated user, try to load guest orders from AsyncStorage
      loadOrdersFromStorage();
    }
  }, [session?.user, isLoading, loadUserOrders]);

  // Login function with enhanced error handling
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('Attempting login with email:', email);
    
    // Check if Supabase is connected
    if (!supabaseConnected) {
      console.error('Cannot login: Supabase not connected');
      Toast.show({
        type: 'error',
        text1: 'Connection Error',
        text2: 'Unable to connect to authentication service. Check your network connection.',
        position: 'bottom',
        visibilityTime: 6000,
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Use console.warn for invalid credentials since this is expected user behavior
        if (error.message.includes('Invalid login credentials')) {
          console.warn('Login failed due to invalid credentials for email:', email);
        } else {
          console.error('Login error:', error.message);
        }
        
        // Provide specific error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Connection failed. Please check your internet connection.';
        }
        
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: errorMessage,
          position: 'bottom',
          visibilityTime: 6000,
        });
        return false;
      }

      if (data.user) {
        console.log('Login successful for user:', data.user.email);
        
        // Reset navigation state on successful login
        resetNavigationState();
        
        // Show success toast
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: `Welcome back!`,
          position: 'bottom',
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Login error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: 'An unexpected error occurred during login. Please try again.',
        position: 'bottom',
        visibilityTime: 6000,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function with enhanced error handling
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    console.log('Attempting registration for:', name, email);
    
    // Check if Supabase is connected
    if (!supabaseConnected) {
      console.error('Cannot register: Supabase not connected');
      Toast.show({
        type: 'error',
        text1: 'Connection Error',
        text2: 'Unable to connect to authentication service. Check your network connection.',
        position: 'bottom',
        visibilityTime: 6000,
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        console.error('Registration error:', error.message);
        
        // Provide specific error messages
        let errorMessage = error.message;
        if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please try logging in instead.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Connection failed. Please check your internet connection.';
        }
        
        Toast.show({
          type: 'error',
          text1: 'Registration Failed',
          text2: errorMessage,
          position: 'bottom',
          visibilityTime: 6000,
        });
        return false;
      }

      if (data.user) {
        console.log('Registration successful for:', name);
        
        // Reset navigation state on successful registration
        resetNavigationState();
        
        // Note: Profile creation will be handled by the auth state change listener
        // when the user is confirmed and authenticated, not immediately here
        
        // Show success toast
        Toast.show({
          type: 'success',
          text1: 'Registration Successful',
          text2: `Welcome, ${name}!`,
          position: 'bottom',
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Registration error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Registration Error',
        text2: 'An unexpected error occurred during registration. Please try again.',
        position: 'bottom',
        visibilityTime: 6000,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function with navigation reset
  const logout = async (): Promise<void> => {
    console.log('Logging out user');
    try {
      if (supabaseConnected) {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Logout error:', error.message);
          return;
        }
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setOrders([]);
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('@onolo_orders_data_v2');
      
      // Reset navigation state on logout
      resetNavigationState();
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been successfully logged out.',
        position: 'bottom',
      });
      
      console.log('Logout successful');
    } catch (error: any) {
      console.error('Logout error:', error.message);
    }
  };

  // Simplified and more robust update user profile function
  const updateUserProfile = async (userData: Partial<User>): Promise<{ success: boolean; progress: ProfileUpdateProgress[]; error?: string }> => {
    console.log('Starting simplified profile update with data:', userData);
    
    const progress: ProfileUpdateProgress[] = [];
    
    // Step 1: Validation
    progress.push({ step: 'validation', status: 'inProgress', message: 'Validating profile data...' });
    
    try {
      // Quick validation
      const validationResult = validateProfileData(userData);
      if (!validationResult.isValid) {
        const errorMessages = Object.entries(validationResult.errors)
          .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
          .join('; ');
        
        progress[0] = { step: 'validation', status: 'error', error: errorMessages };
        
        console.error('Profile validation failed:', validationResult.errors);
        return { success: false, progress, error: errorMessages };
      }
      
      progress[0] = { step: 'validation', status: 'completed', message: 'Profile data validated successfully' };
      
      // Step 2: Sanitization
      progress.push({ step: 'sanitization', status: 'inProgress', message: 'Sanitizing input data...' });
      
      const sanitizedData = sanitizeProfileData(userData);
      console.log('Sanitized profile data:', sanitizedData);
      
      progress[1] = { step: 'sanitization', status: 'completed', message: 'Input data sanitized' };
      
      // Check if user is authenticated
      if (!session?.user) {
        const error = 'No authenticated user found';
        progress.push({ step: 'auth_update', status: 'error', error });
        console.error('Profile update failed:', error);
        return { success: false, progress, error };
      }
      
      let supabaseSuccess = false;
      
      // Step 3: Update Supabase (with simplified error handling and timeouts)
      if (supabaseConnected) {
        progress.push({ step: 'profile_update', status: 'inProgress', message: 'Updating profile database...' });
        
        try {
          // Prepare profile update with proper field mapping
          const nameParts = sanitizedData.name?.trim().split(' ') || [''];
          const profileUpdate = {
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            phone: sanitizedData.phone?.trim() || '',
            address: sanitizedData.address?.trim() || '',
            updated_at: new Date().toISOString(),
          };

          console.log('Updating Supabase profile with:', profileUpdate);

          // Use timeout wrapper for the Supabase operation
          await withTimeout(
            supabase
              .from('profiles')
              .update(profileUpdate)
              .eq('id', session.user.id)
              .then(({ error }) => {
                if (error) {
                  throw new Error(`Profile update failed: ${error.message}`);
                }
              }),
            5000, // 5 second timeout
            'Profile database update'
          );
          
          progress[2] = { step: 'profile_update', status: 'completed', message: 'Profile database updated successfully' };
          supabaseSuccess = true;
          
        } catch (error: any) {
          console.error('Supabase profile update failed:', error.message);
          
          // Check if it's a timeout or network error
          const isNetworkError = error.message?.toLowerCase().includes('timeout') || 
                                 error.message?.toLowerCase().includes('network') ||
                                 error.message?.toLowerCase().includes('connection');
          
          if (isNetworkError) {
            progress[2] = { 
              step: 'profile_update', 
              status: 'error', 
              error: 'Network timeout - continuing with local update' 
            };
          } else {
            progress[2] = { 
              step: 'profile_update', 
              status: 'error', 
              error: error.message 
            };
            
            // For non-network errors, still continue with local update
            console.log('Non-network error, continuing with local update...');
          }
        }
      } else {
        progress.push({ step: 'profile_update', status: 'completed', message: 'Skipped (offline mode)' });
      }
      
      // Step 4: Update local state (always do this)
      progress.push({ step: 'local_update', status: 'inProgress', message: 'Updating local profile...' });
      
      if (user) {
        const updatedUser = { 
          ...user, 
          name: sanitizedData.name?.trim() || user.name,
          email: sanitizedData.email?.trim() || user.email,
          phone: sanitizedData.phone?.trim() || user.phone,
          address: sanitizedData.address?.trim() || user.address,
        };
        setUser(updatedUser);
        
        // Save to local storage as backup
        try {
          await AsyncStorage.setItem('@onolo_user_data_v2', JSON.stringify(updatedUser));
        } catch (storageError: any) {
          console.warn('Failed to save to local storage:', storageError.message);
        }
      }
      
      progress[progress.length - 1] = { step: 'local_update', status: 'completed', message: 'Local profile updated' };
      
      // Step 5: Completion
      progress.push({ step: 'completed', status: 'completed', message: 'Profile update completed successfully' });
      
      console.log('Profile update completed successfully');
      
      // Show appropriate success message
      if (supabaseSuccess) {
        Toast.show({
          type: 'success',
          text1: 'Profile Updated',
          text2: 'Your profile has been updated and synchronized.',
          position: 'bottom',
          visibilityTime: 4000,
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Profile Updated Locally',
          text2: 'Changes saved locally. Will sync when connection is restored.',
          position: 'bottom',
          visibilityTime: 4000,
        });
      }
      
      return { success: true, progress };
      
    } catch (error: any) {
      console.error('Unexpected error in profile update:', error.message);
      
      // Update the last progress item with error
      if (progress.length > 0) {
        progress[progress.length - 1] = { 
          ...progress[progress.length - 1], 
          status: 'error', 
          error: error.message 
        };
      }
      
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'An unexpected error occurred. Please try again.',
        position: 'bottom',
        visibilityTime: 6000,
      });
      
      return { success: false, progress, error: error.message };
    }
  };

  // Login as guest
  const loginAsGuest = async (): Promise<void> => {
    console.log('Logging in as guest');
    const guestUser: User = {
      id: 'guest-' + Date.now(),
      name: 'Guest User',
      email: '',
      phone: '',
      address: '',
      isGuest: true
    };
    
    // Update state
    setUser(guestUser);
    
    // Reset navigation state for guest login
    resetNavigationState();
    
    // Show info toast
    Toast.show({
      type: 'info',
      text1: 'Guest Mode',
      text2: 'You are now browsing as a guest.',
      position: 'bottom',
    });
    
    console.log('Guest login successful');
  };

  // Enhanced add order function with proper error handling and validation
  const addOrder = async (orderData: Omit<Order, 'id' | 'date'>): Promise<Order> => {
    console.log('Adding new order:', orderData);
    setIsProcessingOrder(true);
    
    // Input validation
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    if (!orderData.customerName?.trim()) {
      throw new Error('Customer name is required');
    }

    if (!orderData.deliveryAddress?.trim()) {
      throw new Error('Delivery address is required');
    }

    if (!orderData.paymentMethod?.trim()) {
      throw new Error('Payment method is required');
    }

    if (!orderData.totalAmount || orderData.totalAmount <= 0) {
      throw new Error('Invalid order total amount');
    }
    
    try {
      if (session?.user && supabaseConnected) {
        // Save to Supabase for authenticated users
        const orderInsert = {
          user_id: session.user.id,
          status: orderData.status || 'pending',
          total_amount: orderData.totalAmount,
          delivery_address: orderData.deliveryAddress,
          delivery_phone: orderData.customerPhone || '',
          payment_method: orderData.paymentMethod,
          customer_name: orderData.customerName || '',
          customer_email: orderData.customerEmail || '',
          notes: orderData.notes || '',
          delivery_date: orderData.deliverySchedule ? new Date().toISOString().split('T')[0] : null,
          preferred_delivery_window: orderData.deliverySchedule?.includes('morning') ? 'morning' :
                                   orderData.deliverySchedule?.includes('afternoon') ? 'afternoon' :
                                   orderData.deliverySchedule?.includes('evening') ? 'evening' : null,
        };

        console.log('Creating order in Supabase:', orderInsert);

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([orderInsert])
          .select()
          .single();

        if (orderError) {
          console.error('Error creating order in Supabase:', orderError);
          // Fall back to local storage
          return addOrderLocally(orderData);
        }

        // Insert order items
        const orderItems = orderData.items.map(item => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }));

        console.log('Creating order items:', orderItems);

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Error creating order items:', itemsError);
          // Order was created but items failed - this is recoverable
        }

        const newOrder: Order = {
          id: order.id,
          date: order.created_at,
          items: orderData.items,
          totalAmount: orderData.totalAmount,
          status: orderData.status || 'pending',
          paymentMethod: orderData.paymentMethod,
          deliveryAddress: orderData.deliveryAddress,
          deliverySchedule: orderData.deliverySchedule,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerEmail: orderData.customerEmail,
          notes: orderData.notes,
        };

        // Update local state
        const updatedOrders = [newOrder, ...orders];
        setOrders(updatedOrders);
        
        // Also save to AsyncStorage as backup
        try {
          await AsyncStorage.setItem('@onolo_orders_data_v2', JSON.stringify(updatedOrders));
        } catch (storageError: any) {
          console.warn('Failed to save orders to local storage:', storageError.message);
        }

        console.log('Order added successfully to Supabase:', newOrder.id);
        return newOrder;
      } else {
        // For guest users or when Supabase is not connected, save locally only
        return addOrderLocally(orderData);
      }
    } catch (error: any) {
      console.error('Error adding order:', error.message);
      // Fall back to local storage
      return addOrderLocally(orderData);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Add order locally (fallback)
  const addOrderLocally = async (orderData: Omit<Order, 'id' | 'date'>): Promise<Order> => {
    const newOrder: Order = {
      ...orderData,
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      status: orderData.status || 'pending',
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    
    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem('@onolo_orders_data_v2', JSON.stringify(updatedOrders));
    } catch (error: any) {
      console.error('Failed to save order to AsyncStorage:', error.message);
    }
    
    console.log('Order added locally:', newOrder.id);
    return newOrder;
  };

  // Cancel order
  const cancelOrder = async (orderId: string): Promise<boolean> => {
    console.log('Cancelling order:', orderId);
    try {
      if (session?.user && supabaseConnected) {
        // Update in Supabase
        const { error } = await supabase
          .from('orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .eq('user_id', session.user.id);

        if (error) {
          console.error('Error cancelling order in Supabase:', error);
          // Fall back to local update
        }
      }

      // Update local state
      const orderIndex = orders.findIndex(order => order.id === orderId);
      if (orderIndex === -1) {
        console.log('Cancel order failed: Order not found');
        return false;
      }

      const updatedOrders = [...orders];
      updatedOrders[orderIndex] = {
        ...updatedOrders[orderIndex],
        status: 'cancelled'
      };

      setOrders(updatedOrders);
      
      // Save to AsyncStorage
      try {
        await AsyncStorage.setItem('@onolo_orders_data_v2', JSON.stringify(updatedOrders));
      } catch (error: any) {
        console.error('Failed to save cancelled order to AsyncStorage:', error.message);
      }
      
      console.log('Order cancelled successfully');
      return true;
    } catch (error: any) {
      console.error('Cancel order error:', error.message);
      return false;
    }
  };

  // Get order by ID
  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find(order => order.id === orderId);
  };

  // Fetch notification preferences from Supabase
  const fetchNotificationPreferences = useCallback(async () => {
    if (!session?.user || !supabaseConnected) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('notification_settings, notification_preferences, expo_push_token')
      .eq('id', session.user.id)
      .single();
    if (!error && data) {
      setNotificationSettings(data.notification_settings || { email: true, sms: true, push: true });
      setNotificationPreferences(data.notification_preferences || { orderUpdates: true, promotions: true, newsletter: true });
      setExpoPushToken(data.expo_push_token || null);
    }
  }, [session?.user, supabaseConnected]);

  // Update notification preferences in Supabase
  const updateNotificationPreferences = useCallback(async (settings: NotificationSettings, preferences: NotificationPreferences) => {
    if (!session?.user || !supabaseConnected) return;
    setNotificationSettings(settings);
    setNotificationPreferences(preferences);
    await supabase
      .from('profiles')
      .update({ notification_settings: settings, notification_preferences: preferences })
      .eq('id', session.user.id);
  }, [session?.user, supabaseConnected]);

  // Register for push notifications and save token to Supabase
  const registerForPushNotifications = useCallback(async () => {
    try {
      // Dynamically import to avoid web errors
      const Notifications = await import('expo-notifications');
      const Device = await import('expo-device');
      let token = null;
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          Toast.show({ type: 'error', text1: 'Permission denied', text2: 'Enable push notifications in settings.' });
          return null;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
        setExpoPushToken(token);
        if (session?.user && supabaseConnected) {
          await supabase.from('profiles').update({ expo_push_token: token }).eq('id', session.user.id);
        }
      } else {
        Toast.show({ type: 'info', text1: 'Physical device required', text2: 'Push notifications only work on a real device.' });
      }
      return token;
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Push registration failed', text2: e.message });
      return null;
    }
  }, [session?.user, supabaseConnected]);

  // Fetch preferences on login
  useEffect(() => {
    if (session?.user && supabaseConnected) {
      fetchNotificationPreferences();
    }
  }, [session?.user, supabaseConnected, fetchNotificationPreferences]);

  // Context value
  const contextValue: UserContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateUserProfile,
    loginAsGuest,
    isAuthenticated: !!session && !!user && !user.isGuest,
    orders,
    addOrder,
    cancelOrder,
    getOrderById,
    loadUserOrders,
    supabaseConnected,
    resetNavigationState,
    isProcessingOrder,
    notificationSettings,
    notificationPreferences,
    expoPushToken,
    fetchNotificationPreferences,
    updateNotificationPreferences,
    registerForPushNotifications,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}