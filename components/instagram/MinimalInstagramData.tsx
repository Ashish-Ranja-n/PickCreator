import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Instagram,
  Link as LinkIcon,
  Users,
  Heart,
  Play,
  BarChart3,
  Info,
  Trophy,
  Flame,
  LineChart,
  RefreshCw
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { InstagramData } from '@/utils/instagramApi';

// Format account type (e.g., MEDIA_CREATOR -> Media Creator)
const formatAccountType = (accountType?: string): string => {
  if (!accountType) return 'Unknown';

  return accountType
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

// Format follower count (e.g., 5000 -> 5K)
const formatNumber = (num?: number): string => {
  if (num === undefined) return '0';
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
};

// Format Instagram date
const formatDate = (timestamp?: Date): string => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface MinimalInstagramDataProps {
  instagramData: InstagramData;
  onReconnect?: () => void;
  onRefresh?: () => void;
}

const MinimalInstagramData: React.FC<MinimalInstagramDataProps> = ({
  instagramData,
  onReconnect,
  onRefresh
}) => {
  // If not connected, show reconnect button
  if (!instagramData.isConnected) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Instagram className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Instagram Connection</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center space-y-4 p-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <Info className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-medium">Instagram Not Connected</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {instagramData.error || 'Your Instagram account is not connected or needs to be reconnected.'}
              </p>
            </div>
            {onReconnect && (
              <Button onClick={onReconnect}>
                <Instagram className="mr-2 h-5 w-5" />
                Reconnect Instagram
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If connected but no profile data, show loading
  if (!instagramData.profile) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Instagram className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Instagram Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-slate-200 h-16 w-16"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full mb-6">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Instagram className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Instagram Profile</CardTitle>
          </div>
          <CardDescription>
            Connected as @{instagramData.profile.username}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile image */}
            {instagramData.profile.profile_picture_url ? (
              <div className="shrink-0">
                <Image
                  src={instagramData.profile.profile_picture_url}
                  alt={instagramData.profile.username}
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                <Instagram className="h-10 w-10 text-muted-foreground" />
              </div>
            )}

            {/* Profile stats */}
            <div className="flex-1">
              <h3 className="text-xl font-medium mb-2">
                {instagramData.profile.username}
              </h3>

              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-semibold">
                    {formatNumber(instagramData.profile.followers_count)}
                  </span>
                  <span className="text-xs text-muted-foreground">Followers</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-lg font-semibold">
                    {formatNumber(instagramData.profile.media_count)}
                  </span>
                  <span className="text-xs text-muted-foreground">Posts</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-between">
                    <span>Account Type:</span>
                    <Badge variant="outline" className="font-normal">
                      {formatAccountType(instagramData.profile.account_type)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">Account Type</span>
                </div>
              </div>

              {/* Last updated */}
              {instagramData.analytics?.lastUpdated && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: {formatDate(instagramData.analytics.lastUpdated)}
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button asChild variant="outline" size="sm">
            <Link href={`https://instagram.com/${instagramData.profile.username}`} target="_blank" rel="noopener noreferrer">
              <LinkIcon className="h-3.5 w-3.5 mr-2" />
              View on Instagram
            </Link>
          </Button>

          <div className="flex gap-2">
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            )}

            {onReconnect && (
              <Button onClick={onReconnect} variant="ghost" size="sm">
                <Instagram className="mr-2 h-4 w-4" />
                Reconnect
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Analytics Dashboard */}
      {instagramData.analytics && (
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Instagram Analytics</CardTitle>
            </div>
            <CardDescription>
              Key performance metrics from your Instagram account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Average Reel Views Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-2">
                    <Play className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-sm font-medium">Avg. Reel Views</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Trophy className="h-8 w-8 text-amber-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{formatNumber(instagramData.analytics.avgReelViews || 0)}</p>
                      <p className="text-xs text-muted-foreground">Last 30 reels</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Average Reel Likes Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-rose-500" />
                    <CardTitle className="text-sm font-medium">Avg. Reel Likes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Flame className="h-8 w-8 text-red-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{formatNumber(instagramData.analytics.avgReelLikes || 0)}</p>
                      <p className="text-xs text-muted-foreground">Last 30 reels</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Average Engagement Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-2">
                    <LineChart className="h-4 w-4 text-green-500" />
                    <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-indigo-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{formatNumber(instagramData.analytics.averageEngagement)}</p>
                      <p className="text-xs text-muted-foreground">Per post engagement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-6" />

            <div className="text-center text-sm text-muted-foreground">
              <p>These metrics are based on analysis of your recent Instagram posts.</p>
              <p className="mt-1">Data is refreshed periodically to maintain accuracy.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default MinimalInstagramData;