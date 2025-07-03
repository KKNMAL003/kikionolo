import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Oops! Something went wrong.</Text>
    <Text style={styles.message}>{error.message}</Text>
    <Button title="Try Again" onPress={resetError} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#d32f2f',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
}); 