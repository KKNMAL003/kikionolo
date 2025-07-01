import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../contexts/AuthContext';
import { OrdersProvider } from '../contexts/OrdersContext';
import { MessagesProvider } from '../contexts/MessagesContext';
import { NotificationsProvider } from '../contexts/NotificationsContext';
import { COLORS } from '../constants/colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter, useSegments } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeConnectionTest } from '../utils/connectionTest';
import { queryClient } from '../utils/queryClient';
import { useAuth } from '../contexts/AuthContext';

// Enhanced Auth guard component with better navigation management
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';
    const inWelcome = segments[0] === 'welcome';

    // Improved logic: prevent navigation conflicts
    const timeoutId = setTimeout(() => {
      try {
        if (!user) {
          // Not authenticated - only redirect if not already on welcome or auth
          if (!inWelcome && !inAuthGroup) {
            router.replace('/welcome');
          }
        } else {
          // Authenticated - only redirect if on welcome or auth pages
          if (inWelcome || inAuthGroup) {
            router.replace('/(tabs)');
          }
        }
      } catch (error) {
        console.error('Navigation error in AuthGuard:', error);
        if (!user) {
          router.replace('/welcome');
        } else {
          router.replace('/(tabs)');
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user, segments, router, isLoading]);

  if (isLoading) {
    return null;
  }

  return <>{children}</>;
}

// Context providers wrapper to keep layout clean
function ContextProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrdersProvider>
          <MessagesProvider>
            <NotificationsProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </NotificationsProvider>
          </MessagesProvider>
        </OrdersProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  // Initialize connection test on app startup
  useEffect(() => {
    const testConnection = async () => {
      try {
        const success = await initializeConnectionTest();
        
        if (!success) {
          console.warn('⚠️  Some connection issues detected. App functionality may be limited.');
          console.warn('For full functionality, configure CORS in your Supabase project settings.');
        } else {
          console.log('🎉 Supabase connection is working properly');
        }
      } catch (error) {
        console.error('Connection test failed:', error);
        console.warn('⚠️  Connection test failed. App functionality may be limited.');
      }
    };
    
    testConnection();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ContextProviders>
          <StatusBar style="light" />
          <AuthGuard>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.background },
                animation: 'slide_from_right',
                // Enhanced gesture handling
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
              initialRouteName="(tabs)"
            >
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                  // Reset stack when navigating to tabs
                  animationTypeForReplace: 'push',
                }}
              />
              <Stack.Screen
                name="checkout"
                options={{
                  presentation: 'card',
                  gestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="profile"
                options={{
                  presentation: 'card',
                  gestureEnabled: true,
                  // Ensure profile screen doesn't stack - use replace navigation
                  animationTypeForReplace: 'push',
                }}
              />
              <Stack.Screen
                name="order/[id]"
                options={{
                  presentation: 'card',
                  gestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="payfast-success"
                options={{
                  presentation: 'card',
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="payfast-cancel"
                options={{
                  presentation: 'card',
                  gestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="auth/login"
                options={{
                  presentation: 'modal',
                  gestureEnabled: false,
                  // Prevent going back from login
                  headerLeft: () => null,
                }}
              />
              <Stack.Screen
                name="auth/register"
                options={{
                  presentation: 'modal',
                  gestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="+not-found"
                options={{
                  title: 'Not Found',
                  gestureEnabled: true,
                }}
              />
            </Stack>
          </AuthGuard>
        </ContextProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}