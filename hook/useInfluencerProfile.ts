import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface InfluencerProfile {
  name: string;
  email: string;
  bio: string;
  socialMediaLinks: Array<{ platform: string; url: string }>;
  rating: number;
  completedDeals: number;
  mobile?: string;
  city?: string;
  gender?: string;
  age?: number | string;
  instagramUsername?: string;
  followerCount?: number;
  profilePictureUrl?: string;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  pricingModels?: any;
  brandPreferences?: any;
  availability?: any;
  isInstagramVerified?: boolean;
  earnings?: number;
  upiId?: string;
  upiUsername?: string;
}

export function useInfluencerProfile() {
  return useQuery<InfluencerProfile>({
    queryKey: ['influencerProfileFull'],
    queryFn: async () => {
      const response = await axios.get('/api/influencer/profile/full');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - full profile data
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
