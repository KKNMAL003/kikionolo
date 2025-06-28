import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../constants/colors';
import Toast from 'react-native-toast-message';
import Button from '../components/Button';

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

  }, [params, router]);

  const handleViewOrders = () => {
    router.replace('/profile');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.title}>Payment Successful!</Text>
      <Text style={styles.subtitle}>
        Your PayFast payment has been processed successfully. Your order is now being prepared.
      </Text>
      
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
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    marginBottom: 16,
  },
});