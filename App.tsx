import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { initializeConnectionTest } from '@/utils/connectionTest';

export default function App() {
  useEffect(() => {
    // Run connection diagnostics on app startup
    const testConnection = async () => {
      console.log('Running Supabase connection diagnostics...');
      const success = await initializeConnectionTest();
      
      if (!success) {
        console.error('⚠️  Connection issues detected. Check the console for details.');
      } else {
        console.log('✅ Supabase connection is working properly');
      }
    };
    
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Text style={styles.debugText}>Check console for Supabase connection status</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugText: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});