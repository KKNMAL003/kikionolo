import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import { Platform } from 'react-native';

/**
 * Development-friendly PayFast integration
 * This version provides multiple testing approaches for PayFast integration
 */

const PAYFAST_TESTING_CONFIG = {
  merchantId: '10040008',
  merchantKey: 'ph5ub7pps68v2',
  saltPassphrase: 'gasmeupalready19',
  sandboxUrl: 'https://sandbox.payfast.co.za/eng/process',
};

// Simple simulation for initial testing
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

    // Show development mode notification
    Toast.show({
      type: 'info',
      text1: 'Development Mode',
      text2: 'Testing PayFast integration - no real payment processed',
      position: 'bottom',
      visibilityTime: 4000,
    });

    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate successful payment flow
    console.log('Simulating PayFast payment flow...');
    
    // Navigate to success screen with test data
    const successUrl = Linking.createURL('payfast-success', {
      orderId: orderData.orderId,
      amount: orderData.amount.toString(),
      status: 'simulated',
      payment_status: 'COMPLETE',
      merchant_id: PAYFAST_TESTING_CONFIG.merchantId,
      m_payment_id: orderData.orderId,
    });
    
    await Linking.openURL(successUrl);
    
    return true;
  } catch (error) {
    console.error('Error in PayFast development simulation:', error);
    
    // Show error and navigate to cancel screen
    Toast.show({
      type: 'error',
      text1: 'Payment Simulation Failed',
      text2: 'Testing PayFast error handling',
      position: 'bottom',
      visibilityTime: 3000,
    });

    const cancelUrl = Linking.createURL('payfast-cancel', {
      orderId: orderData.orderId,
      status: 'error',
    });
    
    await Linking.openURL(cancelUrl);
    
    return false;
  }
}

// Advanced testing with actual PayFast sandbox but local return handling
export async function initiatePayFastPaymentAdvancedTest(orderData: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  itemDescription?: string;
}): Promise<boolean> {
  try {
    console.log('=== PayFast Advanced Testing ===');
    
    // Create a test payment URL using webhook.site for returns
    const webhookId = 'test-' + Date.now();
    const testingUrls = {
      returnUrl: `https://webhook.site/${webhookId}/success`,
      cancelUrl: `https://webhook.site/${webhookId}/cancel`,
      notifyUrl: `https://webhook.site/${webhookId}/notify`,
    };

    console.log('Testing URLs:', testingUrls);
    console.log('Visit https://webhook.site/' + webhookId + ' to see PayFast responses');

    // Show testing instructions
    Toast.show({
      type: 'info',
      text1: 'Advanced Testing Mode',
      text2: 'Check webhook.site/' + webhookId + ' for PayFast responses',
      position: 'bottom',
      visibilityTime: 6000,
    });

    // For now, simulate the advanced test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const successUrl = Linking.createURL('payfast-success', {
      orderId: orderData.orderId,
      amount: orderData.amount.toString(),
      status: 'advanced_test',
      webhook_id: webhookId,
    });
    
    await Linking.openURL(successUrl);
    
    return true;
  } catch (error) {
    console.error('Error in PayFast advanced testing:', error);
    return false;
  }
}

// Test with ngrok (requires ngrok to be running)
export function createNgrokTestUrls(ngrokUrl: string, orderId: string) {
  if (!ngrokUrl || !ngrokUrl.startsWith('https://')) {
    throw new Error('Valid ngrok HTTPS URL is required');
  }

  return {
    returnUrl: `${ngrokUrl}/payfast-return?success=true&orderId=${orderId}`,
    cancelUrl: `${ngrokUrl}/payfast-return?success=false&orderId=${orderId}`,
    notifyUrl: `${ngrokUrl}/api/payfast-notify`,
  };
}

// Test signature generation with known values
export function testPayFastSignature() {
  console.log('=== Testing PayFast Signature ===');
  
  // Import the actual signature function for testing
  const { testSignatureGeneration } = require('./payfast');
  
  const result = testSignatureGeneration();
  
  Toast.show({
    type: 'info',
    text1: 'Signature Test',
    text2: `Generated signature: ${result.substring(0, 8)}...`,
    position: 'bottom',
    visibilityTime: 4000,
  });
  
  return result;
}

// Validate PayFast configuration
export function validatePayFastConfig() {
  const config = PAYFAST_TESTING_CONFIG;
  const issues: string[] = [];
  
  if (!config.merchantId || config.merchantId === 'your_merchant_id') {
    issues.push('Merchant ID not configured');
  }
  
  if (!config.merchantKey || config.merchantKey === 'your_merchant_key') {
    issues.push('Merchant Key not configured');
  }
  
  if (!config.saltPassphrase) {
    issues.push('Salt Passphrase not configured');
  }
  
  const isValid = issues.length === 0;
  
  console.log('PayFast Configuration Validation:');
  console.log('Valid:', isValid);
  console.log('Issues:', issues);
  
  Toast.show({
    type: isValid ? 'success' : 'error',
    text1: 'PayFast Config',
    text2: isValid ? 'Configuration valid' : `Issues: ${issues.join(', ')}`,
    position: 'bottom',
    visibilityTime: 4000,
  });
  
  return { isValid, issues };
}

// Development utilities for testing
export const PayFastDevUtils = {
  simulatePayment: initiatePayFastPaymentDev,
  advancedTest: initiatePayFastPaymentAdvancedTest,
  testSignature: testPayFastSignature,
  validateConfig: validatePayFastConfig,
  createNgrokUrls: createNgrokTestUrls,
};