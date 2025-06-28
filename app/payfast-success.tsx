import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../constants/colors';
import Toast from 'react-native-toast-message';

export default function PayFastSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Handle PayFast success
    console.log('PayFast payment successful:', params);
    
    // Show success message
    Toast.show({
      type: 'success',
      text1: 'Payment Successful!',
      text2: 'Your order has been processed.',
      position: 'bottom',
      visibilityTime: 3000,
    });

    // Redirect to profile/orders after a short delay
    const timer = setTimeout(() => {
      router.replace('/profile');
    }, 2000);

    return () => clearTimeout(timer);
  }, [params, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.title}>Processing Payment</Text>
      <Text style={styles.subtitle}>Please wait while we confirm your payment...</Text>
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
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.text.gray,
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
});