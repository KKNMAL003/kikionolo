import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface GuestOrderInfoProps {
  visible: boolean;
}

/**
 * Component to inform guest users about how their orders are handled
 */
export default function GuestOrderInfo({ visible }: GuestOrderInfoProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Guest Order Information</Text>
        <Text style={styles.description}>
          Your order will be processed and the business will be notified immediately. 
          You'll receive confirmation via email or phone once your order is confirmed.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '10', // 10% opacity
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 16,
  },
});
