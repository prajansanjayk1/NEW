class AppConfig {
  static const String appName = 'Kings of Wings';
  static const String appVersion = '1.0.0';

  // Supabase Configuration
  // Default to public environment variables, seamlessly matching web app
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://placeholder-project.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'placeholder-anon-key',
  );

  // Multi-tenant Defaults
  static const String defaultRestaurantSlug = 'kings-of-wings';
  static const String defaultRestaurantId = 'rest-kow-blr-01';

  // Razorpay Gateway Client Configuration (PUBLIC Key only - secrets never client-side)
  static const String razorpayKeyId = String.fromEnvironment(
    'RAZORPAY_KEY_ID',
    defaultValue: 'rzp_test_placeholder_key',
  );

  // Backend API Proxy Endpoint (if web backend proxy is running)
  static const String backendApiUrl = String.fromEnvironment(
    'BACKEND_API_URL',
    defaultValue: 'http://localhost:3000',
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
