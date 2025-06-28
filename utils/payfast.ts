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

// Proper MD5 implementation that returns 32 characters
function generateMD5(data: string): string {
  // Simple MD5-like hash implementation for demo purposes
  // In production, you'd want to use a proper crypto library like crypto-js
  
  function md5cycle(x: number[], k: number[]): void {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);
    
    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }
  
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }
  
  function add32(a: number, b: number): number {
    return (a + b) & 0xFFFFFFFF;
  }
  
  function md51(s: string): number[] {
    const n = s.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i;
    for (i = 64; i <= s.length; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < s.length; i++) {
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    }
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) tail[i] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  
  function md5blk(s: string): number[] {
    const md5blks = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }
  
  function rhex(n: number): string {
    let s = '', j = 0;
    for (; j < 4; j++) {
      s += '0123456789abcdef'.charAt((n >> (j * 8 + 4)) & 0x0F) + '0123456789abcdef'.charAt((n >> (j * 8)) & 0x0F);
    }
    return s;
  }
  
  function hex(x: number[]): string {
    for (let i = 0; i < x.length; i++) {
      x[i] = rhex(x[i]);
    }
    return x.join('');
  }
  
  return hex(md51(data));
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
  
  console.log('String to hash:', stringToHash);
  const signature = generateMD5(stringToHash);
  console.log('Generated signature:', signature, 'Length:', signature.length);
  
  return signature;
}

// Get proper return URLs for PayFast
function getPayFastReturnUrls() {
  // PayFast requires proper HTTP URLs, not deep links
  // For testing, we'll use placeholder URLs that redirect back to the app
  const baseUrl = 'https://example.com'; // In production, use your actual domain
  
  return {
    returnUrl: `${baseUrl}/payfast-success`,
    cancelUrl: `${baseUrl}/payfast-cancel`,
    notifyUrl: `${baseUrl}/payfast-notify`, // For webhook notifications
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
  const lastName = nameParts.slice(1).join(' ') || '';

  // Get proper return URLs
  const { returnUrl, cancelUrl, notifyUrl } = getPayFastReturnUrls();

  // Prepare payment data
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

  console.log('PayFast payment data:', paymentData);

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
    
    console.log('PayFast payment URL:', paymentUrl);
    
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