'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
      console.log(`Attempting deal action: ${action} for deal: ${dealId}`);
      const response = await axios.post(`/api/deals/${dealId}/${action}`, {
        counterOffer: data?.counterOffer
      });

      if (response.data.success) {
        console.log(`Deal action ${action} successful for deal: ${dealId}`, response.data);
        toast({
          title: "Success",
          description: action === 'release-payment' ? 'Payment released successfully' : `Deal ${action}ed successfully`,
        });
        // Only refetch deals on actual success
        console.log('Refetching deals after successful action...');
        fetchDeals();
      } else {
        console.error(`Deal action ${action} failed:`, response.data.error);
        toast({
          title: "Error",
          description: response.data.error || `Failed to ${action} deal`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error(`Error with deal action ${action}:`, error);
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
            <h1 className="text-2xl font-bold text-black dark:text-white">
              MY DEALS
            </h1>
            <p className="text-gray-600 dark:text-zinc-400 mt-2">
              Manage your collaboration deals with influencers
            </p>
          </div>
          <Button
            onClick={fetchDeals}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
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
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl w-[90vw] max-w-md mx-auto rounded-xl overflow-hidden">
          {/* Header with icon and gradient */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl font-bold">
                  Approve Content
                </AlertDialogTitle>
                <p className="text-green-100 text-sm mt-1">
                  Review and confirm content approval
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <AlertDialogDescription className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              You are about to approve this content submission. Once approved, the content will be marked as accepted and the influencer will be notified.
            </AlertDialogDescription>

            {/* Important notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-200 text-sm mb-1">
                    Important Notice
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    This action cannot be undone. Please ensure you have thoroughly reviewed the content before proceeding.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 flex flex-row gap-3">
            <AlertDialogCancel className="flex-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 px-4 py-2 rounded-lg font-medium transition-colors">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmContentApproval}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
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
