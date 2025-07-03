import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { COMPANY } from '../../constants/company';
import { Ionicons } from '@expo/vector-icons';
import MenuOption from '../../components/MenuOption';
import { useRouter } from 'expo-router';
import { BaseText } from '../../components/base/BaseText';
import { BaseButton } from '../../components/base/BaseButton';
import Header from '../../components/Header';

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
      <Header />
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <BaseText style={styles.sectionTitle}>Customer Info</BaseText>

          {COMPANY.customerInfo.map((info, index) => (
            <MenuOption
              key={index}
              title={info.title}
              onPress={() => handleMenuOption(info.title)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <BaseText style={styles.sectionTitle}>Contact</BaseText>

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.primary}
                style={styles.contactIcon}
              />
              <BaseButton onPress={handleEmailPress} variant="ghost">
                <BaseText style={styles.contactEmail}>{COMPANY.contact.email}</BaseText>
              </BaseButton>
            </View>

            <View style={styles.contactItem}>
              <Ionicons
                name="globe-outline"
                size={20}
                color={colors.primary}
                style={styles.contactIcon}
              />
              <BaseButton onPress={handleWebsitePress} variant="ghost">
                <BaseText style={styles.contactEmail}>{COMPANY.contact.website}</BaseText>
              </BaseButton>
            </View>

            <View style={styles.contactItem}>
              <Ionicons
                name="call-outline"
                size={20}
                color={colors.primary}
                style={styles.contactIcon}
              />
              <BaseButton onPress={handlePhonePress} variant="ghost">
                <BaseText style={styles.contactEmail}>{COMPANY.contact.phone}</BaseText>
              </BaseButton>
            </View>

            <View style={styles.contactItem}>
              <Ionicons
                name="document-outline"
                size={20}
                color={colors.primary}
                style={styles.contactIcon}
              />
              <BaseText style={styles.contactTextAligned}>Fax: {COMPANY.contact.fax}</BaseText>
            </View>

            <View style={styles.contactItem}>
              <Ionicons
                name="logo-whatsapp"
                size={20}
                color="#25D366"
                style={styles.contactIcon}
              />
              <BaseText
                style={[styles.contactTextAligned, { color: '#25D366' }]}
                onPress={() => Linking.openURL('https://wa.me/27717703063')}
              >
                WhatsApp: +27 71 770-3063
              </BaseText>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    color: colors.text.white,
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
    color: colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contactInfo: {
    marginTop: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  contactText: {
    color: colors.text.gray,
    fontSize: 16,
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactIcon: {
    marginRight: 12,
  },
  contactEmail: {
    color: colors.primary,
    fontSize: 16,
  },
  contactSubtitle: {
    color: colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  contactTextAligned: {
    color: colors.text.gray,
    fontSize: 16,
    textAlignVertical: 'center',
    includeFontPadding: false,
    flex: 1,
  },
});