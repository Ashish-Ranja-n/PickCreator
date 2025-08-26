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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Pre-compute expensive values
    final followerCount = _formatFollowerCount(influencer.followers ?? 0);
    final hasPricing = influencer.pricingModels?.fixedPricing?.enabled == true;

    return RepaintBoundary(
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          border: Border.all(
            color: isDark ? const Color(0xFF334155) : const Color(0xFFE5E7EB),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.15 : 0.08),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Section
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Optimized Profile Picture
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(
                        AppConfig.primaryBlue,
                      ).withOpacity(0.1),
                      border: Border.all(
                        color: const Color(
                          AppConfig.primaryBlue,
                        ).withOpacity(0.2),
                        width: 2,
                      ),
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
                  const SizedBox(width: 14),
                  // Info Section
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Name and Verification
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                influencer.name ?? 'Unknown Influencer',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(AppConfig.darkBlueGray),
                                  letterSpacing: -0.3,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (influencer.isInstagramVerified == true)
                              const Padding(
                                padding: EdgeInsets.only(left: 6.0),
                                child: Icon(
                                  Icons.verified,
                                  size: 18,
                                  color: Color(0xFF6366F1),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        // Location
                        if (influencer.location != null)
                          Row(
                            children: [
                              Icon(
                                Icons.location_on_rounded,
                                size: 14,
                                color: isDark
                                    ? Colors.grey[400]
                                    : Colors.grey[600],
                              ),
                              const SizedBox(width: 3),
                              Flexible(
                                child: Text(
                                  influencer.location!,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: isDark
                                        ? Colors.grey[300]
                                        : Colors.grey[700],
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        const SizedBox(height: 6),
                        // Followers Count
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(
                              AppConfig.primaryBlue,
                            ).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.people_rounded,
                                size: 14,
                                color: const Color(AppConfig.primaryBlue),
                              ),
                              const SizedBox(width: 3),
                              Text(
                                followerCount,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(AppConfig.primaryBlue),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              // Pricing Section (only if available)
              if (hasPricing) ...[
                const SizedBox(height: 16),
                _buildOptimizedPricingGrid(context, isDark),
              ],
              const SizedBox(height: 20),
              // Optimized Connect Button
              Container(
                width: double.infinity,
                height: 48,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF6366F1).withOpacity(0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: isLoading ? null : onConnect,
                    borderRadius: BorderRadius.circular(16),
                    child: Center(
                      child: isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Connect',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                    letterSpacing: 0.3,
                                  ),
                                ),
                                SizedBox(width: 6),
                                Icon(
                                  Icons.arrow_forward,
                                  size: 16,
                                  color: Colors.white,
                                ),
                              ],
                            ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOptimizedPricingGrid(BuildContext context, bool isDark) {
    final pricing = influencer.pricingModels?.fixedPricing;
    if (pricing == null) return const SizedBox.shrink();

    final prices = <String, double?>{
      'Reel': pricing.reelPrice,
      'Post': pricing.postPrice,
      'Story': pricing.storyPrice,
      'Live': pricing.livePrice,
    };

    final availablePrices = prices.entries
        .where((entry) => entry.value != null && entry.value! > 0)
        .toList();

    if (availablePrices.isEmpty) return const SizedBox.shrink();

    // Optimized colors for better performance
    const colors = [
      Color(0xFFF3E8FF),
      Color(0xFFDCFCE7),
      Color(0xFFFEF3C7),
      Color(0xFFDCFDF7),
    ];

    const textColors = [
      Color(0xFF7C3AED),
      Color(0xFF059669),
      Color(0xFFD97706),
      Color(0xFF0D9488),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Pricing',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : const Color(AppConfig.darkBlueGray),
            letterSpacing: -0.2,
          ),
        ),
        const SizedBox(height: 12),
        // Use Row instead of GridView for better performance
        ...List.generate((availablePrices.length / 2).ceil(), (rowIndex) {
          final startIndex = rowIndex * 2;
          final endIndex = (startIndex + 2).clamp(0, availablePrices.length);

          return Padding(
            padding: EdgeInsets.only(
              bottom: rowIndex < (availablePrices.length / 2).ceil() - 1
                  ? 12
                  : 0,
            ),
            child: Row(
              children: List.generate(endIndex - startIndex, (columnIndex) {
                final index = startIndex + columnIndex;
                final entry = availablePrices[index];
                final colorIndex = index % colors.length;

                return Expanded(
                  child: Container(
                    margin: EdgeInsets.only(right: columnIndex == 0 ? 8 : 0),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colors[colorIndex],
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: textColors[colorIndex].withOpacity(0.2),
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
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: textColors[colorIndex],
                            letterSpacing: 0.1,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '₹${_formatPrice(entry.value!)}',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: textColors[colorIndex],
                            letterSpacing: -0.2,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildDefaultAvatar() {
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [
            const Color(AppConfig.primaryBlue).withOpacity(0.8),
            const Color(0xFF8B5CF6).withOpacity(0.8),
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
            fontSize: 26,
            fontWeight: FontWeight.bold,
            letterSpacing: -0.5,
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

  String _formatPrice(double price) {
    final priceInt = price.toInt();
    final priceStr = priceInt.toString();

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
