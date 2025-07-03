import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { isObject, isString, isNumber, isBoolean, isNil } from 'lodash';
import { t } from './i18n';

// Current storage version - increment this when making breaking changes to storage structure
const STORAGE_VERSION = '1.0.0';
const VERSION_KEY = '@storage_version';
const MIGRATION_FLAG = '@migration_complete';

// Error messages
const ERRORS = {
  INVALID_KEY: 'Storage key cannot be empty',
  INVALID_VALUE: 'Invalid value provided for storage',
  MIGRATION_FAILED: 'Storage migration failed',
} as const;

// Type for storage keys to prevent typos
type StorageKey =
  | 'auth_token'
  | 'refresh_token'
  | 'user_profile'
  | 'app_settings'
  | 'theme_preference'
  | 'last_visited'
  | 'notifications_enabled'
  | 'cached_data'
  | 'search_history'
  | 'favorites';

/**
 * Type-safe storage keys with prefix
 */
const StorageKeys: Record<StorageKey, string> = {
  auth_token: '@auth_token',
  refresh_token: '@refresh_token',
  user_profile: '@user_profile',
  app_settings: '@app_settings',
  theme_preference: '@theme_preference',
  last_visited: '@last_visited',
  notifications_enabled: '@notifications_enabled',
  cached_data: '@cached_data',
  search_history: '@search_history',
  favorites: '@favorites',
} as const;

/**
 * Validates if a value can be stored
 */
const isValidStorageValue = (value: unknown): boolean => {
  return (
    isString(value) ||
    isNumber(value) ||
    isBoolean(value) ||
    isObject(value) ||
    isNil(value)
  );
};

/**
 * Stringify a value for storage with error handling
 */
const safeStringify = (value: unknown): string => {
  if (!isValidStorageValue(value)) {
    throw new Error(ERRORS.INVALID_VALUE);
  }
  
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('Error stringifying value:', error);
    throw new Error(ERRORS.INVALID_VALUE);
  }
};

/**
 * Parse a stored value with error handling
 */
const safeParse = <T = unknown>(value: string | null): T | null => {
  if (value === null) return null;
  
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Error parsing stored value:', error);
    return null;
  }
};

/**
 * Get a value from storage
 */
export const getItem = async <T = unknown>(key: StorageKey): Promise<T | null> => {
  if (!key) throw new Error(ERRORS.INVALID_KEY);
  
  try {
    const value = await AsyncStorage.getItem(StorageKeys[key]);
    return safeParse<T>(value);
  } catch (error) {
    console.error(`Error getting item ${key}:`, error);
    return null;
  }
};

/**
 * Set a value in storage
 */
export const setItem = async <T>(key: StorageKey, value: T): Promise<boolean> => {
  if (!key) throw new Error(ERRORS.INVALID_KEY);
  
  try {
    const stringValue = safeStringify(value);
    await AsyncStorage.setItem(StorageKeys[key], stringValue);
    return true;
  } catch (error) {
    console.error(`Error setting item ${key}:`, error);
    return false;
  }
};

/**
 * Remove an item from storage
 */
export const removeItem = async (key: StorageKey): Promise<boolean> => {
  if (!key) throw new Error(ERRORS.INVALID_KEY);
  
  try {
    await AsyncStorage.removeItem(StorageKeys[key]);
    return true;
  } catch (error) {
    console.error(`Error removing item ${key}:`, error);
    return false;
  }
};

/**
 * Clear all storage (use with caution!)
 */
export const clearAll = async (): Promise<boolean> => {
  try {
    await AsyncStorage.clear();
    // Re-initialize after clear
    await initializeStorage();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};

/**
 * Get multiple items from storage
 */
export const multiGet = async <T extends readonly StorageKey[]>(
  keys: T
): Promise<{ [K in T[number]]: unknown }> => {
  const storageKeys = keys.map((key) => StorageKeys[key]);
  const values = await AsyncStorage.multiGet(storageKeys);
  
  return keys.reduce((result, key, index) => {
    const [, value] = values[index] || [];
    return {
      ...result,
      [key]: safeParse(value),
    };
  }, {} as { [K in T[number]]: unknown });
};

/**
 * Set multiple items in storage
 */
export const multiSet = async (
  items: Array<{ key: StorageKey; value: unknown }>
): Promise<boolean> => {
  try {
    const keyValuePairs = items.map(({ key, value }) => [
      StorageKeys[key],
      safeStringify(value),
    ]);
    
    await AsyncStorage.multiSet(keyValuePairs);
    return true;
  } catch (error) {
    console.error('Error in multiSet:', error);
    return false;
  }
};

/**
 * Remove multiple items from storage
 */
export const multiRemove = async (keys: StorageKey[]): Promise<boolean> => {
  try {
    const storageKeys = keys.map((key) => StorageKeys[key]);
    await AsyncStorage.multiRemove(storageKeys);
    return true;
  } catch (error) {
    console.error('Error in multiRemove:', error);
    return false;
  }
};

/**
 * Get all keys from storage
 */
export const getAllKeys = async (): Promise<StorageKey[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    // Convert storage keys back to our typed keys
    return Object.entries(StorageKeys)
      .filter(([, value]) => keys.includes(value))
      .map(([key]) => key as StorageKey);
  } catch (error) {
    console.error('Error getting all keys:', error);
    return [];
  }
};

/**
 * Get all key-value pairs from storage
 */
export const getAllData = async <T = unknown>(): Promise<Record<string, T>> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);
    
    return items.reduce<Record<string, T>>((result, [key, value]) => {
      if (value !== null) {
        result[key] = safeParse<T>(value) as T;
      }
      return result;
    }, {});
  } catch (error) {
    console.error('Error getting all data:', error);
    return {};
  }
};

/**
 * Generate a unique ID for storage
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * Check if storage is available
 */
export const isStorageAvailable = async (): Promise<boolean> => {
  try {
    const testKey = '@test_' + Date.now();
    await AsyncStorage.setItem(testKey, 'test');
    await AsyncStorage.getItem(testKey);
    await AsyncStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.error('Storage is not available:', error);
    return false;
  }
};

/**
 * Get storage statistics
 */
export const getStorageStats = async (): Promise<{
  totalItems: number;
  totalSize: number;
}> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);
    
    const totalSize = items.reduce((size, [, value]) => {
      return size + (value ? value.length * 2 : 0); // Approximate size in bytes
    }, 0);
    
    return {
      totalItems: keys.length,
      totalSize, // Size in bytes
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { totalItems: 0, totalSize: 0 };
  }
};

/**
 * Migrate storage to the current version
 */
const migrateStorage = async (): Promise<boolean> => {
  try {
    // Check if migration is already complete
    const migrationComplete = await AsyncStorage.getItem(MIGRATION_FLAG);
    if (migrationComplete === 'true') {
      return true;
    }
    
    // Get current version
    const currentVersion = await AsyncStorage.getItem(VERSION_KEY);
    
    // If no version exists, this is a fresh install
    if (!currentVersion) {
      await AsyncStorage.setItem(VERSION_KEY, STORAGE_VERSION);
      await AsyncStorage.setItem(MIGRATION_FLAG, 'true');
      return true;
    }
    
    // Perform migrations based on version
    // Example:
    // if (currentVersion === '1.0.0') {
    //   // Migrate from 1.0.0 to 1.1.0
    //   // ...
    //   await AsyncStorage.setItem(VERSION_KEY, '1.1.0');
    // }
    
    // Update to current version
    await AsyncStorage.setItem(VERSION_KEY, STORAGE_VERSION);
    await AsyncStorage.setItem(MIGRATION_FLAG, 'true');
    return true;
  } catch (error) {
    console.error('Error during storage migration:', error);
    return false;
  }
};

/**
 * Initialize storage
 */
export const initializeStorage = async (): Promise<boolean> => {
  try {
    // Check if storage is available
    const available = await isStorageAvailable();
    if (!available) {
      throw new Error('Storage is not available');
    }
    
    // Run migrations
    const migrationSuccess = await migrateStorage();
    if (!migrationSuccess) {
      throw new Error(ERRORS.MIGRATION_FAILED);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};

// Initialize storage when this module is loaded
initializeStorage().catch((error) => {
  console.error('Failed to initialize storage:', error);
});

export default {
  // Basic operations
  getItem,
  setItem,
  removeItem,
  clearAll,
  
  // Batch operations
  multiGet,
  multiSet,
  multiRemove,
  
  // Utility functions
  getAllKeys,
  getAllData,
  generateId,
  isStorageAvailable,
  getStorageStats,
  
  // Initialization
  initializeStorage,
  
  // Constants
  StorageKeys,
  STORAGE_VERSION,
};
