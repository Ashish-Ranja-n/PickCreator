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

  // Calculate account age in days
  const calculateAccountAge = () => {
    // Log the currentUser object to see its structure
    console.log('Current user object:', currentUser);

    // Check if createdAt exists directly or in a nested property
    if (!currentUser) return 0;

    // Try to get createdAt from different possible locations
    let createdAtValue;

    if (typeof currentUser.createdAt === 'string' || currentUser.createdAt instanceof Date) {
      createdAtValue = currentUser.createdAt;
    } else if (typeof (currentUser as any).createdAt === 'string' || (currentUser as any).createdAt instanceof Date) {
      createdAtValue = (currentUser as any).createdAt;
    } else if ((currentUser as any).user && ((currentUser as any).user.createdAt instanceof Date || typeof (currentUser as any).user.createdAt === 'string')) {
      createdAtValue = (currentUser as any).user.createdAt;
    }

    if (!createdAtValue) {
      // Try to find a timestamp field
      if (typeof currentUser.updatedAt === 'string' || currentUser.updatedAt instanceof Date) {
        createdAtValue = currentUser.updatedAt;
      }
    }

    if (!createdAtValue) return 0;

    try {
      const createdDate = new Date(createdAtValue);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - createdDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch (error) {
      console.error('Error calculating account age:', error);
      return 0;
    }
  };

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
        {/* Fresh Mobile-Optimized Profile Header */}
        <div className="mb-8 px-1">
          <div className="flex items-center">
            {/* Profile image on the left */}
            <div className="relative mr-4 flex-shrink-0">
              {instagramData?.isConnected && instagramData.profile?.profile_picture_url ? (
                <div className="relative">
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-75 blur-sm"></div>
                  <Image
                    src={instagramData.profile.profile_picture_url}
                    alt={profileData?.name || 'Profile'}
                    width={72}
                    height={72}
                    className="relative rounded-full object-cover border-2 border-white dark:border-black z-10"
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-75 blur-sm"></div>
                  <div className="relative w-[72px] h-[72px] bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center border-2 border-white dark:border-black z-10">
                    <User className="h-8 w-8 text-slate-400 dark:text-zinc-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Profile details in the middle */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {profileData?.name || 'Your Name'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {profileData?.email}
              </p>
              {/* Instagram connection badge */}
              {instagramData?.isConnected && instagramData.profile && (
                <div className="mt-1 inline-flex items-center">
                  <Instagram className="h-3.5 w-3.5 text-pink-500 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">@{instagramData.profile.username}</span>
                </div>
              )}
            </div>

            {/* Action buttons on the right */}
            <div className="flex-shrink-0 ml-2 flex space-x-2">

              {/* Settings button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="icon"
                    className="h-10 w-10 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all"
                  >
                    <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
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


        <Tabs defaultValue="profile">
          <TabsList className="grid w-full md:w-auto grid-cols-3 bg-gray-100 dark:bg-zinc-900 p-1 rounded-lg border border-gray-200 dark:border-zinc-800">
            <TabsTrigger value="profile" className="text-gray-700 dark:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Profile</TabsTrigger>
            <TabsTrigger value="instagram" className="text-gray-700 dark:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Instagram</TabsTrigger>
            <TabsTrigger value="onboarding" className="text-gray-700 dark:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Onboarding</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-0 pt-8 pb-16">
            {/* Modern Profile Container */}
            <div className="relative" id="profile-container">

              {/* Main Content with Modern Card Layout */}
              <div className="space-y-16 max-w-6xl mx-auto">
                {/* Performance Stats - Professional Design */}
                <section className="relative" id="performance-stats">
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                        Performance Metrics
                      </h2>
                      <div className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-zinc-800 px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-700">
                        Last 30 days
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      Track your key performance indicators and growth metrics
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Rating Card */}
                    <div className="bg-white dark:bg-zinc-800 rounded-xl overflow-hidden group hover:shadow-md transition-shadow duration-300 border border-slate-200 dark:border-zinc-700">
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-3">
                              <Star className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                            </div>
                            <h3 className="text-sm font-medium text-slate-900 dark:text-white">Rating</h3>
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            {profileData?.rating || 0}
                          </div>
                          <div className="text-xs text-green-500 dark:text-green-400 flex items-center">
                            <span className="font-medium">+0%</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Based on client reviews</div>
                      </div>
                    </div>

                    {/* Completed Deals Card */}
                    <div className="bg-white dark:bg-zinc-800 rounded-xl overflow-hidden group hover:shadow-md transition-shadow duration-300 border border-slate-200 dark:border-zinc-700">
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mr-3">
                              <Briefcase className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                            </div>
                            <h3 className="text-sm font-medium text-slate-900 dark:text-white">Completed Deals</h3>
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            {profileData?.completedDeals || 0}
                          </div>
                          <div className="text-xs text-green-500 dark:text-green-400 flex items-center">
                            <span className="font-medium">+0%</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Total successful collaborations</div>
                      </div>
                    </div>

                    {/* Earnings Card */}
                    <div className="bg-white dark:bg-zinc-800 rounded-xl overflow-hidden group hover:shadow-md transition-shadow duration-300 border border-slate-200 dark:border-zinc-700">
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                              <BadgeIndianRupee className="h-4 w-4 text-green-500 dark:text-green-400" />
                            </div>
                            <h3 className="text-sm font-medium text-slate-900 dark:text-white">Earnings</h3>
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            ₹0
                          </div>
                          <div className="text-xs text-green-500 dark:text-green-400 flex items-center">
                            <span className="font-medium">+0%</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Total earnings to date</div>
                      </div>
                    </div>

                    {/* Account Age Card */}
                    <div className="bg-white dark:bg-zinc-800 rounded-xl overflow-hidden group hover:shadow-md transition-shadow duration-300 border border-slate-200 dark:border-zinc-700">
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                              <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                            </div>
                            <h3 className="text-sm font-medium text-slate-900 dark:text-white">Account Age</h3>
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            {calculateAccountAge()}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                            <span className="font-medium">days</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Member since {(() => {
                            try {
                              // Try to get createdAt from different possible locations
                              let createdAtValue;

                              if (typeof currentUser?.createdAt === 'string' || currentUser?.createdAt instanceof Date) {
                                createdAtValue = currentUser.createdAt;
                              } else if (currentUser && typeof (currentUser as any).createdAt === 'string' || (currentUser as any).createdAt instanceof Date) {
                                createdAtValue = (currentUser as any).createdAt;
                              } else if (currentUser && (currentUser as any).user && ((currentUser as any).user.createdAt instanceof Date || typeof (currentUser as any).user.createdAt === 'string')) {
                                createdAtValue = (currentUser as any).user.createdAt;
                              }

                              if (!createdAtValue) return 'N/A';

                              return new Date(createdAtValue).toLocaleDateString();
                            } catch (error) {
                              console.error('Error formatting date:', error);
                              return 'N/A';
                            }
                          })()}
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
              {/* Header with profile overview - Modern Design with Light/Dark Mode Support */}
              <div className="relative mb-10 overflow-hidden rounded-3xl shadow-xl bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-zinc-900 dark:via-black dark:to-zinc-900 border border-slate-200 dark:border-zinc-800">
                {/* Subtle gradient effects */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full bg-violet-500/10 dark:bg-fuchsia-900/20 blur-3xl"></div>
                  <div className="absolute right-10 top-20 w-80 h-80 rounded-full bg-fuchsia-500/10 dark:bg-violet-900/20 blur-3xl"></div>
                  <div className="absolute bottom-0 left-1/3 w-96 h-32 rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 dark:from-violet-900/20 dark:to-fuchsia-900/20 blur-3xl"></div>
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

                <div className="relative p-8 md:p-10">
                  {/* Profile info - Centered design without duplicate profile image */}
                  <div className="flex-1 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-fuchsia-500 to-violet-500 dark:from-fuchsia-400 dark:to-violet-400 bg-clip-text text-transparent">
                      @{instagramData?.profile?.username || 'username'}
                    </h2>

                    <div className="flex flex-wrap justify-center gap-2 mt-3 mb-6">
                      <Link
                        href={`https://instagram.com/${instagramData?.profile?.username || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-1.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-full transition-colors text-gray-800 dark:text-white border border-gray-200 dark:border-zinc-700"
                      >
                        <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                        <span className="text-sm font-medium">View Profile</span>
                      </Link>

                      <button
                        onClick={handleReconnectInstagram}
                        disabled={isConnecting}
                        className="flex items-center px-4 py-1.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-full transition-colors text-gray-800 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed border border-gray-200 dark:border-zinc-700"
                      >
                        {isConnecting ? (
                          <Loader className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Instagram className="h-3.5 w-3.5 mr-1.5 text-pink-500" />
                        )}
                        <span className="text-sm font-medium">
                          {isConnecting ? "Connecting..." : "Reconnect"}
                        </span>
                      </button>

                      <button
                        onClick={refreshInstagramData}
                        disabled={isConnecting}
                        className="flex items-center px-4 py-1.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-full transition-colors text-gray-800 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed border border-gray-200 dark:border-zinc-700"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        <span className="text-sm font-medium">Refresh</span>
                      </button>
                    </div>

                    {/* Stats tiles */}
                    <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
                      <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200/50 dark:border-zinc-700/50 shadow-sm">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {instagramData?.profile?.followers_count?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Followers</div>
                      </div>

                      <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200/50 dark:border-zinc-700/50 shadow-sm">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {instagramData?.profile?.media_count?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Posts</div>
                      </div>

                      <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200/50 dark:border-zinc-700/50 shadow-sm">
                        <div className="text-sm font-bold truncate text-gray-900 dark:text-white">
                          {instagramData?.profile?.account_type
                            ? instagramData.profile.account_type
                              .split('_')
                              .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                              .join(' ')
                            : 'Unknown'}
                        </div>
                        <div className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Account Type</div>
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
                    {/* <div className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600"></div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold flex items-center text-gray-900 dark:text-white mb-4">
                          <MessageSquare className="h-5 w-5 text-violet-500 dark:text-violet-400 mr-2" />
                          <span>Automation</span>
                        </h3>

                        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
                          Set up automated responses and enhance your Instagram engagement.
                        </p>

                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => router.push('/influencer/instagram/automation')}
                            className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <MessageSquare className="h-4 w-4 mr-2 text-violet-500" />
                            <span className="font-medium">Message Automation</span>
                          </button>

                          <button
                            onClick={handleReconnectInstagram}
                            disabled={isConnecting}
                            className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 text-white hover:from-violet-600 hover:to-fuchsia-600 dark:hover:from-violet-700 dark:hover:to-fuchsia-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
                    </div> */}

                    {/* Key Performance Indicators */}
                    {instagramData?.analytics && (
                      <div className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-lg">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-fuchsia-500 to-violet-500 dark:from-fuchsia-600 dark:to-violet-600"></div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold flex items-center text-gray-900 dark:text-white mb-4">
                            <BarChart3 className="h-5 w-5 text-fuchsia-500 dark:text-fuchsia-400 mr-2" />
                            <span>Key Metrics</span>
                          </h3>

                          <div className="space-y-3">
                            <div className="relative overflow-hidden rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-4 flex items-center">
                              <div className="bg-white dark:bg-zinc-900 rounded-full p-2 mr-3 border border-blue-300 dark:border-blue-500/30">
                                <Play className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Avg. Reel Views</span>
                                  <span className="flex items-center text-xs font-medium text-blue-500 dark:text-blue-400">
                                    <Trophy className="h-3 w-3 mr-1" />
                                    Last 30
                                  </span>
                                </div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">
                                  {(instagramData.analytics.avgReelViews || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <div className="relative overflow-hidden rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-4 flex items-center">
                              <div className="bg-white dark:bg-zinc-900 rounded-full p-2 mr-3 border border-rose-300 dark:border-rose-500/30">
                                <Heart className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Avg. Reel Likes</span>
                                  <span className="flex items-center text-xs font-medium text-rose-500 dark:text-rose-400">
                                    <Flame className="h-3 w-3 mr-1" />
                                    Last 30
                                  </span>
                                </div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">
                                  {(instagramData.analytics.avgReelLikes || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <div className="relative overflow-hidden rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-4 flex items-center">
                              <div className="bg-white dark:bg-zinc-900 rounded-full p-2 mr-3 border border-green-300 dark:border-green-500/30">
                                <LineChart className="h-5 w-5 text-green-500 dark:text-green-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Avg. Engagement</span>
                                  <span className="flex items-center text-xs font-medium text-green-500 dark:text-green-400">
                                    <Users className="h-3 w-3 mr-1" />
                                    Per Post
                                  </span>
                                </div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">
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
                    <div className="p-10 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-lg">
                      <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-zinc-700">
                          <Instagram className="h-10 w-10 text-gray-400 dark:text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No Analytics Available</h3>
                        <p className="text-gray-500 dark:text-zinc-400 max-w-md">
                          Connect your Instagram account to view your analytics and performance data.
                        </p>
                        <button
                          onClick={handleReconnectInstagram}
                          disabled={isConnecting}
                          className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 text-white hover:from-violet-600 hover:to-fuchsia-600 dark:hover:from-violet-700 dark:hover:to-fuchsia-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
                      {/* Account Details Card */}
                      <div className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-lg">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-zinc-600 dark:to-zinc-700"></div>
                        <div className="p-6">
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center text-gray-900 dark:text-white">
                              <Clipboard className="h-5 w-5 text-gray-500 dark:text-zinc-400 mr-2" />
                              <span>Account Details</span>
                            </h3>

                            <div className="text-xs text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-full border border-gray-200 dark:border-zinc-700">
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
            {/* Edit Onboarding Button */}
              <div className="flex justify-center border-gray-200 dark:border-zinc-800">
                <Button asChild size="lg" className="bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-600 dark:hover:from-violet-700 dark:hover:to-fuchsia-700 text-white">
                  <Link href="/influencer/onboarding/basic-info">
                    <Edit className="h-5 w-5 mr-2" />
                    Edit Onboarding Information
                  </Link>
                </Button>
              </div>
              

              {/* Onboarding Status Card */}
              <Card className="shadow-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-black">
                <CardHeader className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Clipboard className="h-6 w-6 text-fuchsia-500 dark:text-fuchsia-400" />
                      <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Onboarding Status</CardTitle>
                    </div>
                     {onboardingData?.influencer?.onboardingCompleted ? (
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 px-4 py-1 rounded-full text-sm font-medium flex items-center shadow-sm border border-green-200 dark:border-green-700/50">
                          <Check className="h-4 w-4 mr-1.5" />
                          Completed
                        </div>
                      ) : (
                        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 px-4 py-1 rounded-full text-sm font-medium shadow-sm border border-amber-200 dark:border-amber-700/50">
                          In Progress
                        </div>
                      )}
                  </div>
                  <CardDescription className="text-gray-500 dark:text-zinc-400">
                    Your onboarding progress and submitted information
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Onboarding Progress */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Current Progress</h3>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        {onboardingData?.influencer?.onboardingCompleted
                          ? 'All onboarding steps completed successfully.'
                          : `Currently on step ${(onboardingData?.influencer?.onboardingStep ?? 0) + 1} of 4`}
                      </p>
                    </div>
                    {/* Progress indicator could go here if needed */}
                  </div>

                  {/* Basic Info */}
                  <div>
                    <h3 className="font-semibold mb-3 text-lg text-gray-900 dark:text-white">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bio */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-zinc-400 block">Bio Summary</label>
                        <p className="text-sm p-3 bg-gray-50 dark:bg-zinc-900 rounded-md border border-gray-200 dark:border-zinc-800 min-h-[5rem] text-gray-900 dark:text-white">
                          {onboardingData?.influencer?.bio || <span className="italic text-gray-400 dark:text-zinc-500">No bio provided</span>}
                        </p>
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-zinc-400 block">Location</label>
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-zinc-900 rounded-md border border-gray-200 dark:border-zinc-800">
                          <MapPin className="h-4 w-4 text-gray-400 dark:text-zinc-500 shrink-0" />
                          <span className="text-sm text-gray-900 dark:text-white">{onboardingData?.influencer?.city || <span className="italic text-gray-400 dark:text-zinc-500">No city provided</span>}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Info Card */}
              <Card className="shadow-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-black">
                <CardHeader className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center space-x-3">
                    <Clipboard className="h-6 w-6 text-fuchsia-500 dark:text-fuchsia-400" />
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Personal Info</CardTitle>
                  </div>
                  <CardDescription className="text-gray-500 dark:text-zinc-400">
                    Your personal information provided during onboarding
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Gender */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 dark:text-zinc-400 block">Gender</label>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-zinc-900 rounded-md border border-gray-200 dark:border-zinc-800">
                        <span className="text-sm text-gray-900 dark:text-white">{profileData?.gender || <span className="italic text-gray-400 dark:text-zinc-500">Not specified</span>}</span>
                      </div>
                    </div>
                    {/* Age */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 dark:text-zinc-400 block">Age</label>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-zinc-900 rounded-md border border-gray-200 dark:border-zinc-800">
                        <span className="text-sm text-gray-900 dark:text-white">{profileData?.age || <span className="italic text-gray-400 dark:text-zinc-500">Not specified</span>}</span>
                      </div>
                    </div>
                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 dark:text-zinc-400 block">Phone</label>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-zinc-900 rounded-md border border-gray-200 dark:border-zinc-800">
                        <span className="text-sm text-gray-900 dark:text-white">{profileData?.mobile || <span className="italic text-gray-400 dark:text-zinc-500">Not specified</span>}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Models Card */}
              <Card className="shadow-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-black">
                <CardHeader className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center space-x-3">
                    <BadgeIndianRupee className="h-6 w-6 text-fuchsia-500 dark:text-fuchsia-400" />
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Pricing Models</CardTitle>
                  </div>
                  <CardDescription className="text-gray-500 dark:text-zinc-400">
                    Your pricing preferences and package details
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="space-y-8">
                    {/* Fixed Pricing */}
                    <div className="space-y-4 p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Fixed Pricing</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          onboardingData?.influencer?.pricingModels?.fixedPricing?.enabled
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 border border-green-200 dark:border-green-700/50'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700'
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
                            <div key={index} className="bg-white dark:bg-black p-3 rounded-md border border-gray-200 dark:border-zinc-800 text-center shadow-sm">
                              <div className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{item.label}</div>
                              <div className="font-semibold mt-1 text-fuchsia-500 dark:text-fuchsia-400">₹{item.price.toLocaleString()}</div>
                            </div>
                          ) : null)}
                        </div>
                      ) : (
                         <p className="text-sm text-gray-500 dark:text-zinc-500 italic">Fixed pricing is currently disabled.</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Negotiable Pricing */}
                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900">
                          <h3 className="font-semibold text-gray-900 dark:text-white">Negotiable Pricing</h3>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            onboardingData?.influencer?.pricingModels?.negotiablePricing
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 border border-green-200 dark:border-green-700/50'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700'
                          }`}>
                            {onboardingData?.influencer?.pricingModels?.negotiablePricing ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>

                        {/* Barter Deals Enabled/Disabled */}
                         <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900">
                          <h3 className="font-semibold text-gray-900 dark:text-white">Barter Deals</h3>
                           <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              onboardingData?.influencer?.pricingModels?.barterDeals?.enabled
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 border border-green-200 dark:border-green-700/50'
                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700'
                            }`}>
                              {onboardingData?.influencer?.pricingModels?.barterDeals?.enabled ? 'Enabled' : 'Disabled'}
                            </div>
                        </div>
                    </div>

                    {/* Package Deals */}
                    <div className="space-y-4 p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Package Deals</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          onboardingData?.influencer?.pricingModels?.packageDeals?.enabled
                             ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 border border-green-200 dark:border-green-700/50'
                             : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700'
                        }`}>
                          {onboardingData?.influencer?.pricingModels?.packageDeals?.enabled ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>

                      {onboardingData?.influencer?.pricingModels?.packageDeals?.enabled &&
                        onboardingData?.influencer?.pricingModels?.packageDeals?.packages.length > 0 ? (
                        <div className="space-y-4 pt-2">
                          {onboardingData?.influencer?.pricingModels?.packageDeals?.packages.map((pkg, index) => (
                            <div key={index} className="bg-white dark:bg-black p-4 rounded-md border border-gray-200 dark:border-zinc-800 shadow-sm">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{pkg.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{pkg.includedServices}</div>
                                 </div>
                                 <div className="mt-1 font-semibold text-lg text-fuchsia-500 dark:text-fuchsia-400 whitespace-nowrap">₹{pkg.totalPrice.toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : onboardingData?.influencer?.pricingModels?.packageDeals?.enabled ? (
                         <p className="text-sm text-gray-500 dark:text-zinc-500 italic">No package deals have been created yet.</p>
                      ): (
                         <p className="text-sm text-gray-500 dark:text-zinc-500 italic">Package deals are currently disabled.</p>
                      )}
                    </div>

                    {/* Barter Deals Details */}
                    {onboardingData?.influencer?.pricingModels?.barterDeals?.enabled && (
                       <div className="space-y-4 p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Barter Deal Preferences</h3>

                            {onboardingData?.influencer?.pricingModels?.barterDeals?.acceptedCategories.length > 0 ? (
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-zinc-400 block mb-2">Accepted Categories</label>
                                <div className="flex flex-wrap gap-2">
                                  {onboardingData?.influencer?.pricingModels?.barterDeals?.acceptedCategories.map((category, index) => (
                                    <div key={index} className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 px-3 py-1 rounded-full text-sm font-medium border border-violet-200 dark:border-violet-700/50">
                                      {category}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                               <p className="text-sm text-gray-500 dark:text-zinc-500 italic">No specific categories accepted for barter deals.</p>
                            )}

                            {onboardingData?.influencer?.pricingModels?.barterDeals?.restrictions && (
                              <div className="mt-4">
                                <label className="text-sm font-medium text-gray-500 dark:text-zinc-400 block mb-1">Restrictions / Notes</label>
                                <p className="text-sm p-3 bg-white dark:bg-black rounded-md border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white">{onboardingData?.influencer?.pricingModels?.barterDeals?.restrictions}</p>
                              </div>
                            )}
                       </div>
                    )}

                  </div>
                </CardContent>
              </Card>

              {/* Brand Preferences Card */}
              <Card className="shadow-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-black">
                <CardHeader className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-6 w-6 text-fuchsia-500 dark:text-fuchsia-400" />
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Brand Preferences</CardTitle>
                  </div>
                  <CardDescription className="text-gray-500 dark:text-zinc-400">
                    Your preferred brand types and collaboration styles
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                   <div className="space-y-6">
                     {(onboardingData?.influencer?.brandPreferences?.preferredBrandTypes?.length ?? 0) === 0 &&
                      (onboardingData?.influencer?.brandPreferences?.exclusions?.length ?? 0) === 0 &&
                      (onboardingData?.influencer?.brandPreferences?.collabStyles?.length ?? 0) === 0 ? (
                         <p className="text-sm text-gray-500 dark:text-zinc-500 italic text-center py-4">No brand preferences specified during onboarding.</p>
                     ) : (
                       <>
                         {/* Preferred Brand Types */}
                         {(onboardingData?.influencer?.brandPreferences?.preferredBrandTypes?.length ?? 0) > 0 && (
                           <div>
                             <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Preferred Brand Types</h3>
                             <div className="flex flex-wrap gap-2">
                               {onboardingData?.influencer?.brandPreferences?.preferredBrandTypes?.map((type, index) => (
                                 <div key={index} className="bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-300 px-3 py-1 rounded-full text-sm font-medium border border-fuchsia-200 dark:border-fuchsia-700/50">
                                   {type}
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                         {/* Exclusions */}
                         {(onboardingData?.influencer?.brandPreferences?.exclusions?.length ?? 0) > 0 && (
                           <div>
                             <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Brand Exclusions</h3>
                             <div className="flex flex-wrap gap-2">
                               {onboardingData?.influencer?.brandPreferences?.exclusions?.map((exclusion, index) => (
                                 <div key={index} className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium border border-red-200 dark:border-red-700/50">
                                   {exclusion}
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                         {/* Collaboration Styles */}
                         {(onboardingData?.influencer?.brandPreferences?.collabStyles?.length ?? 0) > 0 && (
                           <div>
                             <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Preferred Collaboration Styles</h3>
                             <div className="flex flex-wrap gap-2">
                               {onboardingData?.influencer?.brandPreferences?.collabStyles?.map((style, index) => (
                                 <div key={index} className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 px-3 py-1 rounded-full text-sm font-medium border border-violet-200 dark:border-violet-700/50">
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

              
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;