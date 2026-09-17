import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../app/config/app_config.dart';
import '../domain/restaurant_model.dart';

class RestaurantProvider extends ChangeNotifier {
  RestaurantModel? _activeRestaurant;
  List<RestaurantModel> _availableRestaurants = [];
  bool _isLoading = false;

  RestaurantModel? get activeRestaurant => _activeRestaurant;
  List<RestaurantModel> get availableRestaurants => _availableRestaurants;
  bool get isLoading => _isLoading;

  RestaurantProvider() {
    _loadInitialRestaurants();
  }

  Future<void> _loadInitialRestaurants() async {
    _isLoading = true;
    notifyListeners();

    // Default Seed Branches matching Web SaaS Organization
    final seedBranches = [
      const RestaurantModel(
        id: 'rest-kow-blr-01',
        name: 'Kings of Wings',
        slug: 'kings-of-wings',
        branch: 'Indiranagar Flagship',
        address: '100ft Road, Indiranagar, Bengaluru',
        phone: '+91 80 4123 4567',
        logo: '🔥',
        wifiSsid: 'KOW_Indiranagar_Guest',
      ),
      const RestaurantModel(
        id: 'rest-kow-kor-02',
        name: 'Kings of Wings Express',
        slug: 'kow-koramangala',
        branch: 'Koramangala 5th Block',
        address: '80ft Road, Koramangala, Bengaluru',
        phone: '+91 80 4123 9988',
        logo: '⚡',
        wifiSsid: 'KOW_Koramangala_Guest',
      ),
      const RestaurantModel(
        id: 'rest-kow-wfd-03',
        name: 'Kings of Wings Cloud',
        slug: 'kow-whitefield',
        branch: 'Whitefield ITPL',
        address: 'ITPB Road, Whitefield, Bengaluru',
        phone: '+91 80 4123 1122',
        logo: '🍗',
        wifiSsid: 'KOW_Whitefield_Guest',
      ),
    ];

    try {
      if (AppConfig.isSupabaseConfigured) {
        final data = await Supabase.instance.client
            .from('restaurants')
            .select()
            .order('name');
        
        final list = (data as List)
            .map((item) => RestaurantModel.fromJson(item as Map<String, dynamic>))
            .toList();

        _availableRestaurants = list.isNotEmpty ? list : seedBranches;
      } else {
        _availableRestaurants = seedBranches;
      }

      final prefs = await SharedPreferences.getInstance();
      final savedId = prefs.getString('active_restaurant_id');

      _activeRestaurant = _availableRestaurants.firstWhere(
        (r) => r.id == savedId,
        orElse: () => _availableRestaurants.first,
      );
    } catch (e) {
      debugPrint('Error loading restaurants: $e');
      _availableRestaurants = seedBranches;
      _activeRestaurant = seedBranches.first;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> switchRestaurant(RestaurantModel restaurant) async {
    _activeRestaurant = restaurant;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('active_restaurant_id', restaurant.id);
    notifyListeners();
  }
}
