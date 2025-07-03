import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { BaseButton } from './base/BaseButton';
import { BaseText } from './base/BaseText';

interface MenuOptionProps {
  title: string;
  onPress: () => void;
  icon?: string;
}

export default function MenuOption({ title, onPress, icon }: MenuOptionProps) {
  return (
    <BaseButton onPress={onPress} style={styles.button} variant="ghost">
      <View style={styles.iconContainer}>
        {icon && <Ionicons name={icon} size={20} color={colors.primary} />}
      </View>
      <BaseText style={styles.title}>{title}</BaseText>
    </BaseButton>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  title: {
    color: colors.text.white,
    fontSize: 16,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
});
