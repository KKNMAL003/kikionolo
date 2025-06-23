import { View } from 'react-native';

/**
 * Dummy screen so expo-router has a route to match when PayPal redirects to
 * `…/paypal-success`. The real success handling is done inside CheckoutScreen
 * via the deep-link listener, so this screen renders nothing and immediately
 * returns to the previous screen if it ever appears.
 */
export default function PayPalSuccessScreen() {
  return <View style={{ flex: 1, backgroundColor: 'transparent' }} />;
}
