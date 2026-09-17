import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../app/config/app_config.dart';
import '../domain/menu_item_model.dart';

class MenuProvider extends ChangeNotifier {
  List<MenuItemModel> _items = [];
  String _selectedCategory = 'All';
  SalesChannel _activeChannel = SalesChannel.dineIn;
  bool _isLoading = false;
  String _searchQuery = '';

  List<MenuItemModel> get items => _items;
  String get selectedCategory => _selectedCategory;
  SalesChannel get activeChannel => _activeChannel;
  bool get isLoading => _isLoading;
  String get searchQuery => _searchQuery;

  List<String> get categories {
    final set = {'All'};
    for (var item in _items) {
      set.add(item.category);
    }
    return set.toList();
  }

  List<MenuItemModel> get filteredItems {
    return _items.where((item) {
      final matchesCategory =
          _selectedCategory == 'All' || item.category == _selectedCategory;
      final matchesSearch = _searchQuery.isEmpty ||
          item.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          item.description.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesChannel = item.isAvailableInChannel(_activeChannel);

      return matchesCategory && matchesSearch && matchesChannel;
    }).toList();
  }

  MenuProvider() {
    loadMenu();
  }

  void setChannel(SalesChannel channel) {
    if (_activeChannel != channel) {
      _activeChannel = channel;
      notifyListeners();
    }
  }

  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<void> loadMenu({String? restaurantId}) async {
    _isLoading = true;
    notifyListeners();

    try {
      if (AppConfig.isSupabaseConfigured) {
        final query = Supabase.instance.client
            .from('menu_items')
            .select()
            .order('name');
        
        final res = await query;
        final list = (res as List)
            .map((e) => MenuItemModel.fromJson(e as Map<String, dynamic>))
            .toList();

        if (list.isNotEmpty) {
          _items = list;
          _isLoading = false;
          notifyListeners();
          return;
        }
      }

      // Seed items matching the Kings of Wings Web signature menu
      _items = [
        const MenuItemModel(
          id: 'menu-kow-01',
          name: 'Classic Buffalo Fire Wings',
          category: 'Wings',
          description: 'Crispy double-fried wings tossed in aged cayenne pepper, garlic butter & vinegar glaze.',
          dineInPrice: 349.0,
          takeawayPrice: 329.0,
          packagingCharge: 15.0,
          image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80',
          heatFlames: 3,
          scovilleShu: 25000,
          badges: ['BESTSELLER', 'HOT'],
          prepTimeMinutes: 12,
        ),
        const MenuItemModel(
          id: 'menu-kow-02',
          name: 'Smoked Honey Reaper Glaze',
          category: 'Wings',
          description: 'Carolina reaper infused with raw wild honeycomb and applewood smoke essence.',
          dineInPrice: 389.0,
          takeawayPrice: 369.0,
          packagingCharge: 15.0,
          image: 'https://images.unsplash.com/photo-1527477321055-43615852573d?w=600&auto=format&fit=crop&q=80',
          heatFlames: 5,
          scovilleShu: 150000,
          badges: ['LEGENDARY', 'INSANE'],
          prepTimeMinutes: 14,
        ),
        const MenuItemModel(
          id: 'menu-kow-03',
          name: 'Garlic Parmesan Crisp',
          category: 'Wings',
          description: 'Golden roasted wings tossed in emulsified garlic confit, cracked black pepper and 24-month aged parmesan.',
          dineInPrice: 329.0,
          takeawayPrice: 319.0,
          packagingCharge: 15.0,
          image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=600&auto=format&fit=crop&q=80',
          heatFlames: 1,
          badges: ['CHEF SPECIAL'],
          prepTimeMinutes: 10,
        ),
        const MenuItemModel(
          id: 'menu-kow-04',
          name: 'Truffle Mac & Cheese Bombs',
          category: 'Sides',
          description: 'Crisp panko coated macaroni croquettes filled with smoked gouda and winter white truffle oil.',
          dineInPrice: 249.0,
          takeawayPrice: 249.0,
          packagingCharge: 10.0,
          image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop&q=80',
          heatFlames: 0,
          prepTimeMinutes: 8,
        ),
        const MenuItemModel(
          id: 'menu-kow-05',
          name: 'Ghost Pepper Loaded Fries',
          category: 'Sides',
          description: 'Hand-cut double cooked fries dusted with ghost chili seasoning and melted cheddar fondue.',
          dineInPrice: 219.0,
          takeawayPrice: 219.0,
          packagingCharge: 10.0,
          image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
          heatFlames: 4,
          prepTimeMinutes: 8,
        ),
        const MenuItemModel(
          id: 'menu-kow-06',
          name: 'Craft Blood Orange Soda',
          category: 'Drinks',
          description: 'House-made sparkling Italian blood orange soda with fresh bruised rosemary.',
          dineInPrice: 149.0,
          takeawayPrice: 149.0,
          packagingCharge: 5.0,
          image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
          heatFlames: 0,
          prepTimeMinutes: 3,
        ),
      ];
    } catch (e) {
      debugPrint('Error loading menu: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
