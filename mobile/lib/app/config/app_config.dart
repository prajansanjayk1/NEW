class AppConfig {
  static const String appName = 'Kings of Wings';
  static const String appVersion = '1.0.0';

  // Supabase Configuration
  // Configured with live Supabase cloud instance
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://jgeiqbtphyxijxogcjty.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'sb_publishable_1Pfb6bnwn03cb4AeDukq6w_KoVBhw2K',
  );

  // Multi-tenant Defaults
  static const String defaultRestaurantSlug = 'kings-of-wings';
  static const String defaultRestaurantId = 'rest-kow-blr-01';

  // Razorpay Gateway Client Configuration (PUBLIC Key only - secrets never client-side)
  static const String razorpayKeyId = String.fromEnvironment(
    'RAZORPAY_KEY_ID',
    defaultValue: 'rzp_test_SANDBOX_DEMO',
  );

  // Backend API Proxy Endpoint (if web backend proxy is running)
  static const String backendApiUrl = String.fromEnvironment(
    'BACKEND_API_URL',
    defaultValue: 'http://localhost:3050',
  );

  // Deep Link Schemes
  static const String schemeRestaurant = 'restaurant';
  static const String hostTable = 'table';
  static const String hostTakeaway = 'takeaway';
  static const String hostOrder = 'order';

  static bool get isSupabaseConfigured {
    return !supabaseUrl.contains('placeholder') &&
        !supabaseAnonKey.contains('placeholder') &&
        supabaseUrl.startsWith('http');
  }
}
