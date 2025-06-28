import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chrome as Home, Flame, ShoppingCart, MessageCircle, Menu } from 'lucide-react-native';
import { usePathname, useRouter } from 'expo-router';

import { COLORS } from '../constants/colors';
import { useCart } from '../context/CartContext';

interface Tab {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  activeIcon: React.ComponentType<any>;
  badge?: number;
}

export default function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();

  const tabs: Tab[] = [
    { name: 'Home', path: '/(tabs)', icon: Home, activeIcon: Home },
    { name: 'Order', path: '/(tabs)/order', icon: Flame, activeIcon: Flame },
    {
      name: 'Cart',
      path: '/(tabs)/cart',
      icon: ShoppingCart,
      activeIcon: ShoppingCart,
      badge: totalItems > 0 ? totalItems : undefined,
    },
    { name: 'Chat', path: '/(tabs)/chat', icon: MessageCircle, activeIcon: MessageCircle },
    { name: 'Menu', path: '/(tabs)/menu', icon: Menu, activeIcon: Menu },
  ];

  const isActive = (path: string) => {
    const cleanedTarget = path.replace('/(tabs)', '') || '/';
    const cleanedCurrent = pathname.replace('/(tabs)', '') || '/';
    if (cleanedTarget === '/' && (cleanedCurrent === '/' || cleanedCurrent === '/index'))
      return true;
    return cleanedCurrent === cleanedTarget;
  };

  const navigate = (path: string) => {
    if (pathname === path) return;
    router.replace(path as any); // cast to silence route-type issues
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => navigate(tab.path)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabInner, active && styles.activeTab]}>
                {React.createElement(
                  active ? tab.activeIcon : tab.icon,
                  {
                  size: 24,
                  color: active ? COLORS.primary : COLORS.text.gray
                  }
                )}
                <Text style={[styles.tabText, active && styles.activeTabText]}>{tab.name}</Text>
              </View>
              {tab.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.background,
    marginBottom: 10,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
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
