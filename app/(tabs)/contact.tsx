import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Linking, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { COMPANY } from '../../constants/company';

export default function ContactScreen() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('Please enter a message.');
      return;
    }
    setSending(true);
    const subject = encodeURIComponent('Contact Form Message');
    const body = encodeURIComponent(message);
    const email = COMPANY.contact.email || 'info@example.com';
    const mailto = `mailto:${email}?subject=${subject}&body=${body}`;
    try {
      await Linking.openURL(mailto);
    } catch (e) {
      Alert.alert('Could not open email client.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Contact Us</Text>
      <Text style={styles.subtitle}>Send us a message and we'll get back to you soon.</Text>
      <TextInput
        style={styles.input}
        placeholder="Type your message here..."
        placeholderTextColor={colors.text.gray}
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={5}
        editable={!sending}
      />
      <TouchableOpacity
        style={[styles.button, sending && { opacity: 0.6 }]}
        onPress={handleSend}
        disabled={sending}
      >
        <Text style={styles.buttonText}>{sending ? 'Sending...' : 'Send'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.gray,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.card,
    color: colors.text.white,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 