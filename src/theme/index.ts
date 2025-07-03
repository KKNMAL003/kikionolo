import { Platform } from 'react-native';

// Colors
export const colors = {
  // Primary
  primary: '#007AFF',
  primaryLight: '#66B3FF',
  primaryDark: '#0052CC',
  
  // Secondary
  secondary: '#5856D6',
  secondaryLight: '#8A88FF',
  secondaryDark: '#3A389E',
  
  // Background
  background: '#FFFFFF',
  backgroundLight: '#F5F5F5',
  backgroundDark: '#1C1C1E',
  
  // Surface
  surface: '#FFFFFF',
  surfaceLight: '#F5F5F5',
  surfaceDark: '#2C2C2E',
  
  // Text
  text: '#000000',
  textLight: '#606060',
  textDark: '#FFFFFF',
  textDisabled: '#999999',
  
  // Border
  border: '#E5E5E5',
  borderLight: '#F5F5F5',
  borderDark: '#3A3A3C',
  
  // Accent
  accent: '#FF3B30',
  accentLight: '#FF6B60',
  accentDark: '#CC2D24',
  
  // Success
  success: '#34C759',
  successLight: '#66D987',
  successDark: '#28A745',
  
  // Warning
  warning: '#FF9500',
  warningLight: '#FFB74D',
  warningDark: '#E6A23C',
  
  // Error
  error: '#FF3B30',
  errorLight: '#FF6B60',
  errorDark: '#CC2D24',
  
  // Placeholder
  placeholder: '#999999',
  
  // Transparent
  transparent: 'transparent',
};

// Typography
export const typography = {
  h1: {
    fontSize: Platform.select({ ios: 34, android: 32 }),
    lineHeight: Platform.select({ ios: 40, android: 36 }),
    fontWeight: '600',
  },
  h2: {
    fontSize: Platform.select({ ios: 28, android: 26 }),
    lineHeight: Platform.select({ ios: 34, android: 32 }),
    fontWeight: '600',
  },
  h3: {
    fontSize: Platform.select({ ios: 22, android: 20 }),
    lineHeight: Platform.select({ ios: 28, android: 26 }),
    fontWeight: '600',
  },
  h4: {
    fontSize: Platform.select({ ios: 20, android: 18 }),
    lineHeight: Platform.select({ ios: 24, android: 22 }),
    fontWeight: '600',
  },
  body: {
    fontSize: Platform.select({ ios: 17, android: 16 }),
    lineHeight: Platform.select({ ios: 22, android: 20 }),
    fontWeight: '400',
  },
  caption: {
    fontSize: Platform.select({ ios: 13, android: 12 }),
    lineHeight: Platform.select({ ios: 18, android: 16 }),
    fontWeight: '400',
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

// Shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
  },
};

// Border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// Theme context
export const theme = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
};
