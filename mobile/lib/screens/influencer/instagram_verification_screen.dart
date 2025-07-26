import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:pickcreator_mobile/services/auth_service.dart';
import 'package:pickcreator_mobile/screens/influencer/influencer_dashboard.dart';

class InstagramVerificationScreen extends StatefulWidget {
  const InstagramVerificationScreen({super.key});

  @override
  State<InstagramVerificationScreen> createState() =>
      _InstagramVerificationScreenState();
}

class _InstagramVerificationScreenState
    extends State<InstagramVerificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _instagramIdController = TextEditingController();
  final _followerCountController = TextEditingController();

  File? _profilePicture;
  bool _isLoading = false;
  String? _error;
  bool _success = false;

  final ImagePicker _picker = ImagePicker();

  @override
  void dispose() {
    _instagramIdController.dispose();
    _followerCountController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );

      if (image != null) {
        setState(() {
          _profilePicture = File(image.path);
          _error = null;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to pick image: $e';
      });
    }
  }

  Future<void> _submitVerification() async {
    if (!_formKey.currentState!.validate()) return;
    if (_profilePicture == null) {
      setState(() {
        _error = 'Please upload a profile picture';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
      _success = false;
    });

    try {
      final result = await AuthService.submitInstagramVerification(
        instagramId: _instagramIdController.text.trim(),
        followerCount: int.parse(_followerCountController.text.trim()),
        profilePicture: _profilePicture!,
      );

      if (mounted) {
        if (result['success']) {
          setState(() {
            _success = true;
            _error = null;
          });

          // Navigate to dashboard after successful submission
          Future.delayed(const Duration(seconds: 2), () {
            if (mounted) {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(
                  builder: (context) => const InfluencerDashboard(),
                ),
              );
            }
          });
        } else {
          setState(() {
            _error = result['message'] ?? 'Failed to submit verification';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Error: $e';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F6FA),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Verification',
                      style: TextStyle(
                        color: const Color(0xFFA07BA6),
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        // Help dialog or info
                      },
                      icon: const Icon(
                        Icons.help_outline,
                        color: Color(0xFFA07BA6),
                        size: 24,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                Text(
                  'Instagram Verification',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF23111A),
                  ),
                ),

                const SizedBox(height: 32),

                // Profile Picture Upload
                Center(
                  child: Column(
                    children: [
                      GestureDetector(
                        onTap: _pickImage,
                        child: Container(
                          width: 128,
                          height: 128,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9D6C7),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 4),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: _profilePicture != null
                              ? ClipOval(
                                  child: Image.file(
                                    _profilePicture!,
                                    width: 128,
                                    height: 128,
                                    fit: BoxFit.cover,
                                  ),
                                )
                              : const Icon(
                                  Icons.person,
                                  size: 64,
                                  color: Color(0xFFE2B6C6),
                                ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      Text(
                        'Upload Profile Picture',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF23111A),
                        ),
                      ),

                      const SizedBox(height: 4),

                      Text(
                        'Tap to upload your profile picture',
                        style: TextStyle(
                          fontSize: 14,
                          color: const Color(0xFFA07BA6),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 40),

                // Form
                Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      // Instagram ID
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8E6F4),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Padding(
                              padding: EdgeInsets.only(left: 16),
                              child: Text(
                                '@',
                                style: TextStyle(
                                  color: Color(0xFFA07BA6),
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                            Expanded(
                              child: TextFormField(
                                controller: _instagramIdController,
                                decoration: const InputDecoration(
                                  hintText: 'Instagram ID',
                                  hintStyle: TextStyle(
                                    color: Color(0xFFA07BA6),
                                  ),
                                  border: InputBorder.none,
                                  contentPadding: EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 16,
                                  ),
                                ),
                                style: const TextStyle(
                                  color: Color(0xFFA07BA6),
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                ),
                                validator: (value) {
                                  if (value == null || value.trim().isEmpty) {
                                    return 'Please enter your Instagram ID';
                                  }
                                  return null;
                                },
                                onChanged: (value) {
                                  // Remove @ symbols if user types them
                                  if (value.startsWith('@')) {
                                    _instagramIdController.text = value
                                        .substring(1);
                                    _instagramIdController
                                        .selection = TextSelection.fromPosition(
                                      TextPosition(
                                        offset:
                                            _instagramIdController.text.length,
                                      ),
                                    );
                                  }
                                },
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Follower Count
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8E6F4),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: TextFormField(
                          controller: _followerCountController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            hintText: 'Follower Count',
                            hintStyle: TextStyle(color: Color(0xFFA07BA6)),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 16,
                            ),
                          ),
                          style: const TextStyle(
                            color: Color(0xFFA07BA6),
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your follower count';
                            }
                            final count = int.tryParse(value.trim());
                            if (count == null || count <= 0) {
                              return 'Please enter a valid follower count';
                            }
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Success/Error Messages
                if (_success)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.green.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.check_circle, color: Colors.green, size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Verification request sent successfully!',
                            style: TextStyle(
                              color: Colors.green[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                if (_error != null)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.red.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error, color: Colors.red, size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _error!,
                            style: TextStyle(
                              color: Colors.red[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),

      // Submit Button
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(24),
        child: SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _submitVerification,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF2DAF),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Send Verification Request',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
          ),
        ),
      ),
    );
  }
}
