import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';
import '../../cart/presentation/cart_provider.dart';
import '../../menu/presentation/menu_provider.dart';
import '../../menu/domain/menu_item_model.dart';
import '../../orders/presentation/orders_provider.dart';
import '../../restaurants/presentation/restaurant_provider.dart';

class TakeawayScreen extends StatefulWidget {
  const TakeawayScreen({super.key});

  @override
  State<TakeawayScreen> createState() => _TakeawayScreenState();
}

class _TakeawayScreenState extends State<TakeawayScreen> {
  final _customerNameCtrl = TextEditingController(text: 'Ananya Sharma');
  final _customerPhoneCtrl = TextEditingController(text: '+91 98450 12345');
  String _pickupTiming = 'ASAP (~15 mins)';
  bool _includeCutlery = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MenuProvider>().setChannel(SalesChannel.takeaway);
    });
  }

  @override
  void dispose() {
    _customerNameCtrl.dispose();
    _customerPhoneCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final rest = context.watch<RestaurantProvider>();
    final orders = context.watch<OrdersProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Express Takeaway & Pickup'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.qrCode),
            tooltip: 'Takeaway Pickup Counter QR',
            onPressed: () => context.push('/scan-qr'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Thermal Packaging Banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.secondary.withOpacity(0.12),
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(color: AppColors.secondary.withOpacity(0.3)),
              ),
              child: const Row(
                children: [
                  Icon(LucideIcons.packageCheck, color: AppColors.secondary, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Thermal Moisture-Vented Packaging',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: AppColors.secondary,
                          ),
                        ),
                        Text(
                          'Sauces sealed separately. Keeps crispy skin hot & crunchy for 35 mins.',
                          style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Pickup Details Form
            Text('PICKUP CONTACT & TIMING', style: Theme.of(context).textTheme.labelSmall),
            const SizedBox(height: 10),
            TextField(
              controller: _customerNameCtrl,
              decoration: const InputDecoration(
                labelText: 'Recipient Name',
                prefixIcon: Icon(LucideIcons.user, size: 20),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _customerPhoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Mobile Number for Pickup SMS',
                prefixIcon: Icon(LucideIcons.phone, size: 20),
              ),
            ),
            const SizedBox(height: 12),

            DropdownButtonFormField<String>(
              value: _pickupTiming,
              decoration: const InputDecoration(
                labelText: 'Estimated Pickup Time',
                prefixIcon: Icon(LucideIcons.clock, size: 20),
              ),
              items: const [
                DropdownMenuItem(value: 'ASAP (~15 mins)', child: Text('ASAP (~15 mins)')),
                DropdownMenuItem(value: 'In 30 mins', child: Text('In 30 mins')),
                DropdownMenuItem(value: 'In 45 mins', child: Text('In 45 mins')),
                DropdownMenuItem(value: 'In 1 hour', child: Text('In 1 hour')),
              ],
              onChanged: (val) => setState(() => _pickupTiming = val ?? _pickupTiming),
            ),
            const SizedBox(height: 12),

            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Include biodegradable cutlery & wet napkins', style: TextStyle(fontSize: 13)),
              value: _includeCutlery,
              onChanged: (val) => setState(() => _includeCutlery = val),
            ),
            const SizedBox(height: 24),

            // Cart Summary Box
            Text('TAKEAWAY ITEMS (${cart.totalItemCount})', style: Theme.of(context).textTheme.labelSmall),
            const SizedBox(height: 10),

            if (cart.items.isEmpty)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 32),
                alignment: Alignment.center,
                child: Column(
                  children: [
                    const Icon(LucideIcons.shoppingBag, size: 48, color: AppColors.textTertiary),
                    const SizedBox(height: 12),
                    const Text('Your takeaway bag is empty', style: TextStyle(color: AppColors.textSecondary)),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => context.go('/home'),
                      child: const Text('EXPLORE TAKEAWAY MENU'),
                    ),
                  ],
                ),
              )
            else ...[
              ...cart.items.map((ci) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(ci.item.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                Text(
                                  '₹${ci.unitPrice.toStringAsFixed(0)} each • +₹${ci.item.packagingCharge.toInt()} packaging',
                                  style: const TextStyle(fontSize: 12, color: AppColors.textTertiary),
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

              // Fee Breakdown
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _summaryRow('Item Subtotal', '₹${cart.subtotal.toStringAsFixed(2)}'),
                      const SizedBox(height: 6),
                      _summaryRow('Thermal Packaging Fee', '₹${cart.totalPackagingFee.toStringAsFixed(2)}'),
                      const SizedBox(height: 6),
                      _summaryRow('GST (5%)', '₹${cart.gstTax.toStringAsFixed(2)}'),
                      const Divider(height: 20),
                      _summaryRow('Grand Total', '₹${cart.grandTotal.toStringAsFixed(2)}', isBold: true),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              ElevatedButton.icon(
                icon: const Icon(LucideIcons.checkCheck),
                label: const Text('CONFIRM & PAY AT PICKUP COUNTER'),
                onPressed: () async {
                  final newOrder = await orders.placeOrder(
                    cartItems: cart.items,
                    channel: SalesChannel.takeaway,
                    subtotal: cart.subtotal,
                    packagingFee: cart.totalPackagingFee,
                    tax: cart.gstTax,
                    totalAmount: cart.grandTotal,
                    customerName: _customerNameCtrl.text.trim(),
                    customerPhone: _customerPhoneCtrl.text.trim(),
                    targetPickupTime: _pickupTiming,
                    restaurantId: rest.activeRestaurant?.id ?? 'rest-kow-blr-01',
                  );

                  cart.clearCart();

                  if (context.mounted) {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        backgroundColor: AppColors.surfaceElevated,
                        title: Row(
                          children: [
                            const Icon(LucideIcons.checkCircle, color: AppColors.success),
                            const SizedBox(width: 10),
                            const Text('Order Confirmed!'),
                          ],
                        ),
                        content: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Pickup Ticket: ${newOrder?.ticketNumber ?? "#T201"}',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppColors.secondary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text('Estimated ready in: $_pickupTiming'),
                            const SizedBox(height: 4),
                            const Text('Show this ticket at the express takeaway counter.'),
                          ],
                        ),
                        actions: [
                          ElevatedButton(
                            onPressed: () {
                              Navigator.pop(ctx);
                              context.go('/orders');
                            },
                            child: const Text('TRACK ORDER'),
                          ),
                        ],
                      ),
                    );
                  }
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value, {bool isBold = false}) {
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
          value,
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
