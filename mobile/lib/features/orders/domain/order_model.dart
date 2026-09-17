import '../../menu/domain/menu_item_model.dart';

enum OrderStatus {
  received,
  confirmed,
  preparing,
  ready,
  delivered,
  pickedUp;

  String get label {
    switch (this) {
      case OrderStatus.received:
        return 'Received';
      case OrderStatus.confirmed:
        return 'Confirmed';
      case OrderStatus.preparing:
        return 'In Kitchen';
      case OrderStatus.ready:
        return 'Ready for Pickup';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.pickedUp:
        return 'Picked Up';
    }
  }

  static OrderStatus fromString(String? status) {
    if (status == null) return OrderStatus.received;
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return OrderStatus.confirmed;
      case 'PREPARING':
      case 'COOKING':
      case 'SAUCING':
        return OrderStatus.preparing;
      case 'READY':
        return OrderStatus.ready;
      case 'DELIVERED':
        return OrderStatus.delivered;
      case 'PICKED_UP':
        return OrderStatus.pickedUp;
      default:
        return OrderStatus.received;
    }
  }

  String toDbString() {
    switch (this) {
      case OrderStatus.received:
        return 'RECEIVED';
      case OrderStatus.confirmed:
        return 'CONFIRMED';
      case OrderStatus.preparing:
        return 'PREPARING';
      case OrderStatus.ready:
        return 'READY';
      case OrderStatus.delivered:
        return 'DELIVERED';
      case OrderStatus.pickedUp:
        return 'PICKED_UP';
    }
  }
}

class OrderItemSummary {
  final String menuItemId;
  final String name;
  final int quantity;
  final double unitPrice;
  final String? customization;

  const OrderItemSummary({
    required this.menuItemId,
    required this.name,
    required this.quantity,
    required this.unitPrice,
    this.customization,
  });

  factory OrderItemSummary.fromJson(Map<String, dynamic> json) {
    return OrderItemSummary(
      menuItemId: json['menu_item_id'] as String? ?? json['menuItemId'] as String? ?? '',
      name: json['name'] as String? ?? 'Wings',
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      unitPrice: (json['unit_price'] as num?)?.toDouble() ?? 299.0,
      customization: json['customization']?.toString(),
    );
  }
}

class OrderModel {
  final String id;
  final String ticketNumber;
  final String restaurantId;
  final SalesChannel channel;
  final String? tableNumber;
  final String? customerName;
  final String? customerPhone;
  final String? targetPickupTime;
  final double subtotal;
  final double packagingFee;
  final double tax;
  final double totalAmount;
  final OrderStatus status;
  final String paymentStatus;
  final List<OrderItemSummary> items;
  final DateTime createdAt;

  const OrderModel({
    required this.id,
    required this.ticketNumber,
    required this.restaurantId,
    required this.channel,
    this.tableNumber,
    this.customerName,
    this.customerPhone,
    this.targetPickupTime,
    required this.subtotal,
    this.packagingFee = 0.0,
    required this.tax,
    required this.totalAmount,
    required this.status,
    this.paymentStatus = 'PAID',
    required this.items,
    required this.createdAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final rawChannel = json['sales_channel'] as String? ?? json['channel'] as String? ?? 'DINE_IN';
    final channel = rawChannel == 'TAKEAWAY' ? SalesChannel.takeaway : SalesChannel.dineIn;

    return OrderModel(
      id: json['id'] as String? ?? 'ord-${DateTime.now().millisecondsSinceEpoch}',
      ticketNumber: json['ticket_number'] as String? ?? json['ticketNumber'] as String? ?? '#101',
      restaurantId: json['restaurant_id'] as String? ?? 'rest-kow-blr-01',
      channel: channel,
      tableNumber: json['table_number'] as String?,
      customerName: json['customer_name'] as String? ?? 'Guest',
      customerPhone: json['customer_phone'] as String?,
      targetPickupTime: json['target_pickup_time'] as String?,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      packagingFee: (json['packaging_fee'] as num?)?.toDouble() ?? 0.0,
      tax: (json['tax'] as num?)?.toDouble() ?? 0.0,
      totalAmount: (json['total_amount'] as num?)?.toDouble() ?? 0.0,
      status: OrderStatus.fromString(json['status'] as String?),
      paymentStatus: json['payment_status'] as String? ?? 'PAID',
      items: (json['items'] as List<dynamic>?)
              ?.map((i) => OrderItemSummary.fromJson(i as Map<String, dynamic>))
              .toList() ??
          const [],
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
