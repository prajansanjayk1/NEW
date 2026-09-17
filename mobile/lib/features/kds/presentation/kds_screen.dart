import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../orders/presentation/orders_provider.dart';
import '../../orders/domain/order_model.dart';
import '../../menu/domain/menu_item_model.dart';

class KdsScreen extends StatelessWidget {
  const KdsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final orders = context.watch<OrdersProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(LucideIcons.chefHat, color: AppColors.primary),
            const SizedBox(width: 10),
            Text('Kitchen Display System (KDS)'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw),
            onPressed: () => orders.fetchLiveOrders(),
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
      body: orders.orders.isEmpty
          ? const Center(
              child: Text('All tickets cleared! Great job Chef.', style: TextStyle(color: AppColors.textTertiary)),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: orders.orders.length,
              itemBuilder: (context, index) {
                final order = orders.orders[index];
                final isTakeaway = order.channel == SalesChannel.takeaway;

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    side: BorderSide(
                      color: isTakeaway ? AppColors.secondary : AppColors.primary,
                      width: 1.5,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Ticket Header with High Contrast Channel Badges
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              order.ticketNumber,
                              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: isTakeaway ? AppColors.secondary : AppColors.primary,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                isTakeaway ? '🥡 TAKEAWAY' : '🍽 TABLE ${order.tableNumber ?? "07"}',
                                style: const TextStyle(
                                  color: Colors.black,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Order Time: ${order.createdAt.hour}:${order.createdAt.minute.toString().padLeft(2, '0')}',
                          style: const TextStyle(fontSize: 12, color: AppColors.textTertiary),
                        ),
                        const Divider(height: 20),

                        // Ticket Items
                        ...order.items.map((it) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 28,
                                    height: 28,
                                    decoration: BoxDecoration(
                                      color: AppColors.surfaceElevated,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      '${it.quantity}',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          it.name,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                        ),
                                        if (it.customization != null)
                                          Text(
                                            it.customization!,
                                            style: const TextStyle(color: AppColors.secondary, fontSize: 12),
                                          ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            )),

                        const Divider(height: 24),

                        // Station Bump Controls
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            if (order.status == OrderStatus.received)
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.warning),
                                icon: const Icon(LucideIcons.flame, size: 16),
                                label: const Text('START COOKING'),
                                onPressed: () => orders.updateOrderStatus(order.id, OrderStatus.preparing),
                              )
                            else if (order.status == OrderStatus.preparing)
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
                                icon: const Icon(LucideIcons.check, size: 16),
                                label: const Text('BUMP TO READY / EXPEDITE'),
                                onPressed: () => orders.updateOrderStatus(order.id, OrderStatus.ready),
                              )
                            else
                              const Text('Ticket Ready & Bumped', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
