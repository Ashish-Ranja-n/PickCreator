'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { NextPage } from 'next';
import { LogOutIcon, UserRoundXIcon, PencilIcon, BellIcon, UserIcon, MapPinIcon, MailIcon, BriefcaseIcon, StarIcon, UsersIcon, EyeIcon, MessageSquareIcon, GlobeIcon, PhoneIcon, KeyRoundIcon } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useCurrentUserWithStatus } from '@/hook/useCurrentUser';
import { useNotifications } from '@/hook/useNotifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useLogout } from '@/hook/useLogout';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface ProfileData {
  name: string;
  email: string;
  avatar: string;
  companyName: string;
  website: string;
  bio: string;
  phoneNumber: string;
  location: string;
  connections?: number;
  rating?: number;
}

const Profile: NextPage = () => {
  const { user: currentUser, isLoading } = useCurrentUserWithStatus();
  const userId = currentUser?._id;
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const { toast } = useToast();

  // Dialog states
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);

  // Call hooks at the top level unconditionally
  const logoutFn = useLogout();
  const { isSupported, isSubscribed, requestPermission } = useNotifications();

  // Debug subscription status to troubleshoot
  useEffect(() => {
    console.log('Notification subscription status:', { isSupported, isSubscribed });
  }, [isSupported, isSubscribed]);

  // Use useCallback to create a stable function reference
  const handleLogout = useCallback(() => {
    logoutFn();
    setLogoutDialogOpen(false);
  }, [logoutFn]);

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await axios.get('/api/brand/profile');

        // Initialize with default data
        setProfileData({
          ...response.data,
          connections: 0,
          rating: 0
        });
      } catch (error) {
        console.error('Failed to fetch profile data:', error);

        // Set default profile data if fetch fails
        if (currentUser) {
          setProfileData({
            name: currentUser.name || 'Brand Name',
            email: currentUser.email || 'brand@example.com',
            avatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name || 'default'}`,
            companyName: '',
            website: '',
            bio: '',
            phoneNumber: '',
            location: '',
            connections: 0,
            rating: 0
          });
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (currentUser) {
      fetchProfileData();
    }
  }, [currentUser]);

  const deleteUser = async (userId: string) => {
    try {
      await axios.delete(`/api/auth/deleteAccount/${userId}`);
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
        variant: "default",
      });
      router.push("/sign-up");
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleEditProfile = () => {
    router.push("/brand/edit-profile");
  };

  const handleNotificationSettings = () => {
    router.push("/brand/notifications");
  };

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

  const handleFaqsClick = () => {
    router.push("/faqs");
  };

  const handleContactClick = () => {
    router.push("/contact");
  };

  // Show loading state if data is still loading
  if (!isClient || isLoading || isLoadingProfile) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-4 w-64 mb-2" />
              <Skeleton className="h-4 w-56 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl text-center">
        <p className="text-red-500 dark:text-red-400">Failed to load profile data. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl min-h-screen">
      {/* Profile Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-6 transition-all hover:shadow-lg">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Profile Image */}
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-gray-100 dark:border-zinc-700 shadow-md">
              {profileData.avatar ? (
                <AvatarImage
                  src={profileData.avatar}
                  alt={profileData.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 text-blue-700 dark:text-blue-300 text-2xl font-bold">
                  {profileData.name?.charAt(0) || 'B'}
                </AvatarFallback>
              )}
            </Avatar>

            <Button
              size="icon"
              variant="outline"
              className="absolute bottom-0 right-0 rounded-full bg-white dark:bg-zinc-800 h-8 w-8 shadow-md hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:border-zinc-600"
              onClick={handleEditProfile}
            >
              <PencilIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </Button>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-2xl font-bold dark:text-white">{profileData.name}</h1>
              {profileData.companyName && (
                <Badge className="md:ml-2 self-center dark:border-zinc-600 dark:text-zinc-300" variant="outline">
                  {profileData.companyName}
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-3">
              {profileData.location && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                  <MapPinIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                  <span>{profileData.location}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                <MailIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                <span>{profileData.email}</span>
              </div>

              {profileData.phoneNumber && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                  <PhoneIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                  <span>{profileData.phoneNumber}</span>
                </div>
              )}

              {profileData.website && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                  <GlobeIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                  <a
                    href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 dark:text-blue-400 hover:underline"
                  >
                    {profileData.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            {/* Bio */}
            {profileData.bio && (
              <div className="mt-4 text-gray-700 dark:text-zinc-300">
                <p className="text-sm">{profileData.bio}</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4 md:mt-0">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <UsersIcon className="h-4 w-4 text-blue-500" />
                <span className="font-bold text-lg dark:text-white">{profileData.connections}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Connections</p>
            </div>

            <div className="text-center">
              <div className="flex items-center gap-1">
                <StarIcon className="h-4 w-4 text-yellow-500" />
                <span className="font-bold text-lg dark:text-white">{profileData.rating}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Rating</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-2 dark:bg-zinc-800">
          <TabsTrigger value="dashboard" className="dark:text-zinc-300 dark:data-[state=active]:bg-zinc-700 dark:data-[state=active]:text-white">Dashboard</TabsTrigger>
          <TabsTrigger value="settings" className="dark:text-zinc-300 dark:data-[state=active]:bg-zinc-700 dark:data-[state=active]:text-white">Account Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


            {/* Profile Enhancement Card */}
            <Card className="transition-all hover:shadow-md dark:bg-zinc-900 dark:border-zinc-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Improve Your Profile</CardTitle>
                <CardDescription className="dark:text-zinc-400">Increase your brand visibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800 mb-4">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Complete Your Profile</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">Add more details to your profile to be more discoverable by relevant influencers.</p>
                  <Button
                    size="sm"
                    onClick={handleEditProfile}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-100 dark:border-purple-800">
                  <h3 className="font-medium text-purple-700 dark:text-purple-300 mb-2">Create Your First Deal</h3>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-3">Start collaborating with influencers by creating your first deal proposal.</p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/brand/deals/create')}
                    className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white"
                  >
                    <BriefcaseIcon className="h-4 w-4 mr-2" />
                    Create Deal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="transition-all hover:shadow-md dark:bg-zinc-900 dark:border-zinc-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Account Management</CardTitle>
              <CardDescription className="dark:text-zinc-400">Manage your account settings and security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <h3 className="text-lg font-medium mb-4 dark:text-white">Account Security</h3>
                  <div className="space-y-3">
                    <Link href="/password-reset">
                      <Button
                        variant="outline"
                        className="w-full justify-start hover:bg-gray-100 dark:hover:bg-zinc-800 dark:border-zinc-600 dark:text-white transition-all"
                      >
                        <KeyRoundIcon className="h-4 w-4 mr-2" />
                        Reset Password
                      </Button>
                    </Link>

                    <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start hover:bg-gray-100 dark:hover:bg-zinc-800 dark:border-zinc-600 dark:text-white transition-all"
                        >
                          <LogOutIcon className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] dark:bg-zinc-900 dark:border-zinc-700">
                        <DialogHeader>
                          <DialogTitle className="dark:text-white">Confirm Logout</DialogTitle>
                          <DialogDescription className="dark:text-zinc-400">
                            Are you sure you want to log out of your account?
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" onClick={() => setLogoutDialogOpen(false)} className="dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800">
                            Cancel
                          </Button>
                          <Button onClick={handleLogout} className="dark:bg-blue-700 dark:hover:bg-blue-800">
                            Yes, Logout
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-zinc-600 dark:hover:border-red-600"
                        >
                          <UserRoundXIcon className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] dark:bg-zinc-900 dark:border-zinc-700">
                        <DialogHeader>
                          <DialogTitle className="text-red-600 dark:text-red-400">Delete Account</DialogTitle>
                          <DialogDescription className="dark:text-zinc-400">
                            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="my-4">
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              All your brand information, deals, and messages will be permanently deleted.
                            </AlertDescription>
                          </Alert>
                        </div>

                        <DialogFooter className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" onClick={() => setDeleteAccountDialogOpen(false)} className="dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800">
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              if (userId) {
                                deleteUser(userId);
                                setDeleteAccountDialogOpen(false);
                              }
                            }}
                            className="dark:bg-red-700 dark:hover:bg-red-800"
                          >
                            Permanently Delete Account
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              <Separator className="my-4 dark:bg-zinc-700" />

              <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-100 dark:border-amber-800">
                <h3 className="font-medium text-amber-700 dark:text-amber-300 mb-2">Important Account Information</h3>
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                  Deleting your account will permanently remove all your data and cannot be undone.
                  Please make sure to download any important information before proceeding.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Left Column - Account Settings */}
        <Card className="dark:bg-zinc-900 dark:border-zinc-700">
          <CardHeader>
            <CardTitle className="text-xl font-semibold dark:text-white">Preferences</CardTitle>
            <CardDescription className="dark:text-zinc-400">Observe your preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            <Button variant="outline" className="w-full justify-start dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800" onClick={handleNotificationSettings}>
              <BellIcon className="mr-2 h-4 w-4" />
              Notification Settings
            </Button>

            {isSupported && !isSubscribed && (
              <Button variant="outline" className="w-full justify-start dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800" onClick={handleEnableNotifications}>
                <BellIcon className="mr-2 h-4 w-4" />
                Enable Push Notifications
              </Button>
            )}

            <Button variant="outline" className="w-full justify-start dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800" onClick={handleFaqsClick}>
              <MessageSquareIcon className="mr-2 h-4 w-4" />
              Frequently Asked Questions
            </Button>

            <Button variant="outline" className="w-full justify-start dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800" onClick={handleContactClick}>
              <MailIcon className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </CardContent>
        </Card>

        {/* Right Column - Profile Actions */}
        {/* ... rest of the existing code ... */}
      </div>
    </div>
  );
};

export default Profile;