import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hook/useCurrentUser";
import axios from "axios";

// Define the brand profile interface
export interface BrandProfile {
  name: string;
  email: string;
  avatar: string;
  companyName: string;
  website: string;
  logo: string;
  bio: string;
  phoneNumber: string;
  location: string;
  connections?: number;
  rating?: number;
}

// Hook to fetch and manage brand profile data
export const useBrandProfile = () => {
  const currentUser = useCurrentUser();
  const [profileData, setProfileData] = useState<BrandProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch profile data
  const fetchProfileData = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get('/api/brand/profile');
      
      // Initialize with response data and default values
      setProfileData({
        ...response.data,
        connections: response.data.connections || 0,
        rating: response.data.rating || 0
      });
    } catch (error: any) {
      console.error('Failed to fetch brand profile data:', error);
      setError(error.message || 'Failed to fetch profile data');
      
      // Set default profile data if fetch fails
      if (currentUser) {
        setProfileData({
          name: currentUser.name || 'Brand Name',
          email: currentUser.email || 'brand@example.com',
          avatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name || 'default'}`,
          companyName: '',
          website: '',
          logo: '',
          bio: '',
          phoneNumber: '',
          location: '',
          connections: 0,
          rating: 0
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile data when current user is available
  useEffect(() => {
    if (currentUser) {
      fetchProfileData();
    }
  }, [currentUser]);

  // Function to refetch profile data
  const refetch = () => {
    fetchProfileData();
  };

  return {
    profileData,
    isLoading,
    error,
    refetch
  };
};
