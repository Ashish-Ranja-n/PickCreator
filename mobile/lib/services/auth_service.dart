import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../config/app_config.dart';
import '../models/user_model.dart';

class AuthService {
  static const _storage = FlutterSecureStorage();
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  // Send OTP to email
  static Future<Map<String, dynamic>> sendOtp(String email) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.sendOtpEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      if (response.statusCode == 200) {
        return {'success': true, 'message': 'OTP sent successfully'};
      } else {
        final error = jsonDecode(response.body);
        return {'success': false, 'message': error['error'] ?? 'Failed to send OTP'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Verify OTP and login
  static Future<Map<String, dynamic>> verifyOtpAndLogin(String email, String otp) async {
    try {
      // Step 1: Verify OTP
      final verifyResponse = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.verifyOtpEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'otp': otp}),
      );

      if (verifyResponse.statusCode != 200) {
        final error = jsonDecode(verifyResponse.body);
        return {'success': false, 'message': error['error'] ?? 'Invalid OTP'};
      }

      // Step 2: OTP Login
      final loginResponse = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.otpLoginEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      if (loginResponse.statusCode == 200) {
        final data = jsonDecode(loginResponse.body);
        
        // Extract token from Set-Cookie header
        final cookies = loginResponse.headers['set-cookie'];
        String? token;
        if (cookies != null) {
          final tokenMatch = RegExp(r'token=([^;]+)').firstMatch(cookies);
          token = tokenMatch?.group(1);
        }

        if (token != null) {
          await saveToken(token);
          await saveUserData(data['user']);
        }

        return {
          'success': true,
          'isNew': data['isNew'],
          'user': data['user'],
          'token': token,
        };
      } else {
        final error = jsonDecode(loginResponse.body);
        return {'success': false, 'message': error['error'] ?? 'Login failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Set user role
  static Future<Map<String, dynamic>> setRole(String role) async {
    try {
      final token = await getToken();
      if (token == null) {
        return {'success': false, 'message': 'No authentication token'};
      }

      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.setRoleEndpoint}'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'role': role}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _storage.write(key: AppConfig.roleKey, value: role);
        return {'success': true, 'role': data['role']};
      } else {
        final error = jsonDecode(response.body);
        return {'success': false, 'message': error['error'] ?? 'Failed to set role'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Google Sign In
  static Future<Map<String, dynamic>> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      if (account == null) {
        return {'success': false, 'message': 'Google sign-in cancelled'};
      }

      final GoogleSignInAuthentication auth = await account.authentication;
      
      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.googleAuthEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'idToken': auth.idToken,
          'accessToken': auth.accessToken,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Handle similar to OTP login
        return {'success': true, 'data': data};
      } else {
        final error = jsonDecode(response.body);
        return {'success': false, 'message': error['error'] ?? 'Google sign-in failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Google sign-in error: $e'};
    }
  }

  // Token management
  static Future<void> saveToken(String token) async {
    await _storage.write(key: AppConfig.tokenKey, value: token);
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: AppConfig.tokenKey);
  }

  static Future<void> saveUserData(Map<String, dynamic> userData) async {
    await _storage.write(key: AppConfig.userKey, value: jsonEncode(userData));
    if (userData['role'] != null) {
      await _storage.write(key: AppConfig.roleKey, value: userData['role']);
    }
  }

  static Future<UserModel?> getUserData() async {
    final userJson = await _storage.read(key: AppConfig.userKey);
    if (userJson != null) {
      return UserModel.fromJson(jsonDecode(userJson));
    }
    return null;
  }

  static Future<String?> getUserRole() async {
    return await _storage.read(key: AppConfig.roleKey);
  }

  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null;
  }

  static Future<void> logout() async {
    await _storage.deleteAll();
    await _googleSignIn.signOut();
  }

  // Check authentication status
  static Future<bool> checkAuthStatus() async {
    try {
      final token = await getToken();
      if (token == null) return false;

      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.checkAuthEndpoint}'),
        headers: {'Authorization': 'Bearer $token'},
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
