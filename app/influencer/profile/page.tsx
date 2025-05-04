'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import {
  User,
  Instagram,
  Mail,
  Edit,
  LogOut,
  UserRoundX,
  Save,
  X,
  Star,
  LinkIcon,
  Play,
  Heart,
  Settings,
  Clipboard,
  MapPin,
  Calendar,
  Briefcase,
  Check,
  BadgeIndianRupee,
  BarChart3,
  Trophy,
  Flame,
  LineChart,
  Users,
  BellIcon,
  MessageSquare,
  RefreshCw,
  Loader,
  KeyRoundIcon,
  Moon,
  Sun
} from 'lucide-react';
import { useCurrentUser } from '@/hook/useCurrentUser';
import { useInfluencerData, useInstagramData, useOnboardingData } from '@/hook/useInfluencerData';
import { useNotifications } from '@/hook/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import InstagramDebugInfo from '@/components/instagram/InstagramDebugInfo';
import { useLogout } from '@/hook/useLogout';
import { useTheme } from 'next-themes';

const ProfilePage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const userId = currentUser?._id;
  const { theme, setTheme } = useTheme();

  // Always call hooks at the top level unconditionally
  const logout = useLogout();
  const { isSupported, isSubscribed, requestPermission } = useNotifications();

  // Add state for connection loading
  const [isConnecting, setIsConnecting] = useState(false);

  // Log theme information when component mounts
  useEffect(() => {
    console.log('Theme from useTheme:', theme);
  }, [theme]);

  // Define logout handler with useCallback at the top level with other hooks
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Use React Query hooks for data fetching
  const { data: profileData, isLoading: isLoadingProfile } = useInfluencerData();
  const { data, isLoading: isLoadingInstagram, refreshData } = useInstagramData();
  const { data: onboardingData, isLoading: isLoadingOnboarding } = useOnboardingData();

  // Rename the variable to make it clear it's the Instagram data
  const instagramData = data;

  // State for editing profile
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    bio: profileData?.bio || '',
  });

  // Loading state
  const isLoading = isLoadingProfile || isLoadingInstagram || isLoadingOnboarding;

  // Add a clear loading state component
  const LoadingState = () => (
    <div className="container py-8 h-screen bg-white dark:bg-black">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 bg-gray-200 dark:bg-zinc-800 rounded-md w-32 animate-pulse"></div>
        </div>
      </div>
      <div className="mt-8 space-y-6">
        <div className="h-10 bg-gray-200 dark:bg-zinc-800 rounded-md w-full max-w-xs animate-pulse"></div>
        <div className="h-40 bg-gray-200 dark:bg-zinc-800 rounded-lg w-full animate-pulse"></div>
        <div className="h-40 bg-gray-200 dark:bg-zinc-800 rounded-lg w-full animate-pulse"></div>
        <div className="h-40 bg-gray-200 dark:bg-zinc-800 rounded-lg w-full animate-pulse"></div>
        <div className="h-40 bg-gray-200 dark:bg-zinc-800 rounded-lg w-full animate-pulse"></div>
      </div>
    </div>
  );

  // Display loading state while data is being fetched
  if (!currentUser || isLoading) {
    return <LoadingState />;
  }

  // Add a function to refresh Instagram data
  const refreshInstagramData = async () => {
    try {
      toast({
        title: "Refreshing Data",
        description: "Please wait while we refresh your Instagram data...",
        variant: "default",
      });

      await refreshData();

      toast({
        title: "Data Refreshed",
        description: "Instagram data has been successfully refreshed and stored in your profile.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error refreshing Instagram data:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh Instagram data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle reconnecting Instagram directly
  const handleReconnectInstagram = async () => {
    try {
      setIsConnecting(true);

      // Call the API to get the Instagram auth URL
      const response = await axios.get('/api/auth/instagram', {
        timeout: 8000 // Add timeout to prevent hanging requests
      });

      if (response.data.url) {
        // Redirect to Instagram authorization page
        window.location.href = response.data.url;
      } else {
        // Fallback if no URL is returned
        window.location.href = '/api/auth/instagram';
      }
    } catch (error) {
      console.error('Error initiating Instagram connection:', error);
      setIsConnecting(false);

      toast({
        title: "Connection Failed",
        description: "Failed to initiate Instagram connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle saving profile changes
  const handleSaveProfile = async () => {
    try {
      const response = await axios.patch('/api/influencer/profile', {
        bio: editData.bio,
        // Add other fields as needed
      });

      if (response.data.success) {
        // Exit edit mode
        setIsEditing(false);

        // Show success toast
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
          variant: "default",
        });
      } else {
        throw new Error(response.data.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);

      // Show error toast
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || error.message || "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle canceling edits
  const handleCancelEdit = () => {
    setEditData({
      bio: profileData?.bio || '',
    });
    setIsEditing(false);
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      await axios.delete(`/api/auth/deleteAccount/${userId}`);
      router.push('/sign-up');
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete your account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle notification subscription
  const handleEnableNotifications = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      await requestPermission();
      toast({
        title: "Notifications Enabled",
        description: "You will now receive push notifications.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Notification Error",
        description: "Failed to enable notifications. Please check your browser permissions.",
        variant: "destructive",
      });
    }
  };

  // Handle FAQs navigation
  const handleFaqsClick = () => {
    router.push("/faqs");
  };

  // Handle Contact navigation
  const handleContactClick = () => {
    router.push("/contact");
  };

  return (
    <div className="container py-16 bg-white dark:bg-black min-h-screen overflow-x-hidden">
      <div className="space-y-8">
        {/* Modern Header with Gradient Background */}
        <div className="relative overflow-hidden rounded-xl">
          {/* Background with animated gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-100/50 via-white to-fuchsia-100/50 dark:from-violet-900/30 dark:via-black dark:to-fuchsia-900/30 animate-gradient-slow"></div>

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5 mix-blend-overlay">
            <svg viewBox="0 0 1024 1024" className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <filter id="noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="4" stitchTiles="stitch" />
              </filter>
              <rect width="100%" height="100%" filter="url(#noise)" />
            </svg>
          </div>

          {/* Floating orbs for visual interest */}
          <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-violet-400/10 dark:bg-violet-600/10 blur-3xl"></div>
          <div className="absolute right-10 top-5 w-20 h-20 rounded-full bg-fuchsia-400/10 dark:bg-fuchsia-600/10 blur-2xl"></div>

          {/* Content with glass effect */}
          <div className="relative backdrop-blur-sm p-6 md:p-8 z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              {/* Left side with title and description */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-8 w-1 bg-gradient-to-b from-violet-400 to-fuchsia-400 dark:from-violet-500 dark:to-fuchsia-500 rounded-full"></div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-fuchsia-500 to-gray-900 dark:from-white dark:via-fuchsia-100 dark:to-white">
                    My Profile
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-zinc-300 ml-4 pl-3 border-l border-gray-300/50 dark:border-zinc-700/50">
                  Manage your profile information and Instagram connection
                </p>
              </div>

              {/* Right side with settings button */}
              <div className="flex items-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-gray-100/70 dark:bg-zinc-900/70 border-gray-300/50 dark:border-zinc-700/50 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 hover:border-violet-400/50 dark:hover:border-violet-500/50 py-4 px-5 text-base rounded-xl transition-all duration-300 backdrop-blur-sm"
                    >
                      <Settings className="h-5 w-5 mr-2 text-violet-500 dark:text-violet-400" />
                      <span>Settings</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white dark:bg-black border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
                        Settings
                      </DialogTitle>
                      <DialogDescription className="text-gray-500 dark:text-zinc-400">
                        Manage your profile and account settings
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => setIsEditing(true)}
                          className="flex justify-start items-center w-full text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                        >
                          <Edit className="h-5 w-5 mr-3" />
                          <span>Edit Profile</span>
                        </Button>

                        {isSupported && !isSubscribed && (
                          <Button
                            variant="ghost"
                            onClick={handleEnableNotifications}
                            className="flex justify-start items-center w-full text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                          >
                            <BellIcon className="h-5 w-5 mr-3" />
                            <span>Enable Push Notifications</span>
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          onClick={handleFaqsClick}
                          className="flex justify-start items-center w-full text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                        >
                          <MessageSquare className="h-5 w-5 mr-3" />
                          <span>FAQs</span>
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={handleContactClick}
                          className="flex justify-start items-center w-full text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                        >
                          <Mail className="h-5 w-5 mr-3" />
                          <span>Contact Support</span>
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={() => router.push('/password-reset')}
                          className="flex justify-start items-center w-full text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                        >
                          <KeyRoundIcon className="h-5 w-5 mr-3" />
                          <span>Reset Password</span>
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={() => router.push('/legal/privacy-policy')}
                          className="flex justify-start items-center w-full text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                        >
                          <LinkIcon className="h-5 w-5 mr-3" />
                          <span>Privacy Policy</span>
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={() => router.push('/legal/terms-of-service')}
                          className="flex justify-start items-center w-full text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                        >
                          <User className="h-5 w-5 mr-3" />
                          <span>Terms of Service</span>
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={() => {
                            console.log('Current theme:', theme);
                            const newTheme = theme === 'dark' ? 'light' : 'dark';
                            console.log('Setting theme to:', newTheme);
                            setTheme(newTheme);
                          }}
                          className="flex justify-start items-center w-full text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                        >
                          {theme === 'dark' ? (
                            <>
                              <Sun className="h-5 w-5 mr-3 text-amber-500" />
                              <span>Light Mode</span>
                            </>
                          ) : (
                            <>
                              <Moon className="h-5 w-5 mr-3 text-indigo-500" />
                              <span>Dark Mode</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-gray-200 dark:bg-zinc-800 my-2" />

                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            className="flex justify-start items-center w-full text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                          >
                            <LogOut className="h-5 w-5 mr-3" />
                            <span>Log Out</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                          <DialogHeader>
                            <DialogTitle className="text-gray-900 dark:text-white">Log Out</DialogTitle>
                            <DialogDescription className="text-gray-500 dark:text-zinc-400">
                              Are you sure you want to log out of your account?
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={handleLogout} className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600">
                              Yes, Log Out
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            className="flex justify-start items-center w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <UserRoundX className="h-5 w-5 mr-3" />
                            <span>Delete Account</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                          <DialogHeader>
                            <DialogTitle className="text-gray-900 dark:text-white">Delete Account</DialogTitle>
                            <DialogDescription className="text-gray-500 dark:text-zinc-400">
                              Are you sure you want to delete your account? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="destructive" onClick={() => handleDeleteAccount()}>
                              Yes, Delete Account
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="grid w-full md:w-auto grid-cols-3 bg-gray-100 dark:bg-zinc-900 p-1 rounded-lg border border-gray-200 dark:border-zinc-800">
            <TabsTrigger value="profile" className="text-gray-700 dark:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Profile</TabsTrigger>
            <TabsTrigger value="instagram" className="text-gray-700 dark:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Instagram</TabsTrigger>
            <TabsTrigger value="onboarding" className="text-gray-700 dark:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Onboarding</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-0 pt-8 pb-16">
            {/* Modern Profile Container */}
            <div className="relative" id="profile-container">
              {/* Profile Header - Modern Design */}
              <div className="relative mb-12">
                <div className="flex flex-col items-center">
                  {/* Profile Image with Subtle Glow */}
                  <div className="relative mb-6 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 rounded-full opacity-70 blur-md group-hover:opacity-90 transition-opacity duration-300"></div>
                    {instagramData?.isConnected && instagramData.profile?.profile_picture_url ? (
                      <Image
                        src={instagramData.profile.profile_picture_url}
                        alt={profileData?.name || 'Profile'}
                        width={150}
                        height={150}
                        className="relative rounded-full object-cover border-2 border-white/50 dark:border-black/50 shadow-lg z-10 group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <div className="relative w-[150px] h-[150px] bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-zinc-800 shadow-lg z-10 group-hover:scale-[1.02] transition-transform duration-300">
                        <User className="h-16 w-16 text-gray-400 dark:text-zinc-600" />
                      </div>
                    )}
                  </div>

                  {/* Name and Info with Modern Typography */}
                  <div className="text-center relative">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-violet-400 to-fuchsia-400">
                        {profileData?.name || 'Your Name'}
                      </span>
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-400 max-w-md mx-auto text-sm md:text-base">
                      {profileData?.email}
                    </p>

                    {/* Instagram Connection Badge - Subtle Modern Design */}
                    {instagramData?.isConnected && instagramData.profile && (
                      <div className="mt-4 inline-flex items-center px-3 py-1.5 bg-gray-100/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-violet-300/20 dark:border-violet-500/20 rounded-full hover:border-violet-300/40 dark:hover:border-violet-500/40 transition-colors duration-300">
                        <Instagram className="h-3.5 w-3.5 text-fuchsia-500 dark:text-fuchsia-400 mr-2" />
                        <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">@{instagramData.profile.username}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content with Modern Card Layout */}
              <div className="space-y-16 max-w-6xl mx-auto">
                {/* Performance Stats - Modern Card Layout */}
                <section className="relative" id="performance-stats">
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white inline-flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-violet-500 dark:text-violet-400" />
                      Performance Stats
                    </h2>
                    <div className="h-px w-full bg-gradient-to-r from-violet-400/50 to-fuchsia-400/50 dark:from-violet-500/50 dark:to-fuchsia-500/50 mt-2"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Rating Card */}
                    <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm rounded-xl overflow-hidden group hover:bg-white/90 dark:hover:bg-zinc-900/90 transition-colors duration-300 border border-gray-200/50 dark:border-zinc-800/50 shadow-sm">
                      <div className="h-1 bg-gradient-to-r from-violet-400 to-fuchsia-400 dark:from-violet-500 dark:to-fuchsia-500"></div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Rating</h3>
                          <Star className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                          {profileData?.rating || 0}
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-zinc-500">Based on client reviews</div>
                      </div>
                    </div>

                    {/* Completed Deals Card */}
                    <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm rounded-xl overflow-hidden group hover:bg-white/90 dark:hover:bg-zinc-900/90 transition-colors duration-300 border border-gray-200/50 dark:border-zinc-800/50 shadow-sm">
                      <div className="h-1 bg-gradient-to-r from-fuchsia-400 to-violet-400 dark:from-fuchsia-500 dark:to-violet-500"></div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Completed Deals</h3>
                          <Briefcase className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                          {profileData?.completedDeals || 0}
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-zinc-500">Total successful collaborations</div>
                      </div>
                    </div>

                    {/* Earnings Card (Placeholder) */}
                    <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm rounded-xl overflow-hidden group hover:bg-white/90 dark:hover:bg-zinc-900/90 transition-colors duration-300 border border-gray-200/50 dark:border-zinc-800/50 shadow-sm">
                      <div className="h-1 bg-gradient-to-r from-violet-400 to-fuchsia-400 dark:from-violet-500 dark:to-fuchsia-500"></div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Earnings</h3>
                          <BadgeIndianRupee className="h-4 w-4 text-green-500 dark:text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                          ₹0
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-zinc-500">Total earnings to date</div>
                      </div>
                    </div>

                    {/* Account Age Card */}
                    <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm rounded-xl overflow-hidden group hover:bg-white/90 dark:hover:bg-zinc-900/90 transition-colors duration-300 border border-gray-200/50 dark:border-zinc-800/50 shadow-sm">
                      <div className="h-1 bg-gradient-to-r from-fuchsia-400 to-violet-400 dark:from-fuchsia-500 dark:to-violet-500"></div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Account Age</h3>
                          <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                          0 days
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-zinc-500">Member since N/A</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Support Hub - Modern Card Design */}
                <section className="relative" id="support-hub">
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-white inline-flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-violet-400" />
                      Support Hub
                    </h2>
                    <div className="h-px w-full bg-gradient-to-r from-violet-500/50 to-fuchsia-500/50 mt-2"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={handleFaqsClick}
                      className="group bg-zinc-900/70 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-zinc-900/90 transition-colors duration-300 p-6 text-left"
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-violet-900/30 transition-colors duration-300">
                          <MessageSquare className="h-5 w-5 text-violet-400" />
                        </div>
                        <h3 className="text-lg font-semibold ml-4 text-white">Frequently Asked Questions</h3>
                      </div>
                      <p className="text-sm text-zinc-400 ml-14">Find answers to common questions about the platform, deals, and payments</p>
                    </button>

                    <button
                      onClick={handleContactClick}
                      className="group bg-zinc-900/70 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-zinc-900/90 transition-colors duration-300 p-6 text-left"
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-fuchsia-900/30 transition-colors duration-300">
                          <Mail className="h-5 w-5 text-fuchsia-400" />
                        </div>
                        <h3 className="text-lg font-semibold ml-4 text-white">Contact Support</h3>
                      </div>
                      <p className="text-sm text-zinc-400 ml-14">Get in touch with our support team for personalized assistance</p>
                    </button>
                  </div>
                </section>

                {/* Notifications Hub - Modern Design */}
                <section className="relative" id="notifications-hub">
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-white inline-flex items-center">
                      <BellIcon className="h-5 w-5 mr-2 text-violet-400" />
                      Notifications
                    </h2>
                    <div className="h-px w-full bg-gradient-to-r from-violet-500/50 to-fuchsia-500/50 mt-2"></div>
                  </div>

                  <div className="bg-zinc-900/70 backdrop-blur-sm rounded-xl overflow-hidden p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                      <div>
                        <h3 className="font-semibold text-white text-lg">Push Notifications</h3>
                        <p className="text-sm text-zinc-400 mt-1">Get real-time updates on deals, messages, and platform activity</p>
                      </div>

                      {isSupported ? (
                        isSubscribed ? (
                          <div className="flex items-center gap-2 bg-zinc-800 border border-green-500/30 text-white px-4 py-2 rounded-lg">
                            <Check className="h-5 w-5 text-green-400" />
                            <span className="font-medium">Notifications Enabled</span>
                          </div>
                        ) : (
                          <button
                            onClick={handleEnableNotifications}
                            className="inline-flex items-center px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-violet-500/30 hover:border-violet-500/50 transition-all duration-300"
                          >
                            <BellIcon className="h-4 w-4 mr-2 text-violet-400" />
                            <span>Enable Notifications</span>
                          </button>
                        )
                      ) : (
                        <div className="bg-zinc-800 text-zinc-400 px-4 py-2 rounded-lg text-sm border border-zinc-700">
                          Not supported in your browser
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <h3 className="font-medium text-white mb-4">Notification Categories:</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30 hover:border-violet-500/30 transition-colors duration-300">
                          <div className="w-8 h-8 rounded-full bg-violet-900/30 flex items-center justify-center mr-3">
                            <Briefcase className="h-4 w-4 text-violet-400" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-white">Deal Offers</span>
                            <p className="text-xs text-zinc-500 mt-1">New collaboration opportunities</p>
                          </div>
                        </div>

                        <div className="flex items-center p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30 hover:border-violet-500/30 transition-colors duration-300">
                          <div className="w-8 h-8 rounded-full bg-fuchsia-900/30 flex items-center justify-center mr-3">
                            <RefreshCw className="h-4 w-4 text-fuchsia-400" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-white">Status Updates</span>
                            <p className="text-xs text-zinc-500 mt-1">Changes to your active deals</p>
                          </div>
                        </div>

                        <div className="flex items-center p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30 hover:border-violet-500/30 transition-colors duration-300">
                          <div className="w-8 h-8 rounded-full bg-violet-900/30 flex items-center justify-center mr-3">
                            <MessageSquare className="h-4 w-4 text-violet-400" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-white">Messages</span>
                            <p className="text-xs text-zinc-500 mt-1">New messages from brands</p>
                          </div>
                        </div>

                        <div className="flex items-center p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30 hover:border-violet-500/30 transition-colors duration-300">
                          <div className="w-8 h-8 rounded-full bg-fuchsia-900/30 flex items-center justify-center mr-3">
                            <BadgeIndianRupee className="h-4 w-4 text-fuchsia-400" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-white">Payments</span>
                            <p className="text-xs text-zinc-500 mt-1">Payment confirmations and updates</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="instagram" className="space-y-8 pt-6 pb-16">
            {/* Instagram Overview Container */}
            <div className="relative">
              {/* Header with profile overview - Dark Modern Design */}
              <div className="relative mb-10 overflow-hidden rounded-3xl shadow-xl bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-zinc-800">
                {/* Subtle gradient effects */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full bg-fuchsia-900/20 blur-3xl"></div>
                  <div className="absolute right-10 top-20 w-80 h-80 rounded-full bg-violet-900/20 blur-3xl"></div>
                  <div className="absolute bottom-0 left-1/3 w-96 h-32 rounded-full bg-gradient-to-r from-violet-900/20 to-fuchsia-900/20 blur-3xl"></div>
                </div>

                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-5 mix-blend-overlay">
                  <svg viewBox="0 0 1024 1024" className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                    <filter id="noise">
                      <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="4" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noise)" />
                  </svg>
                </div>

                <div className="relative p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center">
                  {/* Profile image with glow effect */}
                  <div className="relative shrink-0 group">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 opacity-70 blur-sm"></div>
                    {instagramData?.profile?.profile_picture_url ? (
                      <div className="relative z-10">
                        <Image
                          src={instagramData.profile.profile_picture_url}
                          alt={instagramData.profile.username || 'Profile'}
                          width={130}
                          height={130}
                          className="rounded-full object-cover border-4 border-black shadow-xl transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 rounded-full bg-black opacity-0 group-hover:opacity-20 flex items-center justify-center transition-opacity duration-300">
                          <LinkIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <Link
                          href={`https://instagram.com/${instagramData?.profile?.username || ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 rounded-full z-20"
                          aria-label="View on Instagram"
                        />
                      </div>
                    ) : (
                      <div className="relative z-10 w-32 h-32 bg-zinc-900 rounded-full flex items-center justify-center border-4 border-black shadow-lg">
                        <Instagram className="h-14 w-14 text-zinc-600" />
                      </div>
                    )}
                  </div>

                  {/* Profile info */}
                  <div className="flex-1 text-center md:text-left text-white">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                      @{instagramData?.profile?.username || 'username'}
                    </h2>

                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3 mb-4">
                      <Link
                        href={`https://instagram.com/${instagramData?.profile?.username || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors text-white border border-zinc-700"
                      >
                        <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                        <span className="text-sm font-medium">View Profile</span>
                      </Link>

                      <button
                        onClick={handleReconnectInstagram}
                        disabled={isConnecting}
                        className="flex items-center px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors text-white disabled:opacity-70 disabled:cursor-not-allowed border border-zinc-700"
                      >
                        {isConnecting ? (
                          <Loader className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Instagram className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        <span className="text-sm font-medium">
                          {isConnecting ? "Connecting..." : "Reconnect"}
                        </span>
                      </button>

                      <button
                        onClick={refreshInstagramData}
                        disabled={isConnecting}
                        className="flex items-center px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors text-white disabled:opacity-70 disabled:cursor-not-allowed border border-zinc-700"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        <span className="text-sm font-medium">Refresh</span>
                      </button>
                    </div>

                    {/* Stats tiles */}
                    <div className="grid grid-cols-3 gap-3 max-w-lg">
                      <div className="bg-zinc-800/80 backdrop-blur-sm rounded-xl p-3 text-center border border-zinc-700/50">
                        <div className="text-2xl font-bold text-white">
                          {instagramData?.profile?.followers_count?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Followers</div>
                      </div>

                      <div className="bg-zinc-800/80 backdrop-blur-sm rounded-xl p-3 text-center border border-zinc-700/50">
                        <div className="text-2xl font-bold text-white">
                          {instagramData?.profile?.media_count?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Posts</div>
                      </div>

                      <div className="bg-zinc-800/80 backdrop-blur-sm rounded-xl p-3 text-center border border-zinc-700/50">
                        <div className="text-sm font-bold truncate text-white">
                          {instagramData?.profile?.account_type
                            ? instagramData.profile.account_type
                              .split('_')
                              .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                              .join(' ')
                            : 'Unknown'}
                        </div>
                        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Account Type</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Analytics Summary */}
                <div className="col-span-1 transform-gpu">
                  <div className="sticky top-6 space-y-6">
                    {/* Automation Card */}
                    <div className="relative overflow-hidden bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-600 to-fuchsia-600"></div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold flex items-center text-white mb-4">
                          <MessageSquare className="h-5 w-5 text-violet-400 mr-2" />
                          <span>Automation</span>
                        </h3>

                        <p className="text-sm text-zinc-400 mb-5">
                          Set up automated responses and enhance your Instagram engagement.
                        </p>

                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => router.push('/influencer/instagram/automation')}
                            className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 transition-colors"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            <span className="font-medium">Message Automation</span>
                          </button>

                          <button
                            onClick={handleReconnectInstagram}
                            disabled={isConnecting}
                            className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {isConnecting ? (
                              <Loader className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Instagram className="h-4 w-4 mr-2" />
                            )}
                            <span className="font-medium">
                              {isConnecting ? "Connecting..." : "Reconnect Instagram"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Key Performance Indicators */}
                    {instagramData?.analytics && (
                      <div className="relative overflow-hidden bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-fuchsia-600 to-violet-600"></div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold flex items-center text-white mb-4">
                            <BarChart3 className="h-5 w-5 text-fuchsia-400 mr-2" />
                            <span>Key Metrics</span>
                          </h3>

                          <div className="space-y-3">
                            <div className="relative overflow-hidden rounded-xl bg-zinc-800 border border-zinc-700 p-4 flex items-center">
                              <div className="bg-zinc-900 rounded-full p-2 mr-3 border border-blue-500/30">
                                <Play className="h-5 w-5 text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs font-medium text-zinc-400">Avg. Reel Views</span>
                                  <span className="flex items-center text-xs font-medium text-blue-400">
                                    <Trophy className="h-3 w-3 mr-1" />
                                    Last 30
                                  </span>
                                </div>
                                <div className="text-xl font-bold text-white">
                                  {(instagramData.analytics.avgReelViews || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <div className="relative overflow-hidden rounded-xl bg-zinc-800 border border-zinc-700 p-4 flex items-center">
                              <div className="bg-zinc-900 rounded-full p-2 mr-3 border border-rose-500/30">
                                <Heart className="h-5 w-5 text-rose-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs font-medium text-zinc-400">Avg. Reel Likes</span>
                                  <span className="flex items-center text-xs font-medium text-rose-400">
                                    <Flame className="h-3 w-3 mr-1" />
                                    Last 30
                                  </span>
                                </div>
                                <div className="text-xl font-bold text-white">
                                  {(instagramData.analytics.avgReelLikes || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <div className="relative overflow-hidden rounded-xl bg-zinc-800 border border-zinc-700 p-4 flex items-center">
                              <div className="bg-zinc-900 rounded-full p-2 mr-3 border border-green-500/30">
                                <LineChart className="h-5 w-5 text-green-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs font-medium text-zinc-400">Avg. Engagement</span>
                                  <span className="flex items-center text-xs font-medium text-green-400">
                                    <Users className="h-3 w-3 mr-1" />
                                    Per Post
                                  </span>
                                </div>
                                <div className="text-xl font-bold text-white">
                                  {instagramData.analytics.averageEngagement.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Content & Performance Details */}
                <div className="col-span-1 lg:col-span-2 space-y-6 transform-gpu">
                  {/* Latest Content */}
                  {!instagramData?.analytics ? (
                    <div className="p-10 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg">
                      <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                          <Instagram className="h-10 w-10 text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">No Analytics Available</h3>
                        <p className="text-zinc-400 max-w-md">
                          Connect your Instagram account to view your analytics and performance data.
                        </p>
                        <button
                          onClick={handleReconnectInstagram}
                          disabled={isConnecting}
                          className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isConnecting ? (
                            <Loader className="inline-block mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Instagram className="inline-block mr-2 h-4 w-4" />
                          )}
                          {isConnecting ? "Connecting..." : "Connect Instagram"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Debug Info - Styled nicely */}
                      <div className="relative overflow-hidden bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-zinc-600 to-zinc-700"></div>
                        <div className="p-6">
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center text-white">
                              <Clipboard className="h-5 w-5 text-zinc-400 mr-2" />
                              <span>Account Details</span>
                            </h3>

                            <div className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full border border-zinc-700">
                              {instagramData.analytics.lastUpdated &&
                                `Updated ${new Date(instagramData.analytics.lastUpdated).toLocaleDateString()}`
                              }
                            </div>
                          </div>

                          <InstagramDebugInfo
                            instagramData={instagramData || null}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-6 pt-4">
            <div className="space-y-6">
              {/* Onboarding Status Card */}
              <Card className="shadow-md border border-zinc-800 bg-black">
                <CardHeader className="bg-zinc-900 border-b border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Clipboard className="h-6 w-6 text-fuchsia-400" />
                      <CardTitle className="text-xl font-semibold text-white">Onboarding Status</CardTitle>
                    </div>
                     {onboardingData?.influencer?.onboardingCompleted ? (
                        <div className="bg-green-900/30 text-green-300 px-4 py-1 rounded-full text-sm font-medium flex items-center shadow-sm border border-green-700/50">
                          <Check className="h-4 w-4 mr-1.5" />
                          Completed
                        </div>
                      ) : (
                        <div className="bg-amber-900/30 text-amber-300 px-4 py-1 rounded-full text-sm font-medium shadow-sm border border-amber-700/50">
                          In Progress
                        </div>
                      )}
                  </div>
                  <CardDescription className="text-zinc-400">
                    Your onboarding progress and submitted information
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Onboarding Progress */}
                  <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                    <div>
                      <h3 className="font-medium text-white">Current Progress</h3>
                      <p className="text-sm text-zinc-400">
                        {onboardingData?.influencer?.onboardingCompleted
                          ? 'All onboarding steps completed successfully.'
                          : `Currently on step ${(onboardingData?.influencer?.onboardingStep ?? 0) + 1} of 4`}
                      </p>
                    </div>
                    {/* Progress indicator could go here if needed */}
                  </div>

                  {/* Basic Info */}
                  <div>
                    <h3 className="font-semibold mb-3 text-lg text-white">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bio */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400 block">Bio Summary</label>
                        <p className="text-sm p-3 bg-zinc-900 rounded-md border border-zinc-800 min-h-[5rem] text-white">
                          {onboardingData?.influencer?.bio || <span className="italic text-zinc-500">No bio provided</span>}
                        </p>
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400 block">Location</label>
                        <div className="flex items-center space-x-2 p-3 bg-zinc-900 rounded-md border border-zinc-800">
                          <MapPin className="h-4 w-4 text-zinc-500 shrink-0" />
                          <span className="text-sm text-white">{onboardingData?.influencer?.city || <span className="italic text-zinc-500">No city provided</span>}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Models Card */}
              <Card className="shadow-md border border-zinc-800 bg-black">
                <CardHeader className="bg-zinc-900 border-b border-zinc-800">
                  <div className="flex items-center space-x-3">
                    <BadgeIndianRupee className="h-6 w-6 text-fuchsia-400" />
                    <CardTitle className="text-xl font-semibold text-white">Pricing Models</CardTitle>
                  </div>
                  <CardDescription className="text-zinc-400">
                    Your pricing preferences and package details
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="space-y-8">
                    {/* Fixed Pricing */}
                    <div className="space-y-4 p-4 border border-zinc-800 rounded-lg bg-zinc-900">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-white">Fixed Pricing</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          onboardingData?.influencer?.pricingModels?.fixedPricing?.enabled
                            ? 'bg-green-900/30 text-green-300 border border-green-700/50'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          {onboardingData?.influencer?.pricingModels?.fixedPricing?.enabled ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>

                      {onboardingData?.influencer?.pricingModels?.fixedPricing?.enabled ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                          {[
                            { label: 'Story', price: onboardingData?.influencer?.pricingModels?.fixedPricing?.storyPrice },
                            { label: 'Reel', price: onboardingData?.influencer?.pricingModels?.fixedPricing?.reelPrice },
                            { label: 'Post', price: onboardingData?.influencer?.pricingModels?.fixedPricing?.postPrice },
                            { label: 'Live', price: onboardingData?.influencer?.pricingModels?.fixedPricing?.livePrice }
                          ].map((item, index) => item.price !== null && item.price !== undefined ? (
                            <div key={index} className="bg-black p-3 rounded-md border border-zinc-800 text-center shadow-sm">
                              <div className="text-xs text-zinc-400 uppercase tracking-wider">{item.label}</div>
                              <div className="font-semibold mt-1 text-fuchsia-400">₹{item.price.toLocaleString()}</div>
                            </div>
                          ) : null)}
                        </div>
                      ) : (
                         <p className="text-sm text-zinc-500 italic">Fixed pricing is currently disabled.</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Negotiable Pricing */}
                        <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900">
                          <h3 className="font-semibold text-white">Negotiable Pricing</h3>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            onboardingData?.influencer?.pricingModels?.negotiablePricing
                              ? 'bg-green-900/30 text-green-300 border border-green-700/50'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {onboardingData?.influencer?.pricingModels?.negotiablePricing ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>

                        {/* Barter Deals Enabled/Disabled */}
                         <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900">
                          <h3 className="font-semibold text-white">Barter Deals</h3>
                           <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              onboardingData?.influencer?.pricingModels?.barterDeals?.enabled
                                ? 'bg-green-900/30 text-green-300 border border-green-700/50'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}>
                              {onboardingData?.influencer?.pricingModels?.barterDeals?.enabled ? 'Enabled' : 'Disabled'}
                            </div>
                        </div>
                    </div>

                    {/* Package Deals */}
                    <div className="space-y-4 p-4 border border-zinc-800 rounded-lg bg-zinc-900">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-white">Package Deals</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          onboardingData?.influencer?.pricingModels?.packageDeals?.enabled
                             ? 'bg-green-900/30 text-green-300 border border-green-700/50'
                             : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          {onboardingData?.influencer?.pricingModels?.packageDeals?.enabled ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>

                      {onboardingData?.influencer?.pricingModels?.packageDeals?.enabled &&
                        onboardingData?.influencer?.pricingModels?.packageDeals?.packages.length > 0 ? (
                        <div className="space-y-4 pt-2">
                          {onboardingData?.influencer?.pricingModels?.packageDeals?.packages.map((pkg, index) => (
                            <div key={index} className="bg-black p-4 rounded-md border border-zinc-800 shadow-sm">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <div className="font-semibold text-white">{pkg.name}</div>
                                    <div className="text-sm text-zinc-400 mt-1">{pkg.includedServices}</div>
                                 </div>
                                 <div className="mt-1 font-semibold text-lg text-fuchsia-400 whitespace-nowrap">₹{pkg.totalPrice.toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : onboardingData?.influencer?.pricingModels?.packageDeals?.enabled ? (
                         <p className="text-sm text-zinc-500 italic">No package deals have been created yet.</p>
                      ): (
                         <p className="text-sm text-zinc-500 italic">Package deals are currently disabled.</p>
                      )}
                    </div>

                    {/* Barter Deals Details */}
                    {onboardingData?.influencer?.pricingModels?.barterDeals?.enabled && (
                       <div className="space-y-4 p-4 border border-zinc-800 rounded-lg bg-zinc-900">
                          <h3 className="font-semibold text-lg text-white">Barter Deal Preferences</h3>

                            {onboardingData?.influencer?.pricingModels?.barterDeals?.acceptedCategories.length > 0 ? (
                              <div>
                                <label className="text-sm font-medium text-zinc-400 block mb-2">Accepted Categories</label>
                                <div className="flex flex-wrap gap-2">
                                  {onboardingData?.influencer?.pricingModels?.barterDeals?.acceptedCategories.map((category, index) => (
                                    <div key={index} className="bg-violet-900/30 text-violet-300 px-3 py-1 rounded-full text-sm font-medium border border-violet-700/50">
                                      {category}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                               <p className="text-sm text-zinc-500 italic">No specific categories accepted for barter deals.</p>
                            )}

                            {onboardingData?.influencer?.pricingModels?.barterDeals?.restrictions && (
                              <div className="mt-4">
                                <label className="text-sm font-medium text-zinc-400 block mb-1">Restrictions / Notes</label>
                                <p className="text-sm p-3 bg-black rounded-md border border-zinc-800 text-white">{onboardingData?.influencer?.pricingModels?.barterDeals?.restrictions}</p>
                              </div>
                            )}
                       </div>
                    )}

                  </div>
                </CardContent>
              </Card>

              {/* Brand Preferences Card */}
              <Card className="shadow-md border border-zinc-800 bg-black">
                <CardHeader className="bg-zinc-900 border-b border-zinc-800">
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-6 w-6 text-fuchsia-400" />
                    <CardTitle className="text-xl font-semibold text-white">Brand Preferences</CardTitle>
                  </div>
                  <CardDescription className="text-zinc-400">
                    Your preferred brand types and collaboration styles
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                   <div className="space-y-6">
                     {(onboardingData?.influencer?.brandPreferences?.preferredBrandTypes?.length ?? 0) === 0 &&
                      (onboardingData?.influencer?.brandPreferences?.exclusions?.length ?? 0) === 0 &&
                      (onboardingData?.influencer?.brandPreferences?.collabStyles?.length ?? 0) === 0 ? (
                         <p className="text-sm text-zinc-500 italic text-center py-4">No brand preferences specified during onboarding.</p>
                     ) : (
                       <>
                         {/* Preferred Brand Types */}
                         {(onboardingData?.influencer?.brandPreferences?.preferredBrandTypes?.length ?? 0) > 0 && (
                           <div>
                             <h3 className="font-semibold mb-3 text-white">Preferred Brand Types</h3>
                             <div className="flex flex-wrap gap-2">
                               {onboardingData?.influencer?.brandPreferences?.preferredBrandTypes?.map((type, index) => (
                                 <div key={index} className="bg-fuchsia-900/30 text-fuchsia-300 px-3 py-1 rounded-full text-sm font-medium border border-fuchsia-700/50">
                                   {type}
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                         {/* Exclusions */}
                         {(onboardingData?.influencer?.brandPreferences?.exclusions?.length ?? 0) > 0 && (
                           <div>
                             <h3 className="font-semibold mb-3 text-white">Brand Exclusions</h3>
                             <div className="flex flex-wrap gap-2">
                               {onboardingData?.influencer?.brandPreferences?.exclusions?.map((exclusion, index) => (
                                 <div key={index} className="bg-red-900/30 text-red-300 px-3 py-1 rounded-full text-sm font-medium border border-red-700/50">
                                   {exclusion}
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                         {/* Collaboration Styles */}
                         {(onboardingData?.influencer?.brandPreferences?.collabStyles?.length ?? 0) > 0 && (
                           <div>
                             <h3 className="font-semibold mb-3 text-white">Preferred Collaboration Styles</h3>
                             <div className="flex flex-wrap gap-2">
                               {onboardingData?.influencer?.brandPreferences?.collabStyles?.map((style, index) => (
                                 <div key={index} className="bg-violet-900/30 text-violet-300 px-3 py-1 rounded-full text-sm font-medium border border-violet-700/50">
                                   {style}
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}
                       </>
                     )}
                   </div>
                 </CardContent>
              </Card>

              {/* Edit Onboarding Button */}
              <div className="flex justify-center mt-8 pt-6 border-t border-zinc-800">
                <Button asChild size="lg" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white">
                  <Link href="/influencer/onboarding/basic-info">
                    <Edit className="h-5 w-5 mr-2" />
                    Edit Onboarding Information
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;