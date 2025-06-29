import { supabase, runConnectionDiagnostics, createSafeChannel, removeSafeChannel } from '@/lib/supabase';

// Utility to test connection on app startup
export const initializeConnectionTest = async () => {
  console.log('🚀 Initializing Supabase connection...');
  
  try {
    const diagnostics = await runConnectionDiagnostics();
    
    if (!diagnostics.environmentVariables) {
      console.error('❌ Missing environment variables. Check your .env file.');
      return false;
    }
    
    if (!diagnostics.rawConnection) {
      console.warn('⚠️  Raw connection failed. This may be due to CORS settings.');
      console.warn('Add your development URL to Supabase CORS settings if needed.');
    }
    
    if (!diagnostics.supabaseClient) {
      console.warn('⚠️  Supabase client connection failed. This is likely a CORS issue.');
      console.warn('Your app may work once deployed or with proper CORS configuration.');
      return false; // This is the critical test
    }
    
    if (!diagnostics.realtimeConnection) {
      console.warn('⚠️  Realtime connection failed. Chat and live updates may not work.');
      console.warn('💡 To fix this, add your development URL to Supabase CORS settings:');
      console.warn('   - Go to Supabase Dashboard → Project Settings → API → Configuration');
      console.warn('   - Add your development URL to "Web origins (CORS)"');
      console.warn('   - For Expo web: http://localhost:19006');
      console.warn('   - For Expo dev server: http://localhost:8081');
    }
    
    if (!diagnostics.databaseWrite) {
      console.warn('⚠️  Database write test failed. Basic read operations should still work.');
    }
    
    console.log('✅ Supabase connection established successfully');
    return true;
  } catch (error: any) {
    console.warn('Connection test failed:', error.message);
    return false;
  }
};

// Helper function to retry failed operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError!;
};

// Enhanced order creation with retry logic
export const createOrderWithRetry = async (orderData: any) => {
  return retryOperation(async () => {
    console.log('Creating order with data:', orderData);
    
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (error) {
      console.error('Order creation failed:', error);
      throw new Error(`Order creation failed: ${error.message}`);
    }
    
    console.log('Order created successfully:', data);
    return data;
  }, 3, 1000);
};

// Enhanced message subscription with better error handling and retry logic
export const setupSafeMessageSubscription = (
  userId: string,
  onMessage: (message: any) => void,
  onError?: (error: any) => void
) => {
  if (!userId) {
    console.warn('Cannot setup subscription: userId is required');
    return null;
  }

  let channel: any = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  let reconnectTimeout: NodeJS.Timeout | null = null;

  const cleanup = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (channel) {
      removeSafeChannel(channel);
      channel = null;
    }
  };

  const setupSubscription = () => {
    try {
      console.log(`Setting up message subscription for user: ${userId} (attempt ${reconnectAttempts + 1})`);
      
      // Create channel with more robust configuration
      channel = createSafeChannel(`messages:user_id=eq.${userId}`, {
        config: {
          presence: { key: userId },
          broadcast: { self: true },
        },
      });

      // Set up the subscription with timeout handling
      channel
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'communication_logs', 
            filter: `user_id=eq.${userId}` 
          },
          (payload: any) => {
            try {
              console.log('Received message payload:', payload);
              if (payload.eventType === 'INSERT' && payload.new) {
                onMessage(payload.new);
              }
            } catch (error) {
              console.warn('Error processing message:', error);
              onError?.(error);
            }
          }
        )
        .subscribe((status: string, error?: any) => {
          console.log(`Subscription status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to messages');
            reconnectAttempts = 0; // Reset reconnect attempts on success
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('❌ Channel subscription error:', error);
            onError?.(error);
            
            // Attempt to reconnect
            if (reconnectAttempts < maxReconnectAttempts) {
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
              console.log(`Attempting to reconnect in ${delay}ms...`);
              
              reconnectTimeout = setTimeout(() => {
                reconnectAttempts++;
                cleanup();
                setupSubscription();
              }, delay);
            } else {
              console.error('Max reconnection attempts reached. Subscription failed permanently.');
              onError?.(new Error('Max reconnection attempts reached'));
            }
          } else if (status === 'TIMED_OUT') {
            console.warn('⏱️ Channel subscription timed out');
            const timeoutError = new Error('Subscription timed out');
            onError?.(timeoutError);
            
            // Attempt to reconnect on timeout
            if (reconnectAttempts < maxReconnectAttempts) {
              console.log('Attempting to reconnect after timeout...');
              reconnectTimeout = setTimeout(() => {
                reconnectAttempts++;
                cleanup();
                setupSubscription();
              }, 2000);
            }
          } else if (status === 'CLOSED') {
            console.log('📴 Channel subscription closed');
            
            // Only attempt reconnection if it wasn't intentionally closed
            if (reconnectAttempts < maxReconnectAttempts) {
              console.log('Attempting to reconnect after closure...');
              reconnectTimeout = setTimeout(() => {
                reconnectAttempts++;
                setupSubscription();
              }, 1000);
            }
          }
        });

    } catch (error) {
      console.error('Error setting up message subscription:', error);
      onError?.(error);
      
      // Attempt to reconnect on setup error
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectTimeout = setTimeout(() => {
          reconnectAttempts++;
          setupSubscription();
        }, 2000);
      }
    }
  };

  // Initial setup
  setupSubscription();

  // Return cleanup function
  return {
    channel,
    unsubscribe: cleanup
  };
};

// Helper function to test if realtime subscriptions are working
export const testRealtimeSubscription = async (testDuration: number = 10000): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log('🧪 Testing realtime subscription functionality...');
    
    let resolved = false;
    const resolveOnce = (result: boolean) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    // Create a test subscription
    const testChannelName = `test_subscription_${Date.now()}`;
    const testChannel = createSafeChannel(testChannelName);

    // Set overall test timeout
    const testTimeout = setTimeout(() => {
      console.log('❌ Realtime subscription test timed out');
      removeSafeChannel(testChannel);
      resolveOnce(false);
    }, testDuration);

    testChannel.subscribe((status: string, error?: any) => {
      console.log(`Test subscription status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime subscription test successful');
        clearTimeout(testTimeout);
        removeSafeChannel(testChannel);
        resolveOnce(true);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.log('❌ Realtime subscription test failed:', error || 'Timed out');
        clearTimeout(testTimeout);
        removeSafeChannel(testChannel);
        resolveOnce(false);
      }
    });
  });
};