import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../restaurants/presentation/restaurant_provider.dart';
import '../../orders/presentation/orders_provider.dart';

class ManagerDashboardScreen extends StatelessWidget {
  const ManagerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final rest = context.watch<RestaurantProvider>();
    final orders = context.watch<OrdersProvider>();

    final totalRev = orders.orders.fold(0.0, (s, o) => s + o.totalAmount);
    final takeawayCount = orders.takeawayOrders.length;
    final dineInCount = orders.dineInOrders.length;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Executive Dashboard'),
            Text(
              rest.activeRestaurant?.branch ?? 'Store Branch',
              style: const TextStyle(fontSize: 11, color: AppColors.textTertiary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.package),
            tooltip: 'Live Stock & Inventory',
            onPressed: () => context.push('/inventory'),
          ),
          IconButton(
            icon: const Icon(LucideIcons.qrCode),
            tooltip: 'QR Generator',
            onPressed: () => context.push('/qr-manager'),
          ),
          IconButton(
            icon: const Icon(LucideIcons.logOut),
            onPressed: () async {
              await auth.signOut();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Branch Switcher dropdown
          Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: Row(
                children: [
                  const Icon(LucideIcons.store, color: AppColors.primary, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: rest.activeRestaurant?.id,
                        dropdownColor: AppColors.surfaceElevated,
                        items: rest.availableRestaurants.map((r) {
                          return DropdownMenuItem(
                            value: r.id,
                            child: Text('${r.name} - ${r.branch}', style: const TextStyle(fontSize: 13)),
                          );
                        }).toList(),
                        onChanged: (id) {
                          if (id != null) {
                            final found = rest.availableRestaurants.firstWhere((r) => r.id == id);
                            rest.switchRestaurant(found);
                          }
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // High-level KPI grid
          Row(
            children: [
              Expanded(
                child: _metricCard('Today Revenue', '₹${totalRev.toStringAsFixed(0)}', LucideIcons.indianRupee, AppColors.success),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _metricCard('Total Tickets', '${orders.orders.length}', LucideIcons.receipt, AppColors.primary),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _metricCard('Takeaway Share', '$takeawayCount (${orders.orders.isEmpty ? 0 : ((takeawayCount / orders.orders.length) * 100).toInt()}%)', LucideIcons.shoppingBag, AppColors.secondary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _metricCard('Dine-In Tables', '$dineInCount active', LucideIcons.utensils, AppColors.info),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Operational Navigation Links
          Text('STORE CAPABILITIES & MODES', style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 12),

          _actionListTile(
            title: 'Inventory & Procurement Tracker',
            subtitle: 'Ingredient stock, reorder warnings & batch receipts',
            icon: LucideIcons.package,
            onTap: () => context.push('/inventory'),
          ),
          _actionListTile(
            title: 'Dynamic QR Code Generator',
            subtitle: 'Print high-resolution table cards and counter badges',
            icon: LucideIcons.qrCode,
            onTap: () => context.push('/qr-manager'),
          ),
          _actionListTile(
            title: 'Live Kitchen Display (KDS)',
            subtitle: 'Realtime bump screen for prep stations',
            icon: LucideIcons.chefHat,
            onTap: () => context.push('/kds'),
          ),
          _actionListTile(
            title: 'Staff Floor Map',
            subtitle: 'Table occupancy, waiter calls and bills',
            icon: LucideIcons.layoutGrid,
            onTap: () => context.push('/staff'),
          ),
        ],
      ),
    );
  }

  Widget _metricCard(String label, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 10),
            Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
          ],
        ),
      ),
    );
  }

  Widget _actionListTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        trailing: const Icon(LucideIcons.chevronRight, size: 18, color: AppColors.textTertiary),
        onTap: onTap,
      ),
    );
  }
}
