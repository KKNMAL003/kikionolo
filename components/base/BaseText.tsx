import React from 'react';
import { Text, TextProps, StyleProp, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export interface BaseTextProps extends TextProps {
  color?: keyof typeof colors.text | 'primary' | 'secondary' | 'gray' | 'white' | 'black';
  size?: keyof typeof typography.fontSize;
  weight?: keyof typeof typography.fontWeight;
  monospace?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export const BaseText: React.FC<BaseTextProps> = ({
  color = 'primary',
  size = 'body',
  weight = 'regular',
  monospace = false,
  style,
  children,
  ...rest
}) => {
  const textColor = colors.text[color] || colors.text.primary;
  const fontFamily = monospace
    ? typography.fontFamily.monospace
    : typography.fontFamily[weight] || typography.fontFamily.regular;
  const fontWeight = typography.fontWeight[weight] || typography.fontWeight.regular;
  const fontSize = typography.fontSize[size] || typography.fontSize.body;
  const lineHeight = typography.lineHeight[size] || typography.lineHeight.body;

  return (
    <Text
      style={[
        { color: textColor, fontFamily, fontWeight, fontSize, lineHeight },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}; 