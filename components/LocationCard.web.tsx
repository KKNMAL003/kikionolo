import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { COMPANY } from '../constants/company';
import { Ionicons } from '@expo/vector-icons';
import { BaseButton } from './base/BaseButton';
import { useRouter } from 'expo-router';
import { BaseCard } from './base/BaseCard';
import { BaseText } from './base/BaseText';

interface LocationCardProps {
  onDeliveryRequest?: () => void;
}

export default function LocationCard({ onDeliveryRequest }: LocationCardProps) {
  const router = useRouter();

  const handleDeliveryRequest = () => {
    // Navigate to the order tab
    router.push('/(tabs)/order');
  };

  return (
    <BaseCard style={styles.container}>
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="location-outline" size={32} color={colors.text.gray} />
          <BaseText style={styles.mapPlaceholderText}>
            {COMPANY.location.fullAddress.street}, {COMPANY.location.fullAddress.area}
          </BaseText>
        </View>
      </View>
      <View style={styles.locationInfo}>
        <View style={styles.locationHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={24} color={colors.primary} />
          </View>
          <View>
            <BaseText style={styles.locationName}>{COMPANY.location.name}</BaseText>
            <BaseText style={styles.locationAddress}>{COMPANY.location.address}</BaseText>
          </View>
        </View>
        <View style={styles.hoursContainer}>
          <View style={styles.dot} />
          <BaseText style={styles.hours}>{COMPANY.location.hours}</BaseText>
        </View>
        <BaseButton title="Ask for a delivery" onPress={handleDeliveryRequest} style={styles.button} />
      </View>
    </BaseCard>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mapContainer: {
    height: 150,
    backgroundColor: '#1A1A1A',
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    color: colors.text.gray,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  locationInfo: {
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationName: {
    color: colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationAddress: {
    color: colors.text.gray,
    fontSize: 14,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  hours: {
    color: colors.text.gray,
    fontSize: 14,
  },
  button: {
    marginTop: 8,
  },
});
