// Feature flag configuration
import { Platform } from 'react-native';

export const featuresConfig = {
  enableRealtime: true,
  enablePushNotifications: Platform.OS !== 'web',
  enableExperimentalChat: false, // Example feature flag
}; 