import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../orders/presentation/orders_provider.dart';
import '../../orders/domain/order_model.dart';
import '../../menu/domain/menu_item_model.dart';

class StaffShellScreen extends StatefulWidget {
  const StaffShellScreen({super.key});

  @override
  State<StaffShellScreen> createState() => _StaffShellScreenState();
}

class _StaffShellScreenState extends State<StaffShellScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final orders = context.watch<OrdersProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Floor & Counter Operations'),
            Text(
              'Staff: ${auth.currentUser?.fullName ?? "Waiter"}',
              style: const TextStyle(fontSize: 11, color: AppColors.textTertiary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.qrCode),
            tooltip: 'QR Manager',
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
      body: _currentIndex == 0
          ? _takeawayQueueView(orders)
          : _tableFloorView(orders),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.shoppingBag),
            label: 'Takeaway Counter',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.layoutGrid),
            label: 'Table Floor Map',
          ),
        ],
      ),
    );
  }

  Widget _takeawayQueueView(OrdersProvider orders) {
    final list = orders.takeawayOrders;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('EXPRESS PICKUP QUEUE', style: Theme.of(context).textTheme.labelSmall),
            Text('${list.length} orders', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          ],
        ),
        const SizedBox(height: 12),
        if (list.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(32.0),
              child: Text('No active takeaway pickups right now.', style: TextStyle(color: AppColors.textTertiary)),
            ),
          )
        else
          ...list.map((order) => Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            order.ticketNumber,
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.secondary),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceElevated,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              order.status.label,
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${order.customerName ?? "Customer"} • ${order.customerPhone ?? ""}',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      Text(
                        'Target Pickup: ${order.targetPickupTime ?? "ASAP"}',
                        style: const TextStyle(fontSize: 12, color: AppColors.textTertiary),
                      ),
                      const Divider(height: 16),
                      ...order.items.map((it) => Text('• ${it.quantity}x ${it.name}', style: const TextStyle(fontSize: 12))),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          if (order.status == OrderStatus.ready)
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
                              icon: const Icon(LucideIcons.checkCheck, size: 16),
                              label: const Text('MARK HANDED TO GUEST', style: TextStyle(fontSize: 11)),
                              onPressed: () => orders.updateOrderStatus(order.id, OrderStatus.pickedUp),
                            )
                          else if (order.status == OrderStatus.preparing)
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(backgroundColor: AppColors.secondary),
                              icon: const Icon(LucideIcons.bell, size: 16),
                              label: const Text('NOTIFY READY FOR PICKUP', style: TextStyle(fontSize: 11)),
                              onPressed: () => orders.updateOrderStatus(order.id, OrderStatus.ready),
                            )
                          else
                            const Text('Processing in kitchen...', style: TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                        ],
                      ),
                    ],
                  ),
                ),
              )),
      ],
    );
  }

  Widget _tableFloorView(OrdersProvider orders) {
    // 6 sample tables on floor
    final tables = [
      {'num': '01', 'status': 'OCCUPIED', 'guests': 4, 'total': '₹1,240'},
      {'num': '02', 'status': 'AVAILABLE', 'guests': 0, 'total': '₹0'},
      {'num': '03', 'status': 'BILL_REQUESTED', 'guests': 2, 'total': '₹850'},
      {'num': '04', 'status': 'ORDERING', 'guests': 3, 'total': '₹0'},
      {'num': '05', 'status': 'AVAILABLE', 'guests': 0, 'total': '₹0'},
      {'num': '06', 'status': 'OCCUPIED', 'guests': 6, 'total': '₹2,480'},
    ];

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.1,
      ),
      itemCount: tables.length,
      itemBuilder: (context, index) {
        final tbl = tables[index];
        final isAvail = tbl['status'] == 'AVAILABLE';
        final isBill = tbl['status'] == 'BILL_REQUESTED';

        return Card(
          color: isBill
              ? AppColors.primary.withOpacity(0.15)
              : isAvail
                  ? AppColors.surfaceCard
                  : AppColors.surfaceElevated,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'TABLE ${tbl['num']}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isAvail
                            ? AppColors.success
                            : isBill
                                ? AppColors.accent
                                : AppColors.secondary,
                      ),
                    ),
                  ],
                ),
                Text(
                  '${tbl['status']}',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isBill ? AppColors.accent : AppColors.textTertiary,
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('${tbl['guests']} guests', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    Text('${tbl['total']}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
