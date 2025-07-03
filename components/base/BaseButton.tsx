import React from 'react';
import { Pressable, Text, ActivityIndicator, View, StyleProp, ViewStyle, TextStyle, GestureResponderEvent } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { BaseText } from './BaseText';

export type BaseButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export interface BaseButtonProps {
  variant?: BaseButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  children: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

const getButtonColors = (variant: BaseButtonVariant, disabled: boolean) => {
  if (disabled) {
    return {
      background: colors.inactive || colors.text.gray,
      border: colors.border,
      text: colors.text.gray,
    };
  }
  switch (variant) {
    case 'primary':
      return { background: colors.primary, border: colors.primary, text: colors.text.white };
    case 'secondary':
      return { background: colors.secondary, border: colors.secondary, text: colors.text.black };
    case 'outline':
      return { background: 'transparent', border: colors.primary, text: colors.primary };
    case 'ghost':
      return { background: 'transparent', border: 'transparent', text: colors.primary };
    case 'danger':
      return { background: colors.error, border: colors.error, text: colors.text.white };
    default:
      return { background: colors.primary, border: colors.primary, text: colors.text.white };
  }
};

export const BaseButton: React.FC<BaseButtonProps> = ({
  variant = 'ghost',
  loading = false,
  disabled = false,
  onPress,
  children,
  iconLeft,
  iconRight,
  style,
  textStyle,
  testID,
  ...rest
}) => {
  const { background, border, text } = getButtonColors(variant, disabled);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background,
          borderColor: border,
          borderWidth: variant === 'outline' ? 2 : 0,
          paddingVertical: 10,
          paddingHorizontal: 18,
          borderRadius: 16,
          opacity: pressed || disabled ? 0.7 : 1,
        },
        style,
      ]}
      testID={testID}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={text} />
      ) : (
        <>
          {iconLeft && <View style={{ marginRight: spacing.xs }}>{iconLeft}</View>}
          <BaseText
            color={text === colors.text.white ? 'white' : text === colors.text.black ? 'black' : 'primary'}
            weight="bold"
            style={[{ color: text, fontSize: 16 }, textStyle]}
          >
            {children}
          </BaseText>
          {iconRight && <View style={{ marginLeft: spacing.xs }}>{iconRight}</View>}
        </>
      )}
    </Pressable>
  );
}; 