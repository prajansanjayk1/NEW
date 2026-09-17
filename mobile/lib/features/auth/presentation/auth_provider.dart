import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../app/config/app_config.dart';
import '../domain/user_model.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _currentUser;
  bool _isLoading = true;
  String? _errorMessage;

  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _currentUser != null;

  AuthProvider() {
    _initSession();
  }

  Future<void> _initSession() async {
    _isLoading = true;
    notifyListeners();

    try {
      if (AppConfig.isSupabaseConfigured) {
        final session = Supabase.instance.client.auth.currentSession;
        if (session != null) {
          await _fetchUserProfile(session.user.id, session.user.email ?? '');
        } else {
          await _restoreLocalSession();
        }
      } else {
        await _restoreLocalSession();
      }
    } catch (e) {
      debugPrint('Error restoring auth session: $e');
      await _restoreLocalSession();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _fetchUserProfile(String userId, String email) async {
    try {
      final response = await Supabase.instance.client
          .from('users')
          .select()
          .eq('id', userId)
          .maybeSingle();

      if (response != null) {
        _currentUser = UserModel.fromJson(response);
      } else {
        // Fallback default customer profile
        _currentUser = UserModel(
          id: userId,
          email: email,
          fullName: email.split('@').first,
          role: UserRole.customer,
          restaurantId: AppConfig.defaultRestaurantId,
        );
      }
      await _saveLocalSession(_currentUser!);
    } catch (e) {
      debugPrint('Error fetching user profile from Supabase: $e');
      _currentUser = UserModel(
        id: userId,
        email: email,
        fullName: email.split('@').first,
        role: UserRole.customer,
        restaurantId: AppConfig.defaultRestaurantId,
      );
    }
  }

  Future<bool> signInWithEmail(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      if (AppConfig.isSupabaseConfigured) {
        final res = await Supabase.instance.client.auth.signInWithPassword(
          email: email,
          password: password,
        );
        if (res.user != null) {
          await _fetchUserProfile(res.user!.id, res.user!.email ?? email);
          _isLoading = false;
          notifyListeners();
          return true;
        }
      } else {
        // Safe local demo authentication matching web demo personas
        await Future.delayed(const Duration(milliseconds: 600));
        UserRole determinedRole = UserRole.customer;
        String name = 'Customer Guest';

        if (email.contains('staff') || email.contains('waiter')) {
          determinedRole = UserRole.staff;
          name = 'Staff Member';
        } else if (email.contains('kitchen') || email.contains('chef')) {
          determinedRole = UserRole.kitchen;
          name = 'Kitchen Station';
        } else if (email.contains('manager')) {
          determinedRole = UserRole.manager;
          name = 'Floor Manager';
        } else if (email.contains('admin') || email.contains('owner')) {
          determinedRole = UserRole.owner;
          name = 'Restaurant Owner';
        }

        _currentUser = UserModel(
          id: 'user-${DateTime.now().millisecondsSinceEpoch}',
          email: email,
          fullName: name,
          role: determinedRole,
          restaurantId: AppConfig.defaultRestaurantId,
        );
        await _saveLocalSession(_currentUser!);
        _isLoading = false;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signUpWithEmail(String email, String password, String fullName) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      if (AppConfig.isSupabaseConfigured) {
        final res = await Supabase.instance.client.auth.signUp(
          email: email,
          password: password,
          data: {'full_name': fullName},
        );
        if (res.user != null) {
          _currentUser = UserModel(
            id: res.user!.id,
            email: email,
            fullName: fullName,
            role: UserRole.customer,
            restaurantId: AppConfig.defaultRestaurantId,
          );
          await _saveLocalSession(_currentUser!);
          _isLoading = false;
          notifyListeners();
          return true;
        }
      } else {
        await Future.delayed(const Duration(milliseconds: 600));
        _currentUser = UserModel(
          id: 'user-${DateTime.now().millisecondsSinceEpoch}',
          email: email,
          fullName: fullName,
          role: UserRole.customer,
          restaurantId: AppConfig.defaultRestaurantId,
        );
        await _saveLocalSession(_currentUser!);
        _isLoading = false;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> signOut() async {
    _isLoading = true;
    notifyListeners();

    try {
      if (AppConfig.isSupabaseConfigured) {
        await Supabase.instance.client.auth.signOut();
      }
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('cached_user_id');
      await prefs.remove('cached_user_email');
      await prefs.remove('cached_user_name');
      await prefs.remove('cached_user_role');
      _currentUser = null;
    } catch (e) {
      debugPrint('Error during sign out: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> switchRoleForDemo(UserRole role) async {
    if (_currentUser == null) return;
    _currentUser = UserModel(
      id: _currentUser!.id,
      email: _currentUser!.email,
      fullName: _currentUser!.fullName,
      role: role,
      restaurantId: _currentUser!.restaurantId ?? AppConfig.defaultRestaurantId,
      organizationId: _currentUser!.organizationId,
    );
    await _saveLocalSession(_currentUser!);
    notifyListeners();
  }

  Future<void> _saveLocalSession(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('cached_user_id', user.id);
    await prefs.setString('cached_user_email', user.email);
    await prefs.setString('cached_user_name', user.fullName);
    await prefs.setString('cached_user_role', user.role.toDbString());
  }

  Future<void> _restoreLocalSession() async {
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getString('cached_user_id');
    final email = prefs.getString('cached_user_email');
    final name = prefs.getString('cached_user_name');
    final roleStr = prefs.getString('cached_user_role');

    if (id != null && email != null) {
      _currentUser = UserModel(
        id: id,
        email: email,
        fullName: name ?? 'User',
        role: UserRole.fromString(roleStr),
        restaurantId: AppConfig.defaultRestaurantId,
      );
    }
  }
}
