import React from 'react';
import { TextInput, TextInputProps, StyleProp, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export interface BaseInputProps extends TextInputProps {
  style?: StyleProp<TextStyle>;
}

export const BaseInput: React.FC<BaseInputProps> = ({
  style,
  ...rest
}) => {
  return (
    <TextInput
      style={[
        {
          backgroundColor: colors.surface,
          color: colors.text.primary,
          borderRadius: spacing.borderRadius,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          fontSize: typography.fontSize.body,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
      placeholderTextColor={colors.text.gray}
      {...rest}
    />
  );
}; 