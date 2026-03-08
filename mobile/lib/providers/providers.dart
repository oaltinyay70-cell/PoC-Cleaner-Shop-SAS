import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';

/// Global API service provider — initialized once at startup.
final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

/// Auth state: null = loading, false = not logged in, true = logged in.
final authStateProvider = StateNotifierProvider<AuthNotifier, AsyncValue<bool>>((ref) {
  return AuthNotifier(ref.read(apiServiceProvider));
});

class AuthNotifier extends StateNotifier<AsyncValue<bool>> {
  final ApiService _api;

  AuthNotifier(this._api) : super(const AsyncValue.loading()) {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await _api.init();
    state = AsyncValue.data(_api.isLoggedIn);
  }

  Future<String?> login(String email, String password) async {
    try {
      state = const AsyncValue.loading();
      await _api.login(email, password);
      state = const AsyncValue.data(true);
      return null; // success
    } catch (e) {
      state = const AsyncValue.data(false);
      return e.toString();
    }
  }

  Future<String?> register(String email, String password) async {
    try {
      await _api.register(email, password);
      return null; // success
    } catch (e) {
      return e.toString();
    }
  }

  Future<void> logout() async {
    await _api.logout();
    state = const AsyncValue.data(false);
  }
}

/// Business profile provider.
final profileProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final api = ref.read(apiServiceProvider);
  return api.getProfile();
});

/// Customers list provider.
final customersProvider = FutureProvider.family<Map<String, dynamic>, int>((ref, page) async {
  final api = ref.read(apiServiceProvider);
  return api.getCustomers(page: page);
});

/// Jobs list provider.
final jobsProvider = FutureProvider.family<Map<String, dynamic>, int>((ref, page) async {
  final api = ref.read(apiServiceProvider);
  return api.getJobs(page: page);
});

/// Monthly report provider.
final monthlyReportProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final now = DateTime.now();
  return api.getMonthlyReport(now.month, now.year);
});
