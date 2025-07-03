import { format, formatDistanceToNow, parseISO, differenceInDays, isToday, isYesterday, isThisYear } from 'date-fns';
import { t } from './i18n';

/**
 * Format a date string or Date object into a relative time string
 * (e.g., "2 hours ago", "3 days ago", "just now")
 */
export const formatRelativeTime = (date: Date | string | number): string => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date);
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

/**
 * Format a date string or Date object into a localized date string
 * (e.g., "Today at 2:30 PM", "Yesterday at 11:45 AM", "Jul 2, 2023")
 */
export const formatMessageTime = (date: Date | string | number): string => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date);
    const now = new Date();
    
    if (isToday(parsedDate)) {
      return t('time.todayAt', { time: format(parsedDate, 'h:mm a') });
    }
    
    if (isYesterday(parsedDate)) {
      return t('time.yesterdayAt', { time: format(parsedDate, 'h:mm a') });
    }
    
    if (differenceInDays(now, parsedDate) < 7) {
      return format(parsedDate, 'EEEE'); // Full day name (e.g., "Monday")
    }
    
    if (isThisYear(parsedDate)) {
      return format(parsedDate, 'MMM d'); // Month and day (e.g., "Jul 2")
    }
    
    return format(parsedDate, 'MMM d, yyyy'); // Full date (e.g., "Jul 2, 2023")
  } catch (error) {
    console.error('Error formatting message time:', error);
    return '';
  }
};

/**
 * Format a date string or Date object into a short date string
 * (e.g., "7/2/23", "12/31/23")
 */
export const formatShortDate = (date: Date | string | number): string => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date);
    return format(parsedDate, 'M/d/yy');
  } catch (error) {
    console.error('Error formatting short date:', error);
    return '';
  }
};

/**
 * Format a date string or Date object into a time string
 * (e.g., "2:30 PM", "11:45 AM")
 */
export const formatTime = (date: Date | string | number): string => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date);
    return format(parsedDate, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

/**
 * Format a date string or Date object into a full date and time string
 * (e.g., "July 2, 2023 at 2:30 PM")
 */
export const formatFullDateTime = (date: Date | string | number): string => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date);
    return t('time.fullDateTime', {
      date: format(parsedDate, 'MMMM d, yyyy'),
      time: format(parsedDate, 'h:mm a'),
    });
  } catch (error) {
    console.error('Error formatting full date time:', error);
    return '';
  }
};

/**
 * Calculate the difference between two dates in various units
 */
export const getDateDifference = (
  date1: Date | string | number,
  date2: Date | string | number = new Date(),
  unit: 'days' | 'hours' | 'minutes' | 'seconds' = 'days'
): number => {
  try {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : new Date(date1);
    const d2 = typeof date2 === 'string' ? parseISO(date2) : new Date(date2);
    
    const diffInMs = Math.abs(d1.getTime() - d2.getTime());
    
    switch (unit) {
      case 'days':
        return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      case 'hours':
        return Math.floor(diffInMs / (1000 * 60 * 60));
      case 'minutes':
        return Math.floor(diffInMs / (1000 * 60));
      case 'seconds':
        return Math.floor(diffInMs / 1000);
      default:
        return diffInMs;
    }
  } catch (error) {
    console.error('Error calculating date difference:', error);
    return 0;
  }
};

/**
 * Check if a date is within a certain time frame
 */
export const isWithinTimeFrame = (
  date: Date | string | number,
  timeframe: number,
  unit: 'days' | 'hours' | 'minutes' = 'days'
): boolean => {
  try {
    const now = new Date();
    const targetDate = typeof date === 'string' ? parseISO(date) : new Date(date);
    const diffInMs = now.getTime() - targetDate.getTime();
    
    let msInTimeframe: number;
    switch (unit) {
      case 'days':
        msInTimeframe = timeframe * 24 * 60 * 60 * 1000;
        break;
      case 'hours':
        msInTimeframe = timeframe * 60 * 60 * 1000;
        break;
      case 'minutes':
        msInTimeframe = timeframe * 60 * 1000;
        break;
      default:
        msInTimeframe = timeframe;
    }
    
    return diffInMs <= msInTimeframe;
  } catch (error) {
    console.error('Error checking if date is within timeframe:', error);
    return false;
  }
};

/**
 * Get the start of the day for a given date
 */
export const getStartOfDay = (date: Date | string | number = new Date()): Date => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  } catch (error) {
    console.error('Error getting start of day:', error);
    return new Date();
  }
};

/**
 * Get the end of the day for a given date
 */
export const getEndOfDay = (date: Date | string | number = new Date()): Date => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  } catch (error) {
    console.error('Error getting end of day:', error);
    return new Date();
  }
};

/**
 * Format a duration in milliseconds into a human-readable string
 * (e.g., "2h 30m", "1d 5h 10m", "30s")
 */
export const formatDuration = (ms: number): string => {
  try {
    if (ms < 0) return '0s';
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    const parts = [];
    
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 && days === 0) parts.push(`${seconds}s`);
    
    return parts.length > 0 ? parts.join(' ') : '0s';
  } catch (error) {
    console.error('Error formatting duration:', error);
    return '0s';
  }
};

/**
 * Get the current timestamp in ISO format
 */
export const getCurrentISOTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Parse an ISO timestamp and return a Date object
 */
export const parseISOTimestamp = (timestamp: string): Date => {
  return parseISO(timestamp);
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (date: Date | string | number): boolean => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    return d < new Date();
  } catch (error) {
    console.error('Error checking if date is in past:', error);
    return false;
  }
};

/**
 * Check if a date is in the future
 */
export const isFutureDate = (date: Date | string | number): boolean => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    return d > new Date();
  } catch (error) {
    console.error('Error checking if date is in future:', error);
    return false;
  }
};

export default {
  formatRelativeTime,
  formatMessageTime,
  formatShortDate,
  formatTime,
  formatFullDateTime,
  getDateDifference,
  isWithinTimeFrame,
  getStartOfDay,
  getEndOfDay,
  formatDuration,
  getCurrentISOTimestamp,
  parseISOTimestamp,
  isPastDate,
  isFutureDate,
};
