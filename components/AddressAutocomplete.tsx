import React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  StyleProp, 
  ViewStyle,
  Keyboard,
  Platform
} from 'react-native';
import { COLORS } from '../constants/colors';

interface AddressAutocompleteProps {
  label?: string;
  value: string;
  onAddressSelect: (address: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

export default function AddressAutocomplete({
  label,
  value,
  onAddressSelect,
  placeholder = 'Enter your address...',
  style,
}: AddressAutocompleteProps) {
  const handleSubmitEditing = () => {
    Keyboard.dismiss();
  };

  const handleBlur = () => {
    // Keyboard will dismiss naturally on blur
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onAddressSelect}
        placeholder={placeholder}
        placeholderTextColor="#9A9A9A"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        returnKeyType="done"
        onSubmitEditing={handleSubmitEditing}
        onBlur={handleBlur}
        blurOnSubmit={true}
        enablesReturnKeyAutomatically={true}
        clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#BBBBBB',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
    minHeight: 80,
  },
});