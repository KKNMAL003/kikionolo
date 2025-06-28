import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';
import Toast from 'react-native-toast-message';
import Button from '../components/Button';

export default function PayFastCancelScreen() {
  const router = useRouter();

  useEffect(() => {
    // Show cancellation message
    Toast.show({
      type: 'info',
      text1: 'Payment Cancelled',
      text2: 'Your payment was cancelled. You can try again.',
      position: 'bottom',
      visibilityTime: 4000,
    });
  }, []);

  const handleReturnToCheckout = () => {
    router.replace('/checkout');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Cancelled</Text>
      <Text style={styles.subtitle}>
        Your payment was cancelled. Don't worry, no charges were made to your account.
      </Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Try Again"
          onPress={handleReturnToCheckout}
          style={styles.button}
        />
        <Button
          title="Go Home"
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
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.text.gray,
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    marginBottom: 16,
  },
});