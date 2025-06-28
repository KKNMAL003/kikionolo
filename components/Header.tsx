import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import { COMPANY } from '../constants/company';
import { ArrowLeft, Receipt, User } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { useUser } from '../context/UserContext';

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export default function Header({ showBackButton = false, title }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, orders } = useUser();

  // Calculate pending orders count
  const pendingOrdersCount = orders?.filter((order) => order.status === 'pending').length || 0;

  const handleProfilePress = () => {
    // Prevent navigation if already on profile page
    if (pathname === '/profile') {
      return;
    }

    // Use replace to prevent stacking multiple profile screens
    router.replace('/profile');
  };

  const handleOrdersBadgePress = () => {
    // Prevent navigation if already on profile page
    if (pathname === '/profile') {
      return;
    }

    // Navigate directly to profile page using replace to prevent stacking
    router.replace('/profile');
  };

  const handleBackPress = () => {
    try {
      // Enhanced back navigation with better error handling
      if (router.canGoBack()) {
        router.back();
      } else {
        // If we can't go back, navigate to appropriate fallback
        const isInTabsGroup = pathname.startsWith('/(tabs)');
        const isInAuthGroup = pathname.startsWith('/auth');

        if (isInAuthGroup) {
          // From auth screens, go to home
          router.replace('/(tabs)');
        } else if (!isInTabsGroup) {
          // From non-tab screens, go to tabs
          router.replace('/(tabs)');
        } else {
          // Already in tabs, go to home tab
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.warn('Navigation error in Header:', error);
      // Fallback to home
      router.replace('/(tabs)');
    }
  };

  // Get user initial for avatar
  const getUserInitial = () => {
    if (!user || !user.name) return 'G';
    return user.name.charAt(0).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {showBackButton ? (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={24} color={COLORS.text.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push('/welcome' as any)} activeOpacity={0.7}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../assets/images/onolo-logo-new.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        )}
        <Text style={styles.companyName}>{title || COMPANY.name}</Text>
      </View>

      <View style={styles.rightSection}>
        {/* Pending Orders Badge - Make it more prominent and clickable */}
        {pendingOrdersCount > 0 && (
          <TouchableOpacity
            style={styles.ordersBadgeContainer}
            onPress={handleOrdersBadgePress}
            activeOpacity={0.7}
          >
            <Receipt size={20} color={COLORS.primary} />
            <View style={styles.ordersBadge}>
              <Text style={styles.ordersBadgeText}>{pendingOrdersCount}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Profile Button */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          {user ? (
            <Text style={styles.profileInitial}>{getUserInitial()}</Text>
          ) : (
            <User size={28} color={COLORS.text.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    padding: 0, // Remove any padding around the logo container
    margin: 0, // Remove any margin around the logo container
  },
  logoWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 0, // no rounding
    overflow: 'hidden', // Ensure the image is clipped to the border radius
  },
  companyName: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ordersBadgeContainer: {
    position: 'relative',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  ordersBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordersBadgeText: {
    color: COLORS.text.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
