import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';
import { useOrders } from '../contexts/OrdersContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-toast-message';
import { sendOrderConfirmationEmail } from '../utils/email';
import Button from '../components/Button';

export default function PayFastSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(true);
  const [orderCreated, setOrderCreated] = useState(false);

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

        if (!user || user.isGuest) {
          console.error('User is not authenticated or is a guest');
          Toast.show({
            type: 'error',
            text1: 'Authentication Error',
            text2: 'You need to be logged in to complete your order.',
            position: 'bottom',
            visibilityTime: 5000,
          });
          setIsProcessing(false);
          return;
        }

        if (status === 'simulated' || status === 'COMPLETE' || status === 'advanced_test') {
          // Retrieve and complete the pending order
          const pendingOrderData = await AsyncStorage.getItem('@onolo_pending_order');
          if (pendingOrderData) {
            const orderData = JSON.parse(pendingOrderData);
            
            // Create the order in the system
            const newOrder = await createOrder({
              ...orderData,
              userId: user.id, // Ensure user ID is included for RLS
              paymentMethod: 'payfast', // Ensure correct payment method
            });
            setOrderCreated(true);
            
            // Clear the pending order data
            await AsyncStorage.removeItem('@onolo_pending_order');
            
            // Clear the cart
            clearCart();
            
            // Send confirmation email if email is provided
            if (orderData.customerEmail && orderData.customerEmail.trim() !== '') {
              console.log('Sending PayFast order confirmation email...');
              const emailData = {
                customerName: orderData.customerName,
                customerEmail: orderData.customerEmail,
                orderId: newOrder.id.slice(-6),
                orderDate: new Date(newOrder.date).toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                orderItems: orderData.items,
                totalAmount: newOrder.totalAmount,
                paymentMethod: 'PayFast',
                deliveryAddress: newOrder.deliveryAddress,
                deliverySchedule: orderData.deliverySchedule,
              };
              
              sendOrderConfirmationEmail(emailData).catch((error) => {
                console.error('Error sending PayFast confirmation email:', error);
              });
            }
            
            // Show success message
            Toast.show({
              type: 'success',
              text1: 'Order Placed Successfully!',
              text2: status === 'simulated' 
                ? 'Payment simulation completed - Order created successfully' 
                : 'Your PayFast payment has been processed and order created.',
              position: 'bottom',
              visibilityTime: 4000,
            });
          } else {
            console.warn('No pending order data found after PayFast payment');
            Toast.show({
              type: 'warning',
              text1: 'Payment Successful',
              text2: 'Payment completed but order data not found. Please contact support.',
              position: 'bottom',
              visibilityTime: 6000,
            });
          }
          
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
        {orderCreated 
          ? 'Your PayFast payment has been processed and your order has been created successfully. Your order is now being prepared for delivery.'
          : 'Your PayFast payment has been processed successfully.'
        }
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
          <Text style={styles.debugText}>Order Created: {orderCreated ? 'Yes' : 'No'}</Text>
          {params.webhook_id && (
            <Text style={styles.debugText}>Webhook ID: {params.webhook_id}</Text>
          )}
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <Button
          title={orderCreated ? "View My Orders" : "Go to Profile"}
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
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
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