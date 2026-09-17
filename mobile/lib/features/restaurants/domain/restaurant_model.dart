class RestaurantModel {
  final String id;
  final String name;
  final String slug;
  final String branch;
  final String address;
  final String? phone;
  final String? email;
  final String logo;
  final String? coverImage;
  final String currencySymbol;
  final double gstPercent;
  final String wifiSsid;
  final String? wifiPassword;

  const RestaurantModel({
    required this.id,
    required this.name,
    required this.slug,
    required this.branch,
    required this.address,
    this.phone,
    this.email,
    required this.logo,
    this.coverImage,
    this.currencySymbol = '₹',
    this.gstPercent = 5.0,
    this.wifiSsid = 'KingsOfWings_Guest',
    this.wifiPassword,
  });

  factory RestaurantModel.fromJson(Map<String, dynamic> json) {
    final settings = json['settings'] as Map<String, dynamic>?;
    return RestaurantModel(
      id: json['id'] as String? ?? 'rest-kow-blr-01',
      name: json['name'] as String? ?? 'Kings of Wings',
      slug: json['slug'] as String? ?? 'kings-of-wings',
      branch: json['branch'] as String? ?? 'Indiranagar Flagship',
      address: json['address'] as String? ?? '100ft Road, Indiranagar, Bengaluru',
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      logo: json['logo'] as String? ?? '🔥',
      coverImage: json['cover_image'] as String?,
      currencySymbol: json['currency_symbol'] as String? ?? '₹',
      gstPercent: (settings?['gstPercent'] as num?)?.toDouble() ?? 5.0,
      wifiSsid: json['wifi_ssid'] as String? ?? 'KingsOfWings_Guest',
      wifiPassword: json['wifi_password'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'slug': slug,
        'branch': branch,
        'address': address,
        'phone': phone,
        'email': email,
        'logo': logo,
        'currency_symbol': currencySymbol,
      };
}
