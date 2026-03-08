import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// API service for communicating with the backend.
/// Handles auth tokens, auto-refresh, and base URL config.
class ApiService {
  static const String _baseUrlKey = 'api_base_url';
  static const String _tokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _defaultBaseUrl = 'http://localhost:3000';

  late final Dio _dio;
  String? _accessToken;
  String? _refreshToken;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: _defaultBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ));

    // Add auth interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_accessToken != null) {
          options.headers['Authorization'] = 'Bearer $_accessToken';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401 && _refreshToken != null) {
          try {
            final refreshed = await _refreshTokens();
            if (refreshed) {
              // Retry original request with new token
              error.requestOptions.headers['Authorization'] = 'Bearer $_accessToken';
              final response = await _dio.fetch(error.requestOptions);
              return handler.resolve(response);
            }
          } catch (_) {
            // Refresh failed — force logout
          }
        }
        return handler.next(error);
      },
    ));
  }

  /// Initialize from stored preferences.
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString(_tokenKey);
    _refreshToken = prefs.getString(_refreshTokenKey);
    final baseUrl = prefs.getString(_baseUrlKey) ?? _defaultBaseUrl;
    _dio.options.baseUrl = baseUrl;
  }

  /// Set the API base URL (e.g., from settings screen).
  Future<void> setBaseUrl(String url) async {
    _dio.options.baseUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_baseUrlKey, url);
  }

  String get baseUrl => _dio.options.baseUrl;
  bool get isLoggedIn => _accessToken != null;

  // ─── AUTH ───

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _dio.post('/api/auth/login', data: {'email': email, 'password': password});
    _accessToken = res.data['accessToken'];
    _refreshToken = res.data['refreshToken'];
    await _saveTokens();
    return res.data;
  }

  Future<Map<String, dynamic>> register(String email, String password) async {
    final res = await _dio.post('/api/auth/register', data: {'email': email, 'password': password});
    return res.data;
  }

  Future<void> logout() async {
    _accessToken = null;
    _refreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_refreshTokenKey);
  }

  Future<bool> _refreshTokens() async {
    try {
      final res = await Dio(BaseOptions(baseUrl: _dio.options.baseUrl))
          .post('/api/auth/refresh', data: {'refreshToken': _refreshToken});
      _accessToken = res.data['accessToken'];
      _refreshToken = res.data['refreshToken'];
      await _saveTokens();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> _saveTokens() async {
    final prefs = await SharedPreferences.getInstance();
    if (_accessToken != null) await prefs.setString(_tokenKey, _accessToken!);
    if (_refreshToken != null) await prefs.setString(_refreshTokenKey, _refreshToken!);
  }

  // ─── BUSINESS ───

  Future<Map<String, dynamic>> getProfile() async {
    final res = await _dio.get('/api/business/profile');
    return res.data;
  }

  // ─── CUSTOMERS ───

  Future<Map<String, dynamic>> getCustomers({int page = 1, int limit = 20, String? search}) async {
    final params = <String, dynamic>{'page': page, 'limit': limit};
    if (search != null && search.isNotEmpty) params['search'] = search;
    final res = await _dio.get('/api/customers', queryParameters: params);
    return res.data;
  }

  Future<Map<String, dynamic>> getCustomer(String id) async {
    final res = await _dio.get('/api/customers/$id');
    return res.data;
  }

  Future<Map<String, dynamic>> createCustomer(Map<String, dynamic> data) async {
    final res = await _dio.post('/api/customers', data: data);
    return res.data;
  }

  // ─── JOBS ───

  Future<Map<String, dynamic>> getJobs({int page = 1, int limit = 20, String? status}) async {
    final params = <String, dynamic>{'page': page, 'limit': limit};
    if (status != null) params['status'] = status;
    final res = await _dio.get('/api/jobs', queryParameters: params);
    return res.data;
  }

  Future<Map<String, dynamic>> createJob(Map<String, dynamic> data) async {
    final res = await _dio.post('/api/jobs', data: data);
    return res.data;
  }

  Future<Map<String, dynamic>> updateJobStatus(String jobId, String status) async {
    final res = await _dio.put('/api/jobs/$jobId/status', data: {'status': status});
    return res.data;
  }

  // ─── EXPENSES ───

  Future<Map<String, dynamic>> getExpenses({int? month, int? year}) async {
    final params = <String, dynamic>{};
    if (month != null) params['month'] = month;
    if (year != null) params['year'] = year;
    final res = await _dio.get('/api/expenses', queryParameters: params);
    return res.data;
  }

  Future<Map<String, dynamic>> createExpense(Map<String, dynamic> data) async {
    final res = await _dio.post('/api/expenses', data: data);
    return res.data;
  }

  // ─── REPORTS ───

  Future<Map<String, dynamic>> getMonthlyReport(int month, int year) async {
    final res = await _dio.get('/api/reports/monthly', queryParameters: {'month': month, 'year': year});
    return res.data;
  }
}
