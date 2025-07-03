import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  FlatList,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors } from '../theme/colors';
import { BaseButton } from './base/BaseButton';
import { BaseText } from './base/BaseText';

// Use env variable if available, otherwise fallback to the provided public token
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1Ijoia2tubWFsMDAzIiwiYSI6ImNtOWI2NGF1MjBjdWwya3M1Mmxua3hqaXgifQ._PMbFD1tTIq4zmjGCwnAHg';

interface AddressAutocompleteProps {
  label?: string;
  value: string;
  onAddressSelect: (address: string | any) => void;
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
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const suggestionsContainerRef = useRef<View>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=ZA&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (e) {
        setSuggestions([]);
      }
    };
    const timeout = setTimeout(fetchSuggestions, 300); // debounce
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (feature: any) => {
    setQuery(feature.place_name);
    setShowSuggestions(false);
    setSuggestions([]);
    onAddressSelect(feature);
    Keyboard.dismiss();
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    setShowSuggestions(true);
    onAddressSelect(text); // keep parent in sync
  };

  // Only hide suggestions if focus is lost from both input and dropdown
  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200); // allow tap
  };

  // Prevent dropdown from closing when tapping/scrolling inside
  const handleSuggestionsPressIn = () => {
    // Do nothing, prevents blur
  };

  return (
    <View style={[styles.container, style]}>
      {label && <BaseText style={styles.label}>{label}</BaseText>}
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={query}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9A9A9A"
        returnKeyType="done"
        onBlur={handleBlur}
        onFocus={() => setShowSuggestions(true)}
        blurOnSubmit={true}
        enablesReturnKeyAutomatically={true}
        clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {showSuggestions && suggestions.length > 0 && (
        <TouchableWithoutFeedback onPressIn={handleSuggestionsPressIn}>
          <View style={styles.suggestionsContainer} ref={suggestionsContainerRef}>
            {suggestions.map((item) => (
              <BaseButton
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => handleSelect(item)}
              >
                <BaseText style={styles.suggestionText}>{item.place_name}</BaseText>
              </BaseButton>
            ))}
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 10,
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
    minHeight: 48,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#222',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 100,
    maxHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  suggestionText: {
    color: '#fff',
    fontSize: 15,
  },
});
