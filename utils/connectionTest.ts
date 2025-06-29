import { supabase, runConnectionDiagnostics } from '@/lib/supabase';

// Utility to test connection on app startup
export const initializeConnectionTest = async () => {
  console.log('Initializing Supabase connection test...');
  
  try {
    const diagnostics = await runConnectionDiagnostics();
    
    if (!diagnostics.environmentVariables) {
      console.error('❌ Environment variables are not properly configured');
      return false;
    }
    
    if (!diagnostics.rawConnection) {
      console.error('❌ Raw connection to Supabase failed - check network/CORS');
      return false;
    }
    
    if (!diagnostics.supabaseClient) {
      console.error('❌ Supabase client connection failed - check permissions');
      return false;
    }
    
    if (!diagnostics.orderCreation) {
      console.error('❌ Order creation test failed - check database schema/permissions');
      return false;
    }
    
    console.log('✅ All connection tests passed');
    return true;
  } catch (error: any) {
    console.error('Connection test initialization failed:', error.message);
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