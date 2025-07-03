// API configuration
export const apiConfig = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
};

export const payfastConfig = {
  merchantId: '30596897',
  merchantKey: 'ygodvejftqxd4',
  saltPassphrase: 'G4smeupalready',
  productionUrl: 'https://www.payfast.co.za/eng/process',
  sandboxUrl: 'https://sandbox.payfast.co.za/eng/process',
  useSandbox: false,
};

export function validateApiConfig() {
  const missing: string[] = [];
  if (!apiConfig.supabaseUrl) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!apiConfig.supabaseKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (!payfastConfig.merchantId) missing.push('PAYFAST_MERCHANT_ID');
  if (!payfastConfig.merchantKey) missing.push('PAYFAST_MERCHANT_KEY');
  if (!payfastConfig.saltPassphrase) missing.push('PAYFAST_SALT_PASSPHRASE');
  if (!payfastConfig.productionUrl) missing.push('PAYFAST_PRODUCTION_URL');
  if (!payfastConfig.sandboxUrl) missing.push('PAYFAST_SANDBOX_URL');
  if (missing.length > 0) {
    throw new Error(`Missing required environment/config variables: ${missing.join(', ')}`);
  }
} 