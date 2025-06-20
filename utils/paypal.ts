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
            description: 'Onolo Gas Delivery Order',
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

// Enhanced PayPal Smart Buttons HTML with better UI and error handling
export const generatePayPalSmartButtonsHTML = (
  amount: number,
  orderItems: Array<{name: string, quantity: number, price: number}>,
  customerName: string,
  deliveryAddress: string
): string => {
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PayPal Payment - Onolo Gas</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .container { 
          max-width: 450px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 16px; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #0070ba 0%, #1546a0 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        
        .logo {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .subtitle {
          opacity: 0.9;
          font-size: 16px;
        }
        
        .content {
          padding: 30px 20px;
        }
        
        .amount-display {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .amount-label {
          color: #666;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        .amount-value {
          font-size: 36px;
          font-weight: bold;
          color: #333;
        }
        
        .order-summary {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
        }
        
        .summary-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
        }
        
        .order-items {
          margin-bottom: 15px;
        }
        
        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }
        
        .order-item:last-child {
          border-bottom: none;
        }
        
        .item-name {
          color: #333;
          font-weight: 500;
        }
        
        .item-price {
          color: #666;
          font-weight: 500;
        }
        
        .delivery-info {
          background: #e3f2fd;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .delivery-title {
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 8px;
        }
        
        .delivery-details {
          color: #333;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .total-section {
          border-top: 2px solid #dee2e6;
          padding-top: 15px;
          margin-top: 15px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: bold;
          font-size: 18px;
          color: #333;
        }
        
        #paypal-button-container {
          margin: 30px 0 20px 0;
        }
        
        .cancel-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          width: 100%;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .cancel-button:hover {
          background: #5a6268;
        }
        
        .loading {
          text-align: center;
          color: #666;
          margin: 20px 0;
          font-size: 14px;
        }
        
        .error {
          background: #f8d7da;
          color: #721c24;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
          display: none;
        }
        
        .sandbox-notice {
          background: #fff3cd;
          color: #856404;
          padding: 12px;
          border-radius: 8px;
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
        }
        
        .spinner {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #0070ba;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">PayPal</div>
          <div class="subtitle">Secure Payment Gateway</div>
        </div>
        
        <div class="content">
          <div class="amount-display">
            <div class="amount-label">Total Amount</div>
            <div class="amount-value">R ${total.toFixed(2)}</div>
          </div>
          
          <div class="order-summary">
            <div class="summary-title">Order Summary</div>
            
            <div class="order-items">
              ${orderItems.map(item => `
                <div class="order-item">
                  <span class="item-name">${item.name} x ${item.quantity}</span>
                  <span class="item-price">R ${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            
            <div class="total-section">
              <div class="order-item">
                <span class="item-name">Subtotal</span>
                <span class="item-price">R ${subtotal.toFixed(2)}</span>
              </div>
              <div class="order-item">
                <span class="item-name">Delivery Fee</span>
                <span class="item-price">R ${deliveryFee.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Total</span>
                <span>R ${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div class="delivery-info">
            <div class="delivery-title">📦 Delivery Information</div>
            <div class="delivery-details">
              <strong>Customer:</strong> ${customerName}<br>
              <strong>Address:</strong> ${deliveryAddress}
            </div>
          </div>
          
          <div id="paypal-button-container"></div>
          
          <div id="loading" class="loading">
            <div class="spinner"></div>
            Loading PayPal Smart Buttons...
          </div>
          
          <div id="error" class="error"></div>
          
          <button class="cancel-button" onclick="cancelPayment()">
            Cancel Payment
          </button>
          
          <div class="sandbox-notice">
            🔧 Sandbox Mode - Test payments only
          </div>
        </div>
      </div>

      <script src="https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=ZAR&intent=capture&components=buttons"></script>
      <script>
        function cancelPayment() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CANCEL'
          }));
        }

        function showError(message) {
          const errorElement = document.getElementById('error');
          errorElement.textContent = message;
          errorElement.style.display = 'block';
          document.getElementById('loading').style.display = 'none';
        }

        function showLoading(message) {
          const loadingElement = document.getElementById('loading');
          loadingElement.innerHTML = \`
            <div class="spinner"></div>
            \${message}
          \`;
          loadingElement.style.display = 'block';
        }

        // Initialize PayPal Smart Buttons
        if (typeof paypal !== 'undefined') {
          paypal.Buttons({
            style: {
              shape: 'rect',
              color: 'blue',
              layout: 'vertical',
              label: 'paypal'
            },
            
            createOrder: function(data, actions) {
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    currency_code: 'ZAR',
                    value: '${total.toFixed(2)}',
                    breakdown: {
                      item_total: {
                        currency_code: 'ZAR',
                        value: '${subtotal.toFixed(2)}'
                      },
                      shipping: {
                        currency_code: 'ZAR',
                        value: '${deliveryFee.toFixed(2)}'
                      }
                    }
                  },
                  description: 'Onolo Gas Delivery Order',
                  items: ${JSON.stringify(orderItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity.toString(),
                    unit_amount: {
                      currency_code: 'ZAR',
                      value: item.price.toFixed(2)
                    }
                  })))}
                }]
              });
            },
            
            onApprove: function(data, actions) {
              showLoading('Processing payment...');
              
              return actions.order.capture().then(function(details) {
                console.log('Payment completed successfully:', details);
                
                // Notify React Native of successful payment
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'SUCCESS',
                  orderID: data.orderID,
                  payerID: data.payerID,
                  details: details
                }));
              }).catch(function(err) {
                console.error('Payment capture failed:', err);
                showError('Payment processing failed. Please try again.');
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ERROR',
                  error: 'Payment capture failed: ' + err.toString()
                }));
              });
            },
            
            onCancel: function(data) {
              console.log('Payment cancelled by user');
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CANCEL'
              }));
            },
            
            onError: function(err) {
              console.error('PayPal error:', err);
              showError('Payment error: ' + err.toString());
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                error: err.toString()
              }));
            }
            
          }).render('#paypal-button-container').then(function() {
            document.getElementById('loading').style.display = 'none';
          }).catch(function(err) {
            console.error('Failed to render PayPal buttons:', err);
            showError('Failed to load payment options. Please try again.');
          });
        } else {
          showError('PayPal SDK failed to load. Please check your internet connection and try again.');
        }
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
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #003087; text-align: center; margin-bottom: 30px; }
        .amount { font-size: 32px; font-weight: bold; text-align: center; margin: 20px 0; color: #333; }
        .sandbox-notice { background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
        .test-buttons { display: flex; gap: 10px; margin: 20px 0; }
        .test-button { flex: 1; padding: 15px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; }
        .success-btn { background: #28a745; color: white; }
        .cancel-btn { background: #dc3545; color: white; }
        .error-btn { background: #ffc107; color: #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>PayPal Sandbox Test</h1>
        <div class="amount">R ${amount.toFixed(2)}</div>
        <div class="sandbox-notice">
          🔧 This is a sandbox environment for testing purposes only.
        </div>
        <div class="test-buttons">
          <button class="test-button success-btn" onclick="simulateSuccess()">Simulate Success</button>
          <button class="test-button cancel-btn" onclick="simulateCancel()">Simulate Cancel</button>
          <button class="test-button error-btn" onclick="simulateError()">Simulate Error</button>
        </div>
      </div>
      
      <script>
        function simulateSuccess() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'SUCCESS',
            orderID: 'TEST_ORDER_' + Date.now(),
            payerID: 'TEST_PAYER_' + Date.now(),
            details: {
              id: 'TEST_ORDER_' + Date.now(),
              status: 'COMPLETED',
              payment_source: { paypal: { email_address: 'test@example.com' } }
            }
          }));
        }
        
        function simulateCancel() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CANCEL'
          }));
        }
        
        function simulateError() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ERROR',
            error: 'Simulated payment error for testing'
          }));
        }
      </script>
    </body>
    </html>
  `;
};