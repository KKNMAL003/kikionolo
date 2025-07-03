import React from 'react';
import { View, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface BaseCardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  elevation?: number;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  style,
  children,
  elevation = 2,
  ...rest
}) => {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 18,
          shadowColor: colors.text.black,
          shadowOffset: { width: 0, height: elevation },
          shadowOpacity: 0.08 * elevation,
          shadowRadius: 2 * elevation,
          elevation,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}; 