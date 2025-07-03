import React from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { NotificationsSettings } from './settings/NotificationsSettings';
import { PrivacySecuritySettings } from './settings/PrivacySecuritySettings';
import { useRouter } from 'expo-router';
import { BaseButton } from './base/BaseButton';
import { BaseText } from './base/BaseText';

export default function ProfileSettingsScreen({
  settingsScreen,
  setSettingsScreen,
  notificationSettings,
  notificationPreferences,
  onUpdateSettings,
  user,
  onSetUpTwoFactor,
  onLogout,
}: {
  settingsScreen: string;
  setSettingsScreen: (screen: string) => void;
  notificationSettings: any;
  notificationPreferences: any;
  onUpdateSettings: (updates: any) => void;
  user: any;
  onSetUpTwoFactor: () => void;
  onLogout?: () => void;
}) {
  const router = useRouter();

  switch (settingsScreen) {
    case 'notifications':
      return (
        <NotificationsSettings
          notificationSettings={notificationSettings}
          notificationPreferences={notificationPreferences}
          onBack={() => setSettingsScreen('main')}
          onUpdateSettings={onUpdateSettings}
        />
      );
    case 'privacy':
      return (
        <PrivacySecuritySettings
          securitySettings={user?.securitySettings}
          onBack={() => setSettingsScreen('main')}
          onUpdateSettings={onUpdateSettings}
          onChangePassword={onSetUpTwoFactor}
          onSetUpTwoFactor={onSetUpTwoFactor}
        />
      );
    case 'help':
      return (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <BaseButton
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
            onPress={() => setSettingsScreen('main')}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.white} />
            <BaseText style={{ color: colors.text.white, fontSize: 16, marginLeft: 12 }}>Back to Settings</BaseText>
          </BaseButton>
          
          <BaseText style={{ color: colors.text.white, fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Help & Support</BaseText>
          
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <BaseText style={{ color: colors.text.white, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Contact Information</BaseText>
            <BaseText style={{ color: colors.text.gray, fontSize: 14, marginBottom: 8 }}>📞 Phone: +27 11 464 5073</BaseText>
            <BaseText style={{ color: colors.text.gray, fontSize: 14, marginBottom: 8 }}>📧 Email: info@onologroup.com</BaseText>
            <BaseText style={{ color: colors.text.gray, fontSize: 14, marginBottom: 8 }}>🌐 Website: www.onologroup.com</BaseText>
          </View>
          
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <BaseText style={{ color: colors.text.white, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Business Hours</BaseText>
            <BaseText style={{ color: colors.text.gray, fontSize: 14, marginBottom: 8 }}>Monday - Sunday: 7:00 AM - 10:00 PM</BaseText>
            <BaseText style={{ color: colors.text.gray, fontSize: 14, marginBottom: 8 }}>Emergency deliveries available 24/7</BaseText>
          </View>
          
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <BaseText style={{ color: colors.text.white, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Common Questions</BaseText>
            <BaseText style={{ color: colors.text.gray, fontSize: 14, marginBottom: 8 }}>• How do I place an order?</BaseText>
            <BaseText style={{ color: colors.text.gray, fontSize: 14, marginBottom: 8 }}>• What payment methods do you accept?</BaseText>
            <BaseText style={{ color: colors.text.gray, fontSize: 14, marginBottom: 8 }}>• How long does delivery take?</BaseText>
            <BaseText style={{ color: colors.text.gray, fontSize: 14, marginBottom: 8 }}>• Can I cancel my order?</BaseText>
          </View>
          
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16 }}>
            <BaseText style={{ color: colors.text.white, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Need More Help?</BaseText>
            <BaseText style={{ color: colors.text.gray, fontSize: 14, lineHeight: 20 }}>
              If you need immediate assistance, please call us directly or send us an email. Our customer service team is available during business hours to help you with any questions or concerns.
            </BaseText>
          </View>
        </ScrollView>
      );
    case 'main':
    default:
      return (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BaseText style={{ color: colors.text.white, fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Settings</BaseText>
          <View style={{ marginBottom: 24 }}>
            <BaseButton
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
              onPress={() => setSettingsScreen('notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.text.white} />
              <BaseText style={{ color: colors.text.white, fontSize: 16, marginLeft: 12 }}>Notifications</BaseText>
              <Ionicons name="chevron-forward" size={20} color={colors.text.gray} style={{ marginLeft: 'auto' }} />
            </BaseButton>
            <BaseButton
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
              onPress={() => setSettingsScreen('privacy')}
            >
              <Ionicons name="lock-closed-outline" size={24} color={colors.text.white} />
              <BaseText style={{ color: colors.text.white, fontSize: 16, marginLeft: 12 }}>Privacy & Security</BaseText>
              <Ionicons name="chevron-forward" size={20} color={colors.text.gray} style={{ marginLeft: 'auto' }} />
            </BaseButton>
            <BaseButton
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
              onPress={() => router.push('/(tabs)/chat')}
            >
              <Ionicons name="help-circle-outline" size={24} color={colors.text.white} />
              <BaseText style={{ color: colors.text.white, fontSize: 16, marginLeft: 12 }}>Help & Support</BaseText>
              <Ionicons name="chevron-forward" size={20} color={colors.text.gray} style={{ marginLeft: 'auto' }} />
            </BaseButton>
            {onLogout && (
              <BaseButton
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                onPress={onLogout}
              >
                <Ionicons name="log-out-outline" size={24} color={colors.error} />
                <BaseText style={{ color: colors.error, fontSize: 16, marginLeft: 12 }}>Sign Out</BaseText>
              </BaseButton>
            )}
          </View>
        </ScrollView>
      );
  }
} 