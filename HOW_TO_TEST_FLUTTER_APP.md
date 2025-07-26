# 🚀 How to Test Your PickCreator Flutter App

## ✅ **App Status: Ready for Testing!**

All major errors have been fixed. The app compiles successfully and is ready for testing.

## **Testing Options**

### **Option 1: Android Emulator (Recommended)**

1. **Start Android Studio**
2. **Open AVD Manager** (Tools → AVD Manager)
3. **Create/Start an Android Virtual Device**
4. **Run the app:**
   ```bash
   cd mobile
   flutter run
   ```

### **Option 2: Physical Android Device**

1. **Enable Developer Options** on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect your phone** via USB

3. **Run the app:**
   ```bash
   cd mobile
   flutter devices  # Check if device is detected
   flutter run      # Run on connected device
   ```

### **Option 3: Chrome Web Browser (Quick Test)**

```bash
cd mobile
flutter run -d chrome
```

## **What You'll See When Testing**

### **🔐 Authentication Flow**

1. **Welcome Screen**
   - Email input field
   - "Continue" button
   - "Continue with Google" button

2. **OTP Screen** (after entering email)
   - 6-digit OTP input boxes
   - "Verify" button
   - "Resend" option

3. **Role Selection** (for new users)
   - "Business" card (orange theme)
   - "Influencer" card (purple theme)

4. **Dashboard** (based on selected role)
   - **Brand**: Orange theme with campaign stats
   - **Influencer**: Purple theme with deals/earnings
   - **Admin**: Dark theme with platform overview

### **🎨 UI Features to Test**

- **Touch interactions** (buttons, cards)
- **Navigation** between screens
- **Form validation** (email format, OTP length)
- **Loading states** (spinners during API calls)
- **Error messages** (invalid email, wrong OTP)
- **Role-specific themes** and layouts

## **Backend Integration Testing**

### **⚠️ Important: Update API URLs**

Before testing with your live backend, update the URLs in:

**File:** `mobile/lib/config/app_config.dart`

```dart
// For testing with your live backend
static const String apiBaseUrl = 'https://pickcreator.com/api';
static const String socketUrl = 'https://pickcreator.com:3001';

// For local development
// static const String apiBaseUrl = 'http://localhost:3000/api';
// static const String socketUrl = 'http://localhost:3001';
```

### **🧪 Test Scenarios**

1. **Email/OTP Flow**
   - Enter valid email → Should receive OTP
   - Enter invalid email → Should show error
   - Enter correct OTP → Should proceed to role selection
   - Enter wrong OTP → Should show error message

2. **Role Selection**
   - Select "Business" → Should go to Brand dashboard
   - Select "Influencer" → Should go to Influencer dashboard

3. **Dashboard Navigation**
   - Bottom navigation tabs should work
   - Logout should return to welcome screen

## **Development Commands**

### **Hot Reload (During Development)**
```bash
# While app is running, press:
r  # Hot reload
R  # Hot restart
q  # Quit
```

### **Build for Release**
```bash
# Android APK
flutter build apk --release

# Android App Bundle (for Play Store)
flutter build appbundle --release
```

### **Debug Information**
```bash
# Check Flutter setup
flutter doctor

# List available devices
flutter devices

# View logs
flutter logs
```

## **Troubleshooting**

### **Common Issues & Solutions**

1. **"No devices found"**
   - Make sure Android emulator is running
   - Check USB debugging is enabled on physical device

2. **"Build failed"**
   - Run `flutter clean` then `flutter pub get`
   - Check if Android SDK is properly installed

3. **"Network error" in app**
   - Check API URLs in `app_config.dart`
   - Ensure your backend is running and accessible

4. **"Permission denied" errors**
   - Make sure your backend CORS settings allow mobile app requests

### **Backend CORS Configuration**

Add this to your Next.js API to allow Flutter app requests:

```javascript
// In your Next.js API routes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

## **Next Steps After Testing**

1. **✅ Basic functionality works** → Add more features
2. **🔧 Found issues** → Debug and fix
3. **🎨 UI improvements needed** → Customize design
4. **📱 Ready for production** → Build release version

## **Quick Test Checklist**

- [ ] App launches successfully
- [ ] Welcome screen displays correctly
- [ ] Email validation works
- [ ] OTP screen appears after email submission
- [ ] Role selection works
- [ ] Brand dashboard loads (orange theme)
- [ ] Influencer dashboard loads (purple theme)
- [ ] Bottom navigation works
- [ ] Logout functionality works

## **Performance Tips**

- **Use Android emulator** for best development experience
- **Enable hot reload** for faster development
- **Test on real device** for final validation
- **Check network connectivity** for API calls

Your Flutter app is ready! Start with the Android emulator for the best testing experience. 🎉
