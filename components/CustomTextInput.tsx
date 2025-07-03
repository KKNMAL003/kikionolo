import React from 'react';
import {
  StyleSheet,
  TextInputProps,
  View,
  Text,
  StyleProp,
  ViewStyle,
  Keyboard,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { BaseButton } from './base/BaseButton';
import { BaseInput } from './base/BaseInput';

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
  isTextArea?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export default function CustomTextInput({
  label,
  containerStyle,
  error,
  isTextArea = false,
  style,
  onSubmitEditing,
  returnKeyType = 'done',
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...rest
}: CustomTextInputProps) {
  // Enhanced keyboard dismissal
  const handleSubmitEditing = (e) => {
    // Always dismiss keyboard when done is pressed or when editing finishes
    if (returnKeyType === 'done' || isTextArea) {
      Keyboard.dismiss();
    }

    // Call the original onSubmitEditing if provided
    if (onSubmitEditing) {
      onSubmitEditing(e);
    }
  };

  // Handle focus lost to ensure keyboard dismisses
  const handleBlur = (e) => {
    if (rest.onBlur) {
      rest.onBlur(e);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons name={leftIcon} size={20} color={colors.text.gray} />
          </View>
        )}
        <BaseInput
          style={[
            styles.input,
            isTextArea && styles.textArea,
            error && styles.inputError,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={colors.text.gray}
          returnKeyType={returnKeyType}
          onSubmitEditing={handleSubmitEditing}
          onBlur={handleBlur}
          blurOnSubmit={returnKeyType === 'done' || isTextArea}
          // Enhanced keyboard management
          enablesReturnKeyAutomatically={true}
          clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
          {...rest}
        />
        {rightIcon && (
          <BaseButton style={styles.rightIconContainer} onPress={onRightIconPress}>
            <Ionicons name={rightIcon} size={20} color={colors.text.gray} />
          </BaseButton>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: colors.text.lightGray,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    color: colors.text.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    // Enhanced for better UX
    minHeight: 48,
  },
  inputWithLeftIcon: {
    paddingLeft: 40,
  },
  inputWithRightIcon: {
    paddingRight: 40,
  },
  leftIconContainer: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});
