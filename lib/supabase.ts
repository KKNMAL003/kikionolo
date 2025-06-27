import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

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
    },
  },
});

// Enhanced connection test function with better error handling
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection to:', supabaseUrl);

    // First, test basic connectivity with a simple query
    const { data, error } = await supabase.from('profiles').select('count').limit(1).single();

    if (error) {
      console.error('Supabase connection test failed with error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      // Check for specific error types
      if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        console.error('Network connectivity issue detected. Please check:');
        console.error('1. Your internet connection');
        console.error('2. Supabase CORS settings (add http://localhost:8081 to allowed origins)');
        console.error('3. Firewall or proxy settings');
      } else if (error.message.includes('permission denied') || error.code === 'PGRST116') {
        console.error(
          'Database permission issue. This might be expected if RLS policies are strict.',
        );
        console.log('Connection to Supabase appears to be working despite the permission error.');
        return true; // Connection is working, just a permission issue
      }

      return false;
    }

    console.log('Supabase connection test successful');
    return true;
  } catch (error: any) {
    console.error('Supabase connection test error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    // Provide specific guidance based on error type
    if (error.message?.includes('Failed to fetch')) {
      console.error('CORS or network issue detected. Please:');
      console.error('1. Add http://localhost:8081 to Supabase CORS allowed origins');
      console.error('2. Check if your Supabase project is accessible');
      console.error('3. Verify your internet connection');
    } else if (error.message?.includes('Invalid API key')) {
      console.error('Authentication issue: Check your EXPO_PUBLIC_SUPABASE_ANON_KEY');
    }

    return false;
  }
};

// Additional utility function to test raw fetch to Supabase
export const testRawConnection = async () => {
  try {
    console.log('Testing raw connection to Supabase...');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    console.log('Raw connection response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    return response.ok;
  } catch (error: any) {
    console.error('Raw connection test failed:', error.message);
    return false;
  }
};
