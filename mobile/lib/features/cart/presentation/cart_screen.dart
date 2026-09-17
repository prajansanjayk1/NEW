import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';
import '../cart_provider.dart';
import '../../menu/domain/menu_item_model.dart';
import '../../table_session/presentation/table_session_provider.dart';
import '../../orders/presentation/orders_provider.dart';
import '../../restaurants/presentation/restaurant_provider.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final table = context.watch<TableSessionProvider>();
    final rest = context.watch<RestaurantProvider>();
    final orders = context.watch<OrdersProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('${cart.activeCartChannel.label} Cart'),
        actions: [
          if (cart.items.isNotEmpty)
            IconButton(
              icon: const Icon(LucideIcons.trash2),
              tooltip: 'Clear Cart',
              onPressed: () => cart.clearCart(),
            ),
        ],
      ),
      body: cart.items.isEmpty
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(LucideIcons.shoppingBag, size: 56, color: AppColors.textTertiary),
                  const SizedBox(height: 16),
                  Text('Your cart is empty', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  const Text('Discover crisp wings, combos and drinks', style: TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => context.go('/home'),
                    child: const Text('EXPLORE MENU'),
                  ),
                ],
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Channel Badge Warning
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: cart.activeCartChannel == SalesChannel.takeaway
                        ? AppColors.takeawayBadgeBg
                        : AppColors.dineInBadgeBg,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        cart.activeCartChannel == SalesChannel.takeaway
                            ? LucideIcons.shoppingBag
                            : LucideIcons.utensils,
                        color: cart.activeCartChannel == SalesChannel.takeaway
                            ? AppColors.takeawayBadgeText
                            : AppColors.dineInBadgeText,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        cart.activeCartChannel == SalesChannel.takeaway
                            ? 'Takeaway Mode Active • Thermal packaging added'
                            : 'Dine-In Mode Active • Direct to Table Kitchen',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: cart.activeCartChannel == SalesChannel.takeaway
                              ? AppColors.takeawayBadgeText
                              : AppColors.dineInBadgeText,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                ...cart.items.map((ci) => Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    ci.item.name,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${ci.customization.portionSize} • ${ci.customization.heatLevel} • ${ci.customization.dip}',
                                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    '₹${ci.unitPrice.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(LucideIcons.minusCircle, size: 20),
                                  onPressed: () => cart.updateQuantity(ci.id, -1),
                                ),
                                Text('${ci.quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                IconButton(
                                  icon: const Icon(LucideIcons.plusCircle, size: 20),
                                  onPressed: () => cart.updateQuantity(ci.id, 1),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    )),

                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _costRow('Subtotal', '₹${cart.subtotal.toStringAsFixed(2)}'),
                        if (cart.activeCartChannel == SalesChannel.takeaway) ...[
                          const SizedBox(height: 6),
                          _costRow('Packaging Charges', '₹${cart.totalPackagingFee.toStringAsFixed(2)}'),
                        ],
                        const SizedBox(height: 6),
                        _costRow('GST (5%)', '₹${cart.gstTax.toStringAsFixed(2)}'),
                        const Divider(height: 20),
                        _costRow('Total Pay', '₹${cart.grandTotal.toStringAsFixed(2)}', isBold: true),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                ElevatedButton(
                  onPressed: () async {
                    if (cart.activeCartChannel == SalesChannel.takeaway) {
                      context.push('/takeaway');
                    } else {
                      // Submit Dine-in table order
                      final order = await orders.placeOrder(
                        cartItems: cart.items,
                        channel: SalesChannel.dineIn,
                        subtotal: cart.subtotal,
                        packagingFee: 0.0,
                        tax: cart.gstTax,
                        totalAmount: cart.grandTotal,
                        tableNumber: table.tableNumber ?? '07',
                        customerName: table.hostName ?? 'Table Guest',
                        restaurantId: rest.activeRestaurant?.id ?? 'rest-kow-blr-01',
                      );
                      cart.clearCart();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Order ${order?.ticketNumber} sent to kitchen!'),
                            backgroundColor: AppColors.success,
                          ),
                        );
                        context.go('/orders');
                      }
                    }
                  },
                  child: Text(
                    cart.activeCartChannel == SalesChannel.takeaway
                        ? 'PROCEED TO PICKUP DETAILS'
                        : 'SEND ORDER TO KITCHEN',
                  ),
                ),
              ],
            ),
    );
  }

  Widget _costRow(String label, String val, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isBold ? AppColors.textPrimary : AppColors.textSecondary,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            fontSize: isBold ? 15 : 13,
          ),
        ),
        Text(
          val,
          style: TextStyle(
            color: isBold ? AppColors.primary : AppColors.textPrimary,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            fontSize: isBold ? 16 : 13,
          ),
        ),
      ],
    );
  }
}
