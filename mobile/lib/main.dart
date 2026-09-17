import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app/config/app_config.dart';
import 'app/router.dart';
import 'app/theme/app_theme.dart';
import 'features/auth/presentation/auth_provider.dart';
import 'features/restaurants/presentation/restaurant_provider.dart';
import 'features/menu/presentation/menu_provider.dart';
import 'features/cart/presentation/cart_provider.dart';
import 'features/orders/presentation/orders_provider.dart';
import 'features/table_session/presentation/table_session_provider.dart';
import 'features/concierge/presentation/concierge_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase if live credentials provided
  if (AppConfig.isSupabaseConfigured) {
    try {
      await Supabase.initialize(
        url: AppConfig.supabaseUrl,
        anonKey: AppConfig.supabaseAnonKey,
      );
    } catch (e) {
      debugPrint('Supabase init warning: $e. Falling back to demo mode.');
    }
  }

  runApp(const RestaurantMobileApp());
}

class RestaurantMobileApp extends StatelessWidget {
  const RestaurantMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => RestaurantProvider()),
        ChangeNotifierProvider(create: (_) => MenuProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => OrdersProvider()),
        ChangeNotifierProvider(create: (_) => TableSessionProvider()),
        ChangeNotifierProvider(create: (_) => ConciergeProvider()),
      ],
      child: Builder(
        builder: (context) {
          final auth = context.watch<AuthProvider>();
          final router = createRouter(auth);

          return MaterialApp.router(
            title: AppConfig.appName,
            debugShowCheckedModeBanner: false,
            theme: AppTheme.darkTheme,
            routerConfig: router,
          );
        },
      ),
    );
  }
}
