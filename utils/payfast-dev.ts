import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';

/**
 * Development-friendly PayFast integration
 * This version uses a simpler approach for testing PayFast integration
 * without requiring external URLs during development
 */

const PAYFAST_CONFIG = {
  merchantId: '10040008',
  merchantKey: 'ph5ub7pps68v2',
  saltPassphrase: 'gasmeupalready19',
  sandboxUrl: 'https://sandbox.payfast.co.za/eng/process',
};

// For development testing, we'll use a simple approach
// that simulates the PayFast flow without requiring external URLs
export async function initiatePayFastPaymentDev(orderData: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  itemDescription?: string;
}): Promise<boolean> {
  try {
    console.log('=== PayFast Development Payment (Simulated) ===');
    console.log('Order data:', orderData);

    // Show a development warning
    Toast.show({
      type: 'info',
      text1: 'Development Mode',
      text2: 'PayFast payment simulation - no real payment will be processed',
      position: 'bottom',
      visibilityTime: 4000,
    });

    // Simulate the PayFast payment process
    setTimeout(() => {
      // Simulate successful payment after 2 seconds
      Toast.show({
        type: 'success',
        text1: 'Payment Simulation Complete',
        text2: 'This would redirect to PayFast in production',
        position: 'bottom',
        visibilityTime: 3000,
      });

      // Navigate to success screen
      const successUrl = Linking.createURL('payfast-success', {
        orderId: orderData.orderId,
        amount: orderData.amount.toString(),
        status: 'simulated'
      });
      
      Linking.openURL(successUrl);
    }, 2000);

    return true;
  } catch (error) {
    console.error('Error in PayFast development simulation:', error);
    return false;
  }
}

// Alternative: Use a public testing service
export function createPayFastTestPayment(orderData: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  itemName: string;
}): string {
  // Use a testing service like webhook.site or httpbin.org for URLs
  const testingSiteId = 'your-unique-id'; // Get from webhook.site
  
  const paymentData = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: `https://webhook.site/${testingSiteId}/success`,
    cancel_url: `https://webhook.site/${testingSiteId}/cancel`,
    notify_url: `https://webhook.site/${testingSiteId}/notify`,
    name_first: orderData.customerName.split(' ')[0] || 'Test',
    name_last: orderData.customerName.split(' ').slice(1).join(' ') || 'User',
    email_address: orderData.customerEmail,
    m_payment_id: orderData.orderId,
    amount: orderData.amount.toFixed(2),
    item_name: orderData.itemName,
    item_description: `Test order ${orderData.orderId}`,
  };

  // For testing, we can skip signature generation
  const queryString = Object.entries(paymentData)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  return `${PAYFAST_CONFIG.sandboxUrl}?${queryString}`;
}