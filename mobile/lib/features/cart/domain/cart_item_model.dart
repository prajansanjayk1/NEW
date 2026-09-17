import '../menu/domain/menu_item_model.dart';

class CartCustomization {
  final String portionSize;
  final double portionPriceDelta;
  final String heatLevel;
  final String styleCut;
  final double styleCutDelta;
  final String dip;
  final String? extraNotes;

  const CartCustomization({
    this.portionSize = '10 PC',
    this.portionPriceDelta = 0.0,
    this.heatLevel = 'MED',
    this.styleCut = 'Classic Bone-In',
    this.styleCutDelta = 0.0,
    this.dip = 'Cool Ranch',
    this.extraNotes,
  });

  Map<String, dynamic> toJson() => {
        'portionSize': portionSize,
        'portionPriceDelta': portionPriceDelta,
        'heatLevel': heatLevel,
        'styleCut': styleCut,
        'styleCutDelta': styleCutDelta,
        'dip': dip,
        'extraNotes': extraNotes,
      };

  factory CartCustomization.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const CartCustomization();
    return CartCustomization(
      portionSize: json['portionSize'] as String? ?? '10 PC',
      portionPriceDelta: (json['portionPriceDelta'] as num?)?.toDouble() ?? 0.0,
      heatLevel: json['heatLevel'] as String? ?? 'MED',
      styleCut: json['styleCut'] as String? ?? 'Classic Bone-In',
      styleCutDelta: (json['styleCutDelta'] as num?)?.toDouble() ?? 0.0,
      dip: json['dip'] as String? ?? 'Cool Ranch',
      extraNotes: json['extraNotes'] as String?,
    );
  }
}

class CartItemModel {
  final String id;
  final MenuItemModel item;
  final int quantity;
  final CartCustomization customization;
  final SalesChannel channel;

  const CartItemModel({
    required this.id,
    required this.item,
    required this.quantity,
    required this.customization,
    required this.channel,
  });

  double get unitPrice {
    final base = item.priceForChannel(channel);
    return base + customization.portionPriceDelta + customization.styleCutDelta;
  }

  double get packagingCharge {
    return channel == SalesChannel.takeaway ? item.packagingCharge * quantity : 0.0;
  }

  double get totalItemPrice => unitPrice * quantity;

  CartItemModel copyWith({
    int? quantity,
    CartCustomization? customization,
  }) {
    return CartItemModel(
      id: id,
      item: item,
      quantity: quantity ?? this.quantity,
      customization: customization ?? this.customization,
      channel: channel,
    );
  }
}
