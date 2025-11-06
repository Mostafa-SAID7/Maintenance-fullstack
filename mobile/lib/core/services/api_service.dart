import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:io';
import '../models/api_response_model.dart';
import '../../models/user_model.dart';

class ApiService {
  static const String baseUrl = 'https://api.carmaintenance.com'; // Configure from environment
  static const String apiVersion = 'v1';
  static const String tokenKey = 'auth_token';

  final Dio _dio;
  final SharedPreferences _prefs;

  ApiService(this._dio, this._prefs) {
    _configureDio();
  }

  void _configureDio() {
    _dio.options.baseUrl = '$baseUrl/api/$apiVersion';
    _dio.options.connectTimeout = const Duration(seconds: 30);
    _dio.options.receiveTimeout = const Duration(seconds: 30);
    _dio.options.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add auth interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token expired, redirect to login
          await clearToken();
        }
        handler.next(error);
      },
    ));
  }

  Future<String?> getToken() async {
    return _prefs.getString(tokenKey);
  }

  Future<void> setToken(String token) async {
    await _prefs.setString(tokenKey, token);
  }

  Future<void> clearToken() async {
    await _prefs.remove(tokenKey);
  }

  // Cross-platform data serialization
  T? _deserializeData<T>(Map<String, dynamic>? data, T Function(Map<String, dynamic>) fromJson) {
    if (data == null) return null;
    try {
      return fromJson(data);
    } catch (e) {
      print('Deserialization error: $e');
      return null;
    }
  }

  // Generic API request method with cross-platform error handling
  Future<ApiResponse<T>> request<T>({
    required String method,
    required String endpoint,
    Map<String, dynamic>? data,
    T Function(Map<String, dynamic>)? fromJson,
    Map<String, dynamic>? queryParameters,
    bool requiresAuth = true,
  }) async {
    try {
      if (requiresAuth && await getToken() == null) {
        return ApiResponse.error('Authentication required');
      }

      final response = await _dio.request(
        endpoint,
        data: data,
        queryParameters: queryParameters,
        options: Options(
          method: method,
          headers: requiresAuth ? {'Authorization': 'Bearer ${await getToken()}'} : null,
        ),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (fromJson != null && response.data != null) {
          // Handle both possible response structures
          final responseData = response.data is Map<String, dynamic> 
              ? (response.data['data'] ?? response.data)
              : response.data;
          
          final result = _deserializeData(responseData as Map<String, dynamic>?, fromJson);
          if (result != null) {
            return ApiResponse.success(result);
          }
        }
        return ApiResponse.success(response.data as T);
      } else {
        return ApiResponse.error('Server error: ${response.statusCode}');
      }
    } on DioException catch (e) {
      String errorMessage;
      
      if (e.type == DioExceptionType.connectionTimeout || 
          e.type == DioExceptionType.receiveTimeout) {
        errorMessage = 'Connection timeout. Please check your internet connection.';
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'No internet connection. Please check your network.';
      } else if (e.response?.statusCode == 401) {
        await clearToken();
        errorMessage = 'Session expired. Please login again.';
      } else if (e.response?.data != null) {
        final responseData = e.response!.data;
        if (responseData is Map<String, dynamic>) {
          errorMessage = responseData['message'] ?? responseData['error'] ?? 'Network error';
        } else {
          errorMessage = 'Network error';
        }
      } else {
        errorMessage = e.message ?? 'Network error';
      }
      
      return ApiResponse.error(errorMessage);
    } catch (e) {
      return ApiResponse.error('Unexpected error: $e');
    }
  }

  // Mobile-specific responsive image handling
  String? getResponsiveImageUrl(String baseUrl, {String? size}) {
    if (baseUrl.isEmpty) return null;
    
    if (Platform.isIOS) {
      // Use @2x, @3x images for iOS
      if (size == '2x' || size == '3x') {
        return '$baseUrl@$size';
      }
    } else if (Platform.isAndroid) {
      // Use -hdpi, -xhdpi, -xxhdpi, -xxxhdpi for Android
      if (size != null && ['hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].contains(size)) {
        return '$baseUrl-$size';
      }
    }
    
    return baseUrl;
  }

  // Cross-platform date serialization
  DateTime? parseDate(dynamic date) {
    if (date == null) return null;
    
    if (date is String) {
      return DateTime.tryParse(date);
    } else if (date is int) {
      return DateTime.fromMillisecondsSinceEpoch(date);
    }
    return null;
  }

  // Serialize DateTime to cross-platform compatible format
  String serializeDate(DateTime date) {
    return date.toIso8601String();
  }
}