import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../main.dart';
import '../../services/chat_service.dart';
import '../../services/socket_service.dart';
import '../../config/app_config.dart';
import 'brand_chat_screen.dart';

class BrandConversationsScreen extends StatefulWidget {
  const BrandConversationsScreen({super.key});

  @override
  State<BrandConversationsScreen> createState() =>
      _BrandConversationsScreenState();
}

class _BrandConversationsScreenState extends State<BrandConversationsScreen>
    with WidgetsBindingObserver {
  List<ConversationModel> _conversations = [];
  bool _isLoading = true;
  bool _isRefreshing = false;
  final SocketService _socketService = SocketService.instance;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeSocket();
    _loadConversations();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _socketService.disconnect();
    super.dispose();
  }

  void _initializeSocket() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final currentUserId = authProvider.user?.id;

    if (currentUserId != null) {
      _socketService.connect();

      // Listen for new messages to refresh conversations
      _socketService.onNewMessage = (data) {
        _loadConversations();
      };
    }
  }

  Future<void> _loadConversations() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userId = authProvider.user?.id;

    if (!_isRefreshing) {
      setState(() {
        _isLoading = true;
      });
    }

    if (userId == null) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isRefreshing = false;
        });
        // Show error message after the current frame
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Please log in to view conversations'),
                backgroundColor: Colors.red,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        });
      }
      return;
    }

    try {
      final result = await ChatService.getConversations();

      if (result['success'] && mounted) {
        final conversationsData = result['conversations'];

        if (conversationsData is List) {
          final conversations = conversationsData
              .map((json) => ConversationModel.fromJson(json))
              .toList();

          setState(() {
            _conversations = conversations;
          });
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Failed to load conversations: ${result['message']}',
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
            content: Text('Failed to load conversations: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isRefreshing = false;
        });
      }
    }
  }

  Future<void> _refreshConversations() async {
    setState(() {
      _isRefreshing = true;
    });
    await _loadConversations();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        shadowColor: Colors.black.withValues(alpha: 0.1),
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Messages',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          IconButton(
            onPressed: _isLoading ? null : _refreshConversations,
            icon: AnimatedRotation(
              turns: _isRefreshing ? 1 : 0,
              duration: const Duration(milliseconds: 500),
              child: Icon(
                Icons.refresh_rounded,
                color: _isLoading
                    ? Colors.grey
                    : const Color(AppConfig.primaryBlue),
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _conversations.isEmpty) {
      return _buildLoadingState();
    }

    if (_conversations.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _refreshConversations,
      color: const Color(AppConfig.primaryBlue),
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: _conversations.length,
        itemBuilder: (context, index) {
          final conversation = _conversations[index];
          return _buildConversationItem(conversation);
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: const Color(AppConfig.primaryBlue).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(30),
            ),
            child: const Center(
              child: CircularProgressIndicator(
                color: Color(AppConfig.primaryBlue),
                strokeWidth: 3,
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Loading conversations...',
            style: TextStyle(color: Colors.grey, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
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
            'No conversations yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start chatting with influencers from your deals',
            style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _refreshConversations,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Refresh'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(AppConfig.primaryBlue),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConversationItem(ConversationModel conversation) {
    // Get avatar URL using the same logic as React implementation
    String getAvatarUrl() {
      final otherUser = conversation.otherUser;

      // Check for profile pictures (usually for influencers)
      if (otherUser?['profilePictureUrl'] != null &&
          otherUser!['profilePictureUrl'] != "undefined" &&
          otherUser['profilePictureUrl'] != "null" &&
          otherUser['profilePictureUrl'].toString().isNotEmpty) {
        return otherUser['profilePictureUrl'];
      }

      // Check for regular avatar
      if (otherUser?['avatar'] != null &&
          otherUser!['avatar'] != "/default-avatar.png" &&
          otherUser['avatar'] != "undefined" &&
          otherUser['avatar'] != "null" &&
          otherUser['avatar'].toString().isNotEmpty) {
        return otherUser['avatar'];
      }

      // Check for Instagram profile pictures
      if (otherUser?['instagram']?['profilePicture'] != null &&
          otherUser!['instagram']['profilePicture'] != "undefined" &&
          otherUser['instagram']['profilePicture'] != "null" &&
          otherUser['instagram']['profilePicture'].toString().isNotEmpty) {
        return otherUser['instagram']['profilePicture'];
      }

      // Fallback to DiceBear avatar
      final name = otherUser?['name'] ?? 'User';
      return 'https://api.dicebear.com/7.x/avataaars/svg?seed=$name';
    }

    final otherUserName = conversation.otherUser?['name'] ?? 'Unknown User';
    final lastMessage = conversation.lastMessage ?? 'No messages yet';
    final avatarUrl = getAvatarUrl();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _openConversation(conversation),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Profile Picture
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(
                        AppConfig.primaryBlue,
                      ).withValues(alpha: 0.1),
                      width: 2,
                    ),
                  ),
                  child: ClipOval(
                    child: Image.network(
                      avatarUrl,
                      width: 56,
                      height: 56,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          width: 56,
                          height: 56,
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
                                fontSize: 20,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),

                const SizedBox(width: 16),

                // Conversation Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              otherUserName,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.black87,
                              ),
                            ),
                          ),
                          if (conversation.lastMessageTime != null)
                            Text(
                              _formatTime(conversation.lastMessageTime!),
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[500],
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        lastMessage,
                        style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 8),

                // Arrow Icon
                Icon(
                  Icons.chevron_right_rounded,
                  color: Colors.grey[400],
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openConversation(ConversationModel conversation) {
    final otherUserName = conversation.otherUser?['name'] ?? 'Unknown User';

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BrandChatScreen(
          conversationId: conversation.id!,
          influencerName: otherUserName,
        ),
      ),
    );
  }

  String _formatTime(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inDays > 0) {
      return '${difference.inDays}d';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m';
    } else {
      return 'now';
    }
  }
}
