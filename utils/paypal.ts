// PayPal API integration utility

// PayPal Sandbox API credentials
const PAYPAL_CLIENT_ID = 'AQXiJ3htdCqiXbnleDxdkHIEqXlNYrGYW-gTWj-OObM4cjZzzaxRXynW2rXHJuNsiH6Z0oftxGs1ziZK';
const PAYPAL_SECRET = 'EPWP2X0svwpLbMQgIxh-9o60ssNaJabTLzMGLE13Lmn4wAnz2bmBxU1oDWbzg8rdsC3ewFvtMO-p48bS';

// PayPal API endpoints (sandbox)
const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';

// Function to get PayPal access token
export const getPayPalAccessToken = async (): Promise<string> => {
  try {
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    if (data.access_token) {
      return data.access_token;
    } else {
      throw new Error('Failed to get PayPal access token');
    }
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    throw error;
  }
};

// Function to create a PayPal order
export const createPayPalOrder = async (amount: number, currency: string = 'ZAR'): Promise<string> => {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.id) {
      return data.id;
    } else {
      throw new Error('Failed to create PayPal order');
    }
  } catch (error) {
    console.error('Error creating PayPal order:', error);
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
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    throw error;
  }
};

// Generate PayPal checkout HTML
export const generatePayPalCheckoutHTML = (
  orderId: string, 
  amount: number, 
  onSuccess: string, 
  onCancel: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PayPal Payment</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #003087; font-size: 24px; margin-bottom: 20px; text-align: center; }
        .order-summary { margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
        .order-item { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .total { font-weight: bold; margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; }
        #paypal-button-container { margin-top: 30px; }
        .loading { text-align: center; margin: 20px 0; }
        .error { color: #e53935; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>PayPal Checkout</h1>
        <div class="order-summary">
          <div class="total order-item">
            <span>Total:</span>
            <span>R ${amount.toFixed(2)}</span>
          </div>
        </div>
        
        <div id="paypal-button-container"></div>
        <div id="loading" class="loading">Loading payment options...</div>
        <div id="error" class="error" style="display: none;"></div>
      </div>

      <script src="https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=ZAR"></script>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const loadingElement = document.getElementById('loading');
          const errorElement = document.getElementById('error');
          
          if (typeof paypal === 'undefined') {
            loadingElement.style.display = 'none';
            errorElement.textContent = 'Failed to load PayPal SDK. Please try again later.';
            errorElement.style.display = 'block';
            return;
          }
          
          try {
            paypal.Buttons({
              createOrder: function() {
                return '${orderId}';
              },
              onApprove: function(data, actions) {
                loadingElement.textContent = 'Processing payment...';
                loadingElement.style.display = 'block';
                
                // Notify React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'SUCCESS',
                  orderId: data.orderID
                }));
                
                return actions.order.capture();
              },
              onCancel: function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'CANCEL'
                }));
              },
              onError: function(err) {
                errorElement.textContent = 'Payment error: ' + err;
                errorElement.style.display = 'block';
                loadingElement.style.display = 'none';
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ERROR',
                  error: err.toString()
                }));
              }
            }).render('#paypal-button-container');
            
            loadingElement.style.display = 'none';
          } catch (error) {
            loadingElement.style.display = 'none';
            errorElement.textContent = 'Failed to initialize PayPal: ' + error.toString();
            errorElement.style.display = 'block';
          }
        });
      </script>
    </body>
    </html>
  `;
};

// For sandbox testing, we'll provide a simulated payment flow
export const simulatePayPalPayment = (amount: number): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PayPal Sandbox Payment</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #003087; font-size: 24px; margin-bottom: 20px; text-align: center; }
        .paypal-header { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .paypal-logo { color: #003087; font-weight: bold; font-size: 24px; margin-right: 5px; }
        .paypal-logo span { color: #009cde; }
        .order-summary { margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
        .order-item { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .total { font-weight: bold; margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; }
        .button { display: block; width: 100%; padding: 12px; border: none; border-radius: 4px; background-color: #0070ba; color: white; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 20px; text-align: center; }
        .button:hover { background-color: #005ea6; }
        .button.secondary { background-color: #ffffff; color: #0070ba; border: 1px solid #0070ba; }
        .button.secondary:hover { background-color: #f5f5f5; }
        .sandbox-notice { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="paypal-header">
          <div class="paypal-logo">Pay<span>Pal</span></div>
        </div>
        <h1>Sandbox Payment</h1>
        
        <div class="order-summary">
          <div class="order-item">
            <span>Onolo Gas Order</span>
            <span>R ${amount.toFixed(2)}</span>
          </div>
          <div class="total order-item">
            <span>Total:</span>
            <span>R ${amount.toFixed(2)}</span>
          </div>
        </div>
        
        <button class="button" onclick="window.ReactNativeWebView.postMessage('PAYMENT_SUCCESS')">
          Complete Payment
        </button>
        
        <button class="button secondary" onclick="window.ReactNativeWebView.postMessage('PAYMENT_CANCELLED')">
          Cancel
        </button>
        
        <div class="sandbox-notice">
          <p>This is a sandbox payment for demonstration purposes.</p>
          <p>API Key: AQXiJ3htdCqiXbnleDxdkHIEqXlNYrGYW-gTWj-OObM4cjZzzaxRXynW2rXHJuNsiH6Z0oftxGs1ziZK</p>
        </div>
      </div>
    </body>
    </html>
  `;
};