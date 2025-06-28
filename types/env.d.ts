declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_MAPBOX_TOKEN: string;
      EXPO_PUBLIC_RESEND_API_KEY: string;
      EXPO_PUBLIC_PAYPAL_CLIENT_ID: string;
      EXPO_PUBLIC_PAYPAL_SECRET: string;
    }
  }
}

// Ensure this file is treated as a module
export {};