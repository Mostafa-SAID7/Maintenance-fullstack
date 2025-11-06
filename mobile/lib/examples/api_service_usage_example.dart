// Example: Simple API Service usage without Flutter dependencies
import 'dart:async';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/services/api_service.dart';
import '../core/models/api_response_model.dart';
import '../models/user_model.dart';
import '../models/car_model.dart';

class ApiServiceExample {
  late final ApiService _apiService;
  late final Dio _dio;
  late final SharedPreferences _prefs;

  // Initialize the ApiService properly
  Future<void> initializeApiService() async {
    _dio = Dio();
    _prefs = await SharedPreferences.getInstance();
    _apiService = ApiService(_dio, _prefs);
  }

  // Example 1: Simple GET request without auth
  Future<void> getPublicData() async {
    final response = await _apiService.request<Map<String, dynamic>>(
      method: 'GET',
      endpoint: '/public/info',
      requiresAuth: false,
    );

    if (response.isSuccess) {
      print('Data received: ${response.data}');
    } else {
      print('Error: ${response.message}');
    }
  }

  // Example 2: GET request with authentication and data parsing
  Future<UserModel?> getUserProfile() async {
    final response = await _apiService.request<UserModel>(
      method: 'GET',
      endpoint: '/user/profile',
      fromJson: (json) => UserModel.fromJson(json),
    );

    if (response.isSuccess && response.hasData) {
      return response.data;
    } else {
      print('Failed to get user profile: ${response.message}');
      return null;
    }
  }

  // Example 3: POST request with data
  Future<bool> createCar(Car car) async {
    final response = await _apiService.request<Map<String, dynamic>>(
      method: 'POST',
      endpoint: '/cars',
      data: car.toJson(),
      fromJson: (json) => json, // Simple identity function
    );

    return response.isSuccess;
  }

  // Example 4: PUT request with authentication
  Future<bool> updateCar(int carId, Car updatedCar) async {
    final response = await _apiService.request<Map<String, dynamic>>(
      method: 'PUT',
      endpoint: '/cars/$carId',
      data: updatedCar.toJson(),
    );

    return response.isSuccess;
  }

  // Example 5: DELETE request
  Future<bool> deleteCar(int carId) async {
    final response = await _apiService.request<Map<String, dynamic>>(
      method: 'DELETE',
      endpoint: '/cars/$carId',
    );

    return response.isSuccess;
  }

  // Example 6: Handling different response structures
  Future<List<Car>?> getCars() async {
    final response = await _apiService.request<List<Car>>(
      method: 'GET',
      endpoint: '/cars',
      fromJson: (json) {
        // Handle both possible response structures
        final List<dynamic> carsList = json['data'] ?? json;
        return carsList.map((carJson) => Car.fromJson(carJson)).toList();
      },
    );

    if (response.isSuccess && response.hasData) {
      return response.data;
    } else {
      print('Failed to get cars: ${response.message}');
      return null;
    }
  }

  // Example 7: Error handling for specific scenarios
  Future<void> handleAuthenticationExample() async {
    try {
      // First, set a token (in a real app, this would come from login)
      await _apiService.setToken('your_jwt_token_here');

      // Make an authenticated request
      final response = await _apiService.request<Map<String, dynamic>>(
        method: 'GET',
        endpoint: '/protected/endpoint',
      );

      if (response.isSuccess) {
        print('Authenticated request successful');
      } else {
        // Handle specific error types
        if (response.message?.contains('Session expired') == true) {
          // Redirect to login screen
          print('Need to re-authenticate');
        } else if (response.message?.contains('Connection timeout') == true) {
          // Show network error
          print('Check internet connection');
        } else {
          print('Other error: ${response.message ?? 'Unknown error'}');
        }
      }
    } catch (e) {
      print('Exception caught: $e');
    }
  }

  // Example 8: Using the responsive image URL feature
  String getOptimizedImageUrl(String baseImageUrl) {
    return _apiService.getResponsiveImageUrl(
      baseImageUrl,
      size: '2x', // or '3x', 'hdpi', etc.
    ) ?? baseImageUrl; // fallback to original
  }

  // Example 9: Date serialization utilities
  String formatDateForApi(DateTime date) {
    return _apiService.serializeDate(date);
  }

  DateTime? parseDateFromApi(dynamic dateValue) {
    return _apiService.parseDate(dateValue);
  }

  // Example 10: Complete login flow example
  Future<bool> loginExample(String email, String password) async {
    try {
      final response = await _apiService.request<Map<String, dynamic>>(
        method: 'POST',
        endpoint: '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
        requiresAuth: false,
      );

      if (response.isSuccess && response.hasData) {
        // Extract token from response
        final token = response.data?['token'];
        if (token != null) {
          await _apiService.setToken(token);
          print('Login successful');
          return true;
        }
      } else {
        print('Login failed: ${response.message}');
        return false;
      }
    } catch (e) {
      print('Login exception: $e');
      return false;
    }
    
    return false;
  }

  // Example 11: Logout example
  Future<void> logoutExample() async {
    try {
      // Call logout endpoint (optional)
      await _apiService.request<Map<String, dynamic>>(
        method: 'POST',
        endpoint: '/auth/logout',
      );
    } catch (e) {
      print('Logout endpoint error (non-critical): $e');
    } finally {
      // Always clear the token locally
      await _apiService.clearToken();
      print('Logged out successfully');
    }
  }
}

// Simple usage demonstration
Future<void> demonstrateApiServiceUsage() async {
  final example = ApiServiceExample();
  
  // Initialize the service
  await example.initializeApiService();
  print('ApiService initialized successfully');
  
  // Test different scenarios
  await example.getPublicData();
  
  // Example login (this would fail with real API, but demonstrates the pattern)
  // final loginResult = await example.loginExample('test@example.com', 'password');
  // if (loginResult) {
  //   final user = await example.getUserProfile();
  //   if (user != null) {
  //     print('User logged in: ${user.fullName}');
  //   }
  // }
  
  // Test error handling
  await example.handleAuthenticationExample();
  
  // Test image URL optimization
  final optimizedUrl = example.getOptimizedImageUrl('https://example.com/image');
  print('Optimized image URL: $optimizedUrl');
  
  // Test date handling
  final now = DateTime.now();
  final serializedDate = example.formatDateForApi(now);
  final parsedDate = example.parseDateFromApi(serializedDate);
  print('Date serialization test: $serializedDate -> $parsedDate');
}

// Run the demonstration if this file is executed directly
void main() async {
  await demonstrateApiServiceUsage();
}