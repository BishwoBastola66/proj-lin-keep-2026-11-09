import 'package:dio/dio.dart';
import '../../../../core/api/api_client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthRepository {
  final ApiClient _apiClient;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  AuthRepository(this._apiClient);

  static const String _tokenKey = 'auth_token';
  static const String _userEmailKey = 'auth_email';

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _apiClient.post('/auth/login', {
        'email': email,
        'password': password,
      });

      final data = response.data;
      final token = data['token'];
      
      if (token != null) {
        await _secureStorage.write(key: _tokenKey, value: token);
        await _secureStorage.write(key: _userEmailKey, value: email);
        _apiClient.setToken(token);
      }
      return data;
    } catch (e) {
      if (e is DioException) {
        throw Exception(e.response?.data['error'] ?? 'Login failed');
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> register(String email, String password, {String? fullName}) async {
    try {
      final response = await _apiClient.post('/auth/register', {
        'email': email,
        'password': password,
        'fullName': fullName,
      });

      final data = response.data;
      final token = data['token'];
      
      if (token != null) {
        await _secureStorage.write(key: _tokenKey, value: token);
        await _secureStorage.write(key: _userEmailKey, value: email);
        _apiClient.setToken(token);
      }
      return data;
    } catch (e) {
       if (e is DioException) {
        throw Exception(e.response?.data['error'] ?? 'Registration failed');
      }
      rethrow;
    }
  }

  Future<void> logout() async {
    await _secureStorage.delete(key: _tokenKey);
    await _secureStorage.delete(key: _userEmailKey);
    // Note: To be fully secure we might want to also hit a /auth/logout endpoint if it existed
    _apiClient.setToken('');
  }

  Future<String?> getToken() async {
    return await _secureStorage.read(key: _tokenKey);
  }

  Future<String?> getUserEmail() async {
    return await _secureStorage.read(key: _userEmailKey);
  }

  Future<bool> isAuthenticated() async {
    final token = await getToken();
    if (token != null) {
      _apiClient.setToken(token);
      return true;
    }
    return false;
  }
}
