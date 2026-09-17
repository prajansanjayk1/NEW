enum SalesChannel {
  dineIn,
  takeaway;

  String get label => this == SalesChannel.dineIn ? 'Dine-In' : 'Takeaway';
}

class DietaryInfo {
  final bool vegetarian;
  final bool vegan;
  final bool containsDairy;
  final bool containsGluten;
  final List<String> allergens;

  const DietaryInfo({
    this.vegetarian = false,
    this.vegan = false,
    this.containsDairy = false,
    this.containsGluten = false,
    this.allergens = const [],
  });

  factory DietaryInfo.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const DietaryInfo();
    return DietaryInfo(
      vegetarian: json['vegetarian'] as bool? ?? false,
      vegan: json['vegan'] as bool? ?? false,
      containsDairy: json['containsDairy'] as bool? ?? false,
      containsGluten: json['containsGluten'] as bool? ?? false,
      allergens: (json['allergens'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
    );
  }
}

class MenuItemModel {
  final String id;
  final String name;
  final String category;
  final String description;
  final double dineInPrice;
  final double takeawayPrice;
  final bool availableDineIn;
  final bool availableTakeaway;
  final double packagingCharge;
  final String image;
  final int heatFlames;
  final int? scovilleShu;
  final List<String> badges;
  final int prepTimeMinutes;
  final bool isAvailable;
  final DietaryInfo dietary;

  const MenuItemModel({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.dineInPrice,
    required this.takeawayPrice,
    this.availableDineIn = true,
    this.availableTakeaway = true,
    this.packagingCharge = 15.0,
    required this.image,
    this.heatFlames = 1,
    this.scovilleShu,
    this.badges = const [],
    this.prepTimeMinutes = 12,
    this.isAvailable = true,
    this.dietary = const DietaryInfo(),
  });

  double priceForChannel(SalesChannel channel) {
    return channel == SalesChannel.dineIn ? dineInPrice : takeawayPrice;
  }

  bool isAvailableInChannel(SalesChannel channel) {
    return isAvailable &&
        (channel == SalesChannel.dineIn ? availableDineIn : availableTakeaway);
  }

  factory MenuItemModel.fromJson(Map<String, dynamic> json) {
    final basePrice = (json['price'] as num?)?.toDouble() ?? 299.0;
    return MenuItemModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Menu Item',
      category: json['category'] as String? ?? 'Wings',
      description: json['description'] as String? ?? '',
      dineInPrice: (json['dine_in_price'] as num?)?.toDouble() ??
          (json['dineInPrice'] as num?)?.toDouble() ??
          basePrice,
      takeawayPrice: (json['takeaway_price'] as num?)?.toDouble() ??
          (json['takeawayPrice'] as num?)?.toDouble() ??
          (basePrice * 0.95), // Takeaway often offers express discount or independent pricing
      availableDineIn: json['available_dine_in'] as bool? ??
          json['availableDineIn'] as bool? ??
          true,
      availableTakeaway: json['available_takeaway'] as bool? ??
          json['availableTakeaway'] as bool? ??
          true,
      packagingCharge: (json['packaging_charge'] as num?)?.toDouble() ??
          (json['packagingCharge'] as num?)?.toDouble() ??
          15.0,
      image: json['image'] as String? ??
          'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80',
      heatFlames: (json['heat_flames'] as num?)?.toInt() ??
          (json['heatFlames'] as num?)?.toInt() ??
          1,
      scovilleShu: (json['scoville_shu'] as num?)?.toInt() ??
          (json['scovilleShu'] as num?)?.toInt(),
      badges: (json['badges'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      prepTimeMinutes: (json['prep_time_minutes'] as num?)?.toInt() ??
          (json['prepTimeMinutes'] as num?)?.toInt() ??
          12,
      isAvailable: json['available'] as bool? ?? true,
      dietary: DietaryInfo.fromJson(json['dietary'] as Map<String, dynamic>?),
    );
  }
}
