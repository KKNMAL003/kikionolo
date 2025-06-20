import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { COMPANY } from '../../constants/company';
import Header from '../../components/Header';

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.title}>Customer Support</Text>
        <Text style={styles.message}>
          Our customer support team is available to assist you. Please contact us at:
        </Text>
        <Text style={styles.contactInfo}>
          Email: {COMPANY.contact.email}
        </Text>
        <Text style={styles.contactInfo}>
          Phone: {COMPANY.contact.phone}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    color: COLORS.text.gray,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  contactInfo: {
    color: COLORS.primary,
    fontSize: 18,
    marginBottom: 10,
  },
});