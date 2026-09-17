import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/auth_provider.dart';
import '../../features/auth/domain/user_model.dart';
import '../../features/onboarding/presentation/splash_screen.dart';
import '../../features/onboarding/presentation/customer_home_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/staff/presentation/staff_shell_screen.dart';
import '../../features/kds/presentation/kds_screen.dart';
import '../../features/manager/presentation/manager_dashboard_screen.dart';
import '../../features/takeaway/presentation/takeaway_screen.dart';
import '../../features/cart/presentation/cart_screen.dart';
import '../../features/orders/presentation/orders_screen.dart';
import '../../features/qr/presentation/qr_scanner_screen.dart';
import '../../features/qr/presentation/qr_manager_screen.dart';
import '../../features/nfc/presentation/nfc_screen.dart';
import '../../features/inventory/presentation/inventory_screen.dart';
import '../../features/concierge/presentation/concierge_screen.dart';

GoRouter createRouter(AuthProvider authProvider) {
  return GoRouter(
    initialLocation: '/',
    refreshListenable: authProvider,
    redirect: (context, state) {
      final isAuthenticated = authProvider.isAuthenticated;
      final isAuthRoute = state.uri.path == '/login';
      final isSplash = state.uri.path == '/';

      if (isSplash) return null;

      if (!isAuthenticated && !isAuthRoute) {
        return '/login';
      }

      if (isAuthenticated && isAuthRoute) {
        final role = authProvider.currentUser?.role ?? UserRole.customer;
        switch (role) {
          case UserRole.staff:
            return '/staff';
          case UserRole.kitchen:
            return '/kds';
          case UserRole.manager:
          case UserRole.admin:
          case UserRole.owner:
            return '/manager';
          case UserRole.customer:
          default:
            return '/home';
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const CustomerHomeScreen(),
      ),
      GoRoute(
        path: '/takeaway',
        builder: (context, state) => const TakeawayScreen(),
      ),
      GoRoute(
        path: '/cart',
        builder: (context, state) => const CartScreen(),
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersScreen(),
      ),
      GoRoute(
        path: '/scan-qr',
        builder: (context, state) => const QrScannerScreen(),
      ),
      GoRoute(
        path: '/qr-manager',
        builder: (context, state) => const QrManagerScreen(),
      ),
      GoRoute(
        path: '/nfc',
        builder: (context, state) => const NfcScreen(),
      ),
      GoRoute(
        path: '/concierge',
        builder: (context, state) => const ConciergeScreen(),
      ),
      GoRoute(
        path: '/staff',
        builder: (context, state) => const StaffShellScreen(),
      ),
      GoRoute(
        path: '/kds',
        builder: (context, state) => const KdsScreen(),
      ),
      GoRoute(
        path: '/manager',
        builder: (context, state) => const ManagerDashboardScreen(),
      ),
      GoRoute(
        path: '/inventory',
        builder: (context, state) => const InventoryScreen(),
      ),
    ],
  );
}
