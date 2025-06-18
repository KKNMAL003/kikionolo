import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import FuelTypeSelector from '../../components/FuelTypeSelector';

export default function HomeScreen() {
  const router = useRouter();

  const handleDeliveryRequest = () => {
    // Navigate to the main order tab instead of gas-refill
    router.push('/(tabs)/order');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mapContainer}>
          <Ionicons name="location-outline" size={48} color={COLORS.text.gray} style={styles.mapPlaceholder} />
          
          <View style={styles.locationCard}>
            <View style={styles.locationIconContainer}>
              <Ionicons name="location" size={24} color={COLORS.primary} />
            </View>
            
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Onolo Gas</Text>
              <Text style={styles.locationAddress}>Johannesburg, South Africa</Text>
              
              <View style={styles.hoursContainer}>
                <View style={styles.hoursDot} />
                <Text style={styles.hoursText}>Open from 7 am to 10 pm</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.deliveryButton}
                onPress={handleDeliveryRequest}
              >
                <Text style={styles.deliveryButtonText}>Ask for a delivery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <FuelTypeSelector />
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
  mapContainer: {
    height: 300,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  mapPlaceholder: {
    opacity: 0.3,
  },
  locationCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(34, 34, 34, 0.9)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    color: COLORS.text.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationAddress: {
    color: COLORS.text.gray,
    fontSize: 16,
    marginBottom: 8,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hoursDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  hoursText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  deliveryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deliveryButtonText: {
    color: COLORS.text.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});