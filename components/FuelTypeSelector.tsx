import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useRouter } from 'expo-router';
import { BaseButton } from './base/BaseButton';
import { BaseText } from './base/BaseText';

type FuelType = 'gas' | 'petrol' | 'diesel';

export default function FuelTypeSelector() {
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('gas');
  const router = useRouter();

  const handleFuelSelect = (fuelType: FuelType) => {
    setSelectedFuel(fuelType);

    if (fuelType === 'petrol' || fuelType === 'diesel') {
      Alert.alert(
        `${fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} Information`,
        `For more information about our ${fuelType} products and services, please contact us directly at +27 11 464 5073 or email us at info@onologroup.com.`,
        [{ text: 'OK', onPress: () => setSelectedFuel('gas') }],
      );
      return;
    }

    // Navigate to main order tab instead of gas-refill
    router.push('/(tabs)/order');
  };

  return (
    <View style={styles.container}>
      <BaseText style={styles.title}>Select Fuel Type</BaseText>

      <View style={styles.fuelTypes}>
        <BaseButton
          style={[styles.fuelOption, selectedFuel === 'diesel' && styles.selectedFuelOption]}
          onPress={() => handleFuelSelect('diesel')}
        >
          <Ionicons
            name="speedometer-outline"
            size={32}
            color={selectedFuel === 'diesel' ? colors.text.white : colors.text.gray}
          />
          <BaseText style={[styles.fuelName, selectedFuel === 'diesel' && styles.selectedFuelText]}>
            Diesel
          </BaseText>
        </BaseButton>

        <BaseButton
          style={[styles.fuelOption, selectedFuel === 'gas' && styles.selectedFuelOption]}
          onPress={() => handleFuelSelect('gas')}
        >
          <Ionicons
            name="flame-outline"
            size={32}
            color={selectedFuel === 'gas' ? colors.text.white : colors.text.gray}
          />
          <BaseText style={[styles.fuelName, selectedFuel === 'gas' && styles.selectedFuelText]}>
            Gas
          </BaseText>
        </BaseButton>

        <BaseButton
          style={[styles.fuelOption, selectedFuel === 'petrol' && styles.selectedFuelOption]}
          onPress={() => handleFuelSelect('petrol')}
        >
          <Ionicons
            name="car-outline"
            size={32}
            color={selectedFuel === 'petrol' ? colors.text.white : colors.text.gray}
          />
          <BaseText style={[styles.fuelName, selectedFuel === 'petrol' && styles.selectedFuelText]}>
            Petrol
          </BaseText>
        </BaseButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    color: colors.text.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fuelTypes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 0,
    gap: 8,
  },
  fuelOption: {
    flex: 1,
    height: 120,
    backgroundColor: colors.card,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderWidth: 0,
  },
  selectedFuelOption: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  fuelName: {
    color: colors.text.gray,
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedFuelText: {
    color: colors.text.white,
    fontWeight: 'bold',
  },
});
