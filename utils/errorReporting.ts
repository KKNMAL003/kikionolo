// import * as Sentry from '@sentry/react-native';

// // Initialize Sentry (replace with your actual DSN)
// Sentry.init({
//   dsn: 'https://your-sentry-dsn@sentry.io/project-id',
//   tracesSampleRate: 1.0,
// });

export function reportError(error: Error, info?: any) {
  // Log to console
  console.error('Reported error:', error, info);
  // Send to Sentry
  // Sentry.captureException(error, { extra: info });
} 