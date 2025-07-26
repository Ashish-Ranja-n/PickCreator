import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_config.dart';
import '../../services/auth_service.dart';
import '../../models/user_model.dart';
import '../../main.dart';
import '../brand/brand_dashboard.dart';
import '../influencer/influencer_dashboard.dart';

class RoleSelectionScreen extends StatefulWidget {
  const RoleSelectionScreen({super.key});

  @override
  State<RoleSelectionScreen> createState() => _RoleSelectionScreenState();
}

class _RoleSelectionScreenState extends State<RoleSelectionScreen> {
  String? _loadingRole;
  String _errorMessage = '';

  Future<void> _selectRole(String role) async {
    setState(() {
      _loadingRole = role;
      _errorMessage = '';
    });

    try {
      final result = await AuthService.setRole(role);

      if (result['success']) {
        if (!mounted) return;
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        final currentUser = authProvider.user;

        if (currentUser != null) {
          // Update user with new role
          final updatedUser = UserModel(
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            phoneNumber: currentUser.phoneNumber,
            role: role,
            avatar: currentUser.avatar,
            isVerified: currentUser.isVerified,
            onboardingCompleted: false, // Reset onboarding for new role
            instagramConnected: currentUser.instagramConnected,
            isInstagramVerified: currentUser.isInstagramVerified,
            createdAt: currentUser.createdAt,
            updatedAt: DateTime.now(),
          );

          await authProvider.updateUser(updatedUser);
        }

        // Navigate to appropriate dashboard
        _navigateToRoleDashboard(role);
      } else {
        setState(() {
          _errorMessage = result['message'] ?? 'Failed to set role';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Network error. Please try again.';
      });
    } finally {
      setState(() {
        _loadingRole = null;
      });
    }
  }

  void _navigateToRoleDashboard(String role) {
    Widget dashboard;
    switch (role) {
      case AppConfig.brandRole:
        dashboard = const BrandDashboard();
        break;
      case AppConfig.influencerRole:
        dashboard = const InfluencerDashboard();
        break;
      default:
        return; // Should not happen
    }

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => dashboard),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              const Text(
                'Welcome to PickCreator',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2d2323),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),

              // Subheader
              const Text(
                'Who are you?',
                style: TextStyle(
                  fontSize: 18,
                  color: Color(0xFFc03a5b),
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),

              // Brand Card
              _buildRoleCard(
                role: AppConfig.brandRole,
                title: 'Business',
                subtitle: 'Hire influencers',
                icon: Icons.business,
                backgroundColor: const Color(0xFFeaf2ff),
                iconColor: const Color(0xFF1976f7),
                textColor: const Color(0xFF1976f7),
                isLoading: _loadingRole == AppConfig.brandRole,
              ),
              const SizedBox(height: 24),

              // Influencer Card
              _buildRoleCard(
                role: AppConfig.influencerRole,
                title: 'Influencer',
                subtitle: 'Work with brands',
                icon: Icons.person,
                backgroundColor: const Color(0xFFfff0f8),
                iconColor: const Color(0xFFff5ca8),
                textColor: const Color(0xFFff5ca8),
                isLoading: _loadingRole == AppConfig.influencerRole,
              ),

              // Error Message
              if (_errorMessage.isNotEmpty) ...[
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Text(
                    _errorMessage,
                    style: TextStyle(color: Colors.red.shade700, fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard({
    required String role,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color backgroundColor,
    required Color iconColor,
    required Color textColor,
    required bool isLoading,
  }) {
    return GestureDetector(
      onTap: (_loadingRole == null) ? () => _selectRole(role) : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        transform: Matrix4.identity()..scale(isLoading ? 0.95 : 1.0),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
            border: Border.all(
              color: isLoading ? iconColor : Colors.transparent,
              width: 2,
            ),
          ),
          child: Row(
            children: [
              // Icon Container
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: isLoading
                    ? Center(
                        child: SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              iconColor,
                            ),
                          ),
                        ),
                      )
                    : Icon(icon, size: 32, color: iconColor),
              ),
              const SizedBox(width: 20),

              // Text Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 16,
                        color: textColor.withOpacity(0.8),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
