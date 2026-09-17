enum UserRole {
  customer,
  staff,
  kitchen,
  manager,
  admin,
  owner;

  static UserRole fromString(String? role) {
    if (role == null) return UserRole.customer;
    switch (role.toUpperCase()) {
      case 'STAFF':
        return UserRole.staff;
      case 'KITCHEN':
        return UserRole.kitchen;
      case 'MANAGER':
        return UserRole.manager;
      case 'ADMIN':
        return UserRole.admin;
      case 'OWNER':
        return UserRole.owner;
      default:
        return UserRole.customer;
    }
  }

  String toDbString() {
    switch (this) {
      case UserRole.customer:
        return 'CUSTOMER';
      case UserRole.staff:
        return 'STAFF';
      case UserRole.kitchen:
        return 'KITCHEN';
      case UserRole.manager:
        return 'MANAGER';
      case UserRole.admin:
        return 'ADMIN';
      case UserRole.owner:
        return 'OWNER';
    }
  }

  bool get isStaffOrHigher =>
      this == UserRole.staff ||
      this == UserRole.kitchen ||
      this == UserRole.manager ||
      this == UserRole.admin ||
      this == UserRole.owner;

  bool get isManagerOrHigher =>
      this == UserRole.manager ||
      this == UserRole.admin ||
      this == UserRole.owner;
}

class UserModel {
  final String id;
  final String email;
  final String fullName;
  final UserRole role;
  final String? restaurantId;
  final String? organizationId;
  final DateTime? createdAt;

  const UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    this.restaurantId,
    this.organizationId,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      fullName: json['full_name'] as String? ?? json['name'] as String? ?? 'User',
      role: UserRole.fromString(json['role'] as String?),
      restaurantId: json['restaurant_id'] as String?,
      organizationId: json['organization_id'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'full_name': fullName,
        'role': role.toDbString(),
        'restaurant_id': restaurantId,
        'organization_id': organizationId,
      };
}
