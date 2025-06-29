import { useState } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';

interface RefreshInstagramButtonProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * Button component for manually refreshing Instagram data
 */
export default function RefreshInstagramButton({ onSuccess, onError }: RefreshInstagramButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      // Call the Instagram minimal API to get fresh data
      const response = await axios.get('/api/influencer/instagram/minimal', {
        // Add a cache-busting parameter
        params: { refresh: Date.now() }
      });

      // Call the onSuccess callback with the refreshed data
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('Error refreshing Instagram data:', error);

      // Call the onError callback with the error
      if (onError) {
        onError(error);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
    >
      <RefreshCw className={`h-3.5 w-3.5 text-blue-500 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span className="text-xs">{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
    </Button>
  );
}