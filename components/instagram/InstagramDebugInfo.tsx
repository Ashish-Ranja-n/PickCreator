import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { InstagramData } from '@/utils/instagramApi';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RefreshInstagramButton from './RefreshInstagramButton';

interface InstagramDebugInfoProps {
  instagramData: InstagramData | null;
  onDataRefreshed?: (data: InstagramData) => void;
}

// Format account type (e.g., MEDIA_CREATOR -> Media Creator)
const formatAccountType = (accountType?: string): string => {
  if (!accountType) return 'Unknown';

  return accountType
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Component for displaying detailed debug information about Instagram connection
 */
export default function InstagramDebugInfo({ instagramData, onDataRefreshed }: InstagramDebugInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!instagramData) {
    return null;
  }

  return (
    <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
            <CardTitle className="text-base text-gray-900 dark:text-white">Debug Information</CardTitle>
          </div>
          <div className="flex items-center space-x-4">
            <RefreshInstagramButton
              onSuccess={onDataRefreshed}
              onError={(error) => console.error('Error refreshing Instagram data:', error)}
            />
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-3 text-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700">
              <span className="text-gray-500 dark:text-zinc-400">Connection Status:</span>
              <span className={instagramData.isConnected ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400 font-medium"}>
                {instagramData.isConnected ? "Connected" : "Not Connected"}
              </span>
            </div>

            {instagramData.error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-500 dark:text-red-400 p-2 rounded text-xs mb-2">
                Error: {instagramData.error}
              </div>
            )}

            {instagramData.profile && (
              <>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700">
                  <span className="text-gray-500 dark:text-zinc-400">Username:</span>
                  <span className="text-gray-900 dark:text-white">@{instagramData.profile.username}</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700">
                  <span className="text-gray-500 dark:text-zinc-400">Account Type:</span>
                  <span className="text-gray-900 dark:text-white">{formatAccountType(instagramData.profile.account_type)}</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700">
                  <span className="text-gray-500 dark:text-zinc-400">Followers:</span>
                  <span className="text-gray-900 dark:text-white">{(instagramData.profile.followers_count || 0).toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700">
                  <span className="text-gray-500 dark:text-zinc-400">Media Count:</span>
                  <span className="text-gray-900 dark:text-white">{(instagramData.profile.media_count || 0).toLocaleString()}</span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700">
              <span className="text-gray-500 dark:text-zinc-400">Analytics Available:</span>
              <span className={instagramData.analytics ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}>
                {instagramData.analytics ? "Yes" : "No"}
              </span>
            </div>

            {instagramData.analytics && (
              <>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700">
                  <span className="text-gray-500 dark:text-zinc-400">Avg. Reel Views:</span>
                  <span className="text-gray-900 dark:text-white">{(instagramData.analytics.avgReelViews || 0).toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700">
                  <span className="text-gray-500 dark:text-zinc-400">Avg. Reel Likes:</span>
                  <span className="text-gray-900 dark:text-white">{(instagramData.analytics.avgReelLikes || 0).toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700">
                  <span className="text-gray-500 dark:text-zinc-400">Average Engagement:</span>
                  <span className="text-gray-900 dark:text-white">{(instagramData.analytics.averageEngagement || 0).toLocaleString()}</span>
                </div>

                {instagramData.analytics.lastUpdated && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700">
                    <span className="text-gray-500 dark:text-zinc-400">Last Updated:</span>
                    <span className="text-gray-900 dark:text-white">{new Date(instagramData.analytics.lastUpdated).toLocaleString()}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}