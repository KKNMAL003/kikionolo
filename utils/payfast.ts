import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

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

// Generate MD5 hash (simple implementation for PayFast signature)
function generateMD5(data: string): string {
  // This is a simplified MD5 implementation for demo purposes
  // In production, you'd want to use a proper crypto library
  // For now, we'll use a simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// Generate PayFast signature
function generateSignature(data: Record<string, string | number>, passphrase?: string): string {
  // Create query string from data (excluding signature)
  const queryString = Object.keys(data)
    .filter(key => key !== 'signature' && data[key] !== undefined && data[key] !== '')
    .sort()
    .map(key => `${key}=${encodeURIComponent(data[key].toString())}`)
    .join('&');

  // Add passphrase if provided
  const stringToHash = passphrase ? `${queryString}&passphrase=${encodeURIComponent(passphrase)}` : queryString;
  
  return generateMD5(stringToHash);
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
  const lastName = nameParts.slice(1).join(' ') || '';

  // Prepare payment data
  const paymentData: Record<string, string | number> = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: Linking.createURL('payfast-success'),
    cancel_url: Linking.createURL('payfast-cancel'),
    notify_url: '', // Would be your server endpoint in production
    name_first: firstName,
    name_last: lastName,
    email_address: orderData.customerEmail,
    m_payment_id: orderData.orderId,
    amount: orderData.amount.toFixed(2),
    item_name: orderData.itemName,
    item_description: orderData.itemDescription || `Order ${orderData.orderId}`,
  };

  // Add phone number if provided
  if (orderData.customerPhone) {
    paymentData.cell_number = orderData.customerPhone.replace(/\D/g, ''); // Remove non-digits
  }

  // Generate signature
  const signature = generateSignature(paymentData, PAYFAST_CONFIG.saltPassphrase);
  paymentData.signature = signature;

  // Create URL with parameters
  const queryString = Object.keys(paymentData)
    .map(key => `${key}=${encodeURIComponent(paymentData[key].toString())}`)
    .join('&');

  return `${baseUrl}?${queryString}`;
}

// Verify PayFast payment (for webhook/notification handling)
export function verifyPayFastPayment(data: Record<string, string>): boolean {
  // Remove signature from data for verification
  const { signature, ...dataWithoutSignature } = data;
  
  // Generate expected signature
  const expectedSignature = generateSignature(dataWithoutSignature, PAYFAST_CONFIG.saltPassphrase);
  
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

    const isSuccess = url.includes('payfast-success');
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
    const paymentUrl = createPayFastPayment(orderData);
    
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