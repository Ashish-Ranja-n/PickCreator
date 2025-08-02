import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../main.dart';
import '../../services/chat_service.dart';
import '../../services/socket_service.dart';
import '../../config/app_config.dart';
import 'dart:async';

class BrandChatScreen extends StatefulWidget {
  final String conversationId;
  final String? influencerName;

  const BrandChatScreen({
    super.key,
    required this.conversationId,
    this.influencerName,
  });

  @override
  State<BrandChatScreen> createState() => _BrandChatScreenState();
}

class _BrandChatScreenState extends State<BrandChatScreen>
    with WidgetsBindingObserver {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final SocketService _socketService = SocketService.instance;

  List<MessageModel> _messages = [];
  Map<String, dynamic>? _otherUser;
  bool _isLoading = true;
  bool _isSending = false;
  String? _typingUser;
  Timer? _typingTimer;
  bool _isConnected = false;
  bool _hasText = false;
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Add listener to text controller for reactive send button
    _messageController.addListener(_updateSendButtonState);

    // Initialize everything in parallel for better performance
    _initializeAsync();
  }

  void _updateSendButtonState() {
    final hasText = _messageController.text.trim().isNotEmpty;
    if (hasText != _hasText) {
      setState(() {
        _hasText = hasText;
      });
    }
  }

  Future<void> _initializeAsync() async {
    _getCurrentUser();
    await _loadMessages();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _messageController.removeListener(_updateSendButtonState);
    _messageController.dispose();
    _scrollController.dispose();
    _typingTimer?.cancel();
    _socketService.leaveConversation(widget.conversationId);
    _socketService.disconnect();
    super.dispose();
  }

  void _getCurrentUser() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    _currentUserId = authProvider.user?.id;

    // Initialize socket after we have user ID
    if (_currentUserId != null) {
      _initializeSocket();
    }
  }

  void _initializeSocket() {
    if (_currentUserId != null) {
      _socketService.connect();

      // Set up socket event listeners
      _socketService.onConnect = () {
        if (mounted) {
          setState(() {
            _isConnected = true;
          });
          _socketService.joinConversation(widget.conversationId);
        }
      };

      _socketService.onDisconnect = () {
        if (mounted) {
          setState(() {
            _isConnected = false;
          });
        }
      };

      _socketService.onNewMessage = (data) {
        if (!mounted) return;

        try {
          final message = MessageModel.fromJson(data);

          // Prevent duplicate messages by checking if message already exists
          final existingIndex = _messages.indexWhere(
            (m) =>
                m.id == message.id ||
                (m.text == message.text &&
                    m.senderId == message.senderId &&
                    (m.createdAt != null &&
                        message.createdAt != null &&
                        m.createdAt!
                                .difference(message.createdAt!)
                                .abs()
                                .inSeconds <
                            5)),
          );

          if (existingIndex == -1) {
            setState(() {
              _messages.add(message);
              _messages.sort(
                (a, b) => (a.createdAt ?? DateTime.now()).compareTo(
                  b.createdAt ?? DateTime.now(),
                ),
              );
            });
            _scrollToBottom();
          }
        } catch (e) {
          // Handle parsing error
        }
      };

      _socketService.onUserTyping = (data) {
        if (!mounted) return;

        final userId = data['userId'] as String?;
        final isTyping = data['isTyping'] as bool? ?? false;

        if (userId != _currentUserId) {
          setState(() {
            _typingUser = isTyping ? userId : null;
          });
        }
      };
    }
  }

  Future<void> _loadMessages() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await ChatService.getMessages(widget.conversationId);
      if (result['success'] && mounted) {
        final messagesData = result['messages'];
        setState(() {
          if (messagesData != null && messagesData is List) {
            _messages = messagesData
                .map((m) => MessageModel.fromJson(m))
                .toList();
          } else {
            _messages = [];
          }
          _otherUser = result['otherUser'];
        });

        // Scroll to bottom after loading messages
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _scrollToBottom();
        });
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Failed to load messages: ${result['message'] ?? 'Unknown error'}',
              ),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load messages: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients && mounted) {
      _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
    }
  }

  String _getOnlineStatus() {
    if (!_isConnected) {
      return 'Connecting...';
    }

    // Simple logic: if we have recent messages or typing activity, show as online
    // Otherwise show "last seen recently" for a more realistic feel
    if (_typingUser != null && _typingUser!.isNotEmpty) {
      return 'Online';
    }

    // Check if there are recent messages (within last 5 minutes)
    if (_messages.isNotEmpty) {
      final lastMessage = _messages.last;
      final messageTime = lastMessage.createdAt;

      if (messageTime != null) {
        final now = DateTime.now();
        final difference = now.difference(messageTime);

        if (difference.inMinutes < 5) {
          return 'Online';
        } else if (difference.inHours < 1) {
          return 'Last seen recently';
        } else if (difference.inDays < 1) {
          return 'Last seen today';
        } else {
          return 'Last seen ${difference.inDays} days ago';
        }
      }
    }

    return 'Last seen recently';
  }

  Color _getOnlineStatusColor() {
    if (!_isConnected) {
      return Colors.grey[600]!;
    }

    final status = _getOnlineStatus();
    if (status == 'Online') {
      return Colors.green;
    } else {
      return Colors.grey[600]!;
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isSending || _currentUserId == null) {
      return;
    }

    setState(() {
      _isSending = true;
    });

    // Create message data following React pattern
    final messageData = {
      'conversationId': widget.conversationId,
      'sender': _currentUserId,
      'text': text,
      'timestamp': DateTime.now().toIso8601String(),
    };

    // Clear input immediately for better UX
    _messageController.clear();

    try {
      // Send via socket first for real-time updates
      _socketService.sendMessage(messageData);

      // Then send to API for persistence
      final response = await ChatService.sendMessage(
        conversationId: widget.conversationId,
        message: text,
      );

      if (!response['success'] && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send message: ${response['message']}'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send message: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
        });

        // Force scroll to bottom after sending
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _scrollToBottom();
        });
      }
    }
  }

  void _onTextChanged(String text) {
    if (_currentUserId == null) return;

    // Cancel previous timer
    _typingTimer?.cancel();

    // Send typing status
    _socketService.updateTypingStatus(
      widget.conversationId,
      _currentUserId!,
      text.isNotEmpty,
    );

    // Set timer to stop typing after 2 seconds of inactivity
    if (text.isNotEmpty) {
      _typingTimer = Timer(const Duration(seconds: 2), () {
        _socketService.updateTypingStatus(
          widget.conversationId,
          _currentUserId!,
          false,
        );
      });
    }
  }

  // Helper function to get profile picture URL
  String _getProfilePictureUrl(Map<String, dynamic>? user) {
    if (user == null) {
      return 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
    }

    // Check for Instagram profile picture first
    if (user['instagram']?['profilePicture'] != null &&
        user['instagram']['profilePicture'] != "undefined" &&
        user['instagram']['profilePicture'] != "null" &&
        user['instagram']['profilePicture'].toString().isNotEmpty) {
      return user['instagram']['profilePicture'];
    }

    // Check for profilePictureUrl (for influencers)
    if (user['profilePictureUrl'] != null &&
        user['profilePictureUrl'] != "undefined" &&
        user['profilePictureUrl'] != "null" &&
        user['profilePictureUrl'].toString().isNotEmpty) {
      return user['profilePictureUrl'];
    }

    // Check for regular avatar
    if (user['avatar'] != null &&
        user['avatar'] != "undefined" &&
        user['avatar'] != "null" &&
        user['avatar'] != "/default-avatar.png" &&
        user['avatar'].toString().isNotEmpty) {
      return user['avatar'];
    }

    // Fallback to DiceBear avatar
    final name = user['name'] ?? 'User';
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=$name';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: _buildAppBar(),
      body: Column(
        children: [
          // Messages area
          Expanded(child: _buildMessagesArea()),
          // Typing indicator
          if (_typingUser != null) _buildTypingIndicator(),
          // Message input
          _buildMessageInput(),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    final otherUserName =
        widget.influencerName ?? _otherUser?['name'] ?? 'Chat';
    final otherUserAvatar = _getProfilePictureUrl(_otherUser);

    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      shadowColor: Colors.black.withValues(alpha: 0.1),
      surfaceTintColor: Colors.transparent,
      leading: IconButton(
        onPressed: () => Navigator.pop(context),
        icon: const Icon(
          Icons.arrow_back_ios_rounded,
          color: Colors.black87,
          size: 20,
        ),
      ),
      title: Row(
        children: [
          // Profile Picture
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: const Color(
                  AppConfig.primaryBlue,
                ).withValues(alpha: 0.2),
                width: 1.5,
              ),
            ),
            child: ClipOval(
              child: Image.network(
                otherUserAvatar,
                width: 36,
                height: 36,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [
                          const Color(AppConfig.primaryBlue),
                          const Color(AppConfig.lightPurple),
                        ],
                      ),
                    ),
                    child: Center(
                      child: Text(
                        otherUserName.isNotEmpty
                            ? otherUserName[0].toUpperCase()
                            : 'U',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Name and status
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  otherUserName,
                  style: const TextStyle(
                    color: Colors.black87,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  _getOnlineStatus(),
                  style: TextStyle(
                    color: _getOnlineStatusColor(),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          onPressed: () {
            // Add more options if needed
          },
          icon: Icon(
            Icons.more_vert_rounded,
            color: Colors.grey[600],
            size: 20,
          ),
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildMessagesArea() {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: const Color(
                  AppConfig.primaryBlue,
                ).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(25),
              ),
              child: const Center(
                child: CircularProgressIndicator(
                  color: Color(AppConfig.primaryBlue),
                  strokeWidth: 2.5,
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Loading messages...',
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
          ],
        ),
      );
    }

    if (_messages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(40),
              ),
              child: Icon(
                Icons.chat_bubble_outline_rounded,
                size: 40,
                color: Colors.grey[400],
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'No messages yet',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Start the conversation!',
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _messages.length,
      physics: const BouncingScrollPhysics(),
      cacheExtent: 1000,
      itemBuilder: (context, index) {
        final message = _messages[index];
        final isMe = message.senderId == _currentUserId;
        return _buildMessageBubble(message, isMe);
      },
    );
  }

  Widget _buildMessageBubble(MessageModel message, bool isMe) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isMe
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Other user's avatar (left side)
          if (!isMe) ...[
            Container(
              width: 32,
              height: 32,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(
                    AppConfig.primaryBlue,
                  ).withValues(alpha: 0.2),
                  width: 1,
                ),
              ),
              child: ClipOval(
                child: Image.network(
                  _getProfilePictureUrl(_otherUser),
                  width: 32,
                  height: 32,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [
                            const Color(AppConfig.primaryBlue),
                            const Color(AppConfig.lightPurple),
                          ],
                        ),
                      ),
                      child: Center(
                        child: Text(
                          (_otherUser?['name'] ?? 'U')[0].toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ],

          // Message bubble
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.75,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isMe
                    ? const Color(AppConfig.primaryBlue)
                    : Colors.grey[100],
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(20),
                  topRight: const Radius.circular(20),
                  bottomLeft: Radius.circular(isMe ? 20 : 4),
                  bottomRight: Radius.circular(isMe ? 4 : 20),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    message.text ?? '',
                    style: TextStyle(
                      color: isMe ? Colors.white : Colors.black87,
                      fontSize: 15,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatMessageTime(message.createdAt ?? DateTime.now()),
                    style: TextStyle(
                      color: isMe
                          ? Colors.white.withValues(alpha: 0.8)
                          : Colors.grey[600],
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Spacing for my messages
          if (isMe) const SizedBox(width: 8),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: const Color(
                  AppConfig.primaryBlue,
                ).withValues(alpha: 0.2),
                width: 1,
              ),
            ),
            child: ClipOval(
              child: Image.network(
                _getProfilePictureUrl(_otherUser),
                width: 32,
                height: 32,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [
                          const Color(AppConfig.primaryBlue),
                          const Color(AppConfig.lightPurple),
                        ],
                      ),
                    ),
                    child: Center(
                      child: Text(
                        (_otherUser?['name'] ?? 'U')[0].toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
                bottomRight: Radius.circular(20),
                bottomLeft: Radius.circular(4),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'typing',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                    fontStyle: FontStyle.italic,
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.grey[400],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Attachment button
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: Colors.grey[300]!, width: 1),
              ),
              child: IconButton(
                onPressed: () {
                  // Add attachment functionality
                },
                icon: Icon(
                  Icons.attach_file_rounded,
                  color: Colors.grey[600],
                  size: 20,
                ),
              ),
            ),

            const SizedBox(width: 12),

            // Text input
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.grey[200]!, width: 1),
                ),
                child: TextField(
                  controller: _messageController,
                  onChanged: _onTextChanged,
                  decoration: InputDecoration(
                    hintText: 'Type a message...',
                    hintStyle: TextStyle(color: Colors.grey[500], fontSize: 15),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                  ),
                  style: const TextStyle(fontSize: 15, color: Colors.black87),
                  maxLines: null,
                  textCapitalization: TextCapitalization.sentences,
                ),
              ),
            ),

            const SizedBox(width: 12),

            // Send button
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(AppConfig.primaryBlue),
                    const Color(AppConfig.primaryBlue).withValues(alpha: 0.8),
                  ],
                ),
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: const Color(
                      AppConfig.primaryBlue,
                    ).withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: IconButton(
                onPressed: _hasText && !_isSending ? _sendMessage : null,
                icon: _isSending
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(
                        Icons.send_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatMessageTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'now';
    }
  }
}
