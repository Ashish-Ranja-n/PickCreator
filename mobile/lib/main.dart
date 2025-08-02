import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'config/app_config.dart';
import 'services/auth_service.dart';
import 'providers/theme_provider.dart';
import 'screens/auth/welcome_screen.dart';
import 'screens/auth/role_selection_screen.dart';
import 'screens/brand/brand_dashboard.dart';
import 'screens/influencer/influencer_dashboard.dart';
import 'screens/admin/admin_dashboard.dart';
import 'models/user_model.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Configure system UI overlay style for status bar
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(const PickCreatorApp());
}

class PickCreatorApp extends StatelessWidget {
  const PickCreatorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            title: AppConfig.appName,
            theme: themeProvider.lightTheme,
            darkTheme: themeProvider.darkTheme,
            themeMode: themeProvider.isDarkMode
                ? ThemeMode.dark
                : ThemeMode.light,
            home: const AuthWrapper(),
            routes: {
              '/welcome': (context) => const WelcomeScreen(),
              '/role-selection': (context) => const RoleSelectionScreen(),
              '/brand-dashboard': (context) => const BrandDashboard(),
              '/influencer-dashboard': (context) => const InfluencerDashboard(),
              '/admin-dashboard': (context) => const AdminDashboard(),
            },
          );
        },
      ),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isLoading = true;
  bool _isLoggedIn = false;
  UserModel? _user;

  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    try {
      final isLoggedIn = await AuthService.isLoggedIn();
      if (isLoggedIn) {
        final user = await AuthService.getUserData();

        // For mobile app: Trust local token, don't validate with server
        // This ensures persistent login - users stay logged in forever
        if (user != null) {
          // Update AuthProvider with user data
          if (mounted) {
            final authProvider = Provider.of<AuthProvider>(
              context,
              listen: false,
            );
            await authProvider.login(user);
          }

          setState(() {
            _isLoggedIn = true;
            _user = user;
          });
        } else {
          // Only logout if user data is completely missing
          await AuthService.logout();
        }
      }
    } catch (e) {
      // Don't logout on errors - keep user logged in
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (!_isLoggedIn) {
      return const WelcomeScreen();
    }

    // User is logged in, route to appropriate dashboard
    if (_user?.role == null) {
      return const RoleSelectionScreen();
    }

    switch (_user!.role) {
      case AppConfig.brandRole:
        return const BrandDashboard();
      case AppConfig.influencerRole:
        return const InfluencerDashboard();
      case AppConfig.adminRole:
        return const AdminDashboard();
      default:
        return const WelcomeScreen();
    }
  }
}

// Auth Provider for state management
class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoggedIn = false;

  UserModel? get user => _user;
  bool get isLoggedIn => _isLoggedIn;

  Future<void> login(UserModel user) async {
    _user = user;
    _isLoggedIn = true;
    notifyListeners();
  }

  Future<void> logout() async {
    await AuthService.logout();
    _user = null;
    _isLoggedIn = false;
    notifyListeners();
  }

  Future<void> updateUser(UserModel user) async {
    _user = user;
    await AuthService.saveUserData(user.toJson());
    notifyListeners();
  }
}
