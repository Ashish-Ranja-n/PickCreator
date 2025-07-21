'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Filter,
  RefreshCw,
  Edit,
  Save,
  X,
  User,
  Building2,
  Shield,
  Camera,
  MapPin,
  Mail,
  Loader2
} from 'lucide-react';
import axios from 'axios';

interface UserData {
  _id: string;
  name?: string;
  email?: string;
  role: 'Brand' | 'Influencer' | 'Admin';
  avatar?: string;
  image?: string;
  profilePictureUrl?: string;
  isVerified?: boolean;
  createdAt: string;

  // Influencer-specific fields
  instagramUsername?: string;
  followerCount?: number;
  isInstagramVerified?: boolean;
  instagramConnected?: boolean;
  onboardingCompleted?: boolean;
  city?: string;
  bio?: string;

  // Brand-specific fields
  companyName?: string;
  businessType?: string;
  website?: string;
  logo?: string;
  location?: string;
  verifiedBrand?: boolean;

  // Admin-specific fields
  permissions?: string[];
}

interface FilterState {
  userType?: string;
  isInstagramConnected?: string;
  isInstagramVerified?: string;
  onboardingCompleted?: string;
}

const UserManagementPage = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<UserData>>({});
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState<FilterState>({});

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Fetch users with current filters
  const fetchUsers = async (page = 1, showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');

      if (filters.userType) params.append('userType', filters.userType);
      if (filters.isInstagramConnected) params.append('isInstagramConnected', filters.isInstagramConnected);
      if (filters.isInstagramVerified) params.append('isInstagramVerified', filters.isInstagramVerified);
      if (filters.onboardingCompleted) params.append('onboardingCompleted', filters.onboardingCompleted);

      const response = await axios.get(`/api/admin/users?${params.toString()}`);

      if (response.data.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.data.error || 'Failed to fetch users');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchUsers(1, true);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    // Fetch users without filters
    setTimeout(() => fetchUsers(1, true), 100);
  };

  // Handle user edit
  const handleEditUser = (user: UserData) => {
    setEditingUser(user);

    // Set common fields first
    const baseFormData: Partial<UserData> = {
      name: user.name,
      email: user.email,
    };

    // Add role-specific fields based on user type
    if (user.role === 'Influencer') {
      setEditFormData({
        ...baseFormData,
        instagramUsername: user.instagramUsername,
        followerCount: user.followerCount,
        isInstagramVerified: user.isInstagramVerified,
        city: user.city,
        bio: user.bio,
      });
    } else if (user.role === 'Brand') {
      setEditFormData({
        ...baseFormData,
        companyName: user.companyName,
        businessType: user.businessType,
        website: user.website,
        location: user.location,
        bio: user.bio,
      });
    } else if (user.role === 'Admin') {
      setEditFormData({
        ...baseFormData,
        bio: user.bio,
      });
    } else {
      // Fallback for unknown user types
      setEditFormData(baseFormData);
    }
  };

  // Save user changes
  const saveUserChanges = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);

      // Client-side validation
      if (editFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }

      if (editFormData.followerCount && (editFormData.followerCount < 0 || !Number.isInteger(editFormData.followerCount))) {
        toast({
          title: "Validation Error",
          description: "Follower count must be a non-negative integer",
          variant: "destructive",
        });
        return;
      }

      if (editFormData.website && editFormData.website.trim() && !editFormData.website.match(/^https?:\/\/.+/)) {
        toast({
          title: "Validation Error",
          description: "Website must be a valid URL starting with http:// or https://",
          variant: "destructive",
        });
        return;
      }

      // Filter the form data to only include fields relevant to the user's role
      const filteredFormData: Partial<UserData> = {};

      // Common fields that all user types can have (only include if they have values)
      if (editFormData.name?.trim()) filteredFormData.name = editFormData.name.trim();
      if (editFormData.email?.trim()) filteredFormData.email = editFormData.email.trim();

      // Role-specific fields
      if (editingUser.role === 'Influencer') {
        if (editFormData.instagramUsername?.trim()) filteredFormData.instagramUsername = editFormData.instagramUsername.trim();
        if (editFormData.followerCount !== undefined && editFormData.followerCount >= 0) filteredFormData.followerCount = editFormData.followerCount;
        if (editFormData.isInstagramVerified !== undefined) filteredFormData.isInstagramVerified = editFormData.isInstagramVerified;
        if (editFormData.city?.trim()) filteredFormData.city = editFormData.city.trim();
        if (editFormData.bio?.trim()) filteredFormData.bio = editFormData.bio.trim();
      } else if (editingUser.role === 'Brand') {
        if (editFormData.companyName?.trim()) filteredFormData.companyName = editFormData.companyName.trim();
        if (editFormData.businessType?.trim()) filteredFormData.businessType = editFormData.businessType.trim();
        if (editFormData.website?.trim()) filteredFormData.website = editFormData.website.trim();
        if (editFormData.location?.trim()) filteredFormData.location = editFormData.location.trim();
        if (editFormData.bio?.trim()) filteredFormData.bio = editFormData.bio.trim();
      } else if (editingUser.role === 'Admin') {
        if (editFormData.bio?.trim()) filteredFormData.bio = editFormData.bio.trim();
      }

      // Check if we have any data to update
      if (Object.keys(filteredFormData).length === 0) {
        toast({
          title: "No Changes",
          description: "No valid changes were made to update",
          variant: "destructive",
        });
        return;
      }

      const response = await axios.patch(`/api/admin/users/${editingUser._id}`, filteredFormData);

      if (response.data.success) {
        toast({
          title: "Success",
          description: "User updated successfully",
        });

        // Update the user in the local state
        setUsers(prev => prev.map(user =>
          user._id === editingUser._id
            ? { ...user, ...response.data.user }
            : user
        ));

        setEditingUser(null);
        setEditFormData({});
      } else {
        throw new Error(response.data.error || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Get user avatar
  const getUserAvatar = (user: UserData) => {
    return user.avatar || user.image || user.profilePictureUrl || user.logo;
  };

  // Get user display name
  const getUserDisplayName = (user: UserData) => {
    if (user.role === 'Brand' && user.companyName) {
      return user.companyName;
    }
    return user.name || 'Unknown User';
  };

  // Get status badge for user
  const getStatusBadge = (user: UserData) => {
    if (user.role === 'Influencer') {
      if (user.isInstagramVerified) {
        return <Badge className="bg-green-100 text-green-800 border-green-200">Verified</Badge>;
      } else if (user.instagramConnected) {
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Connected</Badge>;
      } else {
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Not Connected</Badge>;
      }
    } else if (user.role === 'Brand') {
      if (user.verifiedBrand) {
        return <Badge className="bg-green-100 text-green-800 border-green-200">Verified</Badge>;
      } else {
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unverified</Badge>;
      }
    } else if (user.role === 'Admin') {
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Admin</Badge>;
    }

    return <Badge variant="outline">Unknown</Badge>;
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container py-20 min-h-screen bg-white dark:bg-black">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">User Management</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage and monitor all platform users
            </p>
          </div>
          <Button
            onClick={() => fetchUsers(pagination.currentPage, false)}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="border border-gray-200 dark:border-zinc-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black dark:text-white">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter users by type and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* User Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="userType">User Type</Label>
                <Select
                  value={filters.userType || "all"}
                  onValueChange={(value) => handleFilterChange('userType', value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Brand">Brand</SelectItem>
                    <SelectItem value="Influencer">Influencer</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Instagram Connected Filter (Influencer only) */}
              {filters.userType === 'Influencer' && (
                <div className="space-y-2">
                  <Label htmlFor="instagramConnected">Instagram Connected</Label>
                  <Select
                    value={filters.isInstagramConnected || "all"}
                    onValueChange={(value) => handleFilterChange('isInstagramConnected', value === "all" ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Connected</SelectItem>
                      <SelectItem value="false">Not Connected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Instagram Verified Filter (Influencer only) */}
              {filters.userType === 'Influencer' && (
                <div className="space-y-2">
                  <Label htmlFor="instagramVerified">Instagram Verified</Label>
                  <Select
                    value={filters.isInstagramVerified || "all"}
                    onValueChange={(value) => handleFilterChange('isInstagramVerified', value === "all" ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Verified</SelectItem>
                      <SelectItem value="false">Not Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Onboarding Completed Filter (Influencer only) */}
              {filters.userType === 'Influencer' && (
                <div className="space-y-2">
                  <Label htmlFor="onboardingCompleted">Onboarding Status</Label>
                  <Select
                    value={filters.onboardingCompleted || "all"}
                    onValueChange={(value) => handleFilterChange('onboardingCompleted', value === "all" ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Completed</SelectItem>
                      <SelectItem value="false">Incomplete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700 text-white">
                Apply Filters
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="border border-gray-200 dark:border-zinc-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black dark:text-white">
              <Users className="h-5 w-5" />
              Users ({pagination.totalCount})
            </CardTitle>
            <CardDescription>
              {filters.userType ? `${filters.userType} users` : 'All users'} on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {Object.values(filters).some(f => f)
                    ? 'Try adjusting your filters to see more users.'
                    : 'No users have been registered yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {users.map((user) => (
                  <Card key={user._id} className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-zinc-900 dark:to-zinc-800/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    {/* Gradient overlay for role-based theming */}
                    <div className={`absolute inset-0 opacity-5 ${
                      user.role === 'Brand' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                      user.role === 'Admin' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                      'bg-gradient-to-br from-blue-500 to-blue-600'
                    }`} />

                    <CardContent className="relative p-4 sm:p-6">
                      {/* Header Section */}
                      <div className="flex items-start gap-3 mb-4">
                        {/* Enhanced Avatar */}
                        <div className="relative">
                          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-white/20 shadow-lg">
                            <AvatarImage src={getUserAvatar(user)} alt={getUserDisplayName(user)} />
                            <AvatarFallback className={`text-white font-semibold ${
                              user.role === 'Brand' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                              user.role === 'Admin' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                              'bg-gradient-to-br from-blue-500 to-blue-600'
                            }`}>
                              {user.role === 'Brand' ? (
                                <Building2 className="h-7 w-7 sm:h-8 sm:w-8" />
                              ) : user.role === 'Admin' ? (
                                <Shield className="h-7 w-7 sm:h-8 sm:w-8" />
                              ) : (
                                <User className="h-7 w-7 sm:h-8 sm:w-8" />
                              )}
                            </AvatarFallback>
                          </Avatar>

                          {/* Role indicator dot */}
                          <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white shadow-sm ${
                            user.role === 'Brand' ? 'bg-orange-500' :
                            user.role === 'Admin' ? 'bg-purple-500' :
                            'bg-blue-500'
                          }`} />
                        </div>

                        {/* Name and Status */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                              {getUserDisplayName(user)}
                            </h3>
                            {getStatusBadge(user)}
                          </div>

                          {/* Role Badge */}
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.role === 'Brand' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                            user.role === 'Admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                            {user.role}
                          </div>
                        </div>

                        {/* Action Button - Mobile Optimized */}
                        <div className="flex-shrink-0">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                className="h-9 w-9 p-0 rounded-full border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 transition-all duration-200"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>
                                  Update user information for {getUserDisplayName(user)}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4">
                                {/* Common fields */}
                                <div className="space-y-2">
                                  <Label htmlFor="name">
                                    {user.role === 'Brand' ? 'Contact Name' : 'Name'}
                                  </Label>
                                  <Input
                                    id="name"
                                    value={editFormData.name || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder={user.role === 'Brand' ? 'Enter contact name' : 'Enter name'}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="email">Email</Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    value={editFormData.email || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter email"
                                  />
                                </div>

                                {/* Influencer-specific fields */}
                                {editingUser?.role === 'Influencer' && (
                                  <>
                                    <div className="space-y-2">
                                      <Label htmlFor="instagramUsername">Instagram Username</Label>
                                      <Input
                                        id="instagramUsername"
                                        value={editFormData.instagramUsername || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, instagramUsername: e.target.value }))}
                                        placeholder="Enter Instagram username (without @)"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="followerCount">Followers Count</Label>
                                      <Input
                                        id="followerCount"
                                        type="number"
                                        min="0"
                                        value={editFormData.followerCount || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setEditFormData(prev => ({
                                            ...prev,
                                            followerCount: value === '' ? undefined : parseInt(value) || 0
                                          }));
                                        }}
                                        placeholder="Enter followers count"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="city">City</Label>
                                      <Input
                                        id="city"
                                        value={editFormData.city || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                                        placeholder="Enter city"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="isInstagramVerified">Instagram Verification Status</Label>
                                      <Select
                                        value={editFormData.isInstagramVerified === true ? 'true' : 'false'}
                                        onValueChange={(value) => setEditFormData(prev => ({
                                          ...prev,
                                          isInstagramVerified: value === 'true'
                                        }))}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select verification status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="false">Not Verified</SelectItem>
                                          <SelectItem value="true">Verified</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </>
                                )}

                                {/* Brand-specific fields */}
                                {editingUser?.role === 'Brand' && (
                                  <>
                                    <div className="space-y-2">
                                      <Label htmlFor="companyName">Company Name</Label>
                                      <Input
                                        id="companyName"
                                        value={editFormData.companyName || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                        placeholder="Enter company name"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="businessType">Business Type</Label>
                                      <Input
                                        id="businessType"
                                        value={editFormData.businessType || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, businessType: e.target.value }))}
                                        placeholder="Enter business type (e.g., Fashion, Tech, Food)"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="website">Website</Label>
                                      <Input
                                        id="website"
                                        type="url"
                                        value={editFormData.website || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, website: e.target.value }))}
                                        placeholder="Enter website URL (https://...)"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="location">Location</Label>
                                      <Input
                                        id="location"
                                        value={editFormData.location || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                                        placeholder="Enter business location"
                                      />
                                    </div>
                                  </>
                                )}

                                {/* Bio field for all user types */}
                                {editingUser && (
                                  <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Input
                                      id="bio"
                                      value={editFormData.bio || ''}
                                      onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                                      placeholder="Enter bio"
                                    />
                                  </div>
                                )}
                              </div>

                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingUser(null);
                                    setEditFormData({});
                                  }}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                                <Button
                                  onClick={saveUserChanges}
                                  disabled={saving}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {saving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                  )}
                                  Save Changes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>

                        {(user.role === 'Influencer' && user.city) || (user.role === 'Brand' && user.location) ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span>{user.role === 'Influencer' ? user.city : user.location}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Role-specific Information */}
                      {user.role === 'Influencer' && (
                        <div className="space-y-3 mb-4">
                          {user.instagramUsername && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                                <Camera className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                <span className="text-sm font-medium text-pink-700 dark:text-pink-300">
                                  @{user.instagramUsername}
                                </span>
                              </div>
                              {user.isInstagramVerified && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full" title="Verified" />
                              )}
                            </div>
                          )}

                          {user.followerCount && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <span className="font-semibold text-blue-700 dark:text-blue-300">
                                  {user.followerCount.toLocaleString()}
                                </span>
                                <span className="text-blue-600 dark:text-blue-400 ml-1">followers</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {user.role === 'Brand' && (
                        <div className="space-y-3 mb-4">
                          {user.companyName && (
                            <div className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                {user.companyName}
                              </span>
                            </div>
                          )}

                          {user.businessType && (
                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {user.businessType}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bio Section */}
                      {user.bio && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed overflow-hidden" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {user.bio}
                          </p>
                        </div>
                      )}

                      {/* Footer Stats */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>

                        <div className="flex items-center gap-2">
                          {user.onboardingCompleted && (
                            <div className="h-2 w-2 bg-green-500 rounded-full" title="Onboarding Complete" />
                          )}
                          {user.role === 'Influencer' && user.instagramConnected && (
                            <div className="h-2 w-2 bg-pink-500 rounded-full" title="Instagram Connected" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalCount)} of {pagination.totalCount} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;