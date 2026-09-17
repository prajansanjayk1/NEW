import 'package:flutter_test/flutter_test.dart';
import 'package:restaurant_mobile/features/menu/domain/menu_item_model.dart';
import 'package:restaurant_mobile/features/cart/domain/cart_item_model.dart';
import 'package:restaurant_mobile/features/cart/presentation/cart_provider.dart';

void main() {
  group('Multi-Channel Mobile Commerce Tests', () {
    test('MenuItemModel calculates channel specific pricing correctly', () {
      const item = MenuItemModel(
        id: 'kow-test-1',
        name: 'Buffalo Wings',
        category: 'Wings',
        description: 'Crispy wings',
        dineInPrice: 349.0,
        takeawayPrice: 329.0,
        packagingCharge: 15.0,
        image: 'https://images.unsplash.com/test.jpg',
      );

      expect(item.priceForChannel(SalesChannel.dineIn), 349.0);
      expect(item.priceForChannel(SalesChannel.takeaway), 329.0);
    });

    test('CartProvider calculates packaging charge only for takeaway orders', () {
      final cart = CartProvider();
      const item = MenuItemModel(
        id: 'kow-test-1',
        name: 'Buffalo Wings',
        category: 'Wings',
        description: 'Crispy wings',
        dineInPrice: 349.0,
        takeawayPrice: 329.0,
        packagingCharge: 15.0,
        image: 'https://images.unsplash.com/test.jpg',
      );

      // Add to Dine-In cart
      cart.addItem(
        item: item,
        quantity: 2,
        channel: SalesChannel.dineIn,
      );

      expect(cart.totalPackagingFee, 0.0);
      expect(cart.subtotal, 698.0);

      // Add to Takeaway cart
      cart.addItem(
        item: item,
        quantity: 2,
        channel: SalesChannel.takeaway,
      );

      expect(cart.activeCartChannel, SalesChannel.takeaway);
      expect(cart.subtotal, 658.0);
      expect(cart.totalPackagingFee, 30.0);
    });
  });
}
