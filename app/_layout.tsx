import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CartProvider } from '../context/CartContext';
import { UserProvider } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useUser } from '../context/UserContext'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

// Enhanced Auth guard component with better navigation management
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('Auth guard check:', {
      user: !!user,
      isGuest: user?.isGuest,
      inAuthGroup,
      inTabsGroup,
      segments: segments.join('/')
    });

    try {
      if (!user && !inAuthGroup) {
        // If no user and not in auth group, redirect to login
        console.log('Redirecting to login - no user');
        router.replace('/auth/login');
      } else if (user && inAuthGroup) {
        // If user is logged in and in auth group, redirect to home
        console.log('Redirecting to tabs - user authenticated');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Navigation error in AuthGuard:', error);
      // Fallback navigation
      if (!user) {
        router.replace('/auth/login');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  useFrameworkReady();
  
  return (
    <SafeAreaProvider>
      <UserProvider>
        <CartProvider>
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
        </CartProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}