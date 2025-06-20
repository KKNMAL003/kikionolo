import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform, Linking, TouchableWithoutFeedback } from 'react-native';
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
import { WebView } from 'react-native-webview';
import { sendOrderConfirmationEmail } from '../utils/email';
import { generatePayPalSmartButtonsHTML } from '../utils/paypal';

type PaymentMethod = 'cash_on_delivery' | 'card' | 'payfast' | 'paypal' | 'eft';

export default function CheckoutScreen() {
  const { totalPrice, items, clearCart } = useCart();
  const { user, addOrder, isAuthenticated, isProcessingOrder } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [showPayPalWebView, setShowPayPalWebView] = useState(false);
  
  // Delivery scheduling state with tomorrow as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('morning');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    email: '',
  });

  // Check if user is guest and redirect them to signup
  useEffect(() => {
    if (user && user.isGuest) {
      Alert.alert(
        'Account Required',
        'You need to create an account to place orders. This helps us track your delivery and provide better service.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back(),
          },
          {
            text: 'Create Account',
            onPress: () => router.replace('/auth/register'),
          },
        ],
        { cancelable: false }
      );
      return;
    }

    if (!isAuthenticated && !user?.isGuest) {
      Alert.alert(
        'Login Required',
        'Please log in to place an order.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back(),
          },
          {
            text: 'Login',
            onPress: () => router.replace('/auth/login'),
          },
        ],
        { cancelable: false }
      );
    }
  }, [user, isAuthenticated, router]);

  // Auto-fill user information if available
  useEffect(() => {
    if (user && !user.isGuest) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        notes: '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return formData.name.trim() !== '' && 
           formData.phone.trim() !== '' && 
           formData.address.trim() !== '';
  };

  const handlePayPalSuccess = async () => {
    console.log('PayPal payment successful, completing order...');
    setShowPayPalWebView(false);
    
    Toast.show({
      type: 'success',
      text1: 'Payment Successful!',
      text2: 'Your PayPal payment has been processed successfully.',
      position: 'bottom',
    });
    
    await completeOrder('paypal');
  };

  const handlePayPalCancel = () => {
    console.log('PayPal payment cancelled by user');
    setShowPayPalWebView(false);
    setLoading(false);
    
    Toast.show({
      type: 'info',
      text1: 'Payment Cancelled',
      text2: 'PayPal payment was cancelled. You can try again or choose a different payment method.',
      position: 'bottom',
    });
  };

  const formatDeliverySchedule = () => {
    const dateStr = selectedDate.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const timeSlotLabels = {
      morning: 'Morning (8:00 AM - 12:00 PM)',
      afternoon: 'Afternoon (12:00 PM - 5:00 PM)',
      evening: 'Evening (5:00 PM - 8:00 PM)',
    };
    
    return `${dateStr} - ${timeSlotLabels[selectedTimeSlot]}`;
  };

  const completeOrder = async (paymentMethodUsed: PaymentMethod) => {
    try {
      setLoading(true);
      
      // Create order items from cart
      const orderItems = items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      }));
      
      const deliverySchedule = formatDeliverySchedule();
      
      // Create new order with all required fields (using database-compatible values)
      const orderData = {
        items: orderItems,
        totalAmount: totalPrice + 50, // Including delivery fee
        status: 'pending' as const,
        paymentMethod: paymentMethodUsed, // This now matches database constraints
        deliveryAddress: formData.address,
        deliverySchedule,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        notes: formData.notes,
      };

      console.log('Creating order with data:', orderData);

      // Add order to user's orders (will save to Supabase if authenticated)
      const newOrder = await addOrder(orderData);
      
      // Send confirmation email if email is available and not empty
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
          orderItems: orderItems.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: newOrder.totalAmount,
          paymentMethod: getPaymentMethodDisplayName(newOrder.paymentMethod),
          deliveryAddress: newOrder.deliveryAddress,
          deliverySchedule,
        };
        
        // Send email (fire and forget - don't block the user flow)
        sendOrderConfirmationEmail(emailData)
          .then(success => {
            if (success) {
              console.log('Order confirmation email sent successfully');
              Toast.show({
                type: 'success',
                text1: 'Email Sent',
                text2: 'Order confirmation sent to your email.',
                position: 'bottom',
                visibilityTime: 2000,
              });
            } else {
              console.log('Email sending failed - likely due to testing restrictions');
              // Don't show error toast for email failures in testing mode
            }
          })
          .catch(error => {
            console.error('Error sending order confirmation email:', error);
            // Silently fail for email issues to not disrupt user experience
          });
      }
      
      Toast.show({
        type: 'success',
        text1: 'Order Placed Successfully',
        text2: 'Your order has been received and will be delivered as scheduled.',
        position: 'bottom',
        visibilityTime: 3000,
      });
      clearCart();
      
      // Navigate to profile page to view the order
      router.replace('/profile');
    } catch (error) {
      console.error('Error placing order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to place your order. Please try again.',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodDisplayName = (method: PaymentMethod): string => {
    const displayNames = {
      'cash_on_delivery': 'Cash on Delivery',
      'card': 'Card on Delivery',
      'eft': 'EFT',
      'paypal': 'PayPal',
      'payfast': 'PayFast',
    };
    return displayNames[method] || method;
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      // For web, use the Clipboard API
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        Toast.show({
          type: 'success',
          text1: 'Copied!',
          text2: `${text} copied to clipboard`,
          position: 'bottom',
          visibilityTime: 2000,
        });
      } else {
        // For mobile, you'd need to install @react-native-clipboard/clipboard
        // For now, just show the text to copy
        Toast.show({
          type: 'info',
          text1: 'Copy this:',
          text2: text,
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handlePlaceOrder = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();
    
    if (!isFormValid()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all required fields.',
        position: 'bottom',
      });
      return;
    }

    if (loading || isProcessingOrder) {
      // Prevent double submission
      return;
    }

    setLoading(true);
    
    try {
      // Process based on payment method
      if (paymentMethod === 'paypal') {
        // Show PayPal WebView
        setShowPayPalWebView(true);
        setLoading(false); // Reset loading since we're showing webview
        return;
      }
      
      if (paymentMethod === 'eft') {
        // Enhanced EFT payment flow with better instructions
        Alert.alert(
          '🏦 EFT Payment Instructions',
          `Please make payment to the following account:\n\n` +
          `💳 Bank: ABSA Business Commercial West Rand\n` +
          `🔢 Account Number: 4073134909\n` +
          `📝 Reference: ONO-${Date.now().toString().slice(-6)}\n\n` +
          `📧 After payment, send proof to:\n` +
          `• Email: info@onologroup.com\n` +
          `• WhatsApp: 0717703063\n\n` +
          `✅ Your order will be processed once payment is confirmed.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setLoading(false)
            },
            {
              text: 'Copy Account Details',
              onPress: () => {
                handleCopyToClipboard('ABSA Business Commercial West Rand - Account: 4073134909');
                // Don't complete order yet, let user confirm after copying
                setLoading(false);
              }
            },
            {
              text: 'I\'ve Made Payment',
              onPress: async () => {
                await completeOrder('eft');
              }
            }
          ]
        );
        return;
      }
      
      // For cash_on_delivery/card on delivery
      await completeOrder(paymentMethod);
    } catch (error) {
      console.error('Error in handlePlaceOrder:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unexpected error occurred. Please try again.',
        position: 'bottom',
      });
      setLoading(false);
    }
  };

  // Enhanced PayPal WebView with proper Smart Buttons integration
  const paypalHTML = generatePayPalSmartButtonsHTML(
    totalPrice + 50,
    items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price
    })),
    formData.name,
    formData.address
  );

  const handleWebViewMessage = (event) => {
    const { data } = event.nativeEvent;
    
    try {
      const parsedData = JSON.parse(data);
      console.log('PayPal WebView message received:', parsedData);
      
      if (parsedData.type === 'SUCCESS') {
        console.log('PayPal payment successful:', parsedData);
        handlePayPalSuccess();
      } else if (parsedData.type === 'CANCEL') {
        console.log('PayPal payment cancelled');
        handlePayPalCancel();
      } else if (parsedData.type === 'ERROR') {
        console.error('PayPal payment error:', parsedData.error);
        setShowPayPalWebView(false);
        setLoading(false);
        
        Toast.show({
          type: 'error',
          text1: 'Payment Error',
          text2: parsedData.error || 'An error occurred during payment. Please try again.',
          position: 'bottom',
        });
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e, 'Raw data:', data);
    }
  };

  if (showPayPalWebView) {
    return (
      <SafeAreaView style={styles.container}>
        <Header showBackButton />
        <WebView
          source={{ html: paypalHTML }}
          onMessage={handleWebViewMessage}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          mixedContentMode="compatibility"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <Text style={styles.title}>Checkout</Text>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Information</Text>
              
              <CustomTextInput
                label="Full Name *"
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                returnKeyType="next"
                containerStyle={styles.inputGroup}
              />
              
              <CustomTextInput
                label="Email"
                placeholder="Enter your email for order confirmation"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                returnKeyType="next"
                containerStyle={styles.inputGroup}
              />
              
              <CustomTextInput
                label="Phone Number *"
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                returnKeyType="next"
                containerStyle={styles.inputGroup}
              />
              
              <AddressAutocomplete
                label="Delivery Address *"
                value={formData.address}
                onAddressSelect={(address) => handleChange('address', address)}
                placeholder="Start typing your address..."
                style={styles.inputGroup}
              />
              
              <CustomTextInput
                label="Additional Notes"
                placeholder="Any special instructions for delivery"
                multiline
                numberOfLines={3}
                isTextArea
                value={formData.notes}
                onChangeText={(text) => handleChange('notes', text)}
                returnKeyType="done"
                containerStyle={styles.inputGroup}
              />
            </View>

            <DeliveryScheduler
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              onDateChange={setSelectedDate}
              onTimeSlotChange={setSelectedTimeSlot}
            />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              
              {items.map((item) => (
                <View key={item.product.id} style={styles.orderItem}>
                  <View style={styles.orderItemDetails}>
                    <Text style={styles.orderItemName}>
                      {item.product.name} x {item.quantity}
                    </Text>
                    <Text style={styles.orderItemPrice}>
                      R {(item.product.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
              
              <View style={styles.divider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>R {totalPrice.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>R 50.00</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  R {(totalPrice + 50).toFixed(2)}
                </Text>
              </View>
            </View>
            
            <View style={styles.paymentSection}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              
              <TouchableOpacity 
                style={[styles.paymentOption, paymentMethod === 'cash_on_delivery' && styles.selectedPaymentOption]}
                onPress={() => setPaymentMethod('cash_on_delivery')}
              >
                <View style={styles.paymentOptionIcon}>
                  <Ionicons name="cash-outline" size={24} color={COLORS.text.white} />
                </View>
                <View style={styles.paymentOptionContent}>
                  <Text style={styles.paymentOptionTitle}>Cash on Delivery</Text>
                  <Text style={styles.paymentOptionDescription}>Pay with cash when your order arrives</Text>
                </View>
                {paymentMethod === 'cash_on_delivery' && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.paymentOption, paymentMethod === 'card' && styles.selectedPaymentOption]}
                onPress={() => setPaymentMethod('card')}
              >
                <View style={styles.paymentOptionIcon}>
                  <Ionicons name="card-outline" size={24} color={COLORS.text.white} />
                </View>
                <View style={styles.paymentOptionContent}>
                  <Text style={styles.paymentOptionTitle}>Card on Delivery</Text>
                  <Text style={styles.paymentOptionDescription}>Pay with card when your order arrives</Text>
                </View>
                {paymentMethod === 'card' && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.paymentOption, paymentMethod === 'eft' && styles.selectedPaymentOption]}
                onPress={() => setPaymentMethod('eft')}
              >
                <View style={styles.paymentOptionIcon}>
                  <Ionicons name="swap-horizontal-outline" size={24} color={COLORS.text.white} />
                </View>
                <View style={styles.paymentOptionContent}>
                  <Text style={styles.paymentOptionTitle}>EFT (Bank Transfer)</Text>
                  <Text style={styles.paymentOptionDescription}>Pay via electronic funds transfer</Text>
                  {paymentMethod === 'eft' && (
                    <View style={styles.eftDetails}>
                      <Text style={styles.eftDetailsTitle}>💳 Payment Details:</Text>
                      <Text style={styles.eftDetailsText}>Bank: ABSA Business Commercial West Rand</Text>
                      <Text style={styles.eftDetailsText}>Account: 4073134909</Text>
                      <Text style={styles.eftDetailsTitle}>📧 Send proof of payment to:</Text>
                      <TouchableOpacity onPress={() => Linking.openURL('mailto:info@onologroup.com')}>
                        <Text style={styles.eftContactLink}>Email: info@onologroup.com</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => Linking.openURL('https://wa.me/27717703063')}>
                        <Text style={styles.eftContactLink}>WhatsApp: 0717703063</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                {paymentMethod === 'eft' && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.paymentOption, paymentMethod === 'paypal' && styles.selectedPaymentOption]}
                onPress={() => setPaymentMethod('paypal')}
              >
                <View style={styles.paymentOptionIcon}>
                  <Ionicons name="logo-paypal" size={24} color={COLORS.text.white} />
                </View>
                <View style={styles.paymentOptionContent}>
                  <Text style={styles.paymentOptionTitle}>PayPal</Text>
                  <Text style={styles.paymentOptionDescription}>Pay now with PayPal secure payment</Text>
                </View>
                {paymentMethod === 'paypal' && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            </View>
            
            <Button
              title={loading || isProcessingOrder ? 'Processing...' : 'Place Order'}
              onPress={handlePlaceOrder}
              loading={loading || isProcessingOrder}
              disabled={loading || isProcessingOrder || !isFormValid()}
              style={styles.placeOrderButton}
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
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  orderItem: {
    marginBottom: 12,
  },
  orderItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItemName: {
    color: COLORS.text.white,
    fontSize: 16,
  },
  orderItemPrice: {
    color: COLORS.text.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: COLORS.text.gray,
    fontSize: 16,
  },
  summaryValue: {
    color: COLORS.text.white,
    fontSize: 16,
  },
  totalLabel: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  paymentSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedPaymentOption: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  paymentOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentOptionTitle: {
    color: COLORS.text.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paymentOptionDescription: {
    color: COLORS.text.gray,
    fontSize: 14,
  },
  eftDetails: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 6,
  },
  eftDetailsTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eftDetailsText: {
    color: COLORS.text.white,
    fontSize: 13,
    marginBottom: 2,
  },
  eftContactLink: {
    color: COLORS.primary,
    fontSize: 13,
    textDecorationLine: 'underline',
    marginBottom: 2,
  },
  placeOrderButton: {
    marginBottom: 40,
  },
  webview: {
    flex: 1,
  },
});