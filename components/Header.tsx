import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { COMPANY } from '../constants/company';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../contexts/OrdersContext';
import { useMessages } from '../contexts/MessagesContext';
import { BaseButton } from './base/BaseButton';
import { BaseText } from './base/BaseText';

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export default function Header({ showBackButton = false, title }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { orders } = useOrders();
  const { unreadCount } = useMessages();

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

  const handleMessagesPress = () => {
    // Navigate to chat screen
    router.push('/(tabs)/chat');
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
          <BaseButton onPress={handleBackPress} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={colors.text.white} />
          </BaseButton>
        ) : (
          <BaseButton 
            onPress={() => router.replace('/(tabs)')} 
            activeOpacity={0.7}
          >
            <View style={styles.logoWrapper}>
              <Image
                source={require('../assets/images/onolo-logo-new.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </BaseButton>
        )}
        <BaseText style={styles.companyName}>{title || COMPANY.name}</BaseText>
      </View>

      <View style={styles.rightSection}>
        {/* Messages Badge - Show unread messages count */}
        {unreadCount > 0 && (
          <BaseButton
            style={styles.messagesBadgeContainer}
            onPress={handleMessagesPress}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
            <View style={styles.messagesBadge}>
              <BaseText style={styles.messagesBadgeText}>{unreadCount}</BaseText>
            </View>
          </BaseButton>
        )}

        {/* Pending Orders Badge - Make it more prominent and clickable */}
        {pendingOrdersCount > 0 && (
          <BaseButton
            style={styles.ordersBadgeContainer}
            onPress={handleOrdersBadgePress}
            activeOpacity={0.7}
          >
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            <View style={styles.ordersBadge}>
              <BaseText style={styles.ordersBadgeText}>{pendingOrdersCount}</BaseText>
            </View>
          </BaseButton>
        )}

        {/* Profile Button */}
        <BaseButton
          style={styles.profileButton}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          <BaseText style={styles.profileInitial}>{getUserInitial()}</BaseText>
        </BaseButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    minHeight: 64,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    padding: 0,
    margin: 0,
    minHeight: 48,
  },
  logoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 0,
    marginRight: 8,
    padding: 0,
    shadowColor: 'transparent',
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 0,
    overflow: 'hidden',
  },
  companyName: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginLeft: 0,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
  },
  messagesBadgeContainer: {
    position: 'relative',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  messagesBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesBadgeText: {
    color: colors.text.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  ordersBadgeContainer: {
    position: 'relative',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  ordersBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordersBadgeText: {
    color: colors.text.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginLeft: 8,
  },
  profileInitial: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
    lineHeight: 36,
  },
});