import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { BaseButton } from './base/BaseButton';
import { BaseText } from './base/BaseText';

import { colors } from '../theme/colors';
import { useCart } from '../context/CartContext';

interface Tab {
  name: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

export default function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();

  const tabs: Tab[] = [
    { name: 'Home', path: '/(tabs)', icon: 'home-outline', activeIcon: 'home' },
    { name: 'Order', path: '/(tabs)/order', icon: 'flame-outline', activeIcon: 'flame' },
    {
      name: 'Cart',
      path: '/(tabs)/cart',
      icon: 'cart-outline',
      activeIcon: 'cart',
      badge: totalItems > 0 ? totalItems : undefined,
    },
    { name: 'Chat', path: '/(tabs)/chat', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
    { name: 'Menu', path: '/(tabs)/menu', icon: 'menu-outline', activeIcon: 'menu' },
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
            <BaseButton
              key={tab.name}
              style={styles.tab}
              onPress={() => navigate(tab.path)}
              activeOpacity={0.7}
              variant="ghost"
            >
              <View style={[styles.tabInner, active && styles.activeTab]}>
                {/* @ts-ignore  – Ionicons typings don\'t include all names */}
                <Ionicons
                  name={active ? tab.activeIcon : tab.icon}
                  size={24}
                  color={active ? colors.primary : colors.text.gray}
                />
                <BaseText style={[styles.tabText, active && styles.activeTabText]}>{tab.name}</BaseText>
              </View>
              {tab.badge && (
                <View style={styles.badge}>
                  <BaseText style={styles.badgeText}>{tab.badge}</BaseText>
                </View>
              )}
            </BaseButton>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    marginBottom: 0,
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'flex-end',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'flex-end',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    minWidth: 60,
    minHeight: 40,
  },
  activeTab: {
    backgroundColor: colors.primary + '22',
    borderRadius: 20,
    minWidth: 60,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabText: {
    color: colors.text.gray,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  activeTabText: {
    color: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.text.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
