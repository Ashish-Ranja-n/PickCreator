'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

import { useToast } from "@/components/ui/use-toast";
import { useCurrentUser } from "@/hook/useCurrentUser";

// Import deal components
import { type Deal } from '@/components/deal';
import { NativeDealsList } from '@/components/deal/NativeDealsList';



const InfluencerDealsPage = () => {
  const router = useRouter();
  const currentUser = useCurrentUser();

  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/deals');
      if (response.data.success) {
        console.log(`Received ${response.data.deals.length} deals from API`);
        setDeals(response.data.deals);
      } else {
        setError(response.data.error || 'Failed to fetch deals');
      }
    } catch (error: any) {
      console.error('Error fetching deals:', error);
      setError(error.response?.data?.error || error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDealAction = async (dealId: string, action: string, data?: any) => {
    try {
      const response = await axios.post(`/api/deals/${dealId}/${action}`, {
        counterOffer: data?.counterOffer
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: `Deal ${action}ed successfully`,
        });
        await fetchDeals();
      } else {
        setError(response.data.error || `Failed to ${action} deal`);
      }
    } catch (error: any) {
      console.error(`Error ${action}ing deal:`, error);
      setError(error.response?.data?.error || error.message || 'An error occurred');
    }
  };

  const handleContentSubmission = async (dealId: string, data: any) => {
    try {
      const response = await axios.post(`/api/deals/${dealId}/submit`, {
        contentType: data.contentType,
        contentUrl: data.contentUrl
      });

      if (response.data.success) {
        toast({
          title: "Content Submitted",
          description: "Your content has been submitted for review",
        });

        // Refresh deals
        await fetchDeals();
      } else {
        setError(response.data.error || 'Failed to submit content');
      }
    } catch (error: any) {
      console.error('Error submitting content:', error);
      setError(error.response?.data?.error || error.message || 'An error occurred');
    }
  };

  const handleChatAction = async (_dealId: string, otherUserId: string) => {
    try {
      // Create or get conversation
      const response = await axios.post('/api/conversation', {
        currentUserId: currentUser?._id,
        otherUserId: otherUserId
      });

      if (response.data.conversationId) {
        // Navigate to influencer chat window
        router.push(`/influencer/chat/${response.data.conversationId}`);
      } else {
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to start chat",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchDeals} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 mt-12">
      <div className="container mx-auto px-4 pt-6 mt-2 pb-8 mb-6 max-w-4xl">
        <NativeDealsList
          deals={deals}
          userType="influencer"
          loading={loading}
          onDealAction={handleDealAction}
          onContentSubmission={handleContentSubmission}
          onChatAction={handleChatAction}
          onRefresh={fetchDeals}
        />
      </div>
    </div>
  );
};

export default InfluencerDealsPage;