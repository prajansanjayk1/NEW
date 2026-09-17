import 'package:flutter/foundation.dart';
import '../domain/cart_item_model.dart';
import '../../menu/domain/menu_item_model.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItemModel> _items = [];
  SalesChannel _activeCartChannel = SalesChannel.dineIn;

  List<CartItemModel> get items => _items;
  SalesChannel get activeCartChannel => _activeCartChannel;

  int get totalItemCount => _items.fold(0, (sum, i) => sum + i.quantity);

  double get subtotal => _items.fold(0.0, (sum, i) => sum + i.totalItemPrice);

  double get totalPackagingFee =>
      _items.fold(0.0, (sum, i) => sum + i.packagingCharge);

  double get gstTax => (subtotal + totalPackagingFee) * 0.05;

  double get grandTotal => subtotal + totalPackagingFee + gstTax;

  void addItem({
    required MenuItemModel item,
    int quantity = 1,
    CartCustomization? customization,
    required SalesChannel channel,
  }) {
    // Critical SaaS boundary rule: Prevent DINE_IN and TAKEAWAY from silently mixing
    if (_items.isNotEmpty && _activeCartChannel != channel) {
      _items.clear(); // Clear incompatible channel cart
    }
    _activeCartChannel = channel;

    final custom = customization ?? const CartCustomization();
    final existingIndex = _items.indexWhere(
      (ci) =>
          ci.item.id == item.id &&
          ci.customization.portionSize == custom.portionSize &&
          ci.customization.styleCut == custom.styleCut &&
          ci.customization.heatLevel == custom.heatLevel &&
          ci.customization.dip == custom.dip,
    );

    if (existingIndex >= 0) {
      _items[existingIndex] = _items[existingIndex].copyWith(
        quantity: _items[existingIndex].quantity + quantity,
      );
    } else {
      _items.add(
        CartItemModel(
          id: 'cart-${DateTime.now().millisecondsSinceEpoch}-${_items.length}',
          item: item,
          quantity: quantity,
          customization: custom,
          channel: channel,
        ),
      );
    }
    notifyListeners();
  }

  void updateQuantity(String cartItemId, int delta) {
    final idx = _items.indexWhere((ci) => ci.id == cartItemId);
    if (idx >= 0) {
      final newQty = _items[idx].quantity + delta;
      if (newQty <= 0) {
        _items.removeAt(idx);
      } else {
        _items[idx] = _items[idx].copyWith(quantity: newQty);
      }
      notifyListeners();
    }
  }

  void removeItem(String cartItemId) {
    _items.removeWhere((ci) => ci.id == cartItemId);
    notifyListeners();
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }
}
