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
  },
});

// Enhanced connection test function with better error handling
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection to:', supabaseUrl);
    console.log('Using API key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined');

    // First, test basic connectivity with a simple query
    const { data, error } = await supabase.from('profiles').select('count').limit(1);

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
        console.error('2. Supabase project status in dashboard');
        console.error('3. CORS settings if running on web');
        console.error('4. Firewall or proxy settings');
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
      console.error('1. Add your app origin to Supabase CORS allowed origins');
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
        'Content-Type': 'application/json',
      },
    });

    console.log('Raw connection response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Raw connection error response:', errorText);
    }

    return response.ok;
  } catch (error: any) {
    console.error('Raw connection test failed:', error.message);
    return false;
  }
};

// Test order creation specifically
export const testOrderCreation = async () => {
  try {
    console.log('Testing order creation...');
    
    // First create a temporary profile to satisfy foreign key constraints
    const tempProfile = {
      id: uuidv4(), // Generate UUID for the id field
      role: 'customer' as const,
      first_name: 'Test',
      last_name: 'User'
    };

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert(tempProfile)
      .select('id')
      .single();

    if (profileError) {
      console.error('Failed to create temporary profile for test:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
      });
      return false;
    }

    console.log('Temporary profile created for test:', profileData.id);

    // Now test with valid user_id and customer_id
    const testOrder = {
      user_id: profileData.id,
      customer_id: profileData.id,
      total_amount: 100.00,
      delivery_address: 'Test Address',
      delivery_phone: '+1234567890',
      payment_method: 'card',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      status: 'pending',
      payment_status: 'pending'
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();

    if (error) {
      console.error('Order creation test failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      
      // Clean up the temporary profile even if order creation failed
      await supabase.from('profiles').delete().eq('id', profileData.id);
      console.log('Temporary profile cleaned up after order creation failure');
      
      return false;
    }

    console.log('Order creation test successful:', data);
    
    // Clean up test order and temporary profile
    if (data?.id) {
      await supabase.from('orders').delete().eq('id', data.id);
      console.log('Test order cleaned up');
    }
    
    await supabase.from('profiles').delete().eq('id', profileData.id);
    console.log('Temporary profile cleaned up');
    
    return true;
  } catch (error: any) {
    console.error('Order creation test error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return false;
  }
};

// Comprehensive connection diagnostics
export const runConnectionDiagnostics = async () => {
  console.log('=== Supabase Connection Diagnostics ===');
  
  console.log('1. Environment Variables Check:');
  console.log('   URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.log('   Key:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
  
  console.log('2. Raw Connection Test:');
  const rawTest = await testRawConnection();
  console.log('   Result:', rawTest ? '✓ Success' : '✗ Failed');
  
  console.log('3. Supabase Client Test:');
  const clientTest = await testSupabaseConnection();
  console.log('   Result:', clientTest ? '✓ Success' : '✗ Failed');
  
  console.log('4. Order Creation Test:');
  const orderTest = await testOrderCreation();
  console.log('   Result:', orderTest ? '✓ Success' : '✗ Failed');
  
  console.log('=== End Diagnostics ===');
  
  return {
    environmentVariables: !!(supabaseUrl && supabaseAnonKey),
    rawConnection: rawTest,
    supabaseClient: clientTest,
    orderCreation: orderTest,
  };
};