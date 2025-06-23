import { View } from 'react-native';

/**
 * Catch-all screen for PayPal success deep-links that include the order ID as an
 * extra path segment (e.g. /paypal-success/EC-XXXXXX).  We render an empty view
 * and immediately step back so the user never sees a blank page.
 */
export default function PayPalSuccessTokenScreen() {
  return <View style={{ flex: 1, backgroundColor: 'transparent' }} />;
}
