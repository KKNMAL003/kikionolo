import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';

// PayFast configuration
const PAYFAST_CONFIG = {
  merchantId: '10040008',
  merchantKey: 'ph5ub7pps68v2',
  saltPassphrase: 'gasmeupalready19',
  sandboxUrl: 'https://sandbox.payfast.co.za/eng/process',
  productionUrl: 'https://www.payfast.co.za/eng/process',
  // Use sandbox for development/testing
  useSandbox: true,
};

export interface PayFastPaymentData {
  merchantId: string;
  merchantKey: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl?: string;
  nameFirst: string;
  nameLast: string;
  emailAddress: string;
  cellNumber?: string;
  mPaymentId: string;
  amount: number;
  itemName: string;
  itemDescription?: string;
  signature: string;
}

// Generate PayFast signature using the EXACT algorithm from PayFast documentation
function generateSignature(data: Record<string, string | number>, passphrase?: string): string {
  console.log('=== PayFast Signature Generation ===');
  console.log('Input data:', data);
  console.log('Passphrase provided:', !!passphrase);

  // Step 1: Remove signature field and empty/null values
  const filteredData: Record<string, string> = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    // PayFast specific: exclude signature field and empty values
    if (key !== 'signature' && value !== undefined && value !== null && value !== '') {
      filteredData[key] = value.toString();
    }
  });

  console.log('Filtered data:', filteredData);

  // Step 2: Sort keys alphabetically (case sensitive)
  const sortedKeys = Object.keys(filteredData).sort();
  console.log('Sorted keys:', sortedKeys);

  // Step 3: Build the query string with proper URL encoding
  // PayFast uses standard URL encoding but WITHOUT encoding certain characters
  const pairs: string[] = [];
  
  sortedKeys.forEach(key => {
    const value = filteredData[key];
    // Use standard encodeURIComponent but PayFast expects specific encoding
    const encodedValue = encodeURIComponent(value)
      .replace(/[!'()*]/g, function(c) {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
      });
    
    pairs.push(`${key}=${encodedValue}`);
  });

  let queryString = pairs.join('&');
  console.log('Query string (before passphrase):', queryString);

  // Step 4: Append passphrase if provided
  if (passphrase && passphrase.trim() !== '') {
    queryString += `&passphrase=${encodeURIComponent(passphrase)}`;
  }
  
  console.log('Final string to hash:', queryString);

  // Step 5: Generate MD5 hash
  const signature = CryptoJS.MD5(queryString).toString().toLowerCase();
  console.log('Generated signature:', signature);
  console.log('Signature length:', signature.length);
  console.log('=== End Signature Generation ===');
  
  return signature;
}

// Get proper return URLs for PayFast
function getPayFastReturnUrls() {
  // For development, use ngrok or a public URL that can redirect back
  // PayFast requires accessible URLs for validation
  const baseUrl = 'https://httpbin.org';
  
  return {
    returnUrl: Linking.createURL('payfast-success'),
    cancelUrl: Linking.createURL('payfast-cancel'),
    notifyUrl: `${baseUrl}/post`, // For webhook notifications in production
  };
}

// Create PayFast payment URL with exact field names and validation
export function createPayFastPayment(orderData: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  itemDescription?: string;
}): string {
  console.log('=== Creating PayFast Payment ===');
  console.log('Order data:', orderData);

  const baseUrl = PAYFAST_CONFIG.useSandbox ? PAYFAST_CONFIG.sandboxUrl : PAYFAST_CONFIG.productionUrl;
  
  // Split customer name properly
  const nameParts = orderData.customerName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || 'User';

  // Get return URLs
  const { returnUrl, cancelUrl, notifyUrl } = getPayFastReturnUrls();

  // Prepare payment data with EXACT field names required by PayFast
  const paymentData: Record<string, string | number> = {
    // Required fields
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    
    // Customer details
    name_first: firstName,
    name_last: lastName,
    email_address: orderData.customerEmail,
    
    // Order details
    m_payment_id: orderData.orderId,
    amount: parseFloat(orderData.amount.toFixed(2)),
    item_name: orderData.itemName,
    item_description: orderData.itemDescription || `Gas delivery order ${orderData.orderId}`,
  };

  // Add optional phone number if provided and valid
  if (orderData.customerPhone) {
    const cleanPhone = orderData.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      // PayFast expects South African format
      paymentData.cell_number = cleanPhone;
    }
  }

  console.log('Payment data before signature:', paymentData);

  // Generate signature using the corrected algorithm
  const signature = generateSignature(paymentData, PAYFAST_CONFIG.saltPassphrase);
  paymentData.signature = signature;

  console.log('Final payment data with signature:', paymentData);

  // Create URL with parameters
  const queryString = Object.keys(paymentData)
    .map(key => {
      const value = paymentData[key].toString();
      return `${key}=${encodeURIComponent(value)}`;
    })
    .join('&');

  const finalUrl = `${baseUrl}?${queryString}`;
  console.log('Final PayFast URL length:', finalUrl.length);
  console.log('PayFast payment URL:', finalUrl);
  console.log('=== End PayFast Payment Creation ===');
  
  return finalUrl;
}

// Verify PayFast payment signature (for webhook handling)
export function verifyPayFastPayment(data: Record<string, string>): boolean {
  console.log('=== Verifying PayFast Payment ===');
  console.log('Received data:', data);
  
  const { signature, ...dataWithoutSignature } = data;
  
  if (!signature) {
    console.log('No signature provided');
    return false;
  }
  
  // Generate expected signature
  const expectedSignature = generateSignature(dataWithoutSignature, PAYFAST_CONFIG.saltPassphrase);
  
  console.log('Received signature:', signature);
  console.log('Expected signature:', expectedSignature);
  console.log('Signatures match:', signature === expectedSignature);
  console.log('=== End Verification ===');
  
  return signature === expectedSignature;
}

// Handle PayFast return URLs
export function handlePayFastReturn(url: string): { success: boolean; orderId?: string; data?: Record<string, string> } {
  try {
    console.log('Handling PayFast return URL:', url);
    
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const isSuccess = params.success === 'true' || url.includes('payfast-success') || params.payment_status === 'COMPLETE';
    const orderId = params.m_payment_id;

    console.log('PayFast return parsed:', { isSuccess, orderId, params });

    return {
      success: isSuccess,
      orderId: orderId,
      data: params,
    };
  } catch (error) {
    console.error('Error parsing PayFast return URL:', error);
    return { success: false };
  }
}

// Validate PayFast payment data before submission
function validatePayFastData(orderData: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  itemDescription?: string;
}): void {
  if (!orderData.orderId || orderData.orderId.trim() === '') {
    throw new Error('Order ID is required');
  }
  
  if (!orderData.customerName || orderData.customerName.trim() === '') {
    throw new Error('Customer name is required');
  }
  
  if (!orderData.customerEmail || orderData.customerEmail.trim() === '') {
    throw new Error('Customer email is required');
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(orderData.customerEmail)) {
    throw new Error('Valid customer email is required');
  }
  
  if (!orderData.amount || orderData.amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  if (!orderData.itemName || orderData.itemName.trim() === '') {
    throw new Error('Item name is required');
  }
  
  // Validate amount format (max 2 decimal places)
  if (!/^\d+(\.\d{1,2})?$/.test(orderData.amount.toFixed(2))) {
    throw new Error('Amount must have maximum 2 decimal places');
  }
}

// Open PayFast payment in browser
export async function initiatePayFastPayment(orderData: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  itemDescription?: string;
}): Promise<boolean> {
  try {
    console.log('=== Initiating PayFast Payment ===');
    
    // Validate all required data
    validatePayFastData(orderData);
    
    // Create payment URL
    const paymentUrl = createPayFastPayment(orderData);
    
    console.log('Opening PayFast payment URL...');
    
    if (Platform.OS === 'web') {
      // On web, open in the same window for better user experience
      window.location.href = paymentUrl;
    } else {
      // On mobile, open in external browser
      const canOpen = await Linking.canOpenURL(paymentUrl);
      if (canOpen) {
        await Linking.openURL(paymentUrl);
      } else {
        throw new Error('Cannot open PayFast payment URL');
      }
    }
    
    console.log('PayFast payment initiated successfully');
    return true;
  } catch (error) {
    console.error('Error initiating PayFast payment:', error);
    console.log('PayFast payment initiation failed');
    return false;
  }
}