import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { COMPANY } from '../../constants/company';
import { Ionicons } from '@expo/vector-icons';
import MenuOption from '../../components/MenuOption';
import { useRouter } from 'expo-router';

export default function MenuScreen() {
  const router = useRouter();

  const handleMenuOption = (title: string) => {
    router.push(`/menu/${title.toLowerCase().replace(/\s+/g, '-')}`);
  };

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${COMPANY.contact.email}`);
  };

  const handlePhonePress = () => {
    Linking.openURL(`tel:${COMPANY.contact.phone.replace(/\s/g, '')}`);
  };

  const handleWebsitePress = () => {
    Linking.openURL(`https://${COMPANY.contact.website}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Info</Text>

          {COMPANY.customerInfo.map((info, index) => (
            <MenuOption
              key={index}
              title={info.title}
              onPress={() => handleMenuOption(info.title)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>

          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>{COMPANY.location.fullAddress.company}</Text>
            <Text style={styles.contactText}>{COMPANY.location.fullAddress.street}</Text>
            <Text style={styles.contactText}>{COMPANY.location.fullAddress.unit}</Text>
            <Text style={styles.contactText}>{COMPANY.location.fullAddress.area}</Text>

            <View style={styles.contactItem}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.primary}
                style={styles.contactIcon}
              />
              <TouchableOpacity onPress={handleEmailPress}>
                <Text style={styles.contactEmail}>{COMPANY.contact.email}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contactItem}>
              <Ionicons
                name="globe-outline"
                size={20}
                color={COLORS.primary}
                style={styles.contactIcon}
              />
              <TouchableOpacity onPress={handleWebsitePress}>
                <Text style={styles.contactEmail}>{COMPANY.contact.website}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contactItem}>
              <Ionicons
                name="call-outline"
                size={20}
                color={COLORS.primary}
                style={styles.contactIcon}
              />
              <TouchableOpacity onPress={handlePhonePress}>
                <Text style={styles.contactEmail}>{COMPANY.contact.phone}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contactItem}>
              <Ionicons
                name="document-outline"
                size={20}
                color={COLORS.primary}
                style={styles.contactIcon}
              />
              <Text style={styles.contactText}>Fax: {COMPANY.contact.fax}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.contactSubtitle}>Secondary Address</Text>
            <Text style={styles.contactText}>{COMPANY.location.secondaryAddress.street}</Text>
            <Text style={styles.contactText}>{COMPANY.location.secondaryAddress.unit}</Text>
            <Text style={styles.contactText}>{COMPANY.location.secondaryAddress.area}</Text>

            <View style={styles.divider} />

            <Text style={styles.contactSubtitle}>Business Information</Text>
            <Text style={styles.contactText}>
              Registration Number: {COMPANY.business.registrationNumber}
            </Text>
            <Text style={styles.contactText}>Tax Number: {COMPANY.business.taxNumber}</Text>
            <Text style={styles.contactText}>
              Banking Details: {COMPANY.business.bankingDetails}
            </Text>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contactInfo: {
    marginTop: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  contactText: {
    color: COLORS.text.gray,
    fontSize: 16,
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactIcon: {
    marginRight: 8,
  },
  contactEmail: {
    color: COLORS.primary,
    fontSize: 16,
  },
  contactSubtitle: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
});
