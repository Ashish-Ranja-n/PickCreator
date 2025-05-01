import { Card } from "@/components/ui/card";
import { ArrowUpRight, Users, Heart, BarChart3 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useCurrentUser } from "@/hook/useCurrentUser";
import { InstagramData } from "@/utils/instagramApi";
import InstagramDebugInfo from "@/components/instagram/InstagramDebugInfo";
import RefreshInstagramButton from "@/components/instagram/RefreshInstagramButton";

interface StatsData {
  followers: {
    value: string;
    change: string;
  };
  engagement: {
    value: string;
    change: string;
  };
  reach: {
    value: string;
    change: string;
  };
}

export const StatsOverview = () => {
  const currentUser = useCurrentUser();
  const [statsData, setStatsData] = useState<StatsData>({
    followers: { value: "0", change: "0%" },
    engagement: { value: "0%", change: "0%" },
    reach: { value: "0", change: "0%" }
  });
  const [instagramData, setInstagramData] = useState<InstagramData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching Instagram data for stats...");
      // Fetch Instagram data
      const instagramResponse = await axios.get('/api/influencer/instagram/minimal');
      const data = instagramResponse.data;

      // Store the raw Instagram data for debugging
      setInstagramData(data);

      console.log("Instagram data fetched:", {
        isConnected: data.isConnected,
        hasProfile: !!data.profile,
        hasAnalytics: !!data.analytics,
        profile: data.profile ? {
          username: data.profile.username,
          account_type: data.profile.account_type,
          followers_count: data.profile.followers_count,
          has_picture: !!data.profile.profile_picture_url
        } : null
      });

      if (data.isConnected && data.profile) {
        const profile = data.profile;
        const analytics = data.analytics;

        // If follower count is 0 in development, use 1 for testing
        const actualFollowers = profile.followers_count || (process.env.NODE_ENV === 'development' ? 1 : 0);

        // Use engagement rate from analytics if available, otherwise default to 0%
        let engagementRate = "0%";
        if (analytics && typeof analytics.averageEngagement === 'number') {
          engagementRate = analytics.averageEngagement.toFixed(1) + "%";
        }

        // Use average reel views if available in analytics
        let avgReach = "0";
        if (analytics && analytics.avgReelViews) {
          // Format reach data if available
          avgReach = formatNumber(analytics.avgReelViews);
        }

        setStatsData({
          followers: {
            value: formatNumber(actualFollowers),
            change: "+0%"
          },
          engagement: {
            value: engagementRate,
            change: "+0%"
          },
          reach: {
            value: avgReach,
            change: "+0%"
          }
        });
      } else if (data.error) {
        setError(data.error);
      }
    } catch (error) {
      console.error('Error fetching stats data:', error);
      setError('Failed to load Instagram data. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatsData();
  }, [currentUser, fetchStatsData]);

  // Handler for when Instagram data is refreshed
  const handleInstagramRefresh = (refreshedData: InstagramData) => {
    setInstagramData(refreshedData);

    // Log the refreshed data
    console.log("Instagram data refreshed:", {
      isConnected: refreshedData.isConnected,
      hasProfile: !!refreshedData.profile,
      hasAnalytics: !!refreshedData.analytics,
      profile: refreshedData.profile ? {
        username: refreshedData.profile.username,
        account_type: refreshedData.profile.account_type,
        followers_count: refreshedData.profile.followers_count,
        has_picture: !!refreshedData.profile.profile_picture_url
      } : null
    });

    // Re-calculate stats based on refreshed data
    if (refreshedData.isConnected && refreshedData.profile) {
      // Update the stats
      const profile = refreshedData.profile;
      const analytics = refreshedData.analytics;

      // If follower count is 0 in development, use 1 for testing
      const actualFollowers = profile.followers_count || (process.env.NODE_ENV === 'development' ? 1 : 0);

      // Calculate engagement rate from analytics if available
      let engagementRate = "0%";
      if (analytics && typeof analytics.averageEngagement === 'number') {
        engagementRate = analytics.averageEngagement.toFixed(1) + "%";
      }

      // Calculate average reach from analytics if available
      let avgReach = "0";
      if (analytics && analytics.avgReelViews) {
        // Format reach data if available
        avgReach = formatNumber(analytics.avgReelViews);
      }

      setStatsData({
        followers: {
          value: formatNumber(actualFollowers),
          change: "+0%"
        },
        engagement: {
          value: engagementRate,
          change: "+0%"
        },
        reach: {
          value: avgReach,
          change: "+0%"
        }
      });
    }
  };

  // Helper function to format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toString();
    }
  };

  const stats = [
    {
      title: "Total Followers",
      value: statsData.followers.value,
      change: statsData.followers.change,
      icon: Users,
    },
    {
      title: "Engagement Rate",
      value: statsData.engagement.value,
      change: statsData.engagement.change,
      icon: Heart,
    },
    {
      title: "Avg. Reach",
      value: statsData.reach.value,
      change: statsData.reach.change,
      icon: BarChart3,
    },
  ];

  return (
    <>
      {/* Debug information panel */}
      <InstagramDebugInfo
        instagramData={instagramData}
        onDataRefreshed={handleInstagramRefresh}
      />

      {/* Error message if needed */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4 flex flex-col items-center">
          <p className="mb-2">{error}</p>
          <RefreshInstagramButton onSuccess={handleInstagramRefresh} />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="stats-card p-4">
            <div className="flex items-center justify-between">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                {stat.change}
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-semibold">{isLoading ? "..." : stat.value}</h3>
              <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
};
