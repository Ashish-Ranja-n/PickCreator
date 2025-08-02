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
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Colors.white,
          border: Border.all(color: Colors.grey.shade100, width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Profile section with connect button in top-right
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Profile picture
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.grey.shade200, width: 2),
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
                  const SizedBox(width: 12),

                  // Name, location, and verification
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Name with Instagram and verification badges
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                influencer.name ?? 'Unknown',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Color(AppConfig.darkBlueGray),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            // Instagram verification badge (only if verified)
                            if (influencer.isInstagramVerified == true)
                              Container(
                                margin: const EdgeInsets.only(left: 8),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    // Instagram icon with gradient
                                    Container(
                                      width: 18,
                                      height: 18,
                                      decoration: BoxDecoration(
                                        gradient: const LinearGradient(
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                          colors: [
                                            Color(0xFF833AB4), // Purple
                                            Color(0xFFE1306C), // Pink
                                            Color(0xFFFD1D1D), // Red
                                            Color(0xFFF56040), // Orange
                                          ],
                                        ),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Icon(
                                        Icons.camera_alt,
                                        color: Colors.white,
                                        size: 10,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    // Verification checkmark
                                    Container(
                                      width: 16,
                                      height: 16,
                                      decoration: const BoxDecoration(
                                        color: Color(
                                          0xFF1DA1F2,
                                        ), // Twitter blue
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.check,
                                        color: Colors.white,
                                        size: 10,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),

                        // Location
                        if (influencer.location != null)
                          Row(
                            children: [
                              Icon(
                                Icons.location_on,
                                size: 14,
                                color: const Color(0xFF3B82F6),
                              ),
                              const SizedBox(width: 2),
                              Expanded(
                                child: Text(
                                  influencer.location!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF3B82F6),
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),

                        const SizedBox(height: 8),

                        // Followers count
                        Row(
                          children: [
                            Icon(
                              Icons.people,
                              size: 16,
                              color: Colors.grey[600],
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${_formatFollowerCount(influencer.followers ?? 0)} Followers',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Connect button in top-right
                  Container(
                    margin: const EdgeInsets.only(left: 8),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      child: ElevatedButton(
                        onPressed: isLoading ? null : onConnect,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(AppConfig.primaryBlue),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          elevation: isLoading ? 0 : 2,
                          shadowColor: const Color(
                            AppConfig.primaryBlue,
                          ).withValues(alpha: 0.3),
                          minimumSize: const Size(80, 32),
                        ),
                        child: isLoading
                            ? const SizedBox(
                                height: 16,
                                width: 16,
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
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Pricing grid (2x2 layout)
              if (influencer.pricingModels?.fixedPricing?.enabled == true)
                _buildPricingGrid(),
            ],
          ),
        ),
      ),
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
