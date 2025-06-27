// PayPal API integration utility

import { encode as btoa } from 'base-64';
import * as Linking from 'expo-linking';

// Polyfill global btoa for environments where it's missing (React-Native)
// @ts-ignore
if (typeof global.btoa === 'undefined') global.btoa = btoa;

// PayPal Sandbox API credentials
const PAYPAL_CLIENT_ID = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID!;
const PAYPAL_SECRET = process.env.EXPO_PUBLIC_PAYPAL_SECRET!;

// PayPal API endpoints (sandbox)
const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';

let cachedToken: {
  accessToken: string;
  expiresAt: number;
} | null = null;

// Function to get PayPal access token
export const getPayPalAccessToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }
  try {
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('PayPal token error:', response.status, data);
      throw new Error(data.error_description || 'Failed to get PayPal access token');
    }
    if (data.access_token) {
      const bufferSeconds = 300; // 5 minutes buffer
      const expiresAt = Date.now() + (data.expires_in - bufferSeconds) * 1000;
      cachedToken = { accessToken: data.access_token, expiresAt };
      return data.access_token;
    }
    throw new Error('Failed to get PayPal access token');
  } catch (error) {
    console.error('Error getting PayPal access token:', JSON.stringify(error, null, 2));
    cachedToken = null; // Clear cache on error
    throw error;
  }
};

// Function to create a PayPal order
export const createPayPalOrder = async (
  amount: number,
  currency: string,
): Promise<string | null> => {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
            description: 'Onolo Gas Delivery Order',
          },
        ],
        application_context: {
          return_url: Linking.createURL('paypal-success'),
          cancel_url: Linking.createURL('paypal-cancel'),
          brand_name: 'Onolo Group',
          user_action: 'PAY_NOW',
          landing_page: 'BILLING',
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('PayPal create order API error:', response.status, data);
      throw new Error(data.message || 'Failed to create PayPal order');
    }
    if (data.id) {
      return data.id;
    }
    throw new Error('Failed to create PayPal order');
  } catch (error) {
    console.error('Error creating PayPal order:', JSON.stringify(error, null, 2));
    throw error;
  }
};

// Function to capture a PayPal payment
export const capturePayPalPayment = async (orderId: string): Promise<any> => {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('PayPal capture API error:', response.status, data);
      throw new Error(data.message || 'Failed to capture PayPal payment');
    }
    return data;
  } catch (error) {
    console.error('Error capturing PayPal payment:', JSON.stringify(error, null, 2));
    throw error;
  }
};
