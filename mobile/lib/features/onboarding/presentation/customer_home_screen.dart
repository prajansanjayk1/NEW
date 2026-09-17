import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../restaurants/presentation/restaurant_provider.dart';
import '../../menu/presentation/menu_provider.dart';
import '../../menu/domain/menu_item_model.dart';
import '../../cart/presentation/cart_provider.dart';
import '../../table_session/presentation/table_session_provider.dart';

class CustomerHomeScreen extends StatelessWidget {
  const CustomerHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final restProv = context.watch<RestaurantProvider>();
    final menuProv = context.watch<MenuProvider>();
    final cartProv = context.watch<CartProvider>();
    final tableProv = context.watch<TableSessionProvider>();

    final activeBranch = restProv.activeRestaurant;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  activeBranch?.name ?? 'Kings of Wings',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                  ),
                  child: Text(
                    menuProv.activeChannel == SalesChannel.takeaway ? '🥡 TAKEAWAY' : '🍽 DINE-IN',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            Text(
              activeBranch?.branch ?? 'Select Location',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textTertiary),
            ),
          ],
        ),
        actions: [
          // Channel Toggle Button
          IconButton(
            icon: Icon(
              menuProv.activeChannel == SalesChannel.takeaway
                  ? LucideIcons.utensils
                  : LucideIcons.shoppingBag,
              color: AppColors.secondary,
            ),
            tooltip: 'Switch Sales Channel',
            onPressed: () {
              final newChannel = menuProv.activeChannel == SalesChannel.takeaway
                  ? SalesChannel.dineIn
                  : SalesChannel.takeaway;
              menuProv.setChannel(newChannel);
            },
          ),
          IconButton(
            icon: const Icon(LucideIcons.qrCode),
            tooltip: 'Scan QR / Table',
            onPressed: () => context.push('/scan-qr'),
          ),
          IconButton(
            icon: const Icon(LucideIcons.radio),
            tooltip: 'NFC Tap',
            onPressed: () => context.push('/nfc'),
          ),
        ],
      ),
      body: CustomScrollView(
        slivers: [
          // Banner & Quick Action Cards
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  // Active Table Session Alert (if dine-in)
                  if (tableProv.hasActiveSession)
                    Container(
                      margin: const EdgeInsets.bottom(16),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                        border: Border.all(color: AppColors.primary.withOpacity(0.4)),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.utensilsCrossed, color: AppColors.primary, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'TABLE ${tableProv.tableNumber} SESSION ACTIVE',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                Text(
                                  '${tableProv.participants.length} participants ordering live',
                                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          ),
                          TextButton(
                            onPressed: () => tableProv.leaveTable(),
                            child: const Text('Leave', style: TextStyle(color: AppColors.textTertiary, fontSize: 12)),
                          ),
                        ],
                      ),
                    ),

                  // Dual Channel Shortcuts
                  Row(
                    children: [
                      Expanded(
                        child: _channelCard(
                          context: context,
                          title: 'Dine-In',
                          subtitle: 'Scan Table QR or NFC tag',
                          icon: LucideIcons.utensils,
                          isSelected: menuProv.activeChannel == SalesChannel.dineIn,
                          onTap: () {
                            menuProv.setChannel(SalesChannel.dineIn);
                            if (!tableProv.hasActiveSession) {
                              context.push('/scan-qr');
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _channelCard(
                          context: context,
                          title: 'Takeaway',
                          subtitle: 'Pickup in 15 mins • Thermal Pack',
                          icon: LucideIcons.shoppingBag,
                          isSelected: menuProv.activeChannel == SalesChannel.takeaway,
                          onTap: () {
                            menuProv.setChannel(SalesChannel.takeaway);
                            context.push('/takeaway');
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Search Bar
                  TextField(
                    onChanged: (val) => menuProv.setSearchQuery(val),
                    decoration: InputDecoration(
                      hintText: 'Search crispy wings, flavors, drinks...',
                      prefixIcon: const Icon(LucideIcons.search, size: 20),
                      suffixIcon: menuProv.searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(LucideIcons.x, size: 18),
                              onPressed: () => menuProv.setSearchQuery(''),
                            )
                          : null,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Categories Horizontal Scroll
          SliverToBoxAdapter(
            child: SizedBox(
              height: 40,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: menuProv.categories.length,
                separatorBuilder: (context, index) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final cat = menuProv.categories[index];
                  final isSel = menuProv.selectedCategory == cat;
                  return ChoiceChip(
                    label: Text(cat),
                    selected: isSel,
                    selectedColor: AppColors.primary,
                    backgroundColor: AppColors.surfaceElevated,
                    side: BorderSide(
                      color: isSel ? AppColors.primary : AppColors.border,
                    ),
                    labelStyle: TextStyle(
                      color: isSel ? Colors.white : AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                    onSelected: (selected) {
                      if (selected) menuProv.setCategory(cat);
                    },
                  );
                },
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 16)),

          // Menu Items List
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final item = menuProv.filteredItems[index];
                  final channel = menuProv.activeChannel;
                  final price = item.priceForChannel(channel);

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                            child: Image.network(
                              item.image,
                              width: 84,
                              height: 84,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => Container(
                                width: 84,
                                height: 84,
                                color: AppColors.surfaceHighlight,
                                child: const Center(
                                  child: Icon(LucideIcons.flame, color: AppColors.primary),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        item.name,
                                        style: Theme.of(context).textTheme.titleMedium,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (item.heatFlames > 0)
                                      Row(
                                        children: List.generate(
                                          item.heatFlames,
                                          (_) => const Text('🔥', style: TextStyle(fontSize: 11)),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  item.description,
                                  style: Theme.of(context).textTheme.bodyMedium,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '₹${price.toStringAsFixed(0)}',
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                        if (channel == SalesChannel.takeaway)
                                          Text(
                                            '+₹${item.packagingCharge.toInt()} Thermal Pack',
                                            style: const TextStyle(
                                              fontSize: 10,
                                              color: AppColors.secondary,
                                            ),
                                          ),
                                      ],
                                    ),
                                    ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                      ),
                                      icon: const Icon(LucideIcons.plus, size: 16),
                                      label: const Text('ADD', style: TextStyle(fontSize: 12)),
                                      onPressed: () {
                                        cartProv.addItem(
                                          item: item,
                                          quantity: 1,
                                          channel: channel,
                                        );
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text('Added ${item.name} to $channel cart'),
                                            duration: const Duration(seconds: 1),
                                            backgroundColor: AppColors.surfaceElevated,
                                          ),
                                        );
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
                childCount: menuProv.filteredItems.length,
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        onTap: (index) {
          switch (index) {
            case 0:
              break;
            case 1:
              context.push('/orders');
              break;
            case 2:
              context.push('/concierge');
              break;
            case 3:
              context.push('/cart');
              break;
          }
        },
        items: [
          const BottomNavigationBarItem(
            icon: Icon(LucideIcons.home),
            label: 'Home',
          ),
          const BottomNavigationBarItem(
            icon: Icon(LucideIcons.receipt),
            label: 'Orders',
          ),
          const BottomNavigationBarItem(
            icon: Icon(LucideIcons.sparkles),
            label: 'Spark AI',
          ),
          BottomNavigationBarItem(
            icon: Badge(
              isLabelVisible: cartProv.totalItemCount > 0,
              label: Text('${cartProv.totalItemCount}'),
              child: const Icon(LucideIcons.shoppingCart),
            ),
            label: 'Cart',
          ),
        ],
      ),
    );
  }

  Widget _channelCard({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.12) : AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              icon,
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
              size: 24,
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 15,
                color: isSelected ? AppColors.primary : AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 11, color: AppColors.textTertiary),
            ),
          ],
        ),
      ),
    );
  }
}
