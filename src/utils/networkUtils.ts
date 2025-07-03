import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { t } from './i18n';

type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetInfoStateType;
  details: any;
  isWifi: boolean;
  isCellular: boolean;
  isEthernet: boolean;
  isVpn: boolean;
  isWimax: boolean;
  isBluetooth: boolean;
  isOther: boolean;
  isUnknown: boolean;
};

type NetworkCallback = (state: NetworkState) => void;
type Unsubscribe = () => void;

// Track network state
let currentNetworkState: NetworkState = {
  isConnected: false,
  isInternetReachable: null,
  type: NetInfoStateType.unknown,
  details: null,
  isWifi: false,
  isCellular: false,
  isEthernet: false,
  isVpn: false,
  isWimax: false,
  isBluetooth: false,
  isOther: false,
  isUnknown: true,
};

// Track subscribers
const subscribers = new Set<NetworkCallback>();

/**
 * Update network state and notify subscribers
 */
const updateNetworkState = (state: NetInfoState) => {
  const {
    isConnected = false,
    isInternetReachable = null,
    type = NetInfoStateType.unknown,
    details = null,
  } = state;

  const newState: NetworkState = {
    isConnected,
    isInternetReachable,
    type,
    details,
    isWifi: type === NetInfoStateType.wifi,
    isCellular: type === NetInfoStateType.cellular,
    isEthernet: type === NetInfoStateType.ethernet,
    isVpn: type === NetInfoStateType.vpn,
    isWimax: type === NetInfoStateType.wimax,
    isBluetooth: type === NetInfoStateType.bluetooth,
    isOther: type === NetInfoStateType.other,
    isUnknown: type === NetInfoStateType.unknown,
  };

  currentNetworkState = newState;
  notifySubscribers(newState);
};

/**
 * Notify all subscribers of network state changes
 */
const notifySubscribers = (state: NetworkState) => {
  (Array.isArray(subscribers) ? subscribers : []).forEach((callback) => {
    try {
      callback(state);
    } catch (error) {
      console.error('Error in network state subscriber:', error);
    }
  });
};

/**
 * Initialize network monitoring
 */
const initializeNetworkMonitor = () => {
  // Initial state fetch
  NetInfo.fetch().then(updateNetworkState);

  // Subscribe to network state changes
  const unsubscribe = NetInfo.addEventListener(updateNetworkState);

  // Return cleanup function
  return () => {
    unsubscribe();
  };
};

// Initialize network monitoring when this module loads
const cleanupNetworkMonitor = initializeNetworkMonitor();

/**
 * Get the current network state
 */
export const getNetworkState = (): NetworkState => {
  return { ...currentNetworkState };
};

/**
 * Check if the device is currently online
 */
export const isOnline = (): boolean => {
  return currentNetworkState.isConnected === true && 
         currentNetworkState.isInternetReachable !== false;
};

/**
 * Check if the device is currently offline
 */
export const isOffline = (): boolean => {
  return !isOnline();
};

/**
 * Subscribe to network state changes
 * @param callback Function to call when network state changes
 * @returns Unsubscribe function
 */
export const onNetworkStateChange = (callback: NetworkCallback): Unsubscribe => {
  // Call immediately with current state
  callback({ ...currentNetworkState });
  
  // Add to subscribers
  subscribers.add(callback);
  
  // Return unsubscribe function
  return () => {
    subscribers.delete(callback);
  };
};

/**
 * Wait until the device has an internet connection
 * @param timeout Time in milliseconds to wait before rejecting
 * @returns Promise that resolves when online, or rejects on timeout
 */
export const waitForConnection = (timeout: number = 30000): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If already online, resolve immediately
    if (isOnline()) {
      return resolve();
    }

    // Set up timeout
    const timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error(t('errors.network.timeout')));
    }, timeout);

    // Subscribe to network changes
    const unsubscribe = onNetworkStateChange((state) => {
      if (state.isConnected && state.isInternetReachable) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve();
      }
    });
  });
};

/**
 * Check if the current connection is using a metered network
 * (e.g., cellular data where the user might be charged for data usage)
 */
export const isMeteredConnection = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    
    // On Android, we can check the details
    if (Platform.OS === 'android' && state.details) {
      // @ts-ignore - Android specifics
      return state.details.isConnectionExpensive === true;
    }
    
    // On iOS, we can assume cellular is metered
    return state.type === NetInfoStateType.cellular;
  } catch (error) {
    console.error('Error checking metered connection:', error);
    return false; // Default to non-metered on error
  }
};

/**
 * Get the estimated network speed
 * @returns Estimated speed in kbps or null if unknown
 */
export const getNetworkSpeed = async (): Promise<number | null> => {
  try {
    // This is a simple implementation that measures download speed
    // by downloading a small file of known size
    const testUrl = 'https://httpbin.org/bytes/102400'; // 100KB file
    const startTime = Date.now();
    
    const response = await fetch(testUrl, { cache: 'no-store' });
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    
    if (!contentLength) {
      throw new Error('Could not determine content length');
    }
    
    // Read the response to ensure all data is downloaded
    await response.blob();
    
    const endTime = Date.now();
    const durationInSeconds = (endTime - startTime) / 1000;
    
    // Calculate speed in kbps
    const speedKbps = (contentLength * 8) / (durationInSeconds * 1024);
    
    return Math.round(speedKbps * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error('Error measuring network speed:', error);
    return null;
  }
};

/**
 * Check if the current network is slow
 * @param thresholdKbps Threshold in kbps below which the network is considered slow
 * @returns Promise that resolves to a boolean indicating if the network is slow
 */
export const isSlowNetwork = async (thresholdKbps: number = 100): Promise<boolean> => {
  try {
    const speed = await getNetworkSpeed();
    return speed !== null && speed < thresholdKbps;
  } catch (error) {
    console.error('Error checking if network is slow:', error);
    return false; // Assume not slow on error
  }
};

/**
 * Clean up network monitoring
 * Call this when your app is shutting down
 */
export const cleanup = () => {
  cleanupNetworkMonitor();
  subscribers.clear();
};

/**
 * Format network speed in a human-readable format
 * @param kbps Speed in kbps
 * @returns Formatted string (e.g., "1.2 Mbps", "500 Kbps")
 */
export const formatNetworkSpeed = (kbps: number): string => {
  if (kbps >= 1000) {
    return `${(kbps / 1000).toFixed(1)} Mbps`;
  }
  return `${Math.round(kbps)} Kbps`;
};

/**
 * Get the network type as a string
 */
export const getNetworkType = (): string => {
  if (currentNetworkState.isWifi) return 'WiFi';
  if (currentNetworkState.isCellular) return 'Cellular';
  if (currentNetworkState.isEthernet) return 'Ethernet';
  if (currentNetworkState.isVpn) return 'VPN';
  if (currentNetworkState.isWimax) return 'WiMAX';
  if (currentNetworkState.isBluetooth) return 'Bluetooth';
  if (currentNetworkState.isOther) return 'Other';
  return 'Unknown';
};

/**
 * Check if the current network is a VPN
 */
export const isVpn = (): boolean => {
  return currentNetworkState.isVpn;
};

export default {
  getNetworkState,
  isOnline,
  isOffline,
  onNetworkStateChange,
  waitForConnection,
  isMeteredConnection,
  getNetworkSpeed,
  isSlowNetwork,
  cleanup,
  formatNetworkSpeed,
  getNetworkType,
  isVpn,
};
