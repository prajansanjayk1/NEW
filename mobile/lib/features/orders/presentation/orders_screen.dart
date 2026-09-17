import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';
import '../orders_provider.dart';
import '../domain/order_model.dart';
import '../../menu/domain/menu_item_model.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ordersProv = context.watch<OrdersProvider>();

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Live Orders & History'),
          bottom: const TabBar(
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textTertiary,
            tabs: [
              Tab(text: 'All Orders'),
              Tab(text: '🥡 Takeaway'),
              Tab(text: '🍽 Dine-In'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _ordersList(context, ordersProv.orders),
            _ordersList(context, ordersProv.takeawayOrders),
            _ordersList(context, ordersProv.dineInOrders),
          ],
        ),
      ),
    );
  }

  Widget _ordersList(BuildContext context, List<OrderModel> list) {
    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.receipt, size: 48, color: AppColors.textTertiary),
            const SizedBox(height: 12),
            const Text('No orders found', style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/home'),
              child: const Text('START AN ORDER'),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final order = list[index];
        final isTakeaway = order.channel == SalesChannel.takeaway;

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Text(
                          order.ticketNumber,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: isTakeaway ? AppColors.takeawayBadgeBg : AppColors.dineInBadgeBg,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            isTakeaway ? '🥡 TAKEAWAY' : '🍽 TABLE ${order.tableNumber ?? ""}',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: isTakeaway ? AppColors.takeawayBadgeText : AppColors.dineInBadgeText,
                            ),
                          ),
                        ),
                      ],
                    ),
                    _statusBadge(order.status),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Customer: ${order.customerName ?? "Guest"}${order.targetPickupTime != null ? " • Pickup: ${order.targetPickupTime}" : ""}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
                const Divider(height: 18),
                ...order.items.map((it) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('${it.quantity}x ${it.name}', style: const TextStyle(fontSize: 13)),
                          Text('₹${(it.unitPrice * it.quantity).toStringAsFixed(0)}', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                        ],
                      ),
                    )),
                const Divider(height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total Amount', style: TextStyle(fontWeight: FontWeight.bold)),
                    Text(
                      '₹${order.totalAmount.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _statusBadge(OrderStatus status) {
    Color bg;
    Color fg;

    switch (status) {
      case OrderStatus.ready:
      case OrderStatus.pickedUp:
      case OrderStatus.delivered:
        bg = AppColors.success.withOpacity(0.15);
        fg = AppColors.success;
        break;
      case OrderStatus.preparing:
        bg = AppColors.warning.withOpacity(0.15);
        fg = AppColors.warning;
        break;
      case OrderStatus.confirmed:
        bg = AppColors.info.withOpacity(0.15);
        fg = AppColors.info;
        break;
      case OrderStatus.received:
      default:
        bg = AppColors.surfaceElevated;
        fg = AppColors.textTertiary;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Text(
        status.label,
        style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.bold),
      ),
    );
  }
}
