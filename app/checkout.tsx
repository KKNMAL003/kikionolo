import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { COMPANY } from '../constants/company';
import Header from '../components/Header';
import Button from '../components/Button';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import CustomTextInput from '../components/CustomTextInput';
import AddressAutocomplete from '../components/AddressAutocomplete';
import DeliveryScheduler from '../components/DeliveryScheduler';

import { sendOrderConfirmationEmail } from '../utils/email';
import { createPayPalOrder, capturePayPalPayment } from '../utils/paypal';
import { convertZARtoUSD } from '../utils/currency';

type PaymentMethod = 'cash_on_delivery' | 'card_on_delivery' | 'card' | 'payfast' | 'paypal' | 'eft';
type TimeSlot = 'morning' | 'afternoon' | 'evening';

export default function CheckoutScreen() {
  const { totalPrice, items, clearCart } = useCart();
  const { user, addOrder, isAuthenticated, isProcessingOrder } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>('morning');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    email: '',
  });

  const getPaymentMethodDisplayName = (method: PaymentMethod) => {
    const names: Record<PaymentMethod, string> = {
      cash_on_delivery: 'Cash on Delivery',
      card_on_delivery: 'Card on Delivery',
      card: 'Card Payment',
      payfast: 'PayFast',
      paypal: 'PayPal',
      eft: 'EFT / Bank Transfer',
    };
    return names[method] || 'Unknown';
  };

  const formatDeliverySchedule = () => {
    const dateStr = selectedDate.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeSlotLabels: Record<TimeSlot, string> = {
      morning: 'Morning (8:00 AM - 12:00 PM)',
      afternoon: 'Afternoon (12:00 PM - 5:00 PM)',
      evening: 'Evening (5:00 PM - 8:00 PM)',
    };
    return `${dateStr} - ${timeSlotLabels[selectedTimeSlot]}`;
  };

  const completeOrder = async (paymentMethodUsed: PaymentMethod) => {
    try {
      setLoading(true);
      const orderItems = items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));
      const deliverySchedule = formatDeliverySchedule();
      const orderData = {
        items: orderItems,
        totalAmount: totalPrice + 50, // Including delivery fee
        status: 'pending' as const,
        paymentMethod: paymentMethodUsed,
        deliveryAddress: formData.address,
        deliverySchedule,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        notes: formData.notes,
      };

      console.log('Creating order with data:', orderData);
      const newOrder = await addOrder(orderData);

      if (formData.email && formData.email.trim() !== '') {
        console.log('Attempting to send confirmation email to:', formData.email);
        const emailData = {
          customerName: formData.name,
          customerEmail: formData.email,
          orderId: newOrder.id.slice(-6),
          orderDate: new Date(newOrder.date).toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          orderItems,
          totalAmount: newOrder.totalAmount,
          paymentMethod: getPaymentMethodDisplayName(newOrder.paymentMethod as PaymentMethod),
          deliveryAddress: newOrder.deliveryAddress,
          deliverySchedule,
        };
        sendOrderConfirmationEmail(emailData).catch(error => {
          console.error('Error sending order confirmation email:', error);
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Order Placed Successfully',
        text2: 'Your order has been received.',
        position: 'bottom',
      });
      clearCart();
      router.replace('/profile');
    } catch (error) {
      console.error('Error placing order:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to place your order.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !user.isGuest) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => formData.name.trim() && formData.phone.trim() && formData.address.trim();

  const completeOrderRef = useRef(completeOrder);
  useEffect(() => {
    completeOrderRef.current = completeOrder;
  });

  const handlePayPalCancel = useCallback(() => {
    setLoading(false);
    Toast.show({ type: 'info', text1: 'Payment Cancelled', position: 'bottom' });
  }, []);

  const handlePayPalSuccess = useCallback(async () => {
    await AsyncStorage.removeItem('paypalOrderId');
    Toast.show({ type: 'success', text1: 'Payment Successful!', position: 'bottom' });
    await completeOrderRef.current('paypal');
  }, []);

  useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      if (url.includes('paypal-cancel')) {
        handlePayPalCancel();
        await AsyncStorage.removeItem('paypalOrderId');
        return;
      }
      if (url.includes('paypal-success')) {
        setLoading(true);
        const parsedUrl = Linking.parse(url);
        const orderId = (parsedUrl.queryParams?.token as string) || (await AsyncStorage.getItem('paypalOrderId'));
        if (orderId) {
          try {
            await capturePayPalPayment(orderId);
            await handlePayPalSuccess();
          } catch (error) {
            console.error('PayPal processing error:', error);
            handlePayPalCancel();
          } finally {
            await AsyncStorage.removeItem('paypalOrderId');
            setLoading(false);
          }
        } else {
          handlePayPalCancel();
          setLoading(false);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });
    return () => subscription.remove();
  }, [handlePayPalSuccess, handlePayPalCancel]);

  const handlePlaceOrder = async () => {
    if (!isFormValid()) {
      Alert.alert('Incomplete Information', 'Please fill in your name, phone, and address.');
      return;
    }
    if (paymentMethod === 'paypal') {
      try {
        setLoading(true);
        // Convert the total amount from ZAR to USD for PayPal processing.
        const amountInUSD = await convertZARtoUSD(totalPrice + 50);
        const createdOrderId = await createPayPalOrder(amountInUSD, 'USD');

        if (createdOrderId) {
          setPaypalOrderId(createdOrderId);
          await AsyncStorage.setItem('paypalOrderId', createdOrderId);
          const approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${createdOrderId}`;
          await Linking.openURL(approvalUrl);
          // The loading state will be handled by the deep link callbacks, so we don't turn it off here.
        } else {
          Toast.show({
            type: 'error',
            text1: 'PayPal Error',
            text2: 'Could not create PayPal order. Please try again.',
          });
          setLoading(false);
        }
      } catch (error) {
        console.error('PayPal order creation failed:', error);
        Alert.alert('Error', 'Could not connect to PayPal. Please try again.');
        setLoading(false);
      }
    } else {
      await completeOrder(paymentMethod);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Checkout" />
        <View style={styles.centeredMessage}>
          <Text>Loading user information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Checkout" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <CustomTextInput leftIcon="person-outline" placeholder="Full Name" value={formData.name} onChangeText={text => handleChange('name', text)} />
              <CustomTextInput leftIcon="call-outline" placeholder="Phone Number" value={formData.phone} onChangeText={text => handleChange('phone', text)} keyboardType="phone-pad" />
              <CustomTextInput leftIcon="mail-outline" placeholder="Email Address" value={formData.email} onChangeText={text => handleChange('email', text)} keyboardType="email-address" />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <AddressAutocomplete onAddressSelect={address => handleChange('address', address)} value={formData.address} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Schedule</Text>
              <DeliveryScheduler
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedTimeSlot={selectedTimeSlot}
                onTimeSlotChange={setSelectedTimeSlot}
                minDate={tomorrow}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentOptions}>
                {(['cash_on_delivery', 'card_on_delivery', 'paypal', 'eft'] as PaymentMethod[]).map(method => (
                  <TouchableOpacity
                    key={method}
                    style={[styles.paymentButton, paymentMethod === method && styles.paymentButtonSelected]}
                    onPress={() => setPaymentMethod(method)}>
                    <Ionicons name={method === 'paypal' ? 'logo-paypal' : method === 'eft' ? 'newspaper-outline' : method === 'card_on_delivery' ? 'card-outline' : 'cash-outline'} size={24} color={paymentMethod === method ? COLORS.text.white : COLORS.primary} />
                    <Text style={[styles.paymentButtonText, paymentMethod === method && styles.paymentButtonTextSelected]}>
                      {getPaymentMethodDisplayName(method)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {paymentMethod === 'eft' && (
                <View style={styles.eftDetailsContainer}>
                  <Text style={styles.eftTitle}>EFT / Bank Transfer Details</Text>
                  <Text style={styles.eftText}>Please use your Order ID as a reference.</Text>
                  <Text style={styles.eftText}>{COMPANY.business.bankingDetails}</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(`mailto:${COMPANY.contact.email}?subject=Proof of Payment`)}>
                    <Text style={styles.eftContactLink}>
                      Email proof of payment to {COMPANY.contact.email}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {paymentMethod === 'card_on_delivery' && (
                <View style={styles.eftDetailsContainer}>
                  <Text style={styles.eftTitle}>Card on Delivery</Text>
                  <Text style={styles.eftText}>Please have your card ready. Our driver will have a mobile POS machine for payment upon arrival.</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Notes</Text>
              <CustomTextInput leftIcon="document-text-outline" placeholder="Any special instructions?" value={formData.notes} onChangeText={text => handleChange('notes', text)} isTextArea />
            </View>

            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Subtotal</Text>
                <Text style={styles.summaryText}>R {totalPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Delivery Fee</Text>
                <Text style={styles.summaryText}>R 50.00</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalText}>Total</Text>
                <Text style={styles.totalText}>R {(totalPrice + 50).toFixed(2)}</Text>
              </View>
            </View>

            <Button
              title={loading || isProcessingOrder ? 'Processing...' : 'Place Order'}
              onPress={handlePlaceOrder}
              disabled={loading || isProcessingOrder || !isFormValid()}
              style={{ marginTop: 20, marginBottom: 40 }}
            />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.white,
    marginBottom: 12,
  },
  summaryContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: COLORS.text.gray,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 8,
  },
  paymentOptions: {
    flexDirection: 'column',
    gap: 12,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: 12,
  },
  paymentButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  paymentButtonText: {
    marginLeft: 8,
    color: COLORS.primary,
    fontWeight: '600',
  },
  paymentButtonTextSelected: {
    color: COLORS.text.white,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eftDetailsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 8,
  },
  eftTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.white,
    marginBottom: 8,
  },
  eftText: {
    fontSize: 14,
    color: COLORS.text.gray,
    marginBottom: 4,
  },
  eftContactLink: {
    fontSize: 14,
    color: COLORS.primary,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
});
