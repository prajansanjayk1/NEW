/**
 * Centralized Production Feature Flags Configuration
 * 
 * Provides runtime toggles for platform modules with graceful fallbacks.
 * Enables zero-downtime feature control, staged rollouts, and degradation isolation.
 */

export interface FeatureFlags {
  AI_ENABLED: boolean;
  PAYMENTS_ENABLED: boolean;
  INVENTORY_ENABLED: boolean;
  FORECASTING_ENABLED: boolean;
  MULTI_LOCATION_ENABLED: boolean;
  SUBSCRIPTIONS_ENABLED: boolean;
  DEMO_MODE_FALLBACK: boolean;
  REALTIME_ENABLED: boolean;
  AUDIT_LOGGING_ENABLED: boolean;
  RATE_LIMITING_ENABLED: boolean;
}

const getEnvBool = (key: string, defaultValue: boolean): boolean => {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
  const val = env[key];
  if (val === undefined || val === '') return defaultValue;
  return val === 'true' || val === '1';
};

export const FEATURE_FLAGS: FeatureFlags = {
  // Generative AI modules (Wing Concierge & Staff Copilot)
  AI_ENABLED: getEnvBool('VITE_FEATURE_AI', true),

  // Razorpay live checkout and digital payments
  PAYMENTS_ENABLED: getEnvBool('VITE_FEATURE_PAYMENTS', true),

  // Stock tracking, recipes, wastage, and supplier purchase orders
  INVENTORY_ENABLED: getEnvBool('VITE_FEATURE_INVENTORY', true),

  // Predictive demand forecasting and peak hour modeling
  FORECASTING_ENABLED: getEnvBool('VITE_FEATURE_FORECASTING', true),

  // Multi-branch restaurant switching and chain organizations
  MULTI_LOCATION_ENABLED: getEnvBool('VITE_FEATURE_MULTI_TENANT', true),

  // Tiered SaaS subscription limits & entitlement enforcement
  SUBSCRIPTIONS_ENABLED: true,

  // Offline deterministic demo session fallback when cloud credentials are unconfigured
  DEMO_MODE_FALLBACK: true,

  // Supabase real-time broadcast and postgres_changes
  REALTIME_ENABLED: true,

  // System security audit logging
  AUDIT_LOGGING_ENABLED: true,

  // API rate limiting & throttling
  RATE_LIMITING_ENABLED: true,
};

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return FEATURE_FLAGS[flag] ?? false;
}
