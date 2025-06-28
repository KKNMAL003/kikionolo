# PayFast Testing Guide

This guide provides comprehensive instructions for testing the PayFast integration in your Onolo Gas app.

## Overview

The PayFast integration includes multiple testing approaches:
1. **Simulated Testing** - For UI flow testing without external dependencies
2. **Sandbox Testing** - Using PayFast's sandbox environment
3. **Advanced Testing** - With webhook monitoring and real PayFast URLs

## Getting Started

### 1. Access the Testing Panel

In development mode, you'll see a "PayFast Tests" button in the Menu tab. This opens the testing panel with various testing utilities.

### 2. Configuration Validation

First, validate that your PayFast configuration is correct:

1. Open the Testing Panel
2. Click "Test Config" to validate all settings
3. Click "Show Config" to view current configuration

**Expected Configuration:**
- Merchant ID: `10040008` (PayFast sandbox)
- Merchant Key: `ph5ub***` (masked for security)
- Salt Passphrase: Configured
- Sandbox Mode: Enabled

## Testing Approaches

### Level 1: Simulated Testing

**Purpose:** Test the UI flow and app logic without external PayFast calls.

**Steps:**
1. Open Testing Panel
2. Click "Simulated Payment"
3. Observe the payment flow simulation
4. Verify navigation to success/cancel screens

**What it tests:**
- Payment form validation
- Navigation flow
- Success/error handling
- Order completion logic

### Level 2: Signature Testing

**Purpose:** Verify that signature generation matches PayFast's requirements.

**Steps:**
1. Click "Test Signature Generation"
2. Check console logs for signature details
3. Verify no signature generation errors

**What it tests:**
- MD5 hash generation
- Parameter ordering
- URL encoding
- Passphrase inclusion

### Level 3: Sandbox Testing

**Purpose:** Test with actual PayFast sandbox environment.

**Requirements:**
- Internet connection
- Valid PayFast sandbox credentials

**Steps:**
1. Use "Advanced Test" in the testing panel
2. Monitor webhook.site for PayFast responses
3. Test actual payment flow in sandbox

**PayFast Sandbox Test Cards:**
- **Successful Payment:** 4000000000000002
- **Failed Payment:** 4000000000000010
- **Insufficient Funds:** 4000000000000028

### Level 4: Real Device Testing

**Purpose:** Test the complete flow on actual devices.

**Steps:**
1. Install app on physical device
2. Go through checkout process
3. Select PayFast payment
4. Complete payment in browser
5. Verify return to app

## Webhook Testing

For advanced testing, you can monitor PayFast webhooks:

1. Visit the webhook.site URL shown in test results
2. Monitor incoming PayFast notifications
3. Verify signature validation
4. Check payment status updates

## Common Issues and Solutions

### Issue: "Signature does not match"

**Causes:**
- Incorrect parameter ordering
- Wrong URL encoding
- Missing or incorrect passphrase
- Extra/missing parameters

**Solutions:**
1. Run signature test to verify generation
2. Check console logs for parameter details
3. Verify all required fields are included
4. Ensure passphrase matches PayFast configuration

### Issue: "Invalid URL format"

**Causes:**
- PayFast doesn't accept `exp://` URLs
- Missing HTTP/HTTPS protocol
- Invalid URL structure

**Solutions:**
1. Use staging server for return URLs
2. Implement proper deep linking
3. Use webhook.site for testing
4. Set up ngrok for local testing

### Issue: Payment doesn't redirect back to app

**Causes:**
- Return URLs not properly configured
- Deep linking not set up
- Browser doesn't support app schemes

**Solutions:**
1. Use universal links (iOS) or app links (Android)
2. Implement web-based redirect handler
3. Test on physical devices, not simulators

## Production Preparation

Before switching to production:

1. **Update Configuration:**
   ```typescript
   const PAYFAST_CONFIG = {
     merchantId: 'YOUR_PRODUCTION_MERCHANT_ID',
     merchantKey: 'YOUR_PRODUCTION_MERCHANT_KEY',
     saltPassphrase: 'YOUR_PRODUCTION_PASSPHRASE',
     useSandbox: false, // Switch to production
   };
   ```

2. **Set Up Proper Return URLs:**
   - Configure your domain in `app.json`
   - Set up redirect handlers on your server
   - Implement proper deep linking

3. **Test in Production Environment:**
   - Use real payment methods (small amounts)
   - Verify all webhooks work correctly
   - Test on multiple devices and browsers

## Debugging Tips

### Enable Detailed Logging

All PayFast operations include detailed console logging:
- Parameter preparation
- Signature generation steps
- URL construction
- Payment initiation

### Use Browser Developer Tools

When testing payments:
1. Open browser dev tools
2. Monitor network requests to PayFast
3. Check for any JavaScript errors
4. Verify form data submission

### Test Signature Generation Manually

You can test signature generation with known values:

```javascript
// In browser console or testing panel
testSignatureGeneration();
```

### Monitor Webhook Responses

Use webhook.site to see exact PayFast responses:
1. Note the webhook ID from test results
2. Visit https://webhook.site/[ID]
3. Initiate payment
4. Check incoming requests and responses

## Support

If you encounter issues:

1. Check console logs for error details
2. Use the testing panel to diagnose problems
3. Verify PayFast sandbox credentials
4. Test signature generation separately
5. Monitor webhook responses for additional info

For PayFast-specific issues, consult their documentation at: https://developers.payfast.co.za/