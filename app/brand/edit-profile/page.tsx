'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { useCurrentUserWithStatus } from '@/hook/useCurrentUser';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Camera, ArrowLeft, X, CheckCircle } from 'lucide-react';
import { uploadFile } from '@/utils/uploadMedia';
import ImageCropper from '@/app/components/ImageCropper';
import Image from 'next/image';

const EditProfilePage = () => {
  const { user: currentUser, isLoading } = useCurrentUserWithStatus();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    avatar: '',
    companyName: '',
    website: '',
    bio: '',
    phoneNumber: '',
    location: '',
  });
  
  // Profile picture upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showCropper, setShowCropper] = useState(false);
  
  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.get('/api/brand/profile');
        setProfileData(response.data);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        toast.error('Failed to load profile data. Please try again later.');
      }
    };
    
    if (currentUser) {
      fetchProfileData();
    }
  }, [currentUser]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle profile picture change
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) { // 25MB limit
        toast.error('File size should be less than 25MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowCropper(true);
    }
  };
  
  // Handle profile picture upload
  const handleCropComplete = async (croppedImage: Blob) => {
    setShowCropper(false);
    try {
      setIsSubmitting(true);
      
      // Convert Blob to File
      const file = new File([croppedImage], selectedFile?.name || 'profile.jpg', {
        type: 'image/jpeg'
      });

      // Upload to Cloudinary
      const result = await uploadFile(file, 'profile');
      if (!result?.url) throw new Error('Failed to upload image');

      // Update profile with new avatar
      const response = await axios.patch('/api/brand/profile', { avatar: result.url });
      
      if (response.data.success) {
        setProfileData(prev => ({
          ...prev,
          avatar: result.url
        }));
        
        toast.success('Profile picture updated successfully');
      } else {
        throw new Error(response.data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast.error('Failed to update profile picture. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.patch('/api/brand/profile', profileData);
      
      if (response.data.success) {
        toast.success('Profile updated successfully');
        
        // Redirect to profile page
        router.push('/brand/profile');
      } else {
        throw new Error(response.data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => router.push('/brand/profile')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>
        
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <p className="text-gray-600">Update your brand profile information</p>
      </div>
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:w-[400px]">
          <TabsTrigger value="general">General Information</TabsTrigger>
          <TabsTrigger value="picture">Profile Picture</TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit}>
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Brand Information</CardTitle>
                <CardDescription>Update your brand details</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      value={profileData.email}
                      readOnly
                      disabled
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={profileData.companyName}
                    onChange={handleInputChange}
                    placeholder="Your company name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    value={profileData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Your phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={profileData.location}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about your brand..."
                    rows={4}
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/brand/profile')}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="picture">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Update your brand profile picture</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-gray-100">
                      {previewUrl ? (
                        <Image 
                          src={previewUrl} 
                          alt="Profile Preview" 
                          className="h-full w-full object-cover"
                          width={128}
                          height={128}
                        />
                      ) : (
                        <>
                          <AvatarImage 
                            src={profileData.avatar} 
                            alt={profileData.name} 
                            className="h-full w-full object-cover"
                          />
                          <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-700">
                            {profileData.name?.charAt(0) || 'B'}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    
                    <label 
                      htmlFor="profile-picture-upload"
                      className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition"
                    >
                      <Camera className="h-4 w-4" />
                    </label>
                    
                    <input
                      id="profile-picture-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  
                  {previewUrl && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl('');
                          setShowCropper(false);
                        }}
                        className="flex items-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowCropper(true)}
                        disabled={isSubmitting}
                        className="flex items-center gap-1"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Cropping...
                          </>
                        ) : (
                          <>
                            Crop
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Profile Picture Guidelines</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      Upload a clear, professional image of your logo or brand
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      Use a square image for best results
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      Maximum file size: 5MB
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      Supported formats: JPG, PNG, GIF
                    </li>
                  </ul>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/brand/profile')}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </form>
      </Tabs>

      {showCropper && previewUrl && (
        <ImageCropper
          imageUrl={previewUrl}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setSelectedFile(null);
            setPreviewUrl('');
          }}
          aspectRatio={1}
        />
      )}
    </div>
  );
};

export default EditProfilePage; 