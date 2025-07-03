import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import { Platform } from 'react-native';

// Import translations
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';

// Initialize i18n
const i18n = new I18n({
  en,
  fr,
  es,
});

// Set the default locale to device locale or fallback to English
const deviceLocale = Localization.locale;
const [languageCode] = deviceLocale.split('-');

i18n.defaultLocale = 'en';
i18n.locale = languageCode || 'en';

export const supportedLocales = ['en', 'fr', 'es'] as const;
export type SupportedLocale = typeof supportedLocales[number];

/**
 * Set the app's locale
 */
export const setLocale = (locale: string): void => {
  if (supportedLocales.includes(locale as SupportedLocale)) {
    i18n.locale = locale;
  } else {
    console.warn(`Locale '${locale}' is not supported. Falling back to default.`);
    i18n.locale = i18n.defaultLocale;
  }
};

/**
 * Get the current locale
 */
export const getCurrentLocale = (): string => {
  return i18n.locale;
};

/**
 * Get the device locale
 */
export const getDeviceLocale = (): string => {
  return deviceLocale;
};

/**
 * Get the list of supported locales
 */
export const getSupportedLocales = (): readonly string[] => {
  return supportedLocales;
};

/**
 * Check if a locale is supported
 */
export const isLocaleSupported = (locale: string): boolean => {
  return supportedLocales.includes(locale as SupportedLocale);
};

/**
 * Translate a string with variables
 */
export const t = (key: string, variables?: Record<string, any>): string => {
  return i18n.t(key, variables);
};

/**
 * Format a number according to locale
 */
export const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat(i18n.locale, options).format(number);
};

/**
 * Format a currency amount
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat(i18n.locale, {
    style: 'currency',
    currency,
    ...options,
  }).format(amount);
};

/**
 * Format a date according to locale
 */
export const formatDate = (
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Default options
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return dateObj.toLocaleDateString(i18n.locale, { ...defaultOptions, ...options });
};

/**
 * Format a time according to locale
 */
export const formatTime = (
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Default options
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  
  return dateObj.toLocaleTimeString(i18n.locale, { ...defaultOptions, ...options });
};

/**
 * Format a date and time according to locale
 */
export const formatDateTime = (
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string => {
  return `${formatDate(date, options)} ${formatTime(date, options)}`;
};

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (
  date: Date | string | number,
  unit: Intl.RelativeTimeFormatUnit = 'auto',
  options?: Intl.RelativeTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = dateObj.getTime() - now.getTime();
  
  // Convert milliseconds to the appropriate unit
  const units: Record<string, number> = {
    year: 1000 * 60 * 60 * 24 * 365,
    quarter: 1000 * 60 * 60 * 24 * 91,
    month: 1000 * 60 * 60 * 24 * 30,
    week: 1000 * 60 * 60 * 24 * 7,
    day: 1000 * 60 * 60 * 24,
    hour: 1000 * 60 * 60,
    minute: 1000 * 60,
    second: 1000,
  };
  
  // If unit is 'auto', determine the best unit
  let bestUnit = unit;
  let value = diffInMs;
  
  if (unit === 'auto') {
    const absDiff = Math.abs(diffInMs);
    
    if (absDiff >= units.year) {
      bestUnit = 'year';
      value = Math.round(diffInMs / units.year);
    } else if (absDiff >= units.month) {
      bestUnit = 'month';
      value = Math.round(diffInMs / units.month);
    } else if (absDiff >= units.week) {
      bestUnit = 'week';
      value = Math.round(diffInMs / units.week);
    } else if (absDiff >= units.day) {
      bestUnit = 'day';
      value = Math.round(diffInMs / units.day);
    } else if (absDiff >= units.hour) {
      bestUnit = 'hour';
      value = Math.round(diffInMs / units.hour);
    } else if (absDiff >= units.minute) {
      bestUnit = 'minute';
      value = Math.round(diffInMs / units.minute);
    } else {
      bestUnit = 'second';
      value = Math.round(diffInMs / units.second);
    }
  } else if (units[bestUnit]) {
    value = Math.round(diffInMs / units[bestUnit]);
  }
  
  // Format the relative time
  const formatter = new Intl.RelativeTimeFormat(i18n.locale, {
    numeric: 'auto',
    ...options,
  });
  
  return formatter.format(value, bestUnit as Intl.RelativeTimeFormatUnit);
};

/**
 * Format a duration in milliseconds
 */
export const formatDuration = (
  ms: number,
  options: {
    format?: 'short' | 'long';
    units?: ('year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second')[];
  } = {}
): string => {
  const { format = 'short', units = ['hour', 'minute', 'second'] } = options;
  
  const timeUnits = {
    year: 1000 * 60 * 60 * 24 * 365,
    month: 1000 * 60 * 60 * 24 * 30,
    week: 1000 * 60 * 60 * 24 * 7,
    day: 1000 * 60 * 60 * 24,
    hour: 1000 * 60 * 60,
    minute: 1000 * 60,
    second: 1000,
  };
  
  const parts: string[] = [];
  let remaining = Math.abs(ms);
  
  for (const unit of units) {
    const value = Math.floor(remaining / timeUnits[unit]);
    if (value > 0 || parts.length > 0) {
      const unitKey = format === 'short' 
        ? unit[0] 
        : value === 1 ? unit : `${unit}s`;
      
      parts.push(`${value}${format === 'short' ? '' : ' '}${unitKey}`);
      remaining %= timeUnits[unit];
      
      if (format === 'short' && parts.length >= 2) break;
    }
  }
  
  if (parts.length === 0) {
    return format === 'short' ? '0s' : '0 seconds';
  }
  
  return parts.slice(0, 2).join(format === 'short' ? ' ' : ', ');
};

/**
 * Detect the user's preferred language
 */
export const detectLanguage = (): string => {
  return Localization.locale;
};

/**
 * Get the current language direction (ltr or rtl)
 */
export const getTextDirection = (): 'ltr' | 'rtl' => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'ps', 'ku'];
  const lang = i18n.locale.split('-')[0];
  return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
};

/**
 * Check if the current language is RTL
 */
export const isRTL = (): boolean => {
  return getTextDirection() === 'rtl';
};

/**
 * Get the current language name in the native language
 */
export const getLanguageName = (locale: string = i18n.locale): string => {
  const displayNames = new Intl.DisplayNames([locale], { type: 'language' });
  return displayNames.of(locale) || locale;
};

// Export the i18n instance
export default i18n;
