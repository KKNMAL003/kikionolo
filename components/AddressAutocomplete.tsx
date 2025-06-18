import React from 'react';
import { View, Text, TextInput, StyleSheet, StyleProp, ViewStyle } from 'react-native';

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