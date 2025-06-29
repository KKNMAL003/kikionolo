import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging for environment variables
console.log('Supabase Environment Variables:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseAnonKey ? 'Set' : 'Missing',
  urlValue: supabaseUrl,
  keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'undefined',
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    EXPO_PUBLIC_SUPABASE_URL: !!supabaseUrl,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
  });

  // Provide more helpful error message
  throw new Error(
    'Supabase configuration is missing. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.',
  );
}

// Supabase client setup for React Native/Expo app.
// Handles environment variable loading, error handling, and connection testing.
// Usage: Import and use the exported supabase client throughout the app.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    // Improved timeout and reconnection settings
    heartbeatIntervalMs: 15000, // Reduced from 30000 for faster detection
    reconnectAfterMs: (tries) => {
      // More aggressive reconnection strategy
      const baseDelay = Math.min(tries * 500, 5000); // Start with 500ms, max 5s
      console.log(`Realtime reconnection attempt ${tries}, waiting ${baseDelay}ms`);
      return baseDelay;
    },
    // Add timeout configuration
    timeout: 20000, // 20 second timeout for initial connection
  },
});

// Enhanced connection test function with better error handling
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection to:', supabaseUrl);

    // First, test basic connectivity with a simple query
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact' }).limit(1);

    if (error) {
      console.log('Supabase query error (this may be expected):', error.message);
      // For RLS or permission errors, the connection is actually working
      if (error.code === 'PGRST116' || error.message.includes('permission denied')) {
        console.log('✅ Connection successful (permission error is expected without RLS policies)');
        return true;
      }
      return false;
    }

    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch')) {
      console.warn('🌐 CORS issue detected. This is common in web development.');
      console.warn('To fix this, add your development URL to Supabase CORS settings:');
      console.warn('1. Go to your Supabase Dashboard');
      console.warn('2. Project Settings → API → Configuration');
      console.warn('3. Add "http://localhost:8081" to "Web origins (CORS)"');
      console.warn('4. Also add "http://localhost:19006" if using Expo web');
    } else {
      console.error('Connection test failed:', error.message);
    }
    return false;
  }
};

// Additional utility function to test raw fetch to Supabase
export const testRawConnection = async () => {
  try {
    console.log('Testing raw connection to Supabase REST API...');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`Raw connection failed: ${response.status} ${response.statusText}`);
      return false;
    }

    console.log('✅ Raw connection successful');
    return response.ok;
  } catch (error: any) {
    console.log('Raw connection failed:', error.message);
    return false;
  }
};

// Test order creation specifically
export const testOrderCreation = async () => {
  try {
    console.log('Testing database write operations...');
    
    // Try a simple test first - just inserting into profiles table
    const testProfile = {
      id: uuidv4(), // Generate UUID for the id field
      role: 'customer' as const,
      first_name: 'ConnectionTest',
      last_name: 'User',
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(testProfile)
      .select('id');

    if (error) {
      console.log('Database write test failed:', error.message);
      return false;
    }

    // Clean up test data
    if (data && data.length > 0) {
      await supabase.from('profiles').delete().eq('id', data[0].id);
      console.log('✅ Database write test successful');
    } else {
      console.log('✅ Database write test completed');
    }
    return true;
  } catch (error: any) {
    console.log('Database write test failed:', error.message);
    return false;
  }
};

// Test realtime connection specifically
export const testRealtimeConnection = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log('🔄 Testing realtime connection...');
    
    let timeoutId: NodeJS.Timeout;
    let resolved = false;
    
    const resolveOnce = (result: boolean) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve(result);
      }
    };

    // Set up a test channel with shorter timeout
    const testChannel = supabase.channel(`test_${Date.now()}`, {
      config: {
        presence: { key: 'test' },
      },
    });

    // Set timeout for the test
    timeoutId = setTimeout(() => {
      console.log('❌ Realtime connection test timed out');
      testChannel.unsubscribe();
      resolveOnce(false);
    }, 15000); // 15 second timeout

    testChannel.subscribe((status, error) => {
      console.log(`Realtime test status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime connection successful');
        testChannel.unsubscribe();
        resolveOnce(true);
      } else if (status === 'CHANNEL_ERROR') {
        console.log('❌ Realtime connection failed:', error);
        testChannel.unsubscribe();
        resolveOnce(false);
      } else if (status === 'TIMED_OUT') {
        console.log('❌ Realtime connection timed out');
        testChannel.unsubscribe();
        resolveOnce(false);
      } else if (status === 'CLOSED') {
        console.log('📴 Realtime connection closed');
        if (!resolved) {
          resolveOnce(false);
        }
      }
    });
  });
};

// Comprehensive connection diagnostics
export const runConnectionDiagnostics = async () => {
  console.log('🔍 Running Supabase connection diagnostics...');
  
  console.log('Environment Variables:', supabaseUrl ? '✅' : '❌', supabaseAnonKey ? '✅' : '❌');
  
  const rawTest = await testRawConnection();
  
  const clientTest = await testSupabaseConnection();
  
  // Test realtime connection
  const realtimeTest = await testRealtimeConnection();
  
  // Only run database write test if basic connection works
  let writeTest = false;
  if (clientTest) {
    writeTest = await testOrderCreation();
  }
  
  const allPassed = !!(supabaseUrl && supabaseAnonKey) && rawTest && clientTest && realtimeTest && writeTest;
  
  if (allPassed) {
    console.log('✅ All connection tests passed');
  } else if (clientTest && !realtimeTest) {
    console.log('⚠️  Basic connection works, but realtime features may not work');
    console.log('💡 This is likely a CORS configuration issue. Add your development URL to Supabase CORS settings:');
    console.log('   1. Go to Supabase Dashboard → Project Settings → API → Configuration');
    console.log('   2. Add your development URL (e.g., http://localhost:19006) to "Web origins (CORS)"');
  } else if (clientTest) {
    console.log('⚠️  Basic connection works, but some advanced features may not work');
  } else {
    console.log('❌ Connection issues detected - likely CORS configuration needed');
  }
  
  return {
    environmentVariables: !!(supabaseUrl && supabaseAnonKey),
    rawConnection: rawTest,
    supabaseClient: clientTest,
    realtimeConnection: realtimeTest,
    databaseWrite: writeTest,
  };
};

// Helper function for safe channel subscription with improved error handling
export const createSafeChannel = (channelName: string, config?: any) => {
  console.log(`Creating channel: ${channelName}`);
  return supabase.channel(channelName, config);
};

// Helper function to safely remove channels
export const removeSafeChannel = (channel: any) => {
  try {
    if (channel && typeof channel.unsubscribe === 'function') {
      console.log('Unsubscribing from channel');
      channel.unsubscribe();
    }
    supabase.removeChannel(channel);
  } catch (error) {
    console.warn('Error removing channel:', error);
  }
};