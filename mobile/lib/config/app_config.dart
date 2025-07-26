class AppConfig {
  // API Configuration
  // For testing without CORS issues, use a CORS proxy temporarily
  static const String apiBaseUrl =
      'https://cors-anywhere.herokuapp.com/https://pickcreator.com/api';
  static const String socketUrl = 'https://pickcreator.com:3001';

  // Production URLs (use after CORS is fixed)
  // static const String apiBaseUrl = 'https://pickcreator.com/api';
  // static const String socketUrl = 'https://pickcreator.com:3001';

  // Development URLs (for local development)
  // static const String apiBaseUrl = 'http://localhost:3000/api';
  // static const String socketUrl = 'http://localhost:3001';

  // App Information
  static const String appName = 'PickCreator';
  static const String appVersion = '1.0.0';

  // Storage Keys
  static const String tokenKey = 'jwt_token';
  static const String userKey = 'user_data';
  static const String roleKey = 'user_role';

  // API Endpoints
  static const String sendOtpEndpoint = '/send-otp';
  static const String verifyOtpEndpoint = '/verify-otp';
  static const String otpLoginEndpoint = '/auth/otp-login';
  static const String setRoleEndpoint = '/auth/set-role';
  static const String googleAuthEndpoint = '/auth/google';
  static const String refreshTokenEndpoint = '/auth/refresh-token';
  static const String checkAuthEndpoint = '/auth/check-auth';

  // User Roles
  static const String brandRole = 'Brand';
  static const String influencerRole = 'Influencer';
  static const String adminRole = 'Admin';

  // App Colors (matching your web app)
  static const int primaryBlue = 0xFF3B82F6;
  static const int primaryOrange = 0xFFFF9700;
  static const int lightPurple = 0xFFC4B5FD;
  static const int darkBlueGray = 0xFF283747;

  // Socket Events
  static const String messageEvent = 'message';
  static const String joinRoomEvent = 'join';
  static const String leaveRoomEvent = 'leave';
  static const String typingEvent = 'typing';
  static const String notificationEvent = 'notification';
}
