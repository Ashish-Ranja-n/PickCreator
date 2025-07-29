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
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Profile section
              Row(
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

                  // Name and verification
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
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
                            if (influencer.isInstagramVerified == true)
                              Container(
                                margin: const EdgeInsets.only(left: 4),
                                padding: const EdgeInsets.all(2),
                                decoration: const BoxDecoration(
                                  color: Color(AppConfig.primaryBlue),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.check,
                                  color: Colors.white,
                                  size: 12,
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
                                color: Colors.grey[600],
                              ),
                              const SizedBox(width: 2),
                              Expanded(
                                child: Text(
                                  influencer.location!,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Bio
              if (influencer.bio != null)
                Text(
                  influencer.bio!,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                    height: 1.3,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),

              const SizedBox(height: 12),

              // Followers count
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: const Color(
                    AppConfig.lightPurple,
                  ).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.people,
                      size: 16,
                      color: Color(AppConfig.lightPurple),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'followers: ${_formatFollowerCount(influencer.followers ?? 0)}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(AppConfig.lightPurple),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Pricing information
              if (influencer.pricingModels?.fixedPricing?.enabled == true)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(
                      AppConfig.primaryBlue,
                    ).withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(
                        AppConfig.primaryBlue,
                      ).withValues(alpha: 0.1),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Pricing',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(AppConfig.primaryBlue),
                        ),
                      ),
                      const SizedBox(height: 6),
                      _buildPricingRow(),
                    ],
                  ),
                ),

              // Connect button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isLoading ? null : onConnect,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(AppConfig.primaryOrange),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
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
                      : const Text(
                          'Connect',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
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

  Widget _buildPricingRow() {
    final pricing = influencer.pricingModels?.fixedPricing;
    if (pricing == null) return const SizedBox.shrink();

    final prices = <String, double?>{
      'Story': pricing.storyPrice,
      'Reel': pricing.reelPrice,
      'Post': pricing.postPrice,
      'Live': pricing.livePrice,
    };

    // Filter out null prices and get the first two available
    final availablePrices = prices.entries
        .where((entry) => entry.value != null && entry.value! > 0)
        .take(2)
        .toList();

    if (availablePrices.isEmpty) {
      return const Text(
        'Pricing available on request',
        style: TextStyle(
          fontSize: 11,
          color: Color(AppConfig.primaryBlue),
          fontStyle: FontStyle.italic,
        ),
      );
    }

    return Wrap(
      spacing: 8,
      runSpacing: 4,
      children: availablePrices.map((entry) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(AppConfig.primaryBlue).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            '${entry.key}: ₹${_formatPrice(entry.value!)}',
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: Color(AppConfig.primaryBlue),
            ),
          ),
        );
      }).toList(),
    );
  }

  String _formatPrice(double price) {
    if (price >= 100000) {
      return '${(price / 100000).toStringAsFixed(1)}L';
    } else if (price >= 1000) {
      return '${(price / 1000).toStringAsFixed(1)}K';
    } else {
      return price.toStringAsFixed(0);
    }
  }
}
