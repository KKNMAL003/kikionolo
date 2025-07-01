import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';

// PayFast configuration for production
const PAYFAST_CONFIG = {
  // Production credentials
  merchantId: '30596897',
  merchantKey: 'ygodvejftqxd4',
  saltPassphrase: 'G4smeupalready',
  productionUrl: 'https://www.payfast.co.za/eng/process',
  sandboxUrl: 'https://sandbox.payfast.co.za/eng/process',
  // Always set to false for production transactions
  useSandbox: false,
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

// PayFast field order as per documentation
const PAYFAST_FIELD_ORDER = [
  'merchant_id',
  'merchant_key',
  'return_url',
  'cancel_url',
  'notify_url',
  'name_first',
  'name_last',
  'email_address',
  'm_payment_id',
  'amount',
  'item_name',
  'item_description',
  'payment_method',
  'custom_str1',
  'custom_str2',
  'cell_number',
  // Add/remove fields as per your actual data
];

// Polyfill for Python's urllib.parse.quote_plus
function quotePlus(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function generateSignature(data: Record<string, string | number>, passphrase?: string): string {
  let pfOutput = '';
  for (const key of PAYFAST_FIELD_ORDER) {
    if (data[key] !== undefined && data[key] !== '') {
      pfOutput += `${key}=${quotePlus(data[key].toString().trim())}&`;
    }
  }
  // Remove last ampersand
  let getString = pfOutput.slice(0, -1);
  if (passphrase) {
    getString += `&passphrase=${quotePlus(passphrase.trim())}`;
  }
  // Debug log
  console.log('--- PAYFAST DEBUG ---');
  console.log('String to hash:', getString);
  let signature;
  if (Platform.OS === 'web') {
    signature = CryptoJS.MD5(getString).toString().toLowerCase();
  } else {
    const crypto = require('crypto');
    signature = crypto.createHash('md5').update(getString).digest('hex');
  }
  console.log('Signature:', signature);
  console.log('---------------------');
  return signature;
}

// Get appropriate URLs based on environment
function getPayFastUrls(orderId: string) {
  // Use your Netlify production URL for both web and mobile
  const baseUrl = 'https://mellifluous-valkyrie-f9877a.netlify.app';
  return {
    returnUrl: `${baseUrl}/payfast-success?orderId=${orderId}`,
    cancelUrl: `${baseUrl}/payfast-cancel?orderId=${orderId}`,
    notifyUrl: `${baseUrl}/api/payfast-notify`,
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

  const baseUrl = PAYFAST_CONFIG.productionUrl;
  
  // Split customer name properly
  const nameParts = orderData.customerName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || 'User';

  // Get appropriate URLs based on environment
  const { returnUrl, cancelUrl, notifyUrl } = getPayFastUrls(orderData.orderId);

  // Prepare payment data with EXACT field names required by PayFast
  const paymentData: Record<string, string | number> = {
    // Required fields - EXACT case and names as per PayFast API
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
    amount: orderData.amount.toFixed(2), // Always two decimal places as string
    item_name: orderData.itemName,
    item_description: orderData.itemDescription || `Gas delivery order ${orderData.orderId}`,
    
    // Additional PayFast fields for better processing
    payment_method: 'cc',
    
    // Custom fields for tracking
    custom_str1: 'onolo-gas-app',
    custom_str2: 'production',
  };

  // Add optional phone number if provided and valid
  if (orderData.customerPhone) {
    const cleanPhone = orderData.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      // Format for South African numbers
      if (cleanPhone.startsWith('0')) {
        paymentData.cell_number = cleanPhone;
      } else if (cleanPhone.startsWith('27')) {
        paymentData.cell_number = '0' + cleanPhone.substring(2);
      } else {
        paymentData.cell_number = cleanPhone;
      }
    }
  }

  console.log('Payment data before signature:', paymentData);

  // Generate signature using the corrected algorithm
  const signature = generateSignature(paymentData, PAYFAST_CONFIG.saltPassphrase);
  paymentData.signature = signature;

  console.log('Final payment data with signature:', paymentData);

  // Create URL with parameters using the same order and encoding as the signature
  const queryString = PAYFAST_FIELD_ORDER
    .filter(key => paymentData[key] !== undefined && paymentData[key] !== '')
    .map(key => `${key}=${quotePlus(paymentData[key].toString().trim())}`)
    .join('&') + `&signature=${paymentData.signature}`;

  const finalUrl = `${baseUrl}?${queryString}`;
  console.log('Final PayFast URL:', finalUrl);
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

  // Minimum amount check (PayFast requirement)
  if (orderData.amount < 5.00) {
    throw new Error('Minimum payment amount is R5.00');
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
}): Promise<{ success: boolean; redirectUrl?: string }> {
  try {
    console.log('=== Initiating PayFast Payment ===');
    
    // Validate all required data
    validatePayFastData(orderData);
    
    // Create payment URL
    const paymentUrl = createPayFastPayment(orderData);
    
    console.log('Opening PayFast payment URL...');
    console.log('PayFast URL:', paymentUrl);
    
    console.log('PayFast payment initiated successfully');
    return { success: true, redirectUrl: paymentUrl };
  } catch (error) {
    console.error('Error initiating PayFast payment:', error);
    return { success: false };
  }
}

// Test signature generation with known values (only used for testing)
export function testSignatureGeneration() {
  console.log('=== Testing PayFast Signature Generation ===');
  
  // Test with production credentials
  const testData = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: 'https://app.onologroup.com/payfast-success',
    cancel_url: 'https://app.onologroup.com/payfast-cancel',
    notify_url: 'https://app.onologroup.com/api/payfast-notify',
    name_first: 'Test',
    name_last: 'Customer',
    email_address: 'test@example.com',
    m_payment_id: 'TEST-' + Date.now(),
    amount: 100.00,
    item_name: 'Test Payment',
  };
  
  const signature = generateSignature(testData, PAYFAST_CONFIG.saltPassphrase);
  console.log('Test signature result:', signature);
  console.log('=== End Test ===');
  
  return signature;
}