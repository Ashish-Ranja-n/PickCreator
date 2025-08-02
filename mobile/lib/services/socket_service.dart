import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/app_config.dart';
import 'auth_service.dart';

class SocketService {
  static SocketService? _instance;
  static SocketService get instance => _instance ??= SocketService._internal();

  SocketService._internal();

  io.Socket? _socket;
  bool _isConnected = false;
  String? _currentUserId;

  // Event callbacks
  Function(Map<String, dynamic>)? onNewMessage;
  Function(Map<String, dynamic>)? onUserStatusChange;
  Function(Map<String, dynamic>)? onUserTyping;
  Function(List<String>)? onOnlineUsers;
  Function()? onConnect;
  Function()? onDisconnect;

  bool get isConnected => _isConnected;
  String? get currentUserId => _currentUserId;

  Future<void> connect() async {
    if (_socket != null && _isConnected) {
      return; // Already connected
    }

    try {
      final token = await AuthService.getToken();
      final userData = await AuthService.getUserData();

      if (token == null || userData?.id == null) {
        return;
      }

      _currentUserId = userData!.id;

      // Socket.IO server URL from environment
      const socketUrl = AppConfig.socketServerUrl;

      _socket = io.io(
        socketUrl,
        io.OptionBuilder()
            .setTransports(['websocket'])
            .setAuth({'token': token})
            .setReconnectionAttempts(3)
            .setReconnectionDelay(300)
            .setTimeout(5000)
            .enableForceNew()
            .enableAutoConnect()
            .build(),
      );

      _setupEventListeners();
    } catch (e) {
      // Handle connection error silently
    }
  }

  void _setupEventListeners() {
    if (_socket == null) return;

    _socket!.onConnect((_) {
      _isConnected = true;

      // Notify server that user is online
      if (_currentUserId != null) {
        _socket!.emit('userOnline', _currentUserId);
      }

      // Request current online users list
      _socket!.emit('getOnlineUsers');

      onConnect?.call();
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      onDisconnect?.call();
    });

    _socket!.onConnectError((error) {
      _isConnected = false;
    });

    _socket!.onError((error) {
      // Handle socket error silently
    });

    // Listen for new messages
    _socket!.on('newMessage', (data) {
      if (data is Map<String, dynamic>) {
        onNewMessage?.call(data);
      }
    });

    // Listen for user status changes
    _socket!.on('userStatusChange', (data) {
      if (data is Map<String, dynamic>) {
        onUserStatusChange?.call(data);
      }
    });

    // Listen for typing indicators
    _socket!.on('userTyping', (data) {
      if (data is Map<String, dynamic>) {
        onUserTyping?.call(data);
      }
    });

    // Listen for online users list
    _socket!.on('onlineUsers', (data) {
      if (data is List) {
        final users = data.cast<String>();
        onOnlineUsers?.call(users);
      }
    });

    // Alternative event name for online users
    _socket!.on('getOnlineUsers', (data) {
      if (data is List) {
        final users = data.cast<String>();
        onOnlineUsers?.call(users);
      }
    });
  }

  void joinConversation(String conversationId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('joinRoom', conversationId);
    }
  }

  void leaveConversation(String conversationId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('leaveRoom', conversationId);
    }
  }

  void sendMessage(Map<String, dynamic> messageData) {
    if (_socket != null && _isConnected) {
      _socket!.emit('sendMessage', messageData);
    }
  }

  void updateTypingStatus(String conversationId, String userId, bool isTyping) {
    if (_socket != null && _isConnected) {
      _socket!.emit('typing', {
        'conversationId': conversationId,
        'userId': userId,
        'isTyping': isTyping,
      });
    }
  }

  void joinChatRoom(String roomId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('joinChatRoom', roomId);
    }
  }

  void leaveChatRoom(String roomId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('leaveChatRoom', roomId);
    }
  }

  void sendRoomMessage(Map<String, dynamic> messageData) {
    if (_socket != null && _isConnected) {
      _socket!.emit('sendRoomMessage', messageData);
    }
  }

  void disconnect() {
    if (_socket != null) {
      if (_currentUserId != null) {
        _socket!.emit('userOffline', _currentUserId);
      }
      _socket!.disconnect();
      _socket = null;
      _isConnected = false;
      _currentUserId = null;
    }
  }

  void dispose() {
    disconnect();
    _instance = null;
  }
}
