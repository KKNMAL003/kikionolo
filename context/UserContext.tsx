import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isGuest: boolean;
  securitySettings?: {
    biometricLogin?: boolean;
    twoFactorAuth?: boolean;
  };
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  paymentMethod: string;
  totalAmount: number;
  items: Array<{ 
    productId: string; 
    productName: string; 
    quantity: number; 
    price: number; 
  }>;
  status: string;
  date: string;
}

export interface Message {
  id: string;
  user_id: string;
  customer_id: string;
  staff_id?: string;
  log_type: 'user_message' | 'staff_message' | 'order_status_update';
  subject: string;
  message: string;
  sender_type: 'customer' | 'staff';
  is_read: boolean;
  created_at: string;
}

export interface ProfileUpdateProgress {
  step: string;
  status: 'pending' | 'inProgress' | 'completed' | 'error';
  message?: string;
  error?: string;
}

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
}

interface NotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
}

interface UserContextType {
  user: User | null;
  orders: Order[];
  messages: Message[];
  unreadMessagesCount: number;
  notificationSettings: NotificationSettings;
  notificationPreferences: NotificationPreferences;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProcessingOrder: boolean;
  isGuest: boolean;
  
  // Auth methods
  login: (email: string, password: string) => Promise<boolean>;
  loginAsGuest: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Order methods
  addOrder: (orderData: any) => Promise<Order>;
  getOrderById: (id: string) => Order | undefined;
  cancelOrder: (orderId: string) => Promise<boolean>;
  refreshOrders: () => Promise<void>;
  
  // Profile methods
  updateUserProfile: (data: any) => Promise<{ success: boolean; progress: ProfileUpdateProgress[]; error?: string; }>;
  
  // Message methods
  sendMessage: (content: string) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  markAllMessagesAsRead: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  
  // Notification methods
  updateNotificationPreferences: (settings: NotificationSettings, preferences: NotificationPreferences) => Promise<void>;
  registerForPushNotifications: () => Promise<void>;
  fetchNotificationPreferences: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    sms: true,
    push: true,
  });
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    orderUpdates: true,
    promotions: true,
    newsletter: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Refs for cleanup and channel management
  const messageChannelRef = useRef<RealtimeChannel | null>(null);
  const ordersChannelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);
  const currentUserIdRef = useRef<string | null>(null);
  const authSubscriptionRef = useRef<any>(null);
  const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ordersSetupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Computed properties
  const isAuthenticated = !!user && !user.isGuest;
  const isGuest = !!user && user.isGuest;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanupAll();
    };
  }, []);

  // Comprehensive cleanup function
  const cleanupAll = useCallback(() => {
    console.log('🧹 Starting comprehensive cleanup...');
    
    // Clear any pending timeouts
    if (setupTimeoutRef.current) {
      clearTimeout(setupTimeoutRef.current);
      setupTimeoutRef.current = null;
    }

    if (ordersSetupTimeoutRef.current) {
      clearTimeout(ordersSetupTimeoutRef.current);
      ordersSetupTimeoutRef.current = null;
    }

    // Cleanup message subscription
    if (messageChannelRef.current) {
      try {
        console.log('Cleaning up message subscription...');
        messageChannelRef.current.unsubscribe();
        supabase.removeChannel(messageChannelRef.current);
        messageChannelRef.current = null;
      } catch (error) {
        console.warn('Warning during message subscription cleanup:', error);
      }
    }

    // Cleanup orders subscription
    if (ordersChannelRef.current) {
      try {
        console.log('Cleaning up orders subscription...');
        ordersChannelRef.current.unsubscribe();
        supabase.removeChannel(ordersChannelRef.current);
        ordersChannelRef.current = null;
      } catch (error) {
        console.warn('Warning during orders subscription cleanup:', error);
      }
    }

    // Cleanup auth subscription
    if (authSubscriptionRef.current) {
      try {
        console.log('Cleaning up auth subscription...');
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      } catch (error) {
        console.warn('Warning during auth subscription cleanup:', error);
      }
    }

    // Reset refs
    currentUserIdRef.current = null;
    
    console.log('✅ Comprehensive cleanup completed');
  }, []);

  // Debounced setup function for message subscription
  const debouncedSetupMessageSubscription = useCallback((userId: string) => {
    if (setupTimeoutRef.current) {
      clearTimeout(setupTimeoutRef.current);
    }

    setupTimeoutRef.current = setTimeout(() => {
      setupMessageSubscription(userId);
    }, 1000);
  }, []);

  // Debounced setup function for orders subscription
  const debouncedSetupOrderSubscription = useCallback((userId: string) => {
    if (ordersSetupTimeoutRef.current) {
      clearTimeout(ordersSetupTimeoutRef.current);
    }

    ordersSetupTimeoutRef.current = setTimeout(() => {
      setupOrderSubscription(userId);
    }, 1500); // Slightly longer delay to ensure message subscription is established first
  }, []);

  // Setup message subscription with enhanced UPDATE event handling
  const setupMessageSubscription = useCallback(async (userId: string) => {
    if (!userId || !isMountedRef.current) {
      console.log('setupMessageSubscription: Cannot setup - invalid userId or component unmounted');
      return;
    }

    // If we already have a subscription for this user, don't create another one
    if (currentUserIdRef.current === userId && messageChannelRef.current) {
      console.log('setupMessageSubscription: Subscription already exists for this user');
      return;
    }

    try {
      console.log(`setupMessageSubscription: Setting up message subscription for user: ${userId}`);
      
      // Clean up any existing subscription before creating a new one
      if (messageChannelRef.current) {
        console.log('setupMessageSubscription: Cleaning up existing subscription');
        try {
          messageChannelRef.current.unsubscribe();
          supabase.removeChannel(messageChannelRef.current);
        } catch (cleanupError) {
          console.warn('setupMessageSubscription: Warning during cleanup:', cleanupError);
        }
        messageChannelRef.current = null;
      }

      // Create unique channel name to avoid conflicts
      const channelName = `messages_${userId}_${Date.now()}`;
      console.log(`setupMessageSubscription: Creating channel: ${channelName}`);
      
      const channel = supabase.channel(channelName, {
        config: {
          presence: { key: userId },
        }
      });
      
      // Set up the subscription with enhanced event handling
      channel
        .on(
          'postgres_changes',
          { 
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public', 
            table: 'communication_logs', 
            filter: `customer_id=eq.${userId}` 
          },
          (payload: any) => {
            try {
              console.log('setupMessageSubscription: Received message payload:', payload.eventType, payload.new?.id);
              
              if (!isMountedRef.current) return;

              if (payload.eventType === 'INSERT' && payload.new) {
                const formattedMessage: Message = {
                  id: payload.new.id,
                  user_id: payload.new.user_id,
                  customer_id: payload.new.customer_id,
                  staff_id: payload.new.staff_id,
                  log_type: payload.new.log_type,
                  subject: payload.new.subject || payload.new.message,
                  message: payload.new.message,
                  sender_type: payload.new.sender_type,
                  is_read: payload.new.is_read,
                  created_at: payload.new.created_at,
                };

                setMessages(prev => [formattedMessage, ...prev]);
                
                // Update unread count if it's from staff and unread
                if (payload.new.sender_type === 'staff' && !payload.new.is_read) {
                  setUnreadMessagesCount(prev => prev + 1);
                }
                
                console.log('setupMessageSubscription: Added new message to state');
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                // Handle message updates (e.g., is_read status changes from dashboard)
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === payload.new.id 
                      ? {
                          ...msg,
                          is_read: payload.new.is_read,
                          subject: payload.new.subject || payload.new.message,
                          message: payload.new.message,
                        }
                      : msg
                  )
                );

                // Recalculate unread count
                if (payload.old?.is_read !== payload.new.is_read) {
                  setUnreadMessagesCount(prev => {
                    // If message was marked as read
                    if (!payload.old?.is_read && payload.new.is_read && payload.new.sender_type === 'staff') {
                      return Math.max(0, prev - 1);
                    }
                    // If message was marked as unread
                    if (payload.old?.is_read && !payload.new.is_read && payload.new.sender_type === 'staff') {
                      return prev + 1;
                    }
                    return prev;
                  });
                }
                
                console.log('setupMessageSubscription: Updated message in state');
              }
            } catch (error) {
              console.warn('setupMessageSubscription: Error processing message:', error);
            }
          }
        )
        .subscribe((status: string, error?: any) => {
          console.log(`setupMessageSubscription: Subscription status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ setupMessageSubscription: Successfully subscribed to messages');
            messageChannelRef.current = channel;
            currentUserIdRef.current = userId;
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('❌ setupMessageSubscription: Channel subscription error:', error);
            
            // Clean up failed subscription
            if (messageChannelRef.current === channel) {
              messageChannelRef.current = null;
              currentUserIdRef.current = null;
            }
          } else if (status === 'TIMED_OUT') {
            console.warn('⏱️ setupMessageSubscription: Channel subscription timed out');
            if (messageChannelRef.current === channel) {
              messageChannelRef.current = null;
              currentUserIdRef.current = null;
            }
          } else if (status === 'CLOSED') {
            console.log('📴 setupMessageSubscription: Channel subscription closed');
            if (messageChannelRef.current === channel) {
              messageChannelRef.current = null;
              currentUserIdRef.current = null;
            }
          }
        });

      console.log('setupMessageSubscription: Message subscription setup completed');
    } catch (error) {
      console.error('setupMessageSubscription: Error setting up message subscription:', error);
      // Ensure cleanup on error
      if (messageChannelRef.current) {
        try {
          messageChannelRef.current.unsubscribe();
          supabase.removeChannel(messageChannelRef.current);
        } catch (cleanupError) {
          console.warn('setupMessageSubscription: Error during cleanup:', cleanupError);
        }
        messageChannelRef.current = null;
        currentUserIdRef.current = null;
      }
    }
  }, []);

  // Setup orders subscription for real-time order status updates
  const setupOrderSubscription = useCallback(async (userId: string) => {
    if (!userId || !isMountedRef.current) {
      console.log('setupOrderSubscription: Cannot setup - invalid userId or component unmounted');
      return;
    }

    try {
      console.log(`setupOrderSubscription: Setting up orders subscription for user: ${userId}`);
      
      // Clean up any existing orders subscription
      if (ordersChannelRef.current) {
        console.log('setupOrderSubscription: Cleaning up existing orders subscription');
        try {
          ordersChannelRef.current.unsubscribe();
          supabase.removeChannel(ordersChannelRef.current);
        } catch (cleanupError) {
          console.warn('setupOrderSubscription: Warning during cleanup:', cleanupError);
        }
        ordersChannelRef.current = null;
      }

      // Create unique channel name for orders
      const ordersChannelName = `orders_${userId}_${Date.now()}`;
      console.log(`setupOrderSubscription: Creating orders channel: ${ordersChannelName}`);
      
      const ordersChannel = supabase.channel(ordersChannelName, {
        config: {
          presence: { key: `orders_${userId}` },
        }
      });
      
      // Set up orders subscription
      ordersChannel
        .on(
          'postgres_changes',
          { 
            event: '*', // Listen to INSERT and UPDATE events
            schema: 'public', 
            table: 'orders', 
            filter: `customer_id=eq.${userId}` 
          },
          async (payload: any) => {
            try {
              console.log('setupOrderSubscription: Received order payload:', payload.eventType, payload.new?.id);
              
              if (!isMountedRef.current) return;

              if (payload.eventType === 'INSERT' && payload.new) {
                // New order created (might be from external dashboard)
                try {
                  // Fetch complete order data with items
                  const { data: orderData, error } = await supabase
                    .from('orders')
                    .select(`
                      id,
                      customer_name,
                      customer_email,
                      delivery_address,
                      payment_method,
                      total_amount,
                      status,
                      created_at,
                      order_items (
                        product_id,
                        product_name,
                        quantity,
                        unit_price
                      )
                    `)
                    .eq('id', payload.new.id)
                    .single();

                  if (!error && orderData) {
                    const formattedOrder: Order = {
                      id: orderData.id,
                      customerName: orderData.customer_name,
                      customerEmail: orderData.customer_email,
                      deliveryAddress: orderData.delivery_address,
                      paymentMethod: orderData.payment_method,
                      totalAmount: orderData.total_amount,
                      status: orderData.status,
                      date: orderData.created_at,
                      items: orderData.order_items?.map(item => ({
                        productId: item.product_id,
                        productName: item.product_name,
                        quantity: item.quantity,
                        price: item.unit_price,
                      })) || [],
                    };

                    setOrders(prev => {
                      // Check if order already exists to avoid duplicates
                      const existingIndex = prev.findIndex(order => order.id === formattedOrder.id);
                      if (existingIndex === -1) {
                        return [formattedOrder, ...prev];
                      }
                      return prev;
                    });
                    
                    console.log('setupOrderSubscription: Added new order to state');
                  }
                } catch (fetchError) {
                  console.warn('setupOrderSubscription: Error fetching complete order data:', fetchError);
                }
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                // Order status updated (likely from dashboard)
                setOrders(prev => 
                  prev.map(order => 
                    order.id === payload.new.id 
                      ? {
                          ...order,
                          status: payload.new.status,
                          customerName: payload.new.customer_name || order.customerName,
                          customerEmail: payload.new.customer_email || order.customerEmail,
                          deliveryAddress: payload.new.delivery_address || order.deliveryAddress,
                          totalAmount: payload.new.total_amount || order.totalAmount,
                        }
                      : order
                  )
                );
                
                console.log('setupOrderSubscription: Updated order status in state:', payload.new.status);
                
                // Show notification for status changes (excluding the initial pending status)
                if (payload.old?.status !== payload.new.status && payload.new.status !== 'pending') {
                  // This could trigger a toast notification or other UI feedback
                  console.log(`Order ${payload.new.id} status changed from ${payload.old?.status} to ${payload.new.status}`);
                }
              }
            } catch (error) {
              console.warn('setupOrderSubscription: Error processing order update:', error);
            }
          }
        )
        .subscribe((status: string, error?: any) => {
          console.log(`setupOrderSubscription: Orders subscription status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ setupOrderSubscription: Successfully subscribed to orders');
            ordersChannelRef.current = ordersChannel;
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('❌ setupOrderSubscription: Orders channel subscription error:', error);
            
            // Clean up failed subscription
            if (ordersChannelRef.current === ordersChannel) {
              ordersChannelRef.current = null;
            }
          } else if (status === 'TIMED_OUT') {
            console.warn('⏱️ setupOrderSubscription: Orders channel subscription timed out');
            if (ordersChannelRef.current === ordersChannel) {
              ordersChannelRef.current = null;
            }
          } else if (status === 'CLOSED') {
            console.log('📴 setupOrderSubscription: Orders channel subscription closed');
            if (ordersChannelRef.current === ordersChannel) {
              ordersChannelRef.current = null;
            }
          }
        });

      console.log('setupOrderSubscription: Orders subscription setup completed');
    } catch (error) {
      console.error('setupOrderSubscription: Error setting up orders subscription:', error);
      // Ensure cleanup on error
      if (ordersChannelRef.current) {
        try {
          ordersChannelRef.current.unsubscribe();
          supabase.removeChannel(ordersChannelRef.current);
        } catch (cleanupError) {
          console.warn('setupOrderSubscription: Error during cleanup:', cleanupError);
        }
        ordersChannelRef.current = null;
      }
    }
  }, []);

  // Initialize auth state with improved cleanup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        
        // Clean up any existing subscriptions first
        cleanupAll();
        
        // Check if Supabase is connected
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('Supabase not connected, skipping auth initialization');
          await loadOrdersFromStorage();
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Initial session:', session.user.email);
          await loadUserProfile(session.user.id);
        } else {
          await loadOrdersFromStorage();
        }

        // Set up auth state listener with improved cleanup
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMountedRef.current) return;
          
          console.log('Auth state changed:', event, session?.user?.email);
          
          // Clean up existing subscriptions when auth state changes (except for token refresh)
          if ((messageChannelRef.current || ordersChannelRef.current) && event !== 'TOKEN_REFRESHED') {
            console.log('Auth state change: cleaning up existing subscriptions');
            try {
              if (messageChannelRef.current) {
                messageChannelRef.current.unsubscribe();
                supabase.removeChannel(messageChannelRef.current);
                messageChannelRef.current = null;
              }
              if (ordersChannelRef.current) {
                ordersChannelRef.current.unsubscribe();
                supabase.removeChannel(ordersChannelRef.current);
                ordersChannelRef.current = null;
              }
              currentUserIdRef.current = null;
            } catch (error) {
              console.warn('Auth state change: cleanup warning:', error);
            }
          }
          
          if (session?.user && event !== 'TOKEN_REFRESHED') {
            await loadUserProfile(session.user.id);
          } else if (!session?.user) {
            setUser(null);
            setOrders([]);
            setMessages([]);
            setUnreadMessagesCount(0);
            currentUserIdRef.current = null;
            await loadOrdersFromStorage();
          }
          
          setIsLoading(false);
        });

        authSubscriptionRef.current = subscription;
      } catch (error) {
        console.error('Error initializing auth:', error);
        await loadOrdersFromStorage();
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Load user profile and set up subscriptions with debouncing
  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (profile && isMountedRef.current) {
        const userData: User = {
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
          email: '', // Will be set from auth user
          phone: profile.phone || '',
          address: profile.address || '',
          isGuest: false,
        };

        // Get email from auth user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          userData.email = authUser.email || '';
        }

        setUser(userData);
        
        // Load user-specific data
        await Promise.all([
          loadUserOrders(userId),
          loadUserMessages(userId),
        ]);
        
        // Set up real-time subscriptions with debouncing
        debouncedSetupMessageSubscription(userId);
        debouncedSetupOrderSubscription(userId);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

  // Load orders from storage (fallback)
  const loadOrdersFromStorage = async () => {
    try {
      console.log('Loading orders from AsyncStorage fallback');
      const storedOrders = await AsyncStorage.getItem('@onolo_orders');
      if (storedOrders && isMountedRef.current) {
        setOrders(JSON.parse(storedOrders));
      }
    } catch (error) {
      console.error('Error loading orders from storage:', error);
    }
  };

  // Load user orders from Supabase
  const loadUserOrders = async (userId: string) => {
    try {
      console.log('Loading orders for user:', userId);
      
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_email,
          delivery_address,
          payment_method,
          total_amount,
          status,
          created_at,
          order_items (
            product_id,
            product_name,
            quantity,
            unit_price
          )
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        await loadOrdersFromStorage();
        return;
      }

      if (ordersData && isMountedRef.current) {
        const formattedOrders: Order[] = ordersData.map(order => ({
          id: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          deliveryAddress: order.delivery_address,
          paymentMethod: order.payment_method,
          totalAmount: order.total_amount,
          status: order.status,
          date: order.created_at,
          items: order.order_items?.map(item => ({
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            price: item.unit_price,
          })) || [],
        }));

        setOrders(formattedOrders);
        console.log(`Loaded orders from Supabase: ${formattedOrders.length}`);
        
        // Also save to storage as backup
        await AsyncStorage.setItem('@onolo_orders', JSON.stringify(formattedOrders));
      }
    } catch (error) {
      console.error('Error loading user orders:', error);
      await loadOrdersFromStorage();
    }
  };

  // Load user messages from communication_logs
  const loadUserMessages = async (userId: string) => {
    try {
      console.log('loadUserMessages: Loading messages for user:', userId);
      
      const { data: messagesData, error } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to recent messages for performance

      if (error) {
        console.error('loadUserMessages: Error loading messages:', error);
        return;
      }

      if (messagesData && isMountedRef.current) {
        const formattedMessages: Message[] = messagesData.map(msg => ({
          id: msg.id,
          user_id: msg.user_id,
          customer_id: msg.customer_id,
          staff_id: msg.staff_id,
          log_type: msg.log_type,
          subject: msg.subject || msg.message,
          message: msg.message,
          sender_type: msg.sender_type,
          is_read: msg.is_read,
          created_at: msg.created_at,
        }));

        setMessages(formattedMessages);
        
        // Calculate unread count
        const unreadCount = formattedMessages.filter(msg => 
          !msg.is_read && msg.sender_type === 'staff'
        ).length;
        setUnreadMessagesCount(unreadCount);
        
        console.log(`loadUserMessages: Loaded messages: ${formattedMessages.length}`);
      }
    } catch (error) {
      console.error('loadUserMessages: Error:', error);
    }
  };

  // Manual refresh functions
  const refreshOrders = useCallback(async () => {
    if (user && !user.isGuest) {
      console.log('Manually refreshing orders...');
      await loadUserOrders(user.id);
    } else {
      await loadOrdersFromStorage();
    }
  }, [user]);

  const refreshMessages = useCallback(async () => {
    if (user && !user.isGuest) {
      console.log('Manually refreshing messages...');
      await loadUserMessages(user.id);
    }
  }, [user]);

  // Auth methods
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Login error:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = async (): Promise<void> => {
    try {
      // Clean up any existing subscriptions
      cleanupAll();
      
      const guestUser: User = {
        id: 'guest-' + Date.now(),
        name: 'Guest User',
        email: '',
        phone: '',
        address: '',
        isGuest: true,
      };
      
      setUser(guestUser);
      await loadOrdersFromStorage();
    } catch (error) {
      console.error('Guest login error:', error);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user) {
        console.error('Registration error:', authError);
        return false;
      }

      // Create profile
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        role: 'customer',
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clean up all subscriptions
      cleanupAll();
      
      await supabase.auth.signOut();
      
      // Clear state
      setUser(null);
      setOrders([]);
      setMessages([]);
      setUnreadMessagesCount(0);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Order methods
  const addOrder = async (orderData: any): Promise<Order> => {
    try {
      setIsProcessingOrder(true);
      console.log('Adding new order:', orderData);

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create order in Supabase
      const orderRecord = {
        customer_id: user.id,
        user_id: user.id,
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
        delivery_address: orderData.deliveryAddress,
        delivery_phone: orderData.customerPhone || user.phone,
        payment_method: orderData.paymentMethod === 'card_on_delivery' ? 'card' : orderData.paymentMethod,
        total_amount: orderData.totalAmount,
        status: orderData.status,
        notes: orderData.notes || '',
        delivery_date: orderData.deliveryDate || new Date().toISOString().split('T')[0],
        preferred_delivery_window: orderData.preferredDeliveryWindow || null,
      };

      console.log('Creating order in Supabase:', orderRecord);

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderRecord)
        .select()
        .single();

      if (orderError || !newOrder) {
        throw new Error(orderError?.message || 'Failed to create order');
      }

      // Create order items
      const orderItems = orderData.items.map((item: any) => ({
        order_id: newOrder.id,
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
        throw new Error(itemsError.message);
      }

      const formattedOrder: Order = {
        id: newOrder.id,
        customerName: newOrder.customer_name,
        customerEmail: newOrder.customer_email,
        deliveryAddress: newOrder.delivery_address,
        paymentMethod: newOrder.payment_method,
        totalAmount: newOrder.total_amount,
        status: newOrder.status,
        date: newOrder.created_at,
        items: orderData.items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      // Note: We don't manually add to state here because the real-time subscription will handle it
      console.log('Order added successfully to Supabase:', newOrder.id);

      return formattedOrder;
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const getOrderById = (id: string): Order | undefined => {
    return orders.find(order => order.id === id);
  };

  const cancelOrder = async (orderId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) {
        console.error('Error cancelling order:', error);
        return false;
      }

      // Note: Real-time subscription will update the state automatically

      return true;
    } catch (error) {
      console.error('Error cancelling order:', error);
      return false;
    }
  };

  // Profile methods
  const updateUserProfile = async (data: any): Promise<{ success: boolean; progress: ProfileUpdateProgress[]; error?: string; }> => {
    const progress: ProfileUpdateProgress[] = [];
    
    try {
      if (!user || user.isGuest) {
        throw new Error('User not authenticated');
      }

      progress.push({ step: 'validation', status: 'inProgress', message: 'Validating data...' });

      // Update profile
      const nameParts = data.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      progress.push({ step: 'validation', status: 'completed', message: 'Data validated' });
      progress.push({ step: 'profile_update', status: 'inProgress', message: 'Updating profile...' });

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: data.phone,
          address: data.address,
        })
        .eq('id', user.id);

      if (profileError) {
        progress.push({ step: 'profile_update', status: 'error', error: profileError.message });
        throw new Error(profileError.message);
      }

      progress.push({ step: 'profile_update', status: 'completed', message: 'Profile updated' });

      // Update local state
      setUser(prev => prev ? {
        ...prev,
        name: data.name,
        phone: data.phone,
        address: data.address,
      } : null);

      return { success: true, progress };
    } catch (error: any) {
      return { 
        success: false, 
        progress, 
        error: error.message || 'Failed to update profile' 
      };
    }
  };

  // Message methods
  const sendMessage = async (content: string): Promise<void> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase.from('communication_logs').insert({
        user_id: user.id,
        customer_id: user.id,
        log_type: 'user_message',
        subject: content,
        message: content,
        sender_type: 'customer',
        is_read: false,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Note: Real-time subscription will add the message to state automatically
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const markMessageAsRead = async (messageId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('communication_logs')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) {
        console.error('Error marking message as read:', error);
        return;
      }

      // Note: Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markAllMessagesAsRead = async (): Promise<void> => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('communication_logs')
        .update({ is_read: true })
        .eq('customer_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all messages as read:', error);
        return;
      }

      // Note: Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  };

  // Notification methods
  const updateNotificationPreferences = async (settings: NotificationSettings, preferences: NotificationPreferences): Promise<void> => {
    try {
      setNotificationSettings(settings);
      setNotificationPreferences(preferences);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('@onolo_notification_settings', JSON.stringify(settings));
      await AsyncStorage.setItem('@onolo_notification_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  };

  const registerForPushNotifications = async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        console.log('Push notifications not supported on web');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission not granted for push notifications');
        return;
      }

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your actual project ID
      });

      console.log('Push token:', token.data);
      
      // TODO: Send token to your server
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const fetchNotificationPreferences = async (): Promise<void> => {
    try {
      const settingsStr = await AsyncStorage.getItem('@onolo_notification_settings');
      const preferencesStr = await AsyncStorage.getItem('@onolo_notification_preferences');
      
      if (settingsStr) {
        setNotificationSettings(JSON.parse(settingsStr));
      }
      
      if (preferencesStr) {
        setNotificationPreferences(JSON.parse(preferencesStr));
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  const value: UserContextType = {
    user,
    orders,
    messages,
    unreadMessagesCount,
    notificationSettings,
    notificationPreferences,
    isLoading,
    isAuthenticated,
    isProcessingOrder,
    isGuest,
    
    // Auth methods
    login,
    loginAsGuest,
    register,
    logout,
    
    // Order methods
    addOrder,
    getOrderById,
    cancelOrder,
    refreshOrders,
    
    // Profile methods
    updateUserProfile,
    
    // Message methods
    sendMessage,
    markMessageAsRead,
    markAllMessagesAsRead,
    refreshMessages,
    
    // Notification methods
    updateNotificationPreferences,
    registerForPushNotifications,
    fetchNotificationPreferences,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}