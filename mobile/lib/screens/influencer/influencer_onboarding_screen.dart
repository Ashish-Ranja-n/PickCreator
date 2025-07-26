import 'package:flutter/material.dart';
import 'package:pickcreator_mobile/services/auth_service.dart';
import 'instagram_verification_screen.dart';

class InfluencerOnboardingScreen extends StatefulWidget {
  const InfluencerOnboardingScreen({super.key});

  @override
  State<InfluencerOnboardingScreen> createState() =>
      _InfluencerOnboardingScreenState();
}

class _InfluencerOnboardingScreenState extends State<InfluencerOnboardingScreen>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  bool _isLoading = false;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  // Beautiful color scheme inspired by the gradient image
  static const Color primaryColor = Color(0xFFE91E63); // Vibrant magenta-pink
  static const Color secondaryColor = Color(0xFF9C27B0); // Rich purple
  static const Color backgroundColor = Color(0xFFF8F6FA); // Light background
  static const Color textPrimary = Color(0xFF2D1B69); // Dark purple text
  static const Color textSecondary = Color(0xFF8E24AA); // Medium purple text

  // Form controllers
  final _nameController = TextEditingController();
  final _ageController = TextEditingController();
  final _mobileController = TextEditingController();
  final Map<String, TextEditingController> _pricingControllers = {
    'storyPrice': TextEditingController(),
    'reelPrice': TextEditingController(),
    'postPrice': TextEditingController(),
    'livePrice': TextEditingController(),
  };

  // Form data
  String? _selectedGender;
  String? _selectedCity;
  String? _selectedBio;
  bool _negotiablePricing = false;
  final List<String> _preferredBrandTypes = [];
  final List<String> _brandExclusions = [];
  final List<String> _collabStyles = [];

  // Step titles - Now 4 steps instead of 5
  final List<String> _stepTitles = [
    'Basic Info',
    'Pricing Models',
    'Brand Preferences',
    'Personal Info',
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    _mobileController.dispose();
    _pageController.dispose();
    _animationController.dispose();
    for (var controller in _pricingControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _nextPage() {
    if (_currentPage < 3) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _completeOnboarding();
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  bool _canProceed() {
    switch (_currentPage) {
      case 0: // Basic Info
        return _selectedBio != null && _selectedCity != null;
      case 1: // Pricing Models
        return _pricingControllers.values.every(
          (controller) =>
              controller.text.trim().isNotEmpty &&
              double.tryParse(controller.text.trim()) != null &&
              double.parse(controller.text.trim()) > 0,
        );
      case 2: // Brand Preferences
        return _preferredBrandTypes.isNotEmpty &&
            _brandExclusions.isNotEmpty &&
            _collabStyles.isNotEmpty;
      case 3: // Personal Info (Final step)
        return _nameController.text.trim().isNotEmpty &&
            _ageController.text.trim().isNotEmpty &&
            _selectedGender != null;
      default:
        return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Simplified header
            _buildSimpleHeader(),

            // Main content with smooth transitions
            Expanded(
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: PageView(
                  controller: _pageController,
                  onPageChanged: (page) {
                    setState(() {
                      _currentPage = page;
                    });
                  },
                  children: [
                    _buildBasicInfoPage(),
                    _buildPricingModelsPage(),
                    _buildBrandPreferencesPage(),
                    _buildPersonalInfoPage(),
                  ],
                ),
              ),
            ),

            // Modern navigation
            _buildModernNavigation(),
          ],
        ),
      ),
    );
  }

  // Clean, minimal header
  Widget _buildSimpleHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        children: [
          // Step indicator
          Row(
            children: [
              Text(
                'Step ${_currentPage + 1} of 4',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: textSecondary,
                ),
              ),
              const Spacer(),
              Text(
                _stepTitles[_currentPage],
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: primaryColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Progress bar
          Container(
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(2),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: (_currentPage + 1) / 4,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [primaryColor, secondaryColor],
                  ),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Modern bottom navigation
  Widget _buildModernNavigation() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          if (_currentPage > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: _isLoading ? null : _previousPage,
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: primaryColor),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  'Back',
                  style: TextStyle(
                    color: primaryColor,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          if (_currentPage > 0) const SizedBox(width: 16),
          Expanded(
            flex: _currentPage == 0 ? 1 : 2,
            child: ElevatedButton(
              onPressed: _canProceed() && !_isLoading ? _nextPage : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text(
                      _currentPage == 3 ? 'Complete Setup' : 'Continue',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  // Data options matching web version exactly
  final List<String> _cities = [
    'Mumbai',
    'Delhi',
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Pune',
    'Ahmedabad',
    'Jaipur',
    'Lucknow',
    'Surat',
    'Kanpur',
  ];

  // Brand types matching web version
  final List<Map<String, String>> _brandTypes = [
    {'id': 'fashion', 'label': 'Fashion'},
    {'id': 'beauty', 'label': 'Beauty & Skincare'},
    {'id': 'food', 'label': 'Food & Beverages'},
    {'id': 'tech', 'label': 'Technology'},
    {'id': 'travel', 'label': 'Travel'},
    {'id': 'fitness', 'label': 'Fitness & Wellness'},
    {'id': 'lifestyle', 'label': 'Lifestyle'},
    {'id': 'entertainment', 'label': 'Entertainment'},
    {'id': 'education', 'label': 'Education'},
    {'id': 'finance', 'label': 'Finance'},
    {'id': 'automotive', 'label': 'Automotive'},
    {'id': 'home', 'label': 'Home & Decor'},
  ];

  // Brand exclusions matching web version
  final List<Map<String, String>> _brandExclusionOptions = [
    {'id': 'alcohol', 'label': 'Alcohol'},
    {'id': 'tobacco', 'label': 'Tobacco'},
    {'id': 'gambling', 'label': 'Gambling'},
    {'id': 'adult', 'label': 'Adult Content'},
    {'id': 'political', 'label': 'Political Organizations'},
    {'id': 'religious', 'label': 'Religious Organizations'},
    {'id': 'crypto', 'label': 'Cryptocurrency'},
    {'id': 'mlm', 'label': 'Multi-Level Marketing'},
    {'id': 'weapons', 'label': 'Weapons & Firearms'},
  ];

  // Collaboration styles matching web version
  final List<Map<String, String>> _collabStyleOptions = [
    {'id': 'sponsored_posts', 'label': 'Sponsored Posts'},
    {'id': 'product_reviews', 'label': 'Product Reviews'},
    {'id': 'brand_ambassador', 'label': 'Brand Ambassador'},
    {'id': 'affiliate_marketing', 'label': 'Affiliate Marketing'},
    {'id': 'giveaways', 'label': 'Giveaways & Contests'},
    {'id': 'account_takeovers', 'label': 'Account Takeovers'},
    {'id': 'event_coverage', 'label': 'Event Coverage'},
    {'id': 'content_creation', 'label': 'Content Creation'},
  ];

  Future<void> _completeOnboarding() async {
    if (!_canProceed()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      // Create comprehensive onboarding data matching web version
      final fixedPricing = {
        'enabled': true,
        'storyPrice': double.tryParse(
          _pricingControllers['storyPrice']!.text.trim(),
        ),
        'reelPrice': double.tryParse(
          _pricingControllers['reelPrice']!.text.trim(),
        ),
        'postPrice': double.tryParse(
          _pricingControllers['postPrice']!.text.trim(),
        ),
        'livePrice': double.tryParse(
          _pricingControllers['livePrice']!.text.trim(),
        ),
      };

      final onboardingData = {
        'name': _nameController.text.trim(),
        'age': int.parse(_ageController.text.trim()),
        'gender': _selectedGender!,
        'bio': _selectedBio!,
        'city': _selectedCity!,
        'fixedPricing': fixedPricing,
        'negotiablePricing': _negotiablePricing,
        'packageDeals': {'enabled': false, 'packages': []},
        'barterDeals': {
          'enabled': false,
          'acceptedCategories': [],
          'restrictions': '',
        },
        'brandPreferences': {
          'preferredBrandTypes': _preferredBrandTypes,
          'exclusions': _brandExclusions,
          'collabStyles': _collabStyles,
        },
        'onboardingCompleted': true,
        'onboardingStep': 5,
      };

      final result =
          await AuthService.completeInfluencerOnboardingComprehensive(
            onboardingData,
          );

      if (mounted) {
        if (result['success']) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => const InstagramVerificationScreen(),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                result['message'] ?? 'Failed to complete onboarding',
              ),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
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

  // Step 1: Basic Info Page - Modern Design
  Widget _buildBasicInfoPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Page title
          Text(
            'Tell us about yourself',
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: textPrimary,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Share your story and location to help brands discover you.',
            style: TextStyle(fontSize: 16, color: textSecondary, height: 1.4),
          ),
          const SizedBox(height: 40),

          // Bio Input - Free form
          Text(
            'Your Bio',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _selectedBio != null && _selectedBio!.isNotEmpty
                    ? primaryColor
                    : Colors.grey[300]!,
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: TextField(
              maxLines: 4,
              onChanged: (value) {
                setState(() {
                  _selectedBio = value.trim().isEmpty ? null : value.trim();
                });
              },
              decoration: InputDecoration(
                hintText:
                    'Write a compelling bio that showcases your personality and content style...',
                hintStyle: TextStyle(color: Colors.grey[400], fontSize: 16),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(20),
              ),
              style: const TextStyle(fontSize: 16, height: 1.5),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tip: Mention your niche, style, and what makes you unique!',
            style: TextStyle(
              fontSize: 14,
              color: textSecondary,
              fontStyle: FontStyle.italic,
            ),
          ),

          const SizedBox(height: 32),

          // City Selection - Modern Design
          Text(
            'Your City',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _selectedCity != null ? primaryColor : Colors.grey[300]!,
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: DropdownButtonFormField<String>(
              value: _selectedCity,
              onChanged: (value) {
                setState(() {
                  _selectedCity = value;
                });
              },
              decoration: InputDecoration(
                hintText: 'Select your city',
                prefixIcon: Container(
                  margin: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.location_on_rounded,
                    color: primaryColor,
                    size: 20,
                  ),
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 20,
                ),
              ),
              items: _cities.map((city) {
                return DropdownMenuItem(
                  value: city,
                  child: Text(city, style: const TextStyle(fontSize: 16)),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Brands often look for local influencers for campaigns.',
            style: TextStyle(fontSize: 14, color: textSecondary),
          ),
        ],
      ),
    );
  }

  // Step 2: Premium Pricing Models Page
  Widget _buildPricingModelsPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Premium header
          Text(
            'Set your rates',
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: textPrimary,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tell brands what you charge for different content types.',
            style: TextStyle(fontSize: 16, color: textSecondary, height: 1.4),
          ),
          const SizedBox(height: 40),

          // Premium pricing grid
          _buildPremiumPriceGrid(),

          const SizedBox(height: 32),

          // Negotiable pricing toggle
          _buildNegotiableToggle(),
        ],
      ),
    );
  }

  // Premium pricing grid
  Widget _buildPremiumPriceGrid() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildPremiumPriceCard(
                'Story',
                'storyPrice',
                Icons.auto_stories_rounded,
                '24h visibility',
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildPremiumPriceCard(
                'Reel',
                'reelPrice',
                Icons.movie_rounded,
                'Video content',
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildPremiumPriceCard(
                'Post',
                'postPrice',
                Icons.image_rounded,
                'Feed content',
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildPremiumPriceCard(
                'Live',
                'livePrice',
                Icons.live_tv_rounded,
                'Live streaming',
              ),
            ),
          ],
        ),
      ],
    );
  }

  // Premium price card
  Widget _buildPremiumPriceCard(
    String title,
    String key,
    IconData icon,
    String subtitle,
  ) {
    final hasValue = _pricingControllers[key]!.text.trim().isNotEmpty;
    final value = _pricingControllers[key]!.text.trim();

    return Container(
      height: 120, // Reduced from 140 to 120
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: hasValue
              ? [
                  primaryColor.withValues(alpha: 0.1),
                  secondaryColor.withValues(alpha: 0.05),
                ]
              : [
                  Colors.grey.withValues(alpha: 0.05),
                  Colors.grey.withValues(alpha: 0.02),
                ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: hasValue
              ? primaryColor.withValues(alpha: 0.3)
              : Colors.grey.withValues(alpha: 0.2),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: hasValue
                ? primaryColor.withValues(alpha: 0.1)
                : Colors.black.withValues(alpha: 0.03),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => _showPriceInput(title, key, icon),
          child: Padding(
            padding: const EdgeInsets.all(16), // Reduced from 20 to 16
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min, // Added to prevent overflow
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6), // Reduced from 8 to 6
                      decoration: BoxDecoration(
                        color: hasValue
                            ? primaryColor
                            : Colors.grey.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(
                          10,
                        ), // Reduced from 12 to 10
                      ),
                      child: Icon(
                        icon,
                        color: Colors.white,
                        size: 18,
                      ), // Reduced from 20 to 18
                    ),
                    const Spacer(),
                    if (hasValue)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6, // Reduced from 8 to 6
                          vertical: 3, // Reduced from 4 to 3
                        ),
                        decoration: BoxDecoration(
                          color: primaryColor.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(
                            6,
                          ), // Reduced from 8 to 6
                        ),
                        child: Text(
                          '₹$value',
                          style: TextStyle(
                            color: primaryColor,
                            fontSize: 11, // Reduced from 12 to 11
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8), // Reduced from 12 to 8
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16, // Reduced from 18 to 16
                    fontWeight: FontWeight.bold,
                    color: textPrimary,
                  ),
                ),
                const SizedBox(height: 2), // Reduced from 4 to 2
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11,
                    color: textSecondary,
                  ), // Reduced from 12 to 11
                ),
                const Spacer(),
                Text(
                  hasValue ? 'Tap to edit' : 'Tap to set price',
                  style: TextStyle(
                    fontSize: 10, // Reduced from 11 to 10
                    color: hasValue ? primaryColor : textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Premium negotiable toggle
  Widget _buildNegotiableToggle() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            secondaryColor.withValues(alpha: 0.05),
            primaryColor.withValues(alpha: 0.03),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2), width: 1),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: secondaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.handshake_rounded,
              color: secondaryColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Negotiable Pricing',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Allow brands to discuss custom rates with you',
                  style: TextStyle(fontSize: 14, color: textSecondary),
                ),
              ],
            ),
          ),
          Switch.adaptive(
            value: _negotiablePricing,
            onChanged: (value) {
              setState(() {
                _negotiablePricing = value;
              });
            },
            activeColor: primaryColor,
          ),
        ],
      ),
    );
  }

  // Show price input dialog
  void _showPriceInput(String title, String key, IconData icon) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(icon, color: primaryColor, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Set $title Price',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _pricingControllers[key],
                keyboardType: TextInputType.number,
                autofocus: true,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                decoration: InputDecoration(
                  prefixText: '₹ ',
                  prefixStyle: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: textPrimary,
                  ),
                  hintText: '0',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: primaryColor),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: primaryColor, width: 2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() {});
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Save'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Step 3: Brand Preferences Page
  Widget _buildBrandPreferencesPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Brand Preferences',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: primaryColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tell brands about your collaboration preferences.',
            style: TextStyle(fontSize: 16, color: textSecondary),
          ),
          const SizedBox(height: 32),

          // Preferred Brand Types
          Text(
            'Preferred Brand Types',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _brandTypes.map((type) {
              final isSelected = _preferredBrandTypes.contains(type['id']);
              return FilterChip(
                label: Text(type['label']!),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _preferredBrandTypes.add(type['id']!);
                    } else {
                      _preferredBrandTypes.remove(type['id']!);
                    }
                  });
                },
                selectedColor: primaryColor.withValues(alpha: 0.2),
                checkmarkColor: primaryColor,
                backgroundColor: Colors.grey[100],
              );
            }).toList(),
          ),

          const SizedBox(height: 32),

          // Brand Exclusions
          Text(
            'Brand Exclusions',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Select types of brands you prefer not to work with',
            style: TextStyle(fontSize: 14, color: textSecondary),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _brandExclusionOptions.map((exclusion) {
              final isSelected = _brandExclusions.contains(exclusion['id']);
              return FilterChip(
                label: Text(exclusion['label']!),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _brandExclusions.add(exclusion['id']!);
                    } else {
                      _brandExclusions.remove(exclusion['id']!);
                    }
                  });
                },
                selectedColor: Colors.red.withValues(alpha: 0.2),
                checkmarkColor: Colors.red,
                backgroundColor: Colors.grey[100],
              );
            }).toList(),
          ),

          const SizedBox(height: 32),

          // Collaboration Styles
          Text(
            'Collaboration Styles',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _collabStyleOptions.map((style) {
              final isSelected = _collabStyles.contains(style['id']);
              return FilterChip(
                label: Text(style['label']!),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _collabStyles.add(style['id']!);
                    } else {
                      _collabStyles.remove(style['id']!);
                    }
                  });
                },
                selectedColor: secondaryColor.withValues(alpha: 0.2),
                checkmarkColor: secondaryColor,
                backgroundColor: Colors.grey[100],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // Step 4: Personal Info Page
  Widget _buildPersonalInfoPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Personal Information',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: primaryColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Complete your personal details.',
            style: TextStyle(fontSize: 16, color: textSecondary),
          ),
          const SizedBox(height: 32),

          // Full Name
          _buildTextField(
            'Full Name',
            _nameController,
            Icons.person_outline,
            'Enter your full name',
          ),
          const SizedBox(height: 24),

          // Age
          _buildTextField(
            'Age',
            _ageController,
            Icons.cake_outlined,
            'Enter your age',
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 24),

          // Gender
          Text(
            'Gender',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _selectedGender != null
                    ? primaryColor
                    : Colors.grey[300]!,
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: DropdownButtonFormField<String>(
              value: _selectedGender,
              onChanged: (value) {
                setState(() {
                  _selectedGender = value;
                });
              },
              decoration: InputDecoration(
                hintText: 'Select your gender',
                hintStyle: TextStyle(color: Colors.grey[400], fontSize: 16),
                prefixIcon: Container(
                  margin: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.wc_outlined, color: primaryColor, size: 20),
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 20,
                ),
              ),
              items: [
                DropdownMenuItem(
                  value: 'male',
                  child: Text('Male', style: const TextStyle(fontSize: 16)),
                ),
                DropdownMenuItem(
                  value: 'female',
                  child: Text('Female', style: const TextStyle(fontSize: 16)),
                ),
                DropdownMenuItem(
                  value: 'other',
                  child: Text('Other', style: const TextStyle(fontSize: 16)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // Helper method for text fields
  Widget _buildTextField(
    String label,
    TextEditingController controller,
    IconData icon,
    String hint, {
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: controller.text.trim().isNotEmpty
                  ? primaryColor
                  : Colors.grey[300]!,
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            onChanged: (_) => setState(() {}),
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(color: Colors.grey[400], fontSize: 16),
              prefixIcon: Container(
                margin: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: primaryColor, size: 20),
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 20,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
