import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../constants/colors';
import Toast from 'react-native-toast-message';
import Button from '../components/Button';

export default function PayFastSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    console.log('=== PayFast Success Screen ===');
    console.log('Received parameters:', params);

    // Process the PayFast return
    const processPayFastReturn = async () => {
      try {
        // Extract PayFast return data
        const orderId = params.orderId || params.m_payment_id;
        const amount = params.amount;
        const status = params.status || params.payment_status;

        console.log('Processing PayFast return:', { orderId, amount, status });

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (status === 'simulated' || status === 'COMPLETE' || status === 'advanced_test') {
          // Show success message
          Toast.show({
            type: 'success',
            text1: 'Payment Successful!',
            text2: status === 'simulated' 
              ? 'Payment simulation completed successfully' 
              : 'Your PayFast payment has been processed.',
            position: 'bottom',
            visibilityTime: 4000,
          });

          // Here you would typically:
          // 1. Verify the payment with your backend
          // 2. Update the order status
          // 3. Send confirmation emails
          // 4. Clear the cart
          
          console.log('PayFast payment processed successfully');
        } else {
          throw new Error('Payment status indicates failure: ' + status);
        }

      } catch (error) {
        console.error('Error processing PayFast return:', error);
        
        Toast.show({
          type: 'error',
          text1: 'Payment Processing Error',
          text2: 'There was an issue verifying your payment. Please contact support.',
          position: 'bottom',
          visibilityTime: 6000,
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processPayFastReturn();
  }, [params]);

  const handleViewOrders = () => {
    router.replace('/profile');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.processingText}>Processing your payment...</Text>
        <Text style={styles.processingSubtext}>Please wait while we verify your payment with PayFast</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.title}>Payment Successful!</Text>
      <Text style={styles.subtitle}>
        Your PayFast payment has been processed successfully. Your order is now being prepared for delivery.
      </Text>
      
      {params.orderId && (
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Order ID:</Text>
          <Text style={styles.orderValue}>#{String(params.orderId).slice(-6)}</Text>
        </View>
      )}

      {params.amount && (
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Amount Paid:</Text>
          <Text style={styles.orderValue}>R {params.amount}</Text>
        </View>
      )}

      {__DEV__ && params.status && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugLabel}>Debug Info:</Text>
          <Text style={styles.debugText}>Status: {params.status}</Text>
          {params.webhook_id && (
            <Text style={styles.debugText}>Webhook ID: {params.webhook_id}</Text>
          )}
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <Button
          title="View My Orders"
          onPress={handleViewOrders}
          style={styles.button}
        />
        <Button
          title="Continue Shopping"
          onPress={handleGoHome}
          variant="outline"
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.text.gray,
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  orderInfo: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  orderLabel: {
    color: COLORS.text.gray,
    fontSize: 16,
    marginRight: 8,
  },
  orderValue: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugInfo: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
  },
  debugLabel: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    color: COLORS.text.gray,
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  processingText: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  processingSubtext: {
    color: COLORS.text.gray,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 30,
  },
  button: {
    marginBottom: 16,
  },
});