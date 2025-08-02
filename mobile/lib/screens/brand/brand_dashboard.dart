import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_config.dart';
import '../../main.dart';
import '../../models/user_model.dart';
import '../../services/brand_service.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/brand/influencer_card.dart';
import '../../widgets/brand/connect_request_dialog.dart';
import '../../widgets/brand/deal_card.dart';
import '../auth/welcome_screen.dart';
import 'brand_chat_screen.dart';
import 'brand_conversations_screen.dart';

class BrandDashboard extends StatefulWidget {
  const BrandDashboard({super.key});

  @override
  State<BrandDashboard> createState() => _BrandDashboardState();
}

class _BrandDashboardState extends State<BrandDashboard> {
  int _selectedIndex = 0;

  final List<Widget> _pages = [
    const BrandHomeTab(),
    const BrandInfluencersTab(),
    const BrandDealsTab(),
    const BrandProfileTab(),
  ];

  String _getAppBarTitle() {
    return 'pickcreator | studio';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAF9), // Light gray-green background
      appBar: AppBar(
        elevation: 0,
        title: Align(
          alignment: Alignment.centerLeft,
          child: Text(
            _getAppBarTitle(),
            style: TextStyle(
              color: Theme.of(context).textTheme.headlineMedium?.color,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
        ),
        actions: [
          // Dark mode toggle
          Consumer<ThemeProvider>(
            builder: (context, themeProvider, child) {
              return IconButton(
                icon: Icon(
                  themeProvider.isDarkMode
                      ? Icons.light_mode_outlined
                      : Icons.dark_mode_outlined,
                ),
                onPressed: () {
                  themeProvider.toggleTheme();
                },
                tooltip: themeProvider.isDarkMode ? 'Light Mode' : 'Dark Mode',
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // TODO: Navigate to notifications
            },
          ),
          // Chat button moved to Instagram-style position (replacing 3-dot menu)
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const BrandConversationsScreen(),
                ),
              );
            },
          ),
        ],
      ),
      body: _pages[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(AppConfig.primaryOrange),
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(
            icon: Icon(Icons.people),
            label: 'Influencers',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.handshake), label: 'Deals'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

class BrandHomeTab extends StatefulWidget {
  const BrandHomeTab({super.key});

  @override
  State<BrandHomeTab> createState() => _BrandHomeTabState();
}

class _BrandHomeTabState extends State<BrandHomeTab> {
  Map<String, dynamic>? _dashboardStats;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDashboardStats();
  }

  Future<void> _loadDashboardStats() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await BrandService.getDashboardStats();

      if (result['success']) {
        setState(() {
          _dashboardStats = result['stats'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = result['message'];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load dashboard stats';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadDashboardStats,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Promotional Section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(AppConfig.primaryOrange),
                    const Color(AppConfig.primaryOrange).withValues(alpha: 0.8),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Advertise your business!',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Connect with top influencers and grow your brand',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      // Navigate to influencers tab
                      DefaultTabController.of(context).animateTo(1);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(AppConfig.primaryOrange),
                    ),
                    child: const Text('Browse Influencers'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Dashboard Stats Header
            Row(
              children: [
                const Text(
                  'Your Dashboard',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(AppConfig.darkBlueGray),
                  ),
                ),
                const Spacer(),
                if (_isLoading)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Color(AppConfig.primaryOrange),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),

            // Stats Content
            _buildStatsContent(),

            const SizedBox(height: 24),

            // Quick Actions
            _buildQuickActions(),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsContent() {
    if (_error != null) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.red.shade200),
        ),
        child: Column(
          children: [
            Icon(Icons.error_outline, color: Colors.red.shade400, size: 32),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: TextStyle(color: Colors.red.shade700, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: _loadDashboardStats,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                title: 'Active Deals',
                value: _dashboardStats?['activeDeals']?.toString() ?? '0',
                icon: Icons.handshake,
                color: const Color(AppConfig.primaryBlue),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildStatCard(
                title: 'Total Spent',
                value: '₹${_dashboardStats?['totalSpent']?.toString() ?? '0'}',
                icon: Icons.currency_rupee,
                color: const Color(AppConfig.primaryOrange),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                title: 'Influencers',
                value: _dashboardStats?['totalInfluencers']?.toString() ?? '0',
                icon: Icons.people,
                color: const Color(AppConfig.lightPurple),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildStatCard(
                title: 'Campaigns',
                value: _dashboardStats?['totalCampaigns']?.toString() ?? '0',
                icon: Icons.campaign,
                color: Colors.green,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(AppConfig.darkBlueGray),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                'Find Influencers',
                Icons.search,
                const Color(AppConfig.primaryBlue),
                () => DefaultTabController.of(context).animateTo(1),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                'View Deals',
                Icons.handshake,
                const Color(AppConfig.primaryOrange),
                () => DefaultTabController.of(context).animateTo(2),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard(
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: color,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
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
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(AppConfig.darkBlueGray),
            ),
          ),
          Text(title, style: TextStyle(fontSize: 14, color: Colors.grey[600])),
        ],
      ),
    );
  }
}

class BrandInfluencersTab extends StatefulWidget {
  const BrandInfluencersTab({super.key});

  @override
  State<BrandInfluencersTab> createState() => _BrandInfluencersTabState();
}

class _BrandInfluencersTabState extends State<BrandInfluencersTab> {
  List<InfluencerInfo> _influencers = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMoreData = true;
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadInfluencers();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    // Check if we're near the bottom of the scroll view
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.position.pixels;
    final delta = maxScroll - currentScroll;

    // Trigger load more when within 200px of bottom for better UX
    if (delta <= 200 &&
        !_isLoadingMore &&
        _hasMoreData &&
        !_isLoading &&
        _influencers.isNotEmpty) {
      _loadMoreInfluencers();
    }
  }

  Future<void> _loadInfluencers({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _hasMoreData = true;
        _isLoading = true;
        _error = null;
        _influencers.clear();
      });
    } else {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final result = await BrandService.getInfluencers(page: _currentPage);

      if (result['success'] == true) {
        final newInfluencers = result['influencers'] as List<InfluencerInfo>;
        final pagination = result['pagination'] as Map<String, dynamic>;

        setState(() {
          if (refresh || _currentPage == 1) {
            _influencers = newInfluencers;
          } else {
            _influencers.addAll(newInfluencers);
          }

          // Update pagination info from API response
          final currentPage = pagination['page'] ?? _currentPage;
          final totalPages = pagination['totalPages'] ?? 0;

          _currentPage = currentPage;
          _hasMoreData = currentPage < totalPages && newInfluencers.isNotEmpty;
          _isLoading = false;
          _isLoadingMore = false;
          _error = null;
        });
      } else {
        setState(() {
          _error = result['message'] ?? 'Failed to load influencers';
          _isLoading = false;
          _isLoadingMore = false;
          _hasMoreData = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load influencers: $e';
        _isLoading = false;
        _isLoadingMore = false;
        _hasMoreData = false;
      });
    }
  }

  Future<void> _loadMoreInfluencers() async {
    if (_isLoadingMore || !_hasMoreData || _isLoading) {
      return;
    }

    setState(() {
      _isLoadingMore = true;
    });

    try {
      final nextPage = _currentPage + 1;
      final result = await BrandService.getInfluencers(page: nextPage);

      if (mounted && result['success'] == true) {
        final newInfluencers = result['influencers'] as List<InfluencerInfo>;
        final pagination = result['pagination'] as Map<String, dynamic>;

        if (mounted) {
          setState(() {
            if (newInfluencers.isNotEmpty) {
              _influencers.addAll(newInfluencers);
              _currentPage = pagination['page'] ?? nextPage;
            }

            // Check if there are more pages available based on API response
            final totalPages = pagination['totalPages'] ?? 0;
            final currentPage = pagination['page'] ?? _currentPage;
            _hasMoreData =
                currentPage < totalPages && newInfluencers.isNotEmpty;
            _isLoadingMore = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _isLoadingMore = false;
            _hasMoreData = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingMore = false;
          _hasMoreData = false;
        });
      }
    }
  }

  Future<void> _showConnectDialog(InfluencerInfo influencer) async {
    await showDialog(
      context: context,
      builder: (context) => ConnectRequestDialog(
        influencer: influencer,
        onSendRequest: (description, amount) =>
            _sendConnectRequest(influencer, description, amount),
      ),
    );
  }

  Future<void> _sendConnectRequest(
    InfluencerInfo influencer,
    String description,
    double amount,
  ) async {
    try {
      final result = await BrandService.sendConnectRequest(
        influencerId: influencer.id!,
        description: description,
        amount: amount,
      );

      if (result['success']) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Connect request sent to ${influencer.name}!'),
              backgroundColor: const Color(AppConfig.primaryOrange),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to send request'),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to send connect request'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => _loadInfluencers(refresh: true),
      child: _buildContent(),
    );
  }

  Widget _buildContent() {
    if (_isLoading && _influencers.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: Color(AppConfig.primaryOrange)),
      );
    }

    if (_error != null && _influencers.isEmpty) {
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
              onPressed: () => _loadInfluencers(refresh: true),
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

    if (_influencers.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No influencers found',
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return CustomScrollView(
      controller: _scrollController,
      physics: const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      ),
      cacheExtent: 3000, // Cache more items for smoother scrolling
      slivers: [
        // Header
        SliverToBoxAdapter(
          child: Container(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
            child: const Text(
              'Hire individual influencers!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1A1A1A),
                letterSpacing: -0.5,
              ),
            ),
          ),
        ),
        // Influencers List
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverList.builder(
            itemCount:
                _influencers.length +
                (_isLoadingMore ? 1 : 0) +
                (!_hasMoreData && _influencers.isNotEmpty && !_isLoading
                    ? 1
                    : 0),
            addAutomaticKeepAlives: false,
            addRepaintBoundaries: true,
            itemBuilder: (context, index) {
              if (index == _influencers.length) {
                if (_isLoadingMore) {
                  // Loading indicator for infinite scroll
                  return Container(
                    padding: const EdgeInsets.all(20),
                    child: const Center(
                      child: CircularProgressIndicator(
                        color: Color(AppConfig.primaryOrange),
                        strokeWidth: 2,
                      ),
                    ),
                  );
                } else if (!_hasMoreData &&
                    _influencers.isNotEmpty &&
                    !_isLoading) {
                  // End of list message
                  return Container(
                    padding: const EdgeInsets.all(20),
                    child: const Center(
                      child: Text(
                        "You've reached the end!",
                        style: TextStyle(
                          color: Color(0xFF666666),
                          fontSize: 14,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                  );
                }
                return const SizedBox.shrink();
              }

              final influencer = _influencers[index];
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                child: RepaintBoundary(
                  child: InfluencerCard(
                    key: ValueKey(influencer.id),
                    influencer: influencer,
                    onConnect: () => _showConnectDialog(influencer),
                  ),
                ),
              );
            },
          ),
        ),

        // Add some bottom padding and a message if no more data
        if (!_hasMoreData && _influencers.isNotEmpty)
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(20),
              child: Center(
                child: Text(
                  'You\'ve reached the end!',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class BrandDealsTab extends StatefulWidget {
  const BrandDealsTab({super.key});

  @override
  State<BrandDealsTab> createState() => _BrandDealsTabState();
}

class _BrandDealsTabState extends State<BrandDealsTab> {
  List<DealModel> _deals = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDeals();
  }

  Future<void> _loadDeals({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final result = await BrandService.getDeals();

      if (result['success']) {
        final allDeals = result['deals'] as List<DealModel>;

        setState(() {
          _deals = allDeals;
          _isLoading = false;
          _error = null;
        });
      } else {
        setState(() {
          _error = result['message'];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load deals';
        _isLoading = false;
      });
    }
  }

  Future<void> _handleDealAction(
    DealModel deal,
    String action, {
    Map<String, dynamic>? data,
  }) async {
    try {
      final result = await BrandService.performDealAction(
        dealId: deal.id!,
        action: action,
        data: data,
      );

      if (result['success']) {
        // Refresh deals list
        _loadDeals(refresh: true);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_getActionSuccessMessage(action)),
              backgroundColor: const Color(AppConfig.primaryOrange),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Action failed'),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to perform action'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _handleContentAction(
    String contentId,
    String action, {
    String? comment,
    String? dealId,
  }) async {
    try {
      final result = await BrandService.performContentAction(
        dealId: dealId ?? '',
        contentId: contentId,
        action: action,
        comment: comment,
      );

      if (result['success']) {
        // Refresh deals list
        _loadDeals(refresh: true);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Content ${action}d successfully'),
              backgroundColor: const Color(AppConfig.primaryOrange),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Action failed'),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to perform action'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _navigateToChat(DealModel deal) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BrandChatScreen(
          conversationId: null, // Will be created if needed
          dealId: deal.id,
          influencerName: deal.firstInfluencer?.name,
        ),
      ),
    );
  }

  String _getActionSuccessMessage(String action) {
    switch (action) {
      case 'accept':
        return 'Deal accepted successfully';
      case 'reject':
        return 'Deal rejected';
      case 'pay':
        return 'Payment processed successfully';
      case 'release-payment':
        return 'Payment released to influencer';
      default:
        return 'Action completed successfully';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFFAFBFC),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
            decoration: const BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Color(0x0A000000),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                const Text(
                  'My deals',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A1A1A),
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
          ),
          // Content
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading && _deals.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: Color(AppConfig.primaryOrange)),
      );
    }

    if (_error != null && _deals.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.error_outline_rounded,
                  size: 48,
                  color: Colors.red[400],
                ),
              ),
              const SizedBox(height: 24),
              Text(
                _error!,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF1A1A1A),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => _loadDeals(refresh: true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(AppConfig.primaryOrange),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  'Try Again',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_deals.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(
                    AppConfig.primaryOrange,
                  ).withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.handshake_outlined,
                  size: 48,
                  color: const Color(AppConfig.primaryOrange),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'No deals found',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1A1A1A),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Start connecting with influencers to see deals here',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadDeals(refresh: true),
      color: const Color(AppConfig.primaryOrange),
      backgroundColor: Colors.white,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
        itemCount: _deals.length,
        itemBuilder: (context, index) {
          final deal = _deals[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 20),
            child: DealCard(
              deal: deal,
              onDealAction: (action, {data}) =>
                  _handleDealAction(deal, action, data: data),
              onContentAction: (contentId, action, {comment, dealId}) =>
                  _handleContentAction(
                    contentId,
                    action,
                    comment: comment,
                    dealId: deal.id,
                  ),
              onChat: () => _navigateToChat(deal),
            ),
          );
        },
      ),
    );
  }
}

class BrandProfileTab extends StatefulWidget {
  const BrandProfileTab({super.key});

  @override
  State<BrandProfileTab> createState() => _BrandProfileTabState();
}

class _BrandProfileTabState extends State<BrandProfileTab> {
  BrandInfo? _brandProfile;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadBrandProfile();
  }

  Future<void> _loadBrandProfile() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await BrandService.getBrandProfile();

      if (result['success']) {
        setState(() {
          _brandProfile = result['profile'] as BrandInfo;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = result['message'];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load profile';
        _isLoading = false;
      });
    }
  }

  Future<void> _logout() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.logout();

    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const WelcomeScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
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
              onPressed: _loadBrandProfile,
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

    return RefreshIndicator(
      onRefresh: _loadBrandProfile,
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF9FAF9), Color(0xFFFFFFFF)],
          ),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Profile Header
              _buildProfileHeader(),

              const SizedBox(height: 28),

              // Company Information
              _buildCompanyInfo(),

              const SizedBox(height: 28),

              // Settings Section
              _buildSettingsSection(),

              const SizedBox(height: 28),

              // Analytics Section
              _buildAnalyticsSection(),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(AppConfig.primaryOrange),
            const Color(AppConfig.primaryOrange).withValues(alpha: 0.85),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(AppConfig.primaryOrange).withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // Profile Avatar
          Container(
            width: 90,
            height: 90,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              border: Border.all(color: Colors.white, width: 4),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 15,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: ClipOval(
              child: _brandProfile?.avatar != null
                  ? Image.network(
                      _brandProfile!.avatar!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          _buildDefaultLogo(),
                    )
                  : _buildDefaultLogo(),
            ),
          ),

          const SizedBox(height: 20),

          // Brand Name
          Text(
            _brandProfile?.companyName ?? 'Brand Name',
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: 0.5,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 8),

          // Location
          if (_brandProfile?.location != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.location_on,
                    size: 16,
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _brandProfile!.location!,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withValues(alpha: 0.9),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDefaultLogo() {
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [
            const Color(AppConfig.primaryBlue).withValues(alpha: 0.7),
            const Color(AppConfig.lightPurple).withValues(alpha: 0.7),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          (_brandProfile?.companyName?.isNotEmpty == true)
              ? _brandProfile!.companyName![0].toUpperCase()
              : 'B',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 32,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildCompanyInfo() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(
                    AppConfig.primaryOrange,
                  ).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.business,
                  color: Color(AppConfig.primaryOrange),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Company Information',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(AppConfig.darkBlueGray),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          _buildInfoRow(
            Icons.business,
            'Company',
            _brandProfile?.companyName ?? 'Not specified',
          ),

          _buildInfoRow(
            Icons.person,
            'Contact Name',
            _brandProfile?.name ?? 'Not specified',
          ),

          _buildInfoRow(
            Icons.location_on,
            'Location',
            _brandProfile?.location ?? 'Not specified',
          ),

          _buildInfoRow(
            Icons.email,
            'Email',
            _brandProfile?.email ?? 'Not specified',
          ),

          _buildInfoRow(
            Icons.phone,
            'Phone',
            _brandProfile?.phoneNumber ?? 'Not specified',
          ),

          _buildInfoRow(
            Icons.language,
            'Website',
            _brandProfile?.website ?? 'Not specified',
          ),

          _buildInfoRow(
            Icons.description,
            'Description',
            _brandProfile?.bio ?? 'No description available',
            isMultiline: true,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(
    IconData icon,
    String label,
    String value, {
    bool isMultiline = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FA),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE9ECEF), width: 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(
                AppConfig.primaryOrange,
              ).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              size: 18,
              color: const Color(AppConfig.primaryOrange),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 15,
                    color: Color(AppConfig.darkBlueGray),
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: isMultiline ? null : 1,
                  overflow: isMultiline ? null : TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
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
          const Text(
            'Settings',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(AppConfig.darkBlueGray),
            ),
          ),

          const SizedBox(height: 16),

          _buildSettingItem(
            Icons.edit,
            'Edit Profile',
            'Update your company information',
            () {
              // TODO: Navigate to edit profile
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Edit profile coming soon'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),

          _buildSettingItem(
            Icons.notifications,
            'Notifications',
            'Manage your notification preferences',
            () {
              // TODO: Navigate to notification settings
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Notification settings coming soon'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),

          _buildSettingItem(
            Icons.help,
            'Help & Support',
            'Get help and contact support',
            () {
              // TODO: Navigate to help
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Help & support coming soon'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),

          const Divider(height: 32),

          _buildLogoutItem(),
        ],
      ),
    );
  }

  Widget _buildSettingItem(
    IconData icon,
    String title,
    String subtitle,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(
                  AppConfig.primaryOrange,
                ).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                size: 20,
                color: const Color(AppConfig.primaryOrange),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(AppConfig.darkBlueGray),
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }

  Widget _buildAnalyticsSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
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
          const Text(
            'Quick Stats',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(AppConfig.darkBlueGray),
            ),
          ),

          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Total Deals',
                  '12',
                  Icons.handshake,
                  const Color(AppConfig.primaryBlue),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Active Campaigns',
                  '3',
                  Icons.campaign,
                  const Color(AppConfig.primaryOrange),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Total Spent',
                  '₹45,000',
                  Icons.currency_rupee,
                  Colors.green,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Influencers',
                  '8',
                  Icons.people,
                  const Color(AppConfig.lightPurple),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, size: 24, color: color),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildLogoutItem() {
    return InkWell(
      onTap: () {
        // Show confirmation dialog
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text('Logout'),
              content: const Text('Are you sure you want to logout?'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    _logout();
                  },
                  style: TextButton.styleFrom(foregroundColor: Colors.red),
                  child: const Text('Logout'),
                ),
              ],
            );
          },
        );
      },
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.logout, size: 20, color: Colors.red),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Logout',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Colors.red,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Sign out of your account',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}
