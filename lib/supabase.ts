import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

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

// Enhanced error handler for network requests
const handleNetworkError = (error: any, context: string) => {
  console.error(`Network error in ${context}:`, error);
  
  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
    if (Platform.OS === 'web') {
      console.error('🌐 CORS CONFIGURATION REQUIRED!');
      console.error('This error occurs because your development URL is not configured in Supabase CORS settings.');
      console.error('');
      console.error('TO FIX THIS ISSUE:');
      console.error('1. Go to your Supabase Dashboard (https://app.supabase.com)');
      console.error('2. Select your project');
      console.error('3. Go to "Settings" → "API" → "Configuration"');
      console.error('4. Under "Web origins (CORS)", add these URLs:');
      console.error('   - http://localhost:8081');
      console.error('   - http://localhost:19006');
      console.error('   - http://localhost:3000');
      console.error('   - Your current development URL');
      console.error('5. Save the changes and refresh your app');
      console.error('');
      console.error('Current development URL might be:', window?.location?.origin || 'Unknown');
    } else {
      console.error('Network connectivity issue detected. Please check your internet connection.');
    }
  }
  
  // Return a user-friendly error object
  return {
    message: Platform.OS === 'web' 
      ? 'CORS configuration required. Please add your development URL to Supabase CORS settings.'
      : 'Network connection failed. Please check your internet connection.',
    isNetworkError: true,
    isCorsError: Platform.OS === 'web' && (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')),
    originalError: error
  };
};

// Retry logic for network requests
const retryRequest = async (requestFn: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      if (attempt === maxRetries) {
        throw handleNetworkError(error, 'retryRequest');
      }
      
      // Don't retry CORS errors
      if (error.message?.includes('Failed to fetch') && Platform.OS === 'web') {
        throw handleNetworkError(error, 'retryRequest');
      }
      
      console.log(`Request attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

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
    fetch: async (url, options) => {
      try {
        // Add timeout to requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please check your connection');
        }
        
        // Handle network errors with better messaging
        if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
          const errorDetails = handleNetworkError(error, 'supabase-client');
          throw new Error(errorDetails.message);
        }
        
        throw error;
      }
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

    return await retryRequest(async () => {
      // First, test basic connectivity with a simple query that doesn't modify data
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact' }).limit(1);

      if (error) {
        console.log('Supabase query error (this may be expected):', error.message);
        // For RLS or permission errors, the connection is actually working
        if (error.code === 'PGRST116' || error.message.includes('permission denied')) {
          console.log('✅ Connection successful (permission error is expected without RLS policies)');
          return true;
        }
        throw error;
      }

      console.log('✅ Supabase connection test successful');
      return true;
    });
  } catch (error: any) {
    const errorDetails = handleNetworkError(error, 'testSupabaseConnection');
    console.error('Connection test failed:', errorDetails.message);
    return false;
  }
};

// Additional utility function to test raw fetch to Supabase
export const testRawConnection = async () => {
  try {
    console.log('Testing raw connection to Supabase REST API...');
    
    return await retryRequest(async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Raw connection failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Raw connection successful');
      return response.ok;
    });
  } catch (error: any) {
    const errorDetails = handleNetworkError(error, 'testRawConnection');
    console.error('Raw connection failed:', errorDetails.message);
    return false;
  }
};

// Test database operations safely without creating test users
export const testDatabaseOperations = async () => {
  try {
    console.log('Testing database read operations...');
    
    return await retryRequest(async () => {
      // Test a safe read operation that doesn't create data
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        console.log('Database read test result:', error.message);
        // Even permission errors indicate the database is accessible
        if (error.code === 'PGRST116' || error.message.includes('permission denied')) {
          console.log('✅ Database is accessible (RLS working as expected)');
          return true;
        }
        throw error;
      }

      console.log('✅ Database read test successful');
      return true;
    });
  } catch (error: any) {
    const errorDetails = handleNetworkError(error, 'testDatabaseOperations');
    console.error('Database read test failed:', errorDetails.message);
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

// Comprehensive connection diagnostics with improved error handling
export const runConnectionDiagnostics = async () => {
  try {
    console.log('🔍 Running Supabase connection diagnostics...');
    
    console.log('Environment Variables:', supabaseUrl ? '✅' : '❌', supabaseAnonKey ? '✅' : '❌');
    
    // Skip some tests on web platform if CORS is not configured
    if (Platform.OS === 'web') {
      console.log('🌐 Running web-optimized diagnostics...');
      console.log('Current URL:', window?.location?.origin || 'Unknown');
    }
    
    const rawTest = await testRawConnection();
    
    const clientTest = await testSupabaseConnection();
    
    // Test realtime connection
    const realtimeTest = await testRealtimeConnection();
    
    // Test database operations safely
    const databaseTest = await testDatabaseOperations();
    
    const allPassed = !!(supabaseUrl && supabaseAnonKey) && rawTest && clientTest && realtimeTest && databaseTest;
    
    if (allPassed) {
      console.log('✅ All connection tests passed');
    } else if (clientTest && !realtimeTest) {
      console.log('⚠️  Basic connection works, but realtime features may not work');
      if (Platform.OS === 'web') {
        console.log('💡 This is likely a CORS configuration issue. Add your development URL to Supabase CORS settings:');
        console.log('   1. Go to Supabase Dashboard → Project Settings → API → Configuration');
        console.log('   2. Add your development URL (e.g., http://localhost:8081) to "Web origins (CORS)"');
      }
    } else if (clientTest) {
      console.log('⚠️  Basic connection works, but some advanced features may not work');
    } else {
      if (Platform.OS === 'web') {
        console.log('⚠️  CORS configuration needed for web platform');
        console.log('💡 Add your development URLs to Supabase CORS settings:');
        console.log('   - http://localhost:8081');
        console.log('   - http://localhost:19006');
        console.log('   - Your production domain');
        console.log('   - Current URL:', window?.location?.origin || 'Unknown');
      } else {
        console.log('❌ Connection issues detected');
      }
    }
    
    return {
      environmentVariables: !!(supabaseUrl && supabaseAnonKey),
      rawConnection: rawTest,
      supabaseClient: clientTest,
      realtimeConnection: realtimeTest,
      databaseOperations: databaseTest,
      platform: Platform.OS,
    };
  } catch (error: any) {
    const errorDetails = handleNetworkError(error, 'runConnectionDiagnostics');
    console.warn('Connection diagnostics encountered an error:', errorDetails.message);
    
    return {
      environmentVariables: !!(supabaseUrl && supabaseAnonKey),
      rawConnection: false,
      supabaseClient: false,
      realtimeConnection: false,
      databaseOperations: false,
      platform: Platform.OS,
      error: errorDetails.message,
    };
  }
};

// Enhanced wrapper for Supabase operations with automatic error handling
export const supabaseRequest = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  try {
    return await retryRequest(operation);
  } catch (error: any) {
    const errorDetails = handleNetworkError(error, 'supabaseRequest');
    return {
      data: null,
      error: {
        message: errorDetails.message,
        isNetworkError: errorDetails.isNetworkError,
        isCorsError: errorDetails.isCorsError,
        originalError: errorDetails.originalError
      }
    };
  }
};