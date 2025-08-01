import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useCurrentUser } from './useCurrentUser';
import { InstagramData } from '@/utils/instagramApi';

interface ProfileData {
  name: string;
  email: string;
  bio: string;
  socialMediaLinks: Array<{ platform: string; url: string }>;
  rating: number;
  completedDeals: number;
  mobile?: string;
  city?: string;
  gender?: string;
  age?: number;
  instagramUsername?: string; // Added
  followerCount?: number;     // Added
  profilePictureUrl?: string; // Added for DB profile picture
}

interface OnboardingData {
  influencer?: {
    bio?: string;
    city?: string;
    onboardingCompleted?: boolean;
    onboardingStep?: number;
    pricingModels?: {
      fixedPricing: {
        enabled: boolean;
        storyPrice?: number;
        reelPrice?: number;
        postPrice?: number;
        livePrice?: number;
      };
      negotiablePricing: boolean;
      packageDeals: {
        enabled: boolean;
        packages: Array<{
          name: string;
          includedServices: string;
          totalPrice: number;
        }>;
      };
      barterDeals: {
        enabled: boolean;
        acceptedCategories: string[];
        restrictions?: string;
      };
    };
    brandPreferences?: {
      preferredBrandTypes: string[];
      exclusions: string[];
      collabStyles: string[];
    };
    availability?: string[];
    instagramUsername?: string; // Added for onboarding
    followerCount?: number;     // Added for onboarding
  };
}

// Hook to get influencer profile data
export function useInfluencerData() {
  const currentUser = useCurrentUser();
  const userId = currentUser?._id;

  return useQuery<ProfileData>({
    queryKey: ['influencer', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID');
      const response = await axios.get('/api/influencer/profile');
      return response.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes - profile data doesn't change often
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get Instagram data
export function useInstagramData() {
  const currentUser = useCurrentUser();
  const userId = currentUser?._id;
  const queryClient = useQueryClient();

  const query = useQuery<InstagramData>({
    queryKey: ['instagram', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID');
      const response = await axios.get('/api/influencer/instagram/minimal');
      return response.data;
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute - Instagram data can change frequently
    gcTime: 3 * 60 * 1000, // 3 minutes
  });

  // Add a refresh function to the query result
  const refreshInstagramData = async () => {
    try {
      // Call the API with a refresh parameter to force a fresh fetch
      const response = await axios.get('/api/influencer/instagram/minimal', {
        params: { refresh: Date.now() }
      });
      
      // Update the query cache with the new data
      queryClient.setQueryData(['instagram', userId], response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error refreshing Instagram data:', error);
      throw error;
    }
  };

  return {
    ...query,
    refreshData: refreshInstagramData
  };
}

// Hook to get onboarding data
export function useOnboardingData() {
  const currentUser = useCurrentUser();
  const userId = currentUser?._id;

  return useQuery<OnboardingData>({
    queryKey: ['onboarding', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID');
      const response = await axios.get('/api/influencer/onboarding');
      return response.data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds - onboarding data changes during setup
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}