import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './constants/colors';
import { CartProvider } from './context/CartContext';
import { UserProvider } from './context/UserContext';
import { useCallback } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Import the router
import { ExpoRoot } from 'expo-router';

export default function App() {
  const [fontsLoaded] = useFonts({
    'SpaceMono-Regular': require('./assets/fonts/SpaceMono-Regular.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
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
          <Toast />
        </CartProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
