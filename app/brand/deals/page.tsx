'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { RefreshCw, Loader2 } from 'lucide-react';
import { PaymentSummaryDialog } from '@/components/payment/PaymentSummaryDialog';
import { useCurrentUser } from '@/hook/useCurrentUser';

// Import deal components
import {
  DealCard,
  DealTabs,
  EmptyState,
  filterDealsByTab,
  getEmptyStateMessage,
  type Deal
} from '@/components/deal';

function BrandDealsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useCurrentUser();

  const { toast } = useToast();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'requested');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

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
        console.error('API returned error:', response.data.error);
        toast({
          title: "Error",
          description: response.data.error || "Failed to fetch deals",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error fetching deals:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to fetch deals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDealAction = async (dealId: string, action: string, data?: any) => {
    // Handle payment action separately
    if (action === 'pay') {
      const deal = deals.find(d => d._id === dealId);
      if (deal) {
        setSelectedDeal(deal);
        setPaymentDialogOpen(true);
      }
      return;
    }

    try {
      const response = await axios.post(`/api/deals/${dealId}/${action}`, {
        counterOffer: data?.counterOffer
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: `Deal ${action}ed successfully`,
        });
        fetchDeals();
      } else {
        toast({
          title: "Error",
          description: response.data.error || `Failed to ${action} deal`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || `Failed to ${action} deal`,
        variant: "destructive",
      });
    }
  };

  const handleContentAction = async (dealId: string, contentId: string, action: 'approve' | 'reject', comment?: string) => {
    if (action === 'approve') {
      setSelectedContent({ dealId, contentId });
      setApprovalDialogOpen(true);
    } else {
      try {
        const response = await axios.post(`/api/deals/${dealId}/reject-content`, {
          contentId,
          comment: comment || 'Content rejected'
        });

        if (response.data.success) {
          toast({
            title: "Success",
            description: `Content ${action}ed successfully`,
          });
          fetchDeals();
        } else {
          toast({
            title: "Error",
            description: response.data.error || `Failed to ${action} content`,
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error('Error updating content:', error);
        toast({
          title: "Error",
          description: error.response?.data?.error || error.message || `Failed to ${action} content`,
          variant: "destructive",
        });
      }
    }
  };

  const confirmContentApproval = async () => {
    if (!selectedContent) return;

    try {
      const response = await axios.post(`/api/deals/${selectedContent.dealId}/approve-content`, {
        contentId: selectedContent.contentId
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Content approved successfully",
        });
        fetchDeals();
      } else {
        toast({
          title: "Error",
          description: response.data.error || "Failed to approve content",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error approving content:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to approve content",
        variant: "destructive",
      });
    } finally {
      setApprovalDialogOpen(false);
      setSelectedContent(null);
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
        // Navigate to brand chat window
        router.push(`/brand/chat/${response.data.conversationId}`);
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
      <div className="min-h-screen subtle-gradient-bg">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-4" />
            <div className="text-lg font-medium text-gray-900 dark:text-white">Loading deals...</div>
            <div className="text-sm text-gray-600 dark:text-zinc-300 mt-2">Please wait while we fetch your deals</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen subtle-gradient-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              Deal Management
            </h1>
            <p className="text-gray-600 dark:text-zinc-400 mt-2">
              Manage your collaboration deals with influencers
            </p>
          </div>
          <Button
            onClick={fetchDeals}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Deals
          </Button>
        </div>

        <DealTabs
          activeTab={activeTab}
          onTabChange={(value) => {
            setActiveTab(value);
            router.push(`/brand/deals?tab=${value}`);
          }}
          deals={deals}
          userType="brand"
        />

        <Tabs value={activeTab}>
          <TabsContent value="requested">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
                <DealCard
                  key={deal._id}
                  deal={deal}
                  userType="brand"
                  onDealAction={handleDealAction}
                  onContentAction={handleContentAction}
                  onChatAction={handleChatAction}
                />
              ))
            ) : (
              <EmptyState 
                {...getEmptyStateMessage('requested', 'brand')}
              />
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
                  userType="brand"
                  onDealAction={handleDealAction}
                  onContentAction={handleContentAction}
                  onChatAction={handleChatAction}
                />
              ))
            ) : (
              <EmptyState 
                {...getEmptyStateMessage('pending', 'brand')}
              />
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
                  userType="brand"
                  onDealAction={handleDealAction}
                  onContentAction={handleContentAction}
                  onChatAction={handleChatAction}
                />
              ))
            ) : (
              <EmptyState 
                {...getEmptyStateMessage('ongoing', 'brand')}
              />
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
                  userType="brand"
                  onDealAction={handleDealAction}
                  onContentAction={handleContentAction}
                  onChatAction={handleChatAction}
                />
              ))
            ) : (
              <EmptyState 
                {...getEmptyStateMessage('history', 'brand')}
              />
            )}
          </div>
        </TabsContent>
        </Tabs>
      </div>

      {/* Content Approval Confirmation Dialog */}
      <AlertDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <AlertDialogContent className="bg-white border-2 border-gray-300 shadow-xl max-w-md mx-auto rounded-lg">
          <AlertDialogHeader className="pb-2">
            <AlertDialogTitle className="text-xl font-bold text-center text-blue-600 border-b pb-3">
              Confirm Content Approval
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600 pt-3">
              Are you sure you want to approve this content? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center gap-4 pt-4">
            <AlertDialogCancel className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-6 py-2 rounded-md">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmContentApproval}
              className="bg-green-600 text-white hover:bg-green-700 px-6 py-2 rounded-md"
            >
              Approve Content
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Dialog */}
      {selectedDeal && (
        <PaymentSummaryDialog
          isOpen={paymentDialogOpen}
          onClose={() => {
            setPaymentDialogOpen(false);
            setSelectedDeal(null);
          }}
          deal={selectedDeal}
        />
      )}
    </div>
  );
}

export default function BrandDealsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrandDealsContent />
    </Suspense>
  );
}
