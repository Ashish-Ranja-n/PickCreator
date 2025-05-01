import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Instagram, Settings, UserCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCurrentUser } from "@/hook/useCurrentUser";
import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";

interface ProfileData {
  name: string;
  instagramUsername?: string;
  profilePictureUrl?: string;
  followerCount?: number;
  lastUpdated?: Date;
}

export const ProfileHeader = () => {
  const currentUser = useCurrentUser();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    instagramUsername: '',
    profilePictureUrl: '',
    followerCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Memoized fetch function to prevent recreation on every render
  const fetchProfileData = useCallback(async (forceRefresh = false) => {
    // Check if we need to fetch new data or can use cached state
    const now = Date.now();
    if (!forceRefresh && lastFetchTime > 0 && now - lastFetchTime < CACHE_DURATION) {
      console.log('Using in-memory cached profile data, age:', Math.round((now - lastFetchTime)/1000), 'seconds');
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (currentUser?._id) {
        // Check if we have cached data in localStorage first
        let cachedData: ProfileData | null = null;
        
        try {
          const cachedString = localStorage.getItem('profileData');
          if (cachedString) {
            cachedData = JSON.parse(cachedString);
            const cacheAge = now - new Date(cachedData?.lastUpdated || 0).getTime();
            
            // If cache is fresh enough (less than 5 minutes old), use it immediately
            if (cachedData && cacheAge < CACHE_DURATION) {
              console.log('Using localStorage cached profile data, age:', Math.round(cacheAge/1000), 'seconds');
              setProfileData(cachedData);
              setIsLoading(false);
              setLastFetchTime(now);
              
              // We'll still fetch in the background after a delay
              setTimeout(() => fetchProfileData(true), 5000);
              return;
            }
          }
        } catch (e) {
          console.warn('Error reading cache:', e);
        }
        
        // Fetch Instagram data
        const instagramResponse = await axios.get('/api/influencer/instagram/minimal');
        
        // Initialize profile data with Instagram data if available
        let profileInfo = {
          name: currentUser.name || 'Influencer',
          instagramUsername: instagramResponse.data.profile?.username || '',
          profilePictureUrl: instagramResponse.data.profile?.profile_picture_url || '',
          followerCount: instagramResponse.data.profile?.followers_count || 0,
          lastUpdated: instagramResponse.data.lastUpdated || new Date()
        };
        
        try {
          // Attempt to fetch profile data, but don't fail if it's not found
          const profileResponse = await axios.get(`/api/influencer/${currentUser._id}`);
          
          // Merge profile data with what we already have, prioritizing Instagram data
          profileInfo = {
            name: currentUser.name || profileResponse.data.name || 'Influencer',
            instagramUsername: instagramResponse.data.profile?.username || profileResponse.data.instagramUsername || '',
            profilePictureUrl: instagramResponse.data.profile?.profile_picture_url || profileResponse.data.profilePictureUrl || '',
            followerCount: instagramResponse.data.profile?.followers_count || profileResponse.data.followerCount || 0,
            lastUpdated: instagramResponse.data.lastUpdated || new Date()
          };
        } catch (profileError) {
          console.log('Profile API error (non-critical):', 
            profileError instanceof Error ? profileError.message : 'Unknown error');
          // Continue with Instagram data if profile API fails
        }
        
        setProfileData(profileInfo);
        
        // Cache the data in localStorage
        try {
          localStorage.setItem('profileData', JSON.stringify(profileInfo));
        } catch (e) {
          console.warn('Error caching profile data:', e);
        }
      } else {
        setProfileData({
          name: currentUser?.name || 'Influencer',
          instagramUsername: '',
          profilePictureUrl: '',
          followerCount: 0,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      // Set basic profile data even when API calls fail
      setProfileData({
        name: currentUser?.name || 'Influencer',
        instagramUsername: '',
        profilePictureUrl: '',
        followerCount: 0
      });
    } finally {
      setIsLoading(false);
      setLastFetchTime(Date.now());
    }
  }, [currentUser, lastFetchTime, CACHE_DURATION]);

  // Effect to load data when component mounts or user changes
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Memoize the avatar component
  const avatarComponent = useMemo(() => (
    <Avatar className="h-20 w-20">
      {profileData.profilePictureUrl ? (
        <Image
          src={profileData.profilePictureUrl}
          alt={profileData.name}
          className="object-cover"
          width={80}
          height={80}
          unoptimized={profileData.profilePictureUrl.includes('cdninstagram.com')}
        />
      ) : (
        <UserCircle2 className="h-20 w-20" />
      )}
    </Avatar>
  ), [profileData.profilePictureUrl, profileData.name]);

  return (
    <Card className="p-6 flex items-center justify-between animate-in lg:mt-16">
      <div className="flex items-center gap-4">
        {avatarComponent}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isLoading ? 'Loading...' : profileData.name}
          </h1>
          {profileData.instagramUsername && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              <Link 
                href={`https://instagram.com/${profileData.instagramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                @{profileData.instagramUsername}
              </Link>
              {profileData.followerCount !== undefined && profileData.followerCount > 0 && (
                <span>({profileData.followerCount.toLocaleString()} followers)</span>
              )}
            </p>
          )}
          {profileData.lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(profileData.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
      </div>
      <Link href="/influencer/profile">
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </Link>
    </Card>
  );
};
