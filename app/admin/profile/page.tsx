'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import {
  Instagram,
  Edit,
  LogOut,
  UserRoundX,
  Save,
  X,
  LinkIcon,
  Settings,
  Check,
  BellIcon,
  KeyRoundIcon
} from 'lucide-react';
import { useCurrentUser } from '@/hook/useCurrentUser';
import { useNotifications } from '@/hook/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLogout } from '@/hook/useLogout';

// Define the user type for proper typing
interface InstagramData {
  connected: boolean;
  username?: string;
  followersCount?: number;
  profilePicture?: string;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  instagram?: InstagramData;
  permissions?: string[];
  // Add fields for manually created admin users
  instagramConnected?: boolean;
  instagramUsername?: string;
  followerCount?: number;
}

const AdminProfilePage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const currentUser = useCurrentUser() as UserData | null;
  const userId = currentUser?._id;

  // Always call hooks at the top level unconditionally
  const logout = useLogout();
  const { isSupported, isSubscribed, requestPermission } = useNotifications();

  // Check for instagram connection success
  useEffect(() => {
    const refreshData = async () => {
      // Check for instagram connection success from URL params
      const searchParams = new URLSearchParams(window.location.search);
      const refreshParam = searchParams.get('refresh');

      if (refreshParam === 'true') {
        try {
          // Clear search params from URL to prevent repeated refreshes
          window.history.replaceState({}, '', window.location.pathname);

          // Force refresh user data
          const response = await axios.get('/api/auth/currentUser', {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });

          // Show success message
          toast({
            title: "Instagram Connected",
            description: "Your Instagram account has been connected successfully.",
            variant: "default",
          });

          // Force reload page to get fresh data
          window.location.reload();
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }
    };

    refreshData();
  }, [toast]);

  // Define logout handler with useCallback at the top level with other hooks
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // State for editing profile
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    bio: currentUser?.bio || '',
  });

  // Add state for Instagram connection loading
  const [isConnecting, setIsConnecting] = useState(false);

  // Loading state
  const isLoading = !currentUser;

  // Add state for logout dialog
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Update logout handler
  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false);
    logout();
  };

  // Add a clear loading state component
  const LoadingState = () => (
    <div className="container py-8 h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 bg-slate-200 rounded-md w-32 animate-pulse"></div>
        </div>
      </div>
      <div className="mt-8 space-y-6">
        <div className="h-10 bg-slate-200 rounded-md w-full max-w-xs animate-pulse"></div>
        <div className="h-40 bg-slate-200 rounded-lg w-full animate-pulse"></div>
        <div className="h-40 bg-slate-200 rounded-lg w-full animate-pulse"></div>
        <div className="h-40 bg-slate-200 rounded-lg w-full animate-pulse"></div>
        <div className="h-40 bg-slate-200 rounded-lg w-full animate-pulse"></div>
      </div>
    </div>
  );

  // Display loading state while data is being fetched
  if (!currentUser || isLoading) {
    return <LoadingState />;
  }

  // Extract Instagram data - handle both types of document structure
  const instagramConnected = currentUser.instagram?.connected || currentUser.instagramConnected;
  const instagramUsername = currentUser.instagram?.username || currentUser.instagramUsername;
  const instagramFollowers = currentUser.instagram?.followersCount || currentUser.followerCount;
  const profilePicture = currentUser.instagram?.profilePicture || currentUser.image;

  // Handle connecting Instagram
  const handleConnectInstagram = async () => {
    try {
      setIsConnecting(true);

      // Call Instagram auth directly for admins
      const response = await axios.get('/api/auth/instagram');

      if (response.data.url) {
        // Redirect to Instagram auth URL
        window.location.href = response.data.url;
      } else {
        window.location.href = '/api/auth/instagram';
      }
    } catch (error) {
      console.error('Error initiating Instagram connection:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Instagram. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  // Handle saving profile changes
  const handleSaveProfile = async () => {
    try {
      const response = await axios.patch('/api/admin/profile', {
        bio: editData.bio,
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
      bio: currentUser?.bio || '',
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

  return (
    <div className="container py-8 min-h-screen">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center justify-between space-x-2">
            <h1 className="text-3xl font-bold tracking-tight">Admin Profile</h1>
            <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-muted/30 py-4 px-4 text-base">
                  <Settings className="h-5 w-5 mr-2" />
                  Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-lg">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>

                {isSupported && !isSubscribed && (
                  <DropdownMenuItem onClick={handleEnableNotifications}>
                    <BellIcon className="h-4 w-4 mr-2" />
                    Enable Push Notifications
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Privacy Policy
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleLogoutClick}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
            </div>
            <p className="text-gray-500 mt-1">Manage your account and platform settings</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* First Column - User Info */}
          <div className="md:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your admin account information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                      <Image
                        src={profilePicture || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23BBBBBB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E"}
                        alt="Profile Picture"
                        width={96}
                        height={96}
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error("Error loading image:", target.src);
                          target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23BBBBBB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                        }}
                        priority
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-xl">{currentUser.name}</h3>
                    <p className="text-sm text-gray-500">{currentUser.email}</p>
                    <div className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Admin
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4 w-full">
                      <div>
                        <label className="text-sm font-medium">Bio</label>
                        <Textarea
                          value={editData.bio}
                          onChange={(e) => setEditData({...editData, bio: e.target.value})}
                          placeholder="Tell us about yourself"
                          className="mt-1"
                        />
                      </div>

                      <div className="flex justify-between">
                        <Button variant="outline" onClick={handleCancelEdit}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button onClick={handleSaveProfile}>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      {currentUser.bio ? (
                        <p className="text-sm text-gray-600 text-left">{currentUser.bio}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No bio added yet</p>
                      )}
                    </div>
                  )}

                  <Separator />

                  {instagramConnected ? (
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Instagram className="h-4 w-4 text-pink-600" />
                          <span className="text-sm">Connected to Instagram</span>
                        </div>

                        <Link href={`https://instagram.com/${instagramUsername}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>

                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium">{instagramFollowers?.toLocaleString()}</span> followers
                      </div>
                      <div className="mt-2">
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                          Refresh Data
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={handleConnectInstagram} className="w-full" variant="outline" disabled={isConnecting}>
                      {isConnecting ? (
                        <>
                          <span className="animate-spin mr-2">◌</span>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Instagram className="mr-2 h-4 w-4" />
                          Connect Instagram
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Password Reset */}
                <Link href="/password-reset">
                  <Button variant="outline" className="w-full justify-start">
                    <KeyRoundIcon className="mr-2 h-4 w-4" />
                    Reset Password
                  </Button>
                </Link>

                {/* Logout Dialog */}
                <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start" onClick={handleLogoutClick}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Logout</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to log out? You will need to log in again to access your account.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>Cancel</Button>
                      <Button variant="destructive" onClick={handleConfirmLogout}>
                        Log Out
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Delete Account Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                      <UserRoundX className="mr-2 h-4 w-4" />
                      Delete account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription className="space-y-2">
                        <p>Are you absolutely sure you want to delete your account? This action cannot be undone.</p>
                        <p className="font-medium text-red-600">This will permanently delete your account and remove all your data from our servers.</p>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" className="sm:flex-1" onClick={() => {}}>
                        No, keep my account
                      </Button>
                      <Button
                        variant="destructive"
                        className="sm:flex-1"
                        onClick={handleDeleteAccount}
                      >
                        Yes, delete my account
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Second & Third Column - Statistics & Activity */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Admin Dashboard</CardTitle>
                <CardDescription>Platform statistics and management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-lg mb-2">User Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Total Users</span>
                        <span className="font-semibold">-</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Influencers</span>
                        <span className="font-semibold">-</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Brands</span>
                        <span className="font-semibold">-</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-lg mb-2">Content Metrics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Posts</span>
                        <span className="font-semibold">-</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Deals</span>
                        <span className="font-semibold">-</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Active Conversations</span>
                        <span className="font-semibold">-</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Permissions</CardTitle>
                <CardDescription>Your admin access levels and capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(currentUser.permissions) && currentUser.permissions.map((permission: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="capitalize text-sm">{permission.replace(/-/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;