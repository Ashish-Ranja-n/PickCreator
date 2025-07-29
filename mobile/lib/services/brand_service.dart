import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/user_model.dart';
import 'auth_service.dart';

class BrandService {
  // Get brand dashboard stats by aggregating deals data
  static Future<Map<String, dynamic>> getDashboardStats() async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      // Get deals data to calculate stats
      final dealsResponse = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/deals'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (dealsResponse.statusCode == 200) {
        final dealsData = jsonDecode(dealsResponse.body);
        if (dealsData['success']) {
          final deals = dealsData['deals'] as List;

          // Calculate stats from deals
          final activeDeals = deals
              .where(
                (deal) =>
                    deal['status'] == 'ongoing' ||
                    deal['status'] == 'accepted' ||
                    deal['status'] == 'content_approved',
              )
              .length;

          final completedDeals = deals
              .where((deal) => deal['status'] == 'completed')
              .length;

          final totalSpent = deals
              .where((deal) => deal['status'] == 'completed')
              .fold(0.0, (sum, deal) => sum + (deal['totalAmount'] ?? 0.0));

          final totalInfluencers = deals
              .expand((deal) => deal['influencers'] ?? [])
              .map((inf) => inf['id'])
              .toSet()
              .length;

          return {
            'success': true,
            'data': {
              'activeDeals': activeDeals,
              'completedDeals': completedDeals,
              'totalSpent': totalSpent,
              'totalInfluencers': totalInfluencers,
              'totalCampaigns': deals.length,
            },
          };
        }
      }

      return {'success': false, 'message': 'Failed to fetch dashboard stats'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get influencers list
  static Future<Map<String, dynamic>> getInfluencers({
    int page = 1,
    int limit = 10,
    String? search,
    String? location,
  }) async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
        'sortBy': 'followers',
        'sortOrder': 'desc',
      };

      if (search != null && search.isNotEmpty) {
        queryParams['city'] = search; // Use city filter for search
      }
      if (location != null && location.isNotEmpty) {
        queryParams['city'] = location; // Use city filter for location
      }

      final uri = Uri.parse(
        '${AppConfig.apiBaseUrl}/influencer/search',
      ).replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          return {
            'success': true,
            'influencers': (data['influencers'] as List)
                .map((influencer) => InfluencerInfo.fromJson(influencer))
                .toList(),
            'pagination': data['pagination'],
          };
        } else {
          return {
            'success': false,
            'message': data['error'] ?? 'Failed to fetch influencers',
          };
        }
      } else {
        return {'success': false, 'message': 'Failed to fetch influencers'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Send connect request to influencer
  static Future<Map<String, dynamic>> sendConnectRequest({
    required String influencerId,
    required String description,
    required double amount,
  }) async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/deals'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'dealType': 'single',
          'dealName': 'Connect Request',
          'description': description,
          'influencers': [
            {
              'id': influencerId,
              'name': 'Influencer', // This will be updated by the backend
              'profilePictureUrl': '',
            },
          ],
          'payPerInfluencer': amount,
          'totalAmount': amount,
          'contentRequirements': {
            'reels': 1,
            'posts': 0,
            'stories': 0,
            'lives': 0,
          },
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          return {'success': true, 'deal': data['deal']};
        } else {
          return {
            'success': false,
            'message': data['error'] ?? 'Failed to send connect request',
          };
        }
      } else {
        final error = jsonDecode(response.body);
        return {
          'success': false,
          'message': error['error'] ?? 'Failed to send connect request',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get brand deals
  static Future<Map<String, dynamic>> getDeals() async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/deals'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          return {
            'success': true,
            'deals': (data['deals'] as List)
                .map((deal) => DealModel.fromJson(deal))
                .toList(),
          };
        } else {
          return {
            'success': false,
            'message': data['error'] ?? 'Failed to fetch deals',
          };
        }
      } else {
        return {'success': false, 'message': 'Failed to fetch deals'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Deal actions (accept, reject, pay, etc.)
  static Future<Map<String, dynamic>> performDealAction({
    required String dealId,
    required String action,
    Map<String, dynamic>? data,
  }) async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/deals/$dealId/$action'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: data != null ? jsonEncode(data) : null,
      );

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        return {'success': true, 'data': responseData};
      } else {
        final error = jsonDecode(response.body);
        return {
          'success': false,
          'message': error['error'] ?? 'Failed to perform action',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Content actions (approve, reject)
  static Future<Map<String, dynamic>> performContentAction({
    required String dealId,
    required String contentId,
    required String action,
    String? comment,
  }) async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final endpoint = action == 'approve'
          ? 'approve-content'
          : 'reject-content';
      final body = <String, dynamic>{'contentId': contentId};
      if (comment != null) {
        body['comment'] = comment;
      }

      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/deals/$dealId/$endpoint'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        return {'success': true, 'data': responseData};
      } else {
        final error = jsonDecode(response.body);
        return {
          'success': false,
          'message': error['error'] ?? 'Failed to perform content action',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get brand profile
  static Future<Map<String, dynamic>> getBrandProfile() async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/brand/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final brandInfo = BrandInfo.fromJson(data);
        return {'success': true, 'profile': brandInfo};
      } else {
        final error = jsonDecode(response.body);
        return {
          'success': false,
          'message': error['error'] ?? 'Failed to fetch profile',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Update brand profile
  static Future<Map<String, dynamic>> updateBrandProfile(
    Map<String, dynamic> profileData,
  ) async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.patch(
        Uri.parse('${AppConfig.apiBaseUrl}/brand/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(profileData),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'profile': data};
      } else {
        final error = jsonDecode(response.body);
        return {
          'success': false,
          'message': error['error'] ?? 'Failed to update profile',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Create or get conversation
  static Future<Map<String, dynamic>> createConversation({
    required String otherUserId,
  }) async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final currentUser = await AuthService.getUserData();
      if (currentUser?.id == null) {
        return {'success': false, 'message': 'User data not found'};
      }

      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/conversation'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'currentUserId': currentUser!.id,
          'otherUserId': otherUserId,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'conversationId': data['conversationId']};
      } else {
        final error = jsonDecode(response.body);
        return {
          'success': false,
          'message': error['error'] ?? 'Failed to create conversation',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }
}
