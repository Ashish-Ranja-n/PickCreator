'use client';

import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, Loader2 } from 'lucide-react';

import { useToast } from "@/components/ui/use-toast";
import { useCurrentUser } from "@/hook/useCurrentUser";

// Import deal components
import {
  DealCard,
  DealTabs,
  EmptyState,
  filterDealsByTab,
  getEmptyStateMessage,
  type Deal
} from '@/components/deal';



// Client component that handles the search params
const TabHandler = ({
  setActiveTab
}: {
  setActiveTab: (tab: string) => void
}) => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams?.get('tab') || 'requested';
    setActiveTab(tab);
  }, [searchParams, setActiveTab]);

  return null; // This component doesn't render anything
};

const InfluencerDealsPage = () => {
  const router = useRouter();
  const currentUser = useCurrentUser();

  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('requested');


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

  const filteredDeals = filterDealsByTab(deals, activeTab);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen subtle-gradient-bg">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" />
          <span className="text-lg font-medium text-gray-900 dark:text-white">Loading deals...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen subtle-gradient-bg">
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={fetchDeals} variant="outline" className="border-zinc-600 text-gray-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 min-h-screen overflow-y-auto subtle-gradient-bg text-gray-900 dark:text-white">
      {/* Wrap the TabHandler in a Suspense boundary */}
      <Suspense fallback={null}>
        <TabHandler setActiveTab={setActiveTab} />
      </Suspense>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
            My Deals
          </h1>
          <p className="text-gray-600 dark:text-zinc-400 mt-2">
            Manage your brand collaborations and track progress
          </p>
        </div>
        <Button
          onClick={fetchDeals}
          variant="outline"
          className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-gray-800 dark:text-zinc-200 border border-gray-200 dark:border-zinc-600/50 shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <DealTabs
        activeTab={activeTab}
        onTabChange={(value) => {
          setActiveTab(value);
          router.push(`/influencer/deals?tab=${value}`);
        }}
        deals={deals}
        userType="influencer"
      />

      <Tabs value={activeTab}>
        <TabsContent value="requested">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
                <DealCard
                  key={deal._id}
                  deal={deal}
                  userType="influencer"
                  onDealAction={handleDealAction}
                  onContentSubmission={handleContentSubmission}
                  onChatAction={handleChatAction}
                />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState
                  title={getEmptyStateMessage(activeTab, 'influencer').title}
                  description={getEmptyStateMessage(activeTab, 'influencer').description}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
                <DealCard
                  key={deal._id}
                  deal={deal}
                  userType="influencer"
                  onDealAction={handleDealAction}
                  onContentSubmission={handleContentSubmission}
                  onChatAction={handleChatAction}
                />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState
                  title={getEmptyStateMessage(activeTab, 'influencer').title}
                  description={getEmptyStateMessage(activeTab, 'influencer').description}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ongoing">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
                <DealCard
                  key={deal._id}
                  deal={deal}
                  userType="influencer"
                  onDealAction={handleDealAction}
                  onContentSubmission={handleContentSubmission}
                  onChatAction={handleChatAction}
                />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState
                  title={getEmptyStateMessage(activeTab, 'influencer').title}
                  description={getEmptyStateMessage(activeTab, 'influencer').description}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
                <DealCard
                  key={deal._id}
                  deal={deal}
                  userType="influencer"
                  onDealAction={handleDealAction}
                  onContentSubmission={handleContentSubmission}
                  onChatAction={handleChatAction}
                />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState
                  title={getEmptyStateMessage(activeTab, 'influencer').title}
                  description={getEmptyStateMessage(activeTab, 'influencer').description}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InfluencerDealsPage;