import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../app/config/app_config.dart';
import '../../cart/domain/cart_item_model.dart';
import '../../menu/domain/menu_item_model.dart';
import '../domain/order_model.dart';

class OrdersProvider extends ChangeNotifier {
  List<OrderModel> _orders = [];
  bool _isLoading = false;
  RealtimeChannel? _realtimeSubscription;
  Timer? _syncTimer;

  List<OrderModel> get orders => _orders;
  bool get isLoading => _isLoading;

  List<OrderModel> get takeawayOrders =>
      _orders.where((o) => o.channel == SalesChannel.takeaway).toList();

  List<OrderModel> get dineInOrders =>
      _orders.where((o) => o.channel == SalesChannel.dineIn).toList();

  OrdersProvider() {
    _initOrders();
  }

  Future<void> _initOrders() async {
    _isLoading = true;
    notifyListeners();

    // Default Seed orders for instant commercial display
    _orders = [
      OrderModel(
        id: 'ord-kow-9901',
        ticketNumber: '#T204',
        restaurantId: AppConfig.defaultRestaurantId,
        channel: SalesChannel.takeaway,
        customerName: 'Rahul Verma',
        customerPhone: '+91 98765 43210',
        targetPickupTime: '15 mins (Express)',
        subtotal: 678.0,
        packagingFee: 30.0,
        tax: 35.4,
        totalAmount: 743.4,
        status: OrderStatus.preparing,
        items: const [
          OrderItemSummary(
            menuItemId: 'menu-kow-01',
            name: 'Classic Buffalo Fire Wings',
            quantity: 2,
            unitPrice: 329.0,
            customization: '10 PC / MILD / Ranch',
          ),
        ],
        createdAt: DateTime.now().subtract(const Duration(minutes: 6)),
      ),
      OrderModel(
        id: 'ord-kow-9902',
        ticketNumber: '#D108',
        restaurantId: AppConfig.defaultRestaurantId,
        channel: SalesChannel.dineIn,
        tableNumber: '07',
        customerName: 'Ananya S.',
        subtotal: 598.0,
        packagingFee: 0.0,
        tax: 29.9,
        totalAmount: 627.9,
        status: OrderStatus.ready,
        items: const [
          OrderItemSummary(
            menuItemId: 'menu-kow-02',
            name: 'Smoked Honey Reaper Glaze',
            quantity: 1,
            unitPrice: 389.0,
            customization: '10 PC / HOT / Blue Cheese',
          ),
          OrderItemSummary(
            menuItemId: 'menu-kow-05',
            name: 'Ghost Pepper Loaded Fries',
            quantity: 1,
            unitPrice: 219.0,
          ),
        ],
        createdAt: DateTime.now().subtract(const Duration(minutes: 15)),
      ),
    ];

    if (AppConfig.isSupabaseConfigured) {
      await fetchLiveOrders();
      _subscribeToRealtime();
    }
    await fetchBackendOrders();

    // Auto-sync with backend every 2s for instant reflection with Web KDS & Supabase
    _syncTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      fetchBackendOrders();
    });

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchBackendOrders() async {
    try {
      final uri = Uri.parse('${AppConfig.backendApiUrl}/api/orders');
      final res = await http.get(uri).timeout(const Duration(seconds: 3));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['orders'] is List) {
          final List rawList = data['orders'];
          if (rawList.isNotEmpty) {
            final backendOrders = rawList
                .map((j) => OrderModel.fromJson(j as Map<String, dynamic>))
                .toList();

            bool changed = backendOrders.length != _orders.length;
            if (!changed) {
              for (int i = 0; i < backendOrders.length; i++) {
                if (backendOrders[i].id != _orders[i].id ||
                    backendOrders[i].status != _orders[i].status) {
                  changed = true;
                  break;
                }
              }
            }
            if (changed) {
              _orders = backendOrders;
              notifyListeners();
            }
          }
        }
      }
    } catch (e) {
      // Backend temporarily unreachable or timeout; keep local state intact
    }
  }

  Future<void> fetchLiveOrders() async {
    if (!AppConfig.isSupabaseConfigured) return;
    try {
      final res = await Supabase.instance.client
          .from('orders')
          .select()
          .order('created_at', ascending: false)
          .limit(20);

      final liveList = (res as List)
          .map((data) => OrderModel.fromJson(data as Map<String, dynamic>))
          .toList();

      if (liveList.isNotEmpty) {
        _orders = liveList;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching live orders: $e');
    }
  }

  void _subscribeToRealtime() {
    try {
      _realtimeSubscription = Supabase.instance.client
          .channel('public:orders')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'orders',
            callback: (payload) {
              fetchLiveOrders();
            },
          )
          .subscribe();
    } catch (e) {
      debugPrint('Realtime order subscription failed: $e');
    }
  }

  Future<OrderModel?> placeOrder({
    required List<CartItemModel> cartItems,
    required SalesChannel channel,
    required double subtotal,
    required double packagingFee,
    required double tax,
    required double totalAmount,
    String? tableNumber,
    String? customerName,
    String? customerPhone,
    String? targetPickupTime,
    required String restaurantId,
  }) async {
    final ticketNum = channel == SalesChannel.takeaway
        ? '#T${100 + (_orders.length % 900) + 1}'
        : '#D${_orders.length + 1}';

    final newOrder = OrderModel(
      id: 'ord-${DateTime.now().millisecondsSinceEpoch}',
      ticketNumber: ticketNum,
      restaurantId: restaurantId,
      channel: channel,
      tableNumber: tableNumber,
      customerName: customerName ?? 'Customer',
      customerPhone: customerPhone,
      targetPickupTime: targetPickupTime,
      subtotal: subtotal,
      packagingFee: packagingFee,
      tax: tax,
      totalAmount: totalAmount,
      status: OrderStatus.received,
      items: cartItems
          .map((ci) => OrderItemSummary(
                menuItemId: ci.item.id,
                name: ci.item.name,
                quantity: ci.quantity,
                unitPrice: ci.unitPrice,
                customization: '${ci.customization.portionSize} / ${ci.customization.heatLevel}',
              ))
          .toList(),
      createdAt: DateTime.now(),
    );

    if (AppConfig.isSupabaseConfigured) {
      try {
        await Supabase.instance.client.from('orders').insert({
          'id': newOrder.id,
          'ticket_number': newOrder.ticketNumber,
          'restaurant_id': restaurantId,
          'sales_channel': channel == SalesChannel.takeaway ? 'TAKEAWAY' : 'DINE_IN',
          'table_number': tableNumber,
          'customer_name': customerName,
          'customer_phone': customerPhone,
          'target_pickup_time': targetPickupTime,
          'subtotal': subtotal,
          'packaging_fee': packagingFee,
          'tax': tax,
          'total_amount': totalAmount,
          'status': 'RECEIVED',
          'payment_status': 'PAID',
        });
      } catch (e) {
        debugPrint('Error inserting order in Supabase: $e');
      }
    }

    // Always sync with backend server for instant reflection across Web KDS & other clients
    try {
      final uri = Uri.parse('${AppConfig.backendApiUrl}/api/orders');
      http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'id': newOrder.id,
          'ticketNumber': newOrder.ticketNumber,
          'ticket_number': newOrder.ticketNumber,
          'restaurantId': restaurantId,
          'restaurant_id': restaurantId,
          'channel': channel == SalesChannel.takeaway ? 'TAKEAWAY' : 'DINE_IN',
          'sales_channel': channel == SalesChannel.takeaway ? 'TAKEAWAY' : 'DINE_IN',
          'tableNumber': tableNumber,
          'table_number': tableNumber,
          'customerName': customerName ?? 'Customer',
          'customer_name': customerName ?? 'Customer',
          'customerPhone': customerPhone,
          'customer_phone': customerPhone,
          'targetPickupTime': targetPickupTime,
          'target_pickup_time': targetPickupTime,
          'subtotal': subtotal,
          'packagingFee': packagingFee,
          'packaging_fee': packagingFee,
          'tax': tax,
          'total': totalAmount,
          'totalAmount': totalAmount,
          'total_amount': totalAmount,
          'status': 'LOCKED',
          'paymentStatus': 'PAID',
          'payment_status': 'PAID',
          'items': newOrder.items
              .map((i) => {
                    'menuItemId': i.menuItemId,
                    'menu_item_id': i.menuItemId,
                    'name': i.name,
                    'quantity': i.quantity,
                    'unitPrice': i.unitPrice,
                    'unit_price': i.unitPrice,
                    'totalPrice': i.unitPrice * i.quantity,
                    'customization': i.customization,
                  })
              .toList(),
        }),
      ).catchError((err) {
        debugPrint('Backend sync error on placeOrder: $err');
        return http.Response('', 500);
      });
    } catch (e) {
      debugPrint('Backend order dispatch error: $e');
    }

    _orders.insert(0, newOrder);
    notifyListeners();
    return newOrder;
  }

  Future<void> updateOrderStatus(String orderId, OrderStatus newStatus) async {
    final idx = _orders.indexWhere((o) => o.id == orderId);
    if (idx >= 0) {
      final old = _orders[idx];
      _orders[idx] = OrderModel(
        id: old.id,
        ticketNumber: old.ticketNumber,
        restaurantId: old.restaurantId,
        channel: old.channel,
        tableNumber: old.tableNumber,
        customerName: old.customerName,
        customerPhone: old.customerPhone,
        targetPickupTime: old.targetPickupTime,
        subtotal: old.subtotal,
        packagingFee: old.packagingFee,
        tax: old.tax,
        totalAmount: old.totalAmount,
        status: newStatus,
        paymentStatus: old.paymentStatus,
        items: old.items,
        createdAt: old.createdAt,
      );
      notifyListeners();

      if (AppConfig.isSupabaseConfigured) {
        try {
          await Supabase.instance.client
              .from('orders')
              .update({'status': newStatus.toDbString()})
              .eq('id', orderId);
        } catch (e) {
          debugPrint('Error updating order status in Supabase: $e');
        }
      }

      // Sync status change with backend API
      try {
        final uri = Uri.parse('${AppConfig.backendApiUrl}/api/orders/$orderId/status');
        http.patch(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'status': newStatus.toDbString()}),
        ).catchError((err) {
          debugPrint('Backend sync error on updateOrderStatus: $err');
          return http.Response('', 500);
        });
      } catch (e) {
        debugPrint('Backend status patch error: $e');
      }
    }
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    _realtimeSubscription?.unsubscribe();
    super.dispose();
  }
}
