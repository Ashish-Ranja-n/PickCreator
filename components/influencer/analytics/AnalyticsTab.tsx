'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface Analytics {
  totalInfluencers: number;
  totalBrands: number;
  verifiedInfluencers: number;
  verifiedBrands: number;
}

export default function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="py-4">
      <div className="bg-zinc-800/70 border-zinc-500/50 shadow-md rounded-lg p-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center">
            <p className="text-white font-medium">Total Brands - </p>
            <p className="text-fuchsia-400 font-medium ml-1">{analytics?.totalBrands || 0}</p>
            
          </div>
          <div className="flex items-center">
            <p className="text-white font-medium">Total Influencers - </p>
            <p className="text-fuchsia-400 font-medium ml-1">{analytics?.totalInfluencers || 0}</p>
            
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2 text-white">Upcoming Features</h3>
        <ul className="list-disc list-inside space-y-2 text-zinc-400">
          <li>Detailed analytics dashboard</li>
          <li>Industry news and updates</li>
          <li>Performance metrics</li>
        </ul>
      </div>
    </div>
  );
}