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

// Generate PayFast signature using proper algorithm
function generateSignature(data: Record<string, string | number>, passphrase?: string): string {
  // Remove signature and empty values from data
  const filteredData: Record<string, string> = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (key !== 'signature' && value !== undefined && value !== null && value !== '') {
      filteredData[key] = value.toString();
    }
  });

  // Sort keys alphabetically and create query string
  const sortedKeys = Object.keys(filteredData).sort();
  const queryString = sortedKeys
    .map(key => `${key}=${encodeURIComponent(filteredData[key])}`)
    .join('&');

  // Add passphrase if provided
  let stringToHash = queryString;
  if (passphrase && passphrase.trim() !== '') {
    stringToHash += `&passphrase=${encodeURIComponent(passphrase)}`;
  }
  
  console.log('PayFast signature string:', stringToHash);
  
  // Generate MD5 hash using crypto-js
  const signature = CryptoJS.MD5(stringToHash).toString().toLowerCase();
  console.log('Generated PayFast signature:', signature, 'Length:', signature.length);
  
  return signature;
}

// Get proper return URLs for PayFast
function getPayFastReturnUrls() {
  // For testing in Expo Go, we need to use a service that can redirect back to the app
  // In production, you'd use your actual domain
  const baseUrl = 'https://httpbin.org'; // Testing service that accepts any parameters
  
  return {
    returnUrl: `${baseUrl}/get?success=true&source=payfast`,
    cancelUrl: `${baseUrl}/get?cancelled=true&source=payfast`,
    notifyUrl: `${baseUrl}/post`, // For webhook notifications
  };
}

// Create PayFast payment URL
export function createPayFastPayment(orderData: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  itemDescription?: string;
}): string {
  const baseUrl = PAYFAST_CONFIG.useSandbox ? PAYFAST_CONFIG.sandboxUrl : PAYFAST_CONFIG.productionUrl;
  
  // Split customer name
  const nameParts = orderData.customerName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || 'Customer';

  // Get proper return URLs
  const { returnUrl, cancelUrl, notifyUrl } = getPayFastReturnUrls();

  // Prepare payment data - use exact field names required by PayFast
  const paymentData: Record<string, string | number> = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    name_first: firstName,
    name_last: lastName,
    email_address: orderData.customerEmail,
    m_payment_id: orderData.orderId,
    amount: parseFloat(orderData.amount.toFixed(2)), // Ensure proper decimal format
    item_name: orderData.itemName,
    item_description: orderData.itemDescription || `Order ${orderData.orderId}`,
  };

  // Add phone number if provided (format: remove all non-digits)
  if (orderData.customerPhone) {
    const cleanPhone = orderData.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      paymentData.cell_number = cleanPhone;
    }
  }

  console.log('PayFast payment data before signature:', paymentData);

  // Generate signature
  const signature = generateSignature(paymentData, PAYFAST_CONFIG.saltPassphrase);
  paymentData.signature = signature;

  console.log('Final PayFast payment data:', paymentData);

  // Create URL with parameters
  const queryString = Object.keys(paymentData)
    .map(key => `${key}=${encodeURIComponent(paymentData[key].toString())}`)
    .join('&');

  const finalUrl = `${baseUrl}?${queryString}`;
  console.log('PayFast payment URL:', finalUrl);
  
  return finalUrl;
}

// Verify PayFast payment (for webhook/notification handling)
export function verifyPayFastPayment(data: Record<string, string>): boolean {
  // Remove signature from data for verification
  const { signature, ...dataWithoutSignature } = data;
  
  // Generate expected signature
  const expectedSignature = generateSignature(dataWithoutSignature, PAYFAST_CONFIG.saltPassphrase);
  
  console.log('Received signature:', signature);
  console.log('Expected signature:', expectedSignature);
  
  return signature === expectedSignature;
}

// Handle PayFast return URLs
export function handlePayFastReturn(url: string): { success: boolean; orderId?: string; data?: Record<string, string> } {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const isSuccess = params.success === 'true' || url.includes('payfast-success');
    const orderId = params.m_payment_id;

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
    // Validate required data
    if (!orderData.customerName.trim()) {
      throw new Error('Customer name is required');
    }
    if (!orderData.customerEmail.trim()) {
      throw new Error('Customer email is required');
    }
    if (orderData.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const paymentUrl = createPayFastPayment(orderData);
    
    console.log('Initiating PayFast payment with URL:', paymentUrl);
    
    if (Platform.OS === 'web') {
      // On web, open in same window
      window.location.href = paymentUrl;
    } else {
      // On mobile, open in browser
      await Linking.openURL(paymentUrl);
    }
    
    return true;
  } catch (error) {
    console.error('Error initiating PayFast payment:', error);
    return false;
  }
}