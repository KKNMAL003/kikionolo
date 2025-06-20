import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { COMPANY } from '../../constants/company';
import Header from '../../components/Header';
import { useLocalSearchParams } from 'expo-router';

export default function MenuDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  
  // Find the matching menu item from COMPANY.customerInfo
  const menuItem = COMPANY.customerInfo.find(
    item => item.title.toLowerCase().replace(/\s+/g, '-') === slug
  );

  if (!menuItem) {
    return (
      <SafeAreaView style={styles.container}>
        <Header showBackButton />
        <View style={styles.content}>
          <Text style={styles.title}>Page Not Found</Text>
          <Text style={styles.description}>
            Sorry, the page you're looking for doesn't exist.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton />
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{menuItem.title}</Text>
        <View style={styles.card}>
          <Text style={styles.description}>
            {menuItem.content.split('\n').map((paragraph, index) => (
              <Text key={index}>
                {paragraph}
                {index < menuItem.content.split('\n').length - 1 ? '\n\n' : ''}
              </Text>
            ))}
          </Text>
        </View>
      </ScrollView>
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
  },
  title: {
    color: COLORS.text.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  description: {
    color: COLORS.text.gray,
    fontSize: 16,
    lineHeight: 24,
  },
});