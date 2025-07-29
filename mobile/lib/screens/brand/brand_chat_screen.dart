import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_config.dart';
import '../../main.dart';
import '../../services/chat_service.dart';

class BrandChatScreen extends StatefulWidget {
  final String? conversationId;
  final String? dealId;
  final String? influencerName;

  const BrandChatScreen({
    super.key,
    this.conversationId,
    this.dealId,
    this.influencerName,
  });

  @override
  State<BrandChatScreen> createState() => _BrandChatScreenState();
}

class _BrandChatScreenState extends State<BrandChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<MessageModel> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _messageController.addListener(() {
      setState(() {}); // Update send button state
    });
    _loadConversation();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadConversation() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      if (widget.conversationId != null) {
        // Load existing conversation
        final result = await ChatService.getMessages(widget.conversationId!);

        if (result['success']) {
          final data = result['data'];
          setState(() {
            _messages = (data['messages'] as List)
                .map((m) => MessageModel.fromJson(m))
                .toList();
            _isLoading = false;
          });
          _scrollToBottom();
        } else {
          setState(() {
            _error = result['message'];
            _isLoading = false;
          });
        }
      } else {
        // No existing conversation
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load conversation';
        _isLoading = false;
      });
    }
  }

  Future<void> _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty || _isSending) return;

    setState(() {
      _isSending = true;
    });

    try {
      if (widget.conversationId != null) {
        final result = await ChatService.sendMessage(
          conversationId: widget.conversationId!,
          message: message,
        );

        if (result['success']) {
          _messageController.clear();
          _loadConversation(); // Reload to get the new message
        } else {
          _showError(result['message']);
        }
      } else {
        // Create new conversation first
        final result = await ChatService.createConversation(
          participantId: widget.dealId ?? '',
          initialMessage: message,
        );

        if (result['success']) {
          _messageController.clear();
          // Navigate to the new conversation
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => BrandChatScreen(
                  conversationId: result['conversationId'],
                  influencerName: widget.influencerName,
                ),
              ),
            );
          }
        } else {
          _showError(result['message']);
        }
      }
    } catch (e) {
      _showError('Failed to send message');
    } finally {
      setState(() {
        _isSending = false;
      });
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final currentUserId = authProvider.user?.id;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAF9),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(
            Icons.arrow_back,
            color: Color(AppConfig.darkBlueGray),
          ),
        ),
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    const Color(AppConfig.primaryBlue).withValues(alpha: 0.7),
                    const Color(AppConfig.lightPurple).withValues(alpha: 0.7),
                  ],
                ),
              ),
              child: Center(
                child: Text(
                  widget.influencerName?.isNotEmpty == true
                      ? widget.influencerName![0].toUpperCase()
                      : 'I',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.influencerName ?? 'Influencer',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(AppConfig.darkBlueGray),
                    ),
                  ),
                  Text(
                    'Online',
                    style: TextStyle(fontSize: 12, color: Colors.green[600]),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () {
              // TODO: Show chat options
            },
            icon: const Icon(
              Icons.more_vert,
              color: Color(AppConfig.darkBlueGray),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages List
          Expanded(child: _buildMessagesList(currentUserId)),

          // Message Input
          _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildMessagesList(String? currentUserId) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(AppConfig.primaryOrange)),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadConversation,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(AppConfig.primaryOrange),
                foregroundColor: Colors.white,
              ),
              child: const Text('Retry'),
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
            Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No messages yet',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Start the conversation by sending a message',
              style: TextStyle(fontSize: 14, color: Colors.grey[500]),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      physics: const BouncingScrollPhysics(),
      reverse: true, // Show newest messages at bottom
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final reversedIndex = _messages.length - 1 - index;
        final message = _messages[reversedIndex];
        final isMe = message.sender == currentUserId;

        return _buildMessageBubble(message, isMe);
      },
    );
  }

  Widget _buildMessageBubble(MessageModel message, bool isMe) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isMe
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        children: [
          if (!isMe) ...[
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    const Color(AppConfig.primaryBlue).withValues(alpha: 0.7),
                    const Color(AppConfig.lightPurple).withValues(alpha: 0.7),
                  ],
                ),
              ),
              child: Center(
                child: Text(
                  widget.influencerName?.isNotEmpty == true
                      ? widget.influencerName![0].toUpperCase()
                      : 'I',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],

          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isMe
                    ? const Color(AppConfig.primaryOrange)
                    : Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
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
                      fontSize: 14,
                      color: isMe
                          ? Colors.white
                          : const Color(AppConfig.darkBlueGray),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatTime(message.createdAt),
                    style: TextStyle(
                      fontSize: 10,
                      color: isMe
                          ? Colors.white.withValues(alpha: 0.8)
                          : Colors.grey[500],
                    ),
                  ),
                ],
              ),
            ),
          ),

          if (isMe) ...[
            const SizedBox(width: 8),
            Container(
              width: 32,
              height: 32,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(AppConfig.primaryOrange),
              ),
              child: const Center(
                child: Text(
                  'B',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey[200]!, width: 1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // Attachment button
            Container(
              margin: const EdgeInsets.only(right: 8, bottom: 4),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child: IconButton(
                onPressed: () {
                  // TODO: Add attachment functionality
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Attachment feature coming soon'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
                icon: Icon(
                  Icons.attach_file,
                  color: Colors.grey[600],
                  size: 20,
                ),
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                padding: EdgeInsets.zero,
              ),
            ),
            // Message input
            Expanded(
              child: Container(
                constraints: const BoxConstraints(maxHeight: 120),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.grey[300]!, width: 1),
                ),
                child: TextField(
                  controller: _messageController,
                  decoration: InputDecoration(
                    hintText: 'Type a message...',
                    hintStyle: TextStyle(color: Colors.grey[500], fontSize: 15),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                  ),
                  maxLines: null,
                  minLines: 1,
                  textCapitalization: TextCapitalization.sentences,
                  style: const TextStyle(fontSize: 15),
                  onSubmitted: (_) => _sendMessage(),
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Send button
            Container(
              margin: const EdgeInsets.only(bottom: 4),
              decoration: BoxDecoration(
                color: _messageController.text.trim().isEmpty
                    ? Colors.grey[400]
                    : const Color(AppConfig.primaryOrange),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(
                      AppConfig.primaryOrange,
                    ).withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: IconButton(
                onPressed: _isSending || _messageController.text.trim().isEmpty
                    ? null
                    : _sendMessage,
                icon: _isSending
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.send, color: Colors.white, size: 18),
                constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                padding: EdgeInsets.zero,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime? timestamp) {
    if (timestamp == null) return '';

    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}
