import React from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { NotificationsSettings } from './settings/NotificationsSettings';
import { PrivacySecuritySettings } from './settings/PrivacySecuritySettings';

export default function ProfileSettingsScreen({
  settingsScreen,
  setSettingsScreen,
  notificationSettings,
  notificationPreferences,
  onUpdateSettings,
  user,
  onSetUpTwoFactor,
}: {
  settingsScreen: string;
  setSettingsScreen: (screen: string) => void;
  notificationSettings: any;
  notificationPreferences: any;
  onUpdateSettings: (updates: any) => void;
  user: any;
  onSetUpTwoFactor: () => void;
}) {
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
    case 'main':
    default:
      return (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: COLORS.text.white, fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Settings</Text>
          <View style={{ marginBottom: 24 }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
              onPress={() => setSettingsScreen('notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={COLORS.text.white} />
              <Text style={{ color: COLORS.text.white, fontSize: 16, marginLeft: 12 }}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.gray} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
              onPress={() => setSettingsScreen('privacy')}
            >
              <Ionicons name="lock-closed-outline" size={24} color={COLORS.text.white} />
              <Text style={{ color: COLORS.text.white, fontSize: 16, marginLeft: 12 }}>Privacy & Security</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.gray} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
              onPress={() => setSettingsScreen('help')}
            >
              <Ionicons name="help-circle-outline" size={24} color={COLORS.text.white} />
              <Text style={{ color: COLORS.text.white, fontSize: 16, marginLeft: 12 }}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.gray} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
  }
} 