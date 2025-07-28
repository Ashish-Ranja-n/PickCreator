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

      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/conversations'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'conversations': data};
      } else {
        return {'success': false, 'message': 'Failed to fetch conversations'};
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
        Uri.parse(
          '${AppConfig.apiBaseUrl}/conversations/$conversationId/messages',
        ),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'messages': data};
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

      final response = await http.post(
        Uri.parse(
          '${AppConfig.apiBaseUrl}/conversations/$conversationId/messages',
        ),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'message': message, 'type': type ?? 'text'}),
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

      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/conversations'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'participantId': participantId,
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

// Message Model
class MessageModel {
  final String? id;
  final String? conversationId;
  final String? senderId;
  final String? message;
  final String? type;
  final DateTime? timestamp;
  final bool? isRead;
  final Map<String, dynamic>? senderInfo;

  MessageModel({
    this.id,
    this.conversationId,
    this.senderId,
    this.message,
    this.type,
    this.timestamp,
    this.isRead,
    this.senderInfo,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['_id'] ?? json['id'],
      conversationId: json['conversationId'],
      senderId: json['senderId'],
      message: json['message'],
      type: json['type'],
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : null,
      isRead: json['isRead'],
      senderInfo: json['senderInfo'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'message': message,
      'type': type,
      'timestamp': timestamp?.toIso8601String(),
      'isRead': isRead,
      'senderInfo': senderInfo,
    };
  }
}

// Conversation Model
class ConversationModel {
  final String? id;
  final List<String>? participants;
  final MessageModel? lastMessage;
  final DateTime? updatedAt;
  final Map<String, dynamic>? participantInfo;
  final int? unreadCount;

  ConversationModel({
    this.id,
    this.participants,
    this.lastMessage,
    this.updatedAt,
    this.participantInfo,
    this.unreadCount,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(
      id: json['_id'] ?? json['id'],
      participants: json['participants'] != null
          ? List<String>.from(json['participants'])
          : null,
      lastMessage: json['lastMessage'] != null
          ? MessageModel.fromJson(json['lastMessage'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
      participantInfo: json['participantInfo'],
      unreadCount: json['unreadCount'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'participants': participants,
      'lastMessage': lastMessage?.toJson(),
      'updatedAt': updatedAt?.toIso8601String(),
      'participantInfo': participantInfo,
      'unreadCount': unreadCount,
    };
  }
}
