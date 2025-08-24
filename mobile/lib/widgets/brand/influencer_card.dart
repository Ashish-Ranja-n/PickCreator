import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../models/user_model.dart';

class InfluencerCard extends StatelessWidget {
  final InfluencerInfo influencer;
  final VoidCallback? onConnect;
  final bool isLoading;

  const InfluencerCard({
    super.key,
    required this.influencer,
    this.onConnect,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header section with profile and connect button
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Profile picture
                Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(
                        AppConfig.primaryOrange,
                      ).withValues(alpha: 0.2),
                      width: 3,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(
                          AppConfig.primaryOrange,
                        ).withValues(alpha: 0.2),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: influencer.avatar != null
                        ? Image.network(
                            influencer.avatar!,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                _buildDefaultAvatar(),
                          )
                        : _buildDefaultAvatar(),
                  ),
                ),
                const SizedBox(width: 8),
                // Info section
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        influencer.name ?? 'Unknown',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Color(AppConfig.darkBlueGray),
                          letterSpacing: -0.3,
                          height: 1.2,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      if (influencer.location != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF3F4F6),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.location_on_rounded,
                                size: 14,
                                color: Colors.grey[600],
                              ),
                              const SizedBox(width: 4),
                              Text(
                                influencer.location!,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.grey[700],
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(
                                AppConfig.primaryBlue,
                              ).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.people_rounded,
                                  size: 15,
                                  color: const Color(AppConfig.primaryBlue),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  _formatFollowerCount(
                                    influencer.followers ?? 0,
                                  ),
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: Color(AppConfig.primaryBlue),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (influencer.isInstagramVerified == true)
                            Padding(
                              padding: const EdgeInsets.only(left: 8.0),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [
                                      Color(0xFF833AB4),
                                      Color(0xFFE1306C),
                                      Color(0xFFFD1D1D),
                                      Color(0xFFF77737),
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.verified,
                                      size: 13,
                                      color: Colors.white,
                                    ),
                                    const SizedBox(width: 4),
                                    const Text(
                                      'Instagram',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Modern connect button
                Container(
                  constraints: const BoxConstraints(maxWidth: 100),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFF007AFF),
                        const Color(0xFF5B9BD5),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF007AFF).withValues(alpha: 0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: isLoading ? null : onConnect,
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 12,
                        ),
                        child: isLoading
                            ? const SizedBox(
                                height: 18,
                                width: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : const Text(
                                'Connect',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                  letterSpacing: 0.2,
                                ),
                              ),
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Enhanced pricing grid
            if (influencer.pricingModels?.fixedPricing?.enabled == true)
              _buildModernPricingGrid(),
          ],
        ),
      ),
    );
  }

  Widget _buildModernPricingGrid() {
    final pricing = influencer.pricingModels?.fixedPricing;
    if (pricing == null) return const SizedBox.shrink();

    final prices = <String, double?>{
      'Reel': pricing.reelPrice,
      'Post': pricing.postPrice,
      'Story': pricing.storyPrice,
      'Live': pricing.livePrice,
    };

    // Filter out null prices
    final availablePrices = prices.entries
        .where((entry) => entry.value != null && entry.value! > 0)
        .toList();

    if (availablePrices.isEmpty) return const SizedBox.shrink();

    // Modern color scheme
    final colors = [
      const Color(0xFFF3E8FF), // Light purple
      const Color(0xFFDCFCE7), // Light green
      const Color(0xFFFEF3C7), // Light yellow
      const Color(0xFFDCFDF7), // Light teal
    ];

    final textColors = [
      const Color(0xFF7C3AED), // Purple
      const Color(0xFF059669), // Green
      const Color(0xFFD97706), // Yellow
      const Color(0xFF0D9488), // Teal
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Pricing',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: Color(AppConfig.darkBlueGray),
            letterSpacing: -0.2,
          ),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 2.2,
          ),
          itemCount: availablePrices.length > 4 ? 4 : availablePrices.length,
          itemBuilder: (context, index) {
            final entry = availablePrices[index];
            final colorIndex = index % colors.length;
            return Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: colors[colorIndex],
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: textColors[colorIndex].withValues(alpha: 0.2),
                  width: 1,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entry.key,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: textColors[colorIndex],
                      letterSpacing: 0.1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    maxLines: 1,
                    softWrap: false,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₹${_formatPrice(entry.value!)}',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: textColors[colorIndex],
                      letterSpacing: -0.3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    maxLines: 1,
                    softWrap: false,
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildDefaultAvatar() {
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
          (influencer.name?.isNotEmpty == true)
              ? influencer.name![0].toUpperCase()
              : 'I',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  String _formatFollowerCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    } else {
      return count.toString();
    }
  }

  Widget _buildPricingGrid() {
    final pricing = influencer.pricingModels?.fixedPricing;
    if (pricing == null) return const SizedBox.shrink();

    final prices = <String, double?>{
      'Reel': pricing.reelPrice,
      'Post': pricing.postPrice,
      'Story': pricing.storyPrice,
      'Live': pricing.livePrice,
    };

    // Filter out null prices
    final availablePrices = prices.entries
        .where((entry) => entry.value != null && entry.value! > 0)
        .toList();

    if (availablePrices.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: const Center(
          child: Text(
            'Pricing available on request',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey,
              fontStyle: FontStyle.italic,
            ),
          ),
        ),
      );
    }

    // Create a 2x2 grid
    final gridItems = <Widget>[];
    final colors = [
      const Color(0xFFFFF3E0), // Orange background
      const Color(0xFFE3F2FD), // Blue background
      const Color(0xFFF3E5F5), // Purple background
      const Color(0xFFE8F5E8), // Green background
    ];

    final textColors = [
      const Color(0xFFFF9800), // Orange text
      const Color(0xFF2196F3), // Blue text
      const Color(0xFF9C27B0), // Purple text
      const Color(0xFF4CAF50), // Green text
    ];

    for (int i = 0; i < availablePrices.length && i < 4; i++) {
      final entry = availablePrices[i];
      gridItems.add(
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: colors[i],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                entry.key,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: textColors[i],
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '₹${_formatPrice(entry.value!)}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: textColors[i],
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Fill remaining slots if less than 4 items
    while (gridItems.length < 4 && gridItems.length < availablePrices.length) {
      gridItems.add(const SizedBox.shrink());
    }

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: 2.2,
      children: gridItems,
    );
  }

  String _formatPrice(double price) {
    // Format with commas for better readability
    final priceInt = price.toInt();
    final priceStr = priceInt.toString();

    // Add commas every 3 digits from right
    String result = '';
    int count = 0;

    for (int i = priceStr.length - 1; i >= 0; i--) {
      if (count > 0 && count % 3 == 0) {
        result = ',$result';
      }
      result = priceStr[i] + result;
      count++;
    }

    return result;
  }
}
