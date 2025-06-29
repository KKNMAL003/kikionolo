import 'react-native-get-random-values';
import React, { useEffect, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './constants/colors';
import { CartProvider } from './context/CartContext';
import { UserProvider } from './context/UserContext';
import { useFonts, SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

// Force all toast messages to appear at the top unless explicitly overridden
const originalToastShow = Toast.show;
Toast.show = (options: any) => {
  originalToastShow({ ...options, position: 'top', topOffset: 60 });
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Import the router
import { ExpoRoot } from 'expo-router';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'SpaceMono-Regular': SpaceMono_400Regular,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      onLayoutRootView();
    }
  }, [fontsLoaded, fontError, onLayoutRootView]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Set up the router with the app directory
  const ctx = require.context('./app');

  return (
    <SafeAreaProvider>
      <UserProvider>
        <CartProvider>
          <StatusBar style="light" />
          <View style={{ flex: 1, backgroundColor: COLORS.background }} onLayout={onLayoutRootView}>
            <ExpoRoot context={ctx} />
          </View>
          <Toast position="top" topOffset={60} />
        </CartProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}