import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { COMPANY } from '../constants/company';
import Header from '../components/Header';
import { BaseButton } from '../components/base/BaseButton';
import { useCart } from '../context/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../contexts/OrdersContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import CustomTextInput from '../components/CustomTextInput';
import AddressAutocomplete from '../components/AddressAutocomplete';
import DeliveryScheduler from '../components/DeliveryScheduler';

import { sendOrderConfirmationEmail } from '../utils/email';
import { initiatePayFastPayment } from '../utils/payfast';
import { CreateOrderSchema, validateData, getValidationErrors } from '../validation/schemas';

type PaymentMethod = 'cash_on_delivery' | 'card_on_delivery' | 'card' | 'payfast' | 'eft';
type TimeSlot = 'morning' | 'afternoon' | 'evening';

export default function CheckoutScreen() {
  const { totalPrice, items, clearCart } = useCart();
  const { user } = useAuth();
  const { createOrder, isProcessingOrder } = useOrders();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');

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
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));
      const deliverySchedule = formatDeliverySchedule();
      
      if (!user) {
        throw new Error('User is not authenticated');
      }
      
      const orderData = {
        userId: user.id, // Make sure user ID is included for RLS
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        deliveryAddress: formData.address,
        paymentMethod: paymentMethodUsed,
        totalAmount: totalPrice + 50, // Including delivery fee
        items: orderItems,
        notes: formData.notes,
        deliverySchedule,
        deliveryDate: selectedDate.toISOString().split('T')[0],
        preferredDeliveryWindow: selectedTimeSlot,
      };

      console.log('Creating order with data:', orderData);
      const newOrder = await createOrder(orderData);

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
        sendOrderConfirmationEmail(emailData).catch((error) => {
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
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () =>
    formData.name.trim() && formData.phone.trim() && formData.address.trim();

  const completeOrderRef = useRef(completeOrder);
  useEffect(() => {
    completeOrderRef.current = completeOrder;
  });

  const handlePlaceOrder = async () => {
    if (!isFormValid()) {
      Alert.alert('Incomplete Information', 'Please fill in your name, phone, and address.');
      return;
    }
    
    const validationResult = validateData(CreateOrderSchema, formData);
    if (!validationResult.success) {
      const errors = getValidationErrors(validationResult.errors);
      // Show errors to user (e.g., Toast or setFormErrors)
      return;
    }
    
    if (paymentMethod === 'payfast') {
      try {
        setLoading(true);
        
        const paymentData = {
          orderId: `ORDER-${Date.now()}`,
          amount: totalPrice + 50, // Including delivery fee
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          itemName: 'Onolo Gas Delivery Order',
          itemDescription: `Gas delivery order with ${items.length} item(s)`,
        };

        // Always use production PayFast - no more development simulation
        const result = await initiatePayFastPayment(paymentData);
        
        if (!result.success) {
          Toast.show({
            type: 'error',
            text1: 'PayFast Error',
            text2: 'Could not initiate PayFast payment. Please try again.',
          });
          setLoading(false);
        } else if (result.redirectUrl) {
          // Store order data for completion after payment
          const orderData = {
            items: items.map((item) => ({
              productId: item.product.id,
              productName: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
            })),
            totalAmount: totalPrice + 50,
            status: 'pending' as const,
            paymentMethod: 'payfast' as const,
            deliveryAddress: formData.address,
            deliverySchedule: formatDeliverySchedule(),
            customerName: formData.name,
            customerPhone: formData.phone,
            customerEmail: formData.email,
            notes: formData.notes,
            deliveryDate: selectedDate.toISOString().split('T')[0],
            preferredDeliveryWindow: selectedTimeSlot,
          };
          
          // Store order data in AsyncStorage for completion after payment
          await AsyncStorage.setItem('@onolo_pending_order', JSON.stringify(orderData));
          
          // Navigate to PayFast payment
          router.replace(result.redirectUrl);
        }
        // Loading state will be handled by the return URL handling
      } catch (error) {
        console.error('PayFast payment initiation failed:', error);
        Alert.alert('Error', 'Could not connect to PayFast. Please try again.');
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

  // Payment method descriptions
  const paymentMethodDescriptions: Record<PaymentMethod, string> = {
    cash_on_delivery: 'Pay the driver in cash when your order arrives.',
    card_on_delivery: 'Pay with your debit or credit card using our mobile POS on delivery.',
    card: 'Pay online with your debit or credit card.',
    payfast: 'Pay securely online via PayFast - South Africa\'s leading payment processor.',
    eft: 'Transfer funds directly from your bank. Proof of payment required.',
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Checkout" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <CustomTextInput
                leftIcon="person-outline"
                placeholder="Full Name"
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
              />
              <CustomTextInput
                leftIcon="call-outline"
                placeholder="Phone Number"
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                keyboardType="phone-pad"
              />
              <CustomTextInput
                leftIcon="mail-outline"
                placeholder="Email Address"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <AddressAutocomplete
                onAddressSelect={(address) => handleChange('address', address)}
                value={formData.address}
              />
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
                {(['cash_on_delivery', 'card_on_delivery', 'payfast', 'eft'] as PaymentMethod[]).map(
                  (method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentCard,
                        paymentMethod === method && styles.paymentCardSelected,
                      ]}
                      onPress={() => setPaymentMethod(method)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.paymentCardIconRow}>
                        <Ionicons
                          name={
                            method === 'eft'
                              ? 'newspaper-outline'
                              : method === 'payfast'
                                ? 'card'
                                : method === 'card_on_delivery'
                                  ? 'card-outline'
                                  : 'cash-outline'
                          }
                          size={28}
                          color={paymentMethod === method ? colors.primary : colors.text.gray}
                          style={styles.paymentCardIcon}
                        />
                        <Text
                          style={[
                            styles.paymentCardTitle,
                            paymentMethod === method && styles.paymentCardTitleSelected,
                          ]}
                        >
                          {getPaymentMethodDisplayName(method)}
                        </Text>
                      </View>
                      <Text style={styles.paymentCardDescription}>
                        {paymentMethodDescriptions[method]}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>

              {paymentMethod === 'eft' && (
                <View style={styles.eftDetailsContainer}>
                  <Text style={styles.eftTitle}>EFT / Bank Transfer Details</Text>
                  <Text style={styles.eftText}>Please use your Order ID as a reference.</Text>
                  <Text style={styles.eftText}>{COMPANY.business.bankingDetails}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`mailto:${COMPANY.contact.email}?subject=Proof of Payment`)
                    }
                  >
                    <Text style={styles.eftContactLink}>
                      Email proof of payment to {COMPANY.contact.email}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {paymentMethod === 'card_on_delivery' && (
                <View style={styles.eftDetailsContainer}>
                  <Text style={styles.eftTitle}>Card on Delivery</Text>
                  <Text style={styles.eftText}>
                    Please have your card ready. Our driver will have a mobile POS machine for
                    payment upon arrival.
                  </Text>
                </View>
              )}

              {paymentMethod === 'payfast' && (
                <View style={styles.eftDetailsContainer}>
                  <Text style={styles.eftTitle}>PayFast Payment</Text>
                  <Text style={styles.eftText}>
                    You will be redirected to PayFast to complete your payment securely. PayFast supports all major South African banks and payment methods.
                  </Text>
                </View>
              )}

              {paymentMethod === 'cash_on_delivery' && (
                <View style={styles.eftDetailsContainer}>
                  <Text style={styles.eftTitle}>Cash on Delivery</Text>
                  <Text style={styles.eftText}>
                    Please have the exact amount ready. Our driver will collect payment upon
                    delivery.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Notes</Text>
              <CustomTextInput
                leftIcon="document-text-outline"
                placeholder="Any special instructions?"
                value={formData.notes}
                onChangeText={(text) => handleChange('notes', text)}
                isTextArea
              />
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

            <BaseButton
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
    backgroundColor: colors.background,
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
    color: colors.text.white,
    marginBottom: 12,
  },
  summaryContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: colors.text.gray,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 8,
  },
  paymentOptions: {
    flexDirection: 'column',
    gap: 16,
  },
  paymentCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 0,
  },
  paymentCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '18',
    shadowOpacity: 0.18,
    elevation: 4,
  },
  paymentCardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  paymentCardIcon: {
    marginRight: 12,
  },
  paymentCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.white,
  },
  paymentCardTitleSelected: {
    color: colors.primary,
  },
  paymentCardDescription: {
    color: colors.text.gray,
    fontSize: 13,
    marginLeft: 40,
    marginTop: 2,
    marginBottom: 0,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eftDetailsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  eftTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.white,
    marginBottom: 8,
  },
  eftText: {
    fontSize: 14,
    color: colors.text.gray,
    marginBottom: 4,
  },
  eftContactLink: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
});