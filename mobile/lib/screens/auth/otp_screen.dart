import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../config/app_config.dart';
import '../../services/auth_service.dart';
import '../../models/user_model.dart';
import '../../main.dart';
import 'role_selection_screen.dart';
import '../brand/brand_dashboard.dart';
import '../influencer/influencer_dashboard.dart';
import '../admin/admin_dashboard.dart';

class OtpScreen extends StatefulWidget {
  final String email;

  const OtpScreen({super.key, required this.email});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final List<TextEditingController> _otpControllers = List.generate(
    6,
    (index) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(6, (index) => FocusNode());
  bool _isLoading = false;
  String _errorMessage = '';

  @override
  void dispose() {
    for (var controller in _otpControllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  String get _otpCode {
    return _otpControllers.map((controller) => controller.text).join();
  }

  bool get _isOtpComplete {
    return _otpCode.length == 6;
  }

  void _onOtpChanged(int index, String value) {
    if (value.isNotEmpty && index < 5) {
      _focusNodes[index + 1].requestFocus();
    } else if (value.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }

    if (_isOtpComplete) {
      _verifyOtp();
    }
  }

  Future<void> _verifyOtp() async {
    if (!_isOtpComplete) return;

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final result = await AuthService.verifyOtpAndLogin(
        widget.email,
        _otpCode,
      );

      if (result['success']) {
        if (!mounted) return;
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        final userData = result['user'];
        final user = UserModel.fromJson(userData);

        await authProvider.login(user);

        // Navigate based on user status
        if (result['isNew']) {
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => const RoleSelectionScreen(),
              ),
            );
          }
        } else {
          _navigateToUserDashboard(user.role);
        }
      } else {
        setState(() {
          _errorMessage = result['message'] ?? 'Invalid OTP';
        });
        _clearOtp();
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Network error. Please try again.';
      });
      _clearOtp();
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _navigateToUserDashboard(String? role) {
    Widget dashboard;
    switch (role) {
      case AppConfig.brandRole:
        dashboard = const BrandDashboard();
        break;
      case AppConfig.influencerRole:
        dashboard = const InfluencerDashboard();
        break;
      case AppConfig.adminRole:
        dashboard = const AdminDashboard();
        break;
      default:
        dashboard = const RoleSelectionScreen();
    }

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => dashboard),
      (route) => false,
    );
  }

  void _clearOtp() {
    for (var controller in _otpControllers) {
      controller.clear();
    }
    _focusNodes[0].requestFocus();
  }

  Future<void> _resendOtp() async {
    setState(() {
      _errorMessage = '';
    });

    final result = await AuthService.sendOtp(widget.email);

    if (result['success']) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('OTP sent successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } else {
      setState(() {
        _errorMessage = result['message'] ?? 'Failed to resend OTP';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Title
              const Text(
                'Verify Your Email',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2d2323),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),

              // Subtitle
              Text(
                'Enter the 6-digit code sent to\n${widget.email}',
                style: const TextStyle(
                  fontSize: 16,
                  color: Color(0xFFc03a5b),
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),

              // OTP Input Fields
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(6, (index) {
                  return SizedBox(
                    width: 45,
                    height: 55,
                    child: TextFormField(
                      controller: _otpControllers[index],
                      focusNode: _focusNodes[index],
                      textAlign: TextAlign.center,
                      keyboardType: TextInputType.number,
                      maxLength: 1,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                      decoration: InputDecoration(
                        counterText: '',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(AppConfig.primaryBlue),
                            width: 2,
                          ),
                        ),
                      ),
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      onChanged: (value) => _onOtpChanged(index, value),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 32),

              // Verify Button
              ElevatedButton(
                onPressed: (_isOtpComplete && !_isLoading) ? _verifyOtp : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(AppConfig.primaryBlue),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isLoading
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
                        'Verify',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
              const SizedBox(height: 24),

              // Resend OTP
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    "Didn't receive the code? ",
                    style: TextStyle(color: Colors.grey),
                  ),
                  TextButton(
                    onPressed: _resendOtp,
                    child: const Text(
                      'Resend',
                      style: TextStyle(
                        color: Color(AppConfig.primaryBlue),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),

              // Error Message
              if (_errorMessage.isNotEmpty) ...[
                const SizedBox(height: 16),
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
}
