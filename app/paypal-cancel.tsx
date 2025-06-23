import { Redirect } from 'expo-router';

const PayPalCancelScreen = () => {
  // This component handles the PayPal cancellation deep link.
  // It uses the Redirect component from expo-router to safely navigate
  // the user back to the checkout screen, avoiding race conditions
  // that occur when trying to navigate before the app layout is mounted.
  return <Redirect href="/checkout" />;
};

export default PayPalCancelScreen;
