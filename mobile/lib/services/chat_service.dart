import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import 'auth_service.dart';

class ChatService {
  // Get conversations list
  static Future<Map<String, dynamic>> getConversations() async {
    try {
      final token = await AuthService.getToken();

      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      // Get user ID from token
      final userData = await AuthService.getUserData();

      if (userData == null || userData.id == null) {
        return {'success': false, 'message': 'User data not found'};
      }

      final userId = userData.id;
      final uri = Uri.parse('${AppConfig.apiBaseUrl}/conversation/$userId');

      final response = await http
          .get(
            uri,
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          )
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              throw Exception('Request timeout');
            },
          );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        // The API returns conversations directly as an array
        if (data is List) {
          return {'success': true, 'conversations': data};
        } else {
          return {
            'success': false,
            'message': 'Invalid response format: expected array',
          };
        }
      } else {
        return {
          'success': false,
          'message': 'Failed to fetch conversations: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get messages for a conversation
  static Future<Map<String, dynamic>> getMessages(String conversationId) async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/messages/$conversationId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // The API returns: { messages: [...], otherUser: {...}, nextCursor: "...", hasMore: true/false }
        return {
          'success': true,
          'messages': data['messages'] ?? [],
          'otherUser': data['otherUser'],
          'nextCursor': data['nextCursor'],
          'hasMore': data['hasMore'] ?? false,
        };
      } else {
        return {'success': false, 'message': 'Failed to fetch messages'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Send a message
  static Future<Map<String, dynamic>> sendMessage({
    required String conversationId,
    required String message,
    String? type,
  }) async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      // Get user ID for sender
      final userData = await AuthService.getUserData();
      if (userData == null || userData.id == null) {
        return {'success': false, 'message': 'User data not found'};
      }

      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/messages'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'conversationId': conversationId,
          'sender': userData.id,
          'text': message,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return {'success': true, 'message': data};
      } else {
        final error = jsonDecode(response.body);
        return {
          'success': false,
          'message': error['error'] ?? 'Failed to send message',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Mark messages as read
  static Future<Map<String, dynamic>> markAsRead(String conversationId) async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/conversations/$conversationId/read'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        return {'success': false, 'message': 'Failed to mark as read'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Delete conversation (admin only)
  static Future<Map<String, dynamic>> deleteConversation(
    String conversationId,
  ) async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.delete(
        Uri.parse('${AppConfig.apiBaseUrl}/conversations/$conversationId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        final error = jsonDecode(response.body);
        return {
          'success': false,
          'message': error['error'] ?? 'Failed to delete conversation',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get conversation details
  static Future<Map<String, dynamic>> getConversationDetails(
    String conversationId,
  ) async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/conversations/$conversationId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'conversation': data};
      } else {
        return {
          'success': false,
          'message': 'Failed to fetch conversation details',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Create a new conversation
  static Future<Map<String, dynamic>> createConversation({
    required String participantId,
    required String initialMessage,
  }) async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      // Get current user ID
      final userData = await AuthService.getUserData();
      if (userData == null || userData.id == null) {
        return {'success': false, 'message': 'User data not found'};
      }

      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/conversation/initiate'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'currentUserId': userData.id,
          'otherUserId': participantId,
          'initialMessage': initialMessage,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'conversationId': data['conversationId'] ?? data['_id'],
          'conversation': data,
        };
      } else {
        return {'success': false, 'message': 'Failed to create conversation'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }
}

// Message Model with User Information
class MessageModel {
  final String? id;
  final String? conversation;
  final dynamic sender; // Can be String (ID) or Map (full user object)
  final String? text;
  final List<dynamic>? media;
  final DateTime? createdAt;
  final List<String>? seenBy;

  MessageModel({
    this.id,
    this.conversation,
    this.sender,
    this.text,
    this.media,
    this.createdAt,
    this.seenBy,
  });

  // Get sender ID whether sender is string or object
  String? get senderId {
    if (sender is String) return sender;
    if (sender is Map<String, dynamic>) return sender['_id'] ?? sender['id'];
    return null;
  }

  // Get sender name
  String get senderName {
    if (sender is Map<String, dynamic>) {
      return sender['name'] ?? 'Unknown User';
    }
    return 'Unknown User';
  }

  // Get sender avatar/profile picture
  String get senderAvatar {
    if (sender is Map<String, dynamic>) {
      final senderData = sender as Map<String, dynamic>;

      // Check for avatar field (populated by API)
      if (senderData['avatar'] != null &&
          senderData['avatar'].toString().isNotEmpty) {
        return senderData['avatar'];
      }

      // Check for profilePicture field
      if (senderData['profilePicture'] != null &&
          senderData['profilePicture'].toString().isNotEmpty) {
        return senderData['profilePicture'];
      }

      // Check for profilePictureUrl field
      if (senderData['profilePictureUrl'] != null &&
          senderData['profilePictureUrl'].toString().isNotEmpty) {
        return senderData['profilePictureUrl'];
      }

      // Check for Instagram profile picture
      if (senderData['instagram'] != null &&
          senderData['instagram']['profilePicture'] != null &&
          senderData['instagram']['profilePicture'].toString().isNotEmpty) {
        return senderData['instagram']['profilePicture'];
      }

      // Generate default avatar with user's name
      final name = senderData['name'] ?? 'user';
      return 'https://api.dicebear.com/7.x/avataaars/svg?seed=$name';
    }

    // Default avatar for string sender IDs
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
  }

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['_id'] ?? json['id'],
      conversation: json['conversation'],
      sender:
          json['sender'], // Keep as dynamic to handle both string and object
      text: json['text'],
      media: json['media'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      seenBy: json['seenBy'] != null ? List<String>.from(json['seenBy']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversation': conversation,
      'sender': sender,
      'text': text,
      'media': media,
      'createdAt': createdAt?.toIso8601String(),
      'seenBy': seenBy,
    };
  }
}

// Conversation Model
class ConversationModel {
  final String? id;
  final String? name;
  final String? role;
  final String? avatar;
  final String? profilePictureUrl;
  final String? lastMessage;
  final DateTime? lastMessageTime;
  final String? userId;
  final int? unreadCount;
  final DateTime? updatedAt;
  final Map<String, dynamic>? participantInfo;
  final Map<String, dynamic>? otherUser;

  ConversationModel({
    this.id,
    this.name,
    this.role,
    this.avatar,
    this.profilePictureUrl,
    this.lastMessage,
    this.lastMessageTime,
    this.userId,
    this.unreadCount,
    this.updatedAt,
    this.participantInfo,
    this.otherUser,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      role: json['role'],
      avatar: json['avatar'],
      profilePictureUrl: json['profilePictureUrl'],
      lastMessage: json['lastMessage'],
      lastMessageTime: json['lastMessageTime'] != null
          ? DateTime.parse(json['lastMessageTime'])
          : null,
      userId: json['userId'],
      unreadCount: json['unreadCount'],
      updatedAt: json['lastMessageTime'] != null
          ? DateTime.parse(json['lastMessageTime'])
          : null,
      participantInfo: {
        'name': json['name'],
        'role': json['role'],
        'avatar': json['avatar'],
        'userId': json['userId'],
      },
      otherUser:
          json['otherUser'] ??
          {
            'name': json['name'],
            'role': json['role'],
            'avatar': json['avatar'],
            'profilePictureUrl': json['profilePictureUrl'],
            'userId': json['userId'],
          },
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'role': role,
      'avatar': avatar,
      'profilePictureUrl': profilePictureUrl,
      'lastMessage': lastMessage,
      'lastMessageTime': lastMessageTime?.toIso8601String(),
      'userId': userId,
      'unreadCount': unreadCount,
      'participantInfo': participantInfo,
      'otherUser': otherUser,
    };
  }
}
