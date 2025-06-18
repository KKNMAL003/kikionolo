import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { usePathname, useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();

  const tabs = [
    {
      name: 'Home',
      path: '/(tabs)',
      icon: 'home-outline',
      activeIcon: 'home',
    },
    {
      name: 'Order',
      path: '/(tabs)/order',
      icon: 'cube-outline',
      activeIcon: 'cube',
    },
    {
      name: 'Cart',
      path: '/(tabs)/cart',
      icon: 'cart-outline',
      activeIcon: 'cart',
      badge: totalItems > 0 ? totalItems : undefined,
    },
    {
      name: 'Chat',
      path: '/(tabs)/chat',
      icon: 'chatbubble-outline',
      activeIcon: 'chatbubble',
    },
    {
      name: 'Menu',
      path: '/(tabs)/menu',
      icon: 'menu-outline',
      activeIcon: 'menu',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/(tabs)' && (pathname === '/(tabs)' || pathname === '/(tabs)/index')) {
      return true;
    }
    return pathname === path;
  };

  const handleTabPress = (path: string) => {
    // Prevent navigation if already on the target path
    if (pathname === path) {
      return;
    }
    
    // Use replace for main tabs to prevent stacking
    router.replace(path);
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => handleTabPress(tab.path)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={active ? tab.activeIcon : tab.icon}
              size={24}
              color={active ? COLORS.primary : COLORS.text.gray}
            />
            <Text
              style={[
                styles.tabText,
                active && styles.activeTabText,
              ]}
            >
              {tab.name}
            </Text>
            {tab.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabText: {
    color: COLORS.text.gray,
    fontSize: 12,
    marginTop: 4,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: '25%',
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.text.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});