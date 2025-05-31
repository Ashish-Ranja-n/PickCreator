'use client';

import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Badge
} from "@/components/ui/badge";
import {
  Loader2,
  User,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRightLeft,
  RefreshCw,
  InfoIcon,
  MessageCircle
} from 'lucide-react';
import { useCurrentUser } from '@/hook/useCurrentUser';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import Image from 'next/image';
import { PaymentSummaryDialog } from '@/components/payment/PaymentSummaryDialog';

interface ContentSubmission {
  _id?: string;
  type: 'reel' | 'post' | 'story' | 'live';
  url: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  reviewedAt?: string;
}

interface Deal {
  _id: string;
  dealName: string;
  dealType: 'single' | 'multiple';
  status: 'requested' | 'counter-offered' | 'accepted' | 'ongoing' | 'completed' | 'cancelled' | 'content_approved';
  paymentStatus: 'paid' | 'unpaid';
  totalAmount: number;
  createdAt: string;
  brandName: string;
  brandProfilePic: string;
  contentRequirements: {
    reels: number;
    posts: number;
    stories: number;
    lives: number;
  };
  influencers: Array<{
    id: string;
    name: string;
    profilePictureUrl: string;
    status: 'pending' | 'accepted' | 'rejected';
    offeredPrice: number;
    counterOffer?: number;
  }>;
  submittedContent?: ContentSubmission[];
  contentPublished: boolean;
  paymentReleased: boolean;
}

interface DealProgress {
  paid: boolean;
  contentPublished: boolean;
  paymentReleased: boolean;
}

// Client component that handles the tab functionality with useSearchParams

const TabHandler = ({
  // activeTab is not used but included in the type definition for clarity
  setActiveTab
}: {
  activeTab: string,
  setActiveTab: (tab: string) => void
}) => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams?.get('tab') || 'requested';
    setActiveTab(tab);
  }, [searchParams, setActiveTab]);

  return null; // This component doesn't render anything
};

const BrandDealsPage = () => {
  const router = useRouter();
  const user = useCurrentUser();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('requested');
  const [rejectionComment, setRejectionComment] = useState('');
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [contentToApprove, setContentToApprove] = useState<{dealId: string, contentId: string} | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState<boolean>(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState<boolean>(false);
  const [selectedDealForPayment, setSelectedDealForPayment] = useState<Deal | null>(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/deals');
      if (response.data.success) {
        setDeals(response.data.deals);
      } else {
        setError(response.data.error || 'Failed to fetch deals');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching deals');
    } finally {
      setLoading(false);
    }
  };

  const handleDealAction = async (dealId: string, action: 'cancel' | 'reject' | 'complete' | 'accept' | 'pay' | 'release-payment') => {
    try {
      // Special handling for payment action
      if (action === 'pay') {
        const dealToPay = deals.find(d => d._id === dealId);
        if (dealToPay) {
          setSelectedDealForPayment(dealToPay);
          setPaymentDialogOpen(true);
          return;
        }
      }

      // Map frontend actions to API endpoints
      const actionEndpoint = action === 'cancel' ? 'cancel' :
                             action === 'reject' ? 'reject' :
                             action === 'complete' ? 'complete' :
                             action === 'accept' ? 'accept' :
                             action === 'pay' ? 'pay' :
                             action === 'release-payment' ? 'release-payment' : action;

      const response = await axios.post(`/api/deals/${dealId}/${actionEndpoint}`);
      if (response.data.success) {
        fetchDeals(); // Refresh the deals list
      } else {
        setError(response.data.error || `Failed to ${action} deal`);
      }
    } catch (err: any) {
      setError(err.message || `An error occurred while ${action}ing the deal`);
    }
  };

  const handleContentAction = async (dealId: string, contentId: string, action: 'approve' | 'reject', comment?: string) => {
    try {
      const endpoint = action === 'approve' ? 'approve-content' : 'reject-content';
      const payload = action === 'approve' ? { contentId } : { contentId, comment };

      const response = await axios.post(`/api/deals/${dealId}/${endpoint}`, payload);

      if (response.data.success) {
        fetchDeals(); // Refresh the deals list
      } else {
        setError(response.data.error || `Failed to ${action} content`);
      }
    } catch (err: any) {
      setError(err.message || `An error occurred while ${action}ing the content`);
    }
  };

  // Helper function to safely format amounts for display
  const formatAmount = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return "0";
    return amount.toLocaleString();
  };

  // Helper function to safely format dates
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  const getStatusColor = (status: Deal['status']) => {
    switch (status) {
      case 'requested':
        return 'bg-blue-100 text-blue-800';
      case 'counter-offered':
        return 'bg-indigo-100 text-indigo-800';
      case 'accepted':
        return 'bg-yellow-100 text-yellow-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'content_approved':
        return 'bg-teal-100 text-teal-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: Deal['paymentStatus']) => {
    switch (status) {
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Deal['status']) => {
    switch (status) {
      case 'requested':
        return <Clock className="h-4 w-4" />;
      case 'counter-offered':
        return <ArrowRightLeft className="h-4 w-4" />;
      case 'accepted':
        return <AlertCircle className="h-4 w-4" />;
      case 'ongoing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'content_approved':
        return <CheckCircle2 className="h-4 w-4 text-teal-600" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getProgressStatus = (deal: Deal): DealProgress => {
    // Check if any content has been approved
    const hasApprovedContent = deal.submittedContent?.some(content => content.status === 'approved') || false;

    return {
      paid: deal.paymentStatus === 'paid',
      contentPublished: hasApprovedContent || deal.contentPublished || false,
      paymentReleased: deal.paymentReleased || false,
    };
  };

  const filteredDeals = deals.filter(deal => {
    switch (activeTab) {
      case 'requested':
        return deal.status === 'requested' || deal.status === 'counter-offered';
      case 'pending':
        return deal.status === 'accepted';
      case 'ongoing':
        return deal.status === 'ongoing' || deal.status === 'content_approved';
      case 'history':
        return ['completed', 'cancelled'].includes(deal.status);
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-lg font-medium">Loading deals...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchDeals}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen overflow-y-auto">
      {/* Wrap the TabHandler in a Suspense boundary */}
      <Suspense fallback={null}>
        <TabHandler activeTab={activeTab} setActiveTab={setActiveTab} />
      </Suspense>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Deals</h1>
        <Button
          onClick={fetchDeals}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        router.push(`/brand/deals?tab=${value}`);
      }}>
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="requested">
            Requested
            {deals.filter(deal => deal.status === 'requested' || deal.status === 'counter-offered').length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white min-w-[20px]">
                {deals.filter(deal => deal.status === 'requested' || deal.status === 'counter-offered').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {deals.filter(deal => deal.status === 'accepted').length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-500 text-white min-w-[20px]">
                {deals.filter(deal => deal.status === 'accepted').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="ongoing">
            Ongoing
            {deals.filter(deal => deal.status === 'ongoing' || deal.status === 'content_approved').length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-green-500 text-white min-w-[20px]">
                {deals.filter(deal => deal.status === 'ongoing' || deal.status === 'content_approved').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            History
            {deals.filter(deal => ['completed', 'cancelled'].includes(deal.status)).length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-500 text-white min-w-[20px]">
                {deals.filter(deal => ['completed', 'cancelled'].includes(deal.status)).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requested">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
                <Card key={deal._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Collapsible>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Profile Picture - Only show for single influencer deals */}
                          {deal.dealType === 'single' && (
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                              {deal.influencers[0]?.profilePictureUrl ? (
                                <Image
                                  src={deal.influencers[0].profilePictureUrl}
                                  alt={deal.influencers[0].name}
                                  className="w-full h-full object-cover"
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700">
                                  {deal.influencers[0]?.name?.charAt(0) || 'I'}
                                </div>
                              )}
                            </div>
                          )}
                          {/* Name and Deal Title */}
                          <div>
                            {/* For single influencer deals, show the name */}
                            {deal.dealType === 'single' && (
                              <CardTitle className="text-lg">{deal.influencers[0]?.name || 'Influencer'}</CardTitle>
                            )}
                            {/* For multiple influencer deals, show the deal name */}
                            {deal.dealType === 'multiple' && (
                              <div>
                                <CardTitle className="text-lg">
                                  {deal.dealName}
                                </CardTitle>
                                <CollapsibleTrigger className="text-xs text-blue-500 mt-1">
                                  View list
                                </CollapsibleTrigger>
                              </div>
                            )}
                          </div>
                        </div>
                      <Badge className={getStatusColor(deal.status)}>
                        {getStatusIcon(deal.status)}
                        {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                      </Badge>
                    </div>

                      {deal.dealType === 'multiple' && (
                        <CollapsibleContent>
                          <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-md">
                            <h4 className="text-sm font-medium">Influencer List:</h4>
                            {deal.influencers.map((influencer, index) => (
                              <div key={influencer.id || index} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
                                  {influencer.profilePictureUrl ? (
                                    <Image
                                      src={influencer.profilePictureUrl}
                                      alt={influencer.name}
                                      className="w-full h-full object-cover"
                                      width={24}
                                      height={24}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700 text-xs">
                                      {influencer.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm">{influencer.name}</span>
                                <Badge
                                  variant="outline"
                                  className={
                                    influencer.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                                    influencer.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  }
                                >
                                  {influencer.status.charAt(0).toUpperCase() + influencer.status.slice(1)}
                                </Badge>
                        </div>
                            ))}
                        </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {deal.status === 'counter-offered' ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Original Amount</span>
                            <span className="font-semibold flex items-center">
                              <IndianRupee className="h-4 w-4 mr-1" />
                              {formatAmount(deal.totalAmount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Counter Offer</span>
                            <span className="font-semibold flex items-center text-indigo-600">
                              <IndianRupee className="h-4 w-4 mr-1" />
                              {formatAmount(deal.influencers[0].counterOffer)}
                            </span>
                          </div>
                        </>
                      ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Total Amount</span>
                        <span className="font-semibold flex items-center">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {formatAmount(deal.totalAmount)}
                        </span>
                      </div>
                      )}

                      {/* Content Requirements - Block Style */}
                      <div className="flex flex-wrap gap-3 mt-2">
                        {deal.contentRequirements.reels > 0 && (
                          <div className="w-24 h-24 flex flex-col items-center justify-center bg-gray-50 rounded-md p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mb-1">
                              <path d="M19 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"></path>
                              <path d="m15 11-5-3v6l5-3Z"></path>
                            </svg>
                            <span className="text-xl font-medium">{deal.contentRequirements.reels}</span>
                            <span className="text-sm text-gray-500">Reels</span>
                          </div>
                        )}
                        {deal.contentRequirements.posts > 0 && (
                          <div className="w-24 h-24 flex flex-col items-center justify-center bg-gray-50 rounded-md p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mb-1">
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                              <circle cx="9" cy="9" r="2"></circle>
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                            </svg>
                            <span className="text-xl font-medium">{deal.contentRequirements.posts}</span>
                            <span className="text-sm text-gray-500">Posts</span>
                          </div>
                        )}
                        {deal.contentRequirements.stories > 0 && (
                          <div className="w-24 h-24 flex flex-col items-center justify-center bg-gray-50 rounded-md p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mb-1">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M12 8v8"></path>
                              <path d="M8 12h8"></path>
                            </svg>
                            <span className="text-xl font-medium">{deal.contentRequirements.stories}</span>
                            <span className="text-sm text-gray-500">Stories</span>
                          </div>
                        )}
                        {deal.contentRequirements.lives > 0 && (
                          <div className="w-24 h-24 flex flex-col items-center justify-center bg-gray-50 rounded-md p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mb-1">
                              <path d="m22 8-6 4 6 4V8Z"></path>
                              <rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect>
                            </svg>
                            <span className="text-xl font-medium">{deal.contentRequirements.lives}</span>
                            <span className="text-sm text-gray-500">Lives</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Created</span>
                        <span className="text-sm">
                          {formatDate(deal.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Payment Status</span>
                        <Badge className={getPaymentStatusColor(deal.paymentStatus)}>
                          {deal.paymentStatus?.charAt(0).toUpperCase() + deal.paymentStatus?.slice(1) || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    {deal.status === 'counter-offered' && (
                      <div className="flex w-full gap-4">
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleDealAction(deal._id, 'reject')}
                        >
                          Reject
                        </Button>
                    <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleDealAction(deal._id, 'accept')}
                    >
                          Accept Counter Offer
                    </Button>
                      </div>
                    )}
                    {deal.status === 'requested' && (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleDealAction(deal._id, 'cancel')}
                      >
                        Cancel Request
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex justify-center items-center py-16">
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-8 py-10 max-w-md shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-blue-100 p-3 rounded-full mb-4">
                      <InfoIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No requested deals</h3>
                    <p className="text-gray-500">Deals that you have requested to influencers will appear here.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
                <Card key={deal._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Collapsible>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Profile Picture - Only show for single influencer deals */}
                          {deal.dealType === 'single' && (
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                              {deal.influencers[0]?.profilePictureUrl ? (
                                <Image
                                  src={deal.influencers[0].profilePictureUrl}
                                  alt={deal.influencers[0].name}
                                  className="w-full h-full object-cover"
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700">
                                  {deal.influencers[0]?.name?.charAt(0) || 'I'}
                                </div>
                              )}
                            </div>
                          )}
                          {/* Name and Deal Title */}
                          <div>
                            {/* For single influencer deals, show the name */}
                            {deal.dealType === 'single' && (
                              <CardTitle className="text-lg">{deal.influencers[0]?.name || 'Influencer'}</CardTitle>
                            )}
                            {/* For multiple influencer deals, show the deal name */}
                            {deal.dealType === 'multiple' && (
                              <div>
                                <CardTitle className="text-lg">
                                  {deal.dealName}
                                </CardTitle>
                                <CollapsibleTrigger className="text-xs text-blue-500 mt-1">
                                  View list
                                </CollapsibleTrigger>
                              </div>
                            )}
                          </div>
                        </div>
                      <Badge className={getStatusColor(deal.status)}>
                        {getStatusIcon(deal.status)}
                        {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                      </Badge>
                    </div>

                      {deal.dealType === 'multiple' && (
                        <CollapsibleContent>
                          <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-md">
                            <h4 className="text-sm font-medium">Influencer List:</h4>
                            {deal.influencers.map((influencer, index) => (
                              <div key={influencer.id || index} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
                                  {influencer.profilePictureUrl ? (
                                    <Image
                                      src={influencer.profilePictureUrl}
                                      alt={influencer.name}
                                      className="w-full h-full object-cover"
                                      width={24}
                                      height={24}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700 text-xs">
                                      {influencer.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm">{influencer.name}</span>
                                <Badge
                                  variant="outline"
                                  className={
                                    influencer.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                                    influencer.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  }
                                >
                                  {influencer.status.charAt(0).toUpperCase() + influencer.status.slice(1)}
                                </Badge>
                        </div>
                            ))}
                        </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Total Amount</span>
                        <span className="font-semibold flex items-center">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {formatAmount(deal.totalAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Created</span>
                        <span className="text-sm">
                          {formatDate(deal.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Payment Status</span>
                        <Badge className={getPaymentStatusColor(deal.paymentStatus)}>
                          {deal.paymentStatus?.charAt(0).toUpperCase() + deal.paymentStatus?.slice(1) || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleDealAction(deal._id, 'pay')}
                    >
                      Make Payment
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex justify-center items-center py-16">
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-8 py-10 max-w-md shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-yellow-100 p-3 rounded-full mb-4">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending deals</h3>
                    <p className="text-gray-500">Deals accepted by influencers and awaiting your action will appear here.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ongoing">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => {
                const progress = getProgressStatus(deal);
                return (
                  <Collapsible key={deal._id}>
                    <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Collapsible>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Profile Picture - Only show for single influencer deals */}
                          {deal.dealType === 'single' && (
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                              {deal.influencers[0]?.profilePictureUrl ? (
                                <Image
                                  src={deal.influencers[0].profilePictureUrl}
                                  alt={deal.influencers[0].name}
                                  className="w-full h-full object-cover"
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700">
                                  {deal.influencers[0]?.name?.charAt(0) || 'I'}
                                </div>
                              )}
                            </div>
                          )}
                          {/* Name and Deal Title */}
                          <div>
                            {/* For single influencer deals, show the name */}
                            {deal.dealType === 'single' && (
                              <CardTitle className="text-lg">{deal.influencers[0]?.name || 'Influencer'}</CardTitle>
                            )}
                            {/* For multiple influencer deals, show the deal name */}
                            {deal.dealType === 'multiple' && (
                              <div>
                                <CardTitle className="text-lg">
                                  {deal.dealName}
                                </CardTitle>
                                <CollapsibleTrigger className="text-xs text-blue-500 mt-1">
                                  View list
                                </CollapsibleTrigger>
                              </div>
                            )}
                          </div>
                        </div>
                      <Badge className={getStatusColor(deal.status)}>
                        {getStatusIcon(deal.status)}
                        {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                      </Badge>
                    </div>

                      {deal.dealType === 'multiple' && (
                        <CollapsibleContent>
                          <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-md">
                            <h4 className="text-sm font-medium">Influencer List:</h4>
                            {deal.influencers.map((influencer, index) => (
                              <div key={influencer.id || index} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
                                  {influencer.profilePictureUrl ? (
                                    <Image
                                      src={influencer.profilePictureUrl}
                                      alt={influencer.name}
                                      className="w-full h-full object-cover"
                                      width={24}
                                      height={24}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700 text-xs">
                                      {influencer.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm">{influencer.name}</span>
                                <Badge
                                  variant="outline"
                                  className={
                                    influencer.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                                    influencer.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  }
                                >
                                  {influencer.status.charAt(0).toUpperCase() + influencer.status.slice(1)}
                                </Badge>
                        </div>
                            ))}
                        </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Total Amount</span>
                        <span className="font-semibold flex items-center">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {formatAmount(deal.totalAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Created</span>
                        <span className="text-sm">
                          {formatDate(deal.createdAt)}
                        </span>
                      </div>

                          {/* Deal Status */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Payment Status</span>
                              <Badge className={progress.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {progress.paid ? 'Paid' : 'Unpaid'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm text-gray-500">Content Status</span>
                              <Badge className={progress.contentPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {progress.contentPublished ? 'Published' : 'Pending'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm text-gray-500">Payment Release</span>
                              <Badge className={progress.paymentReleased ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {progress.paymentReleased ? 'Released' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CollapsibleContent>
                        <CardContent>
                          {/* Full Progress Timeline */}
                          <div className="relative pl-6 border-l-2 border-gray-200 mt-2">
                            <div className="space-y-6">
                              {/* Payment Made */}
                              <div className="relative">
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 -ml-[7px] rounded-full ${progress.paid ? 'bg-green-500' : 'bg-gray-300'} ring-4 ring-white`} />
                                <div className="ml-4">
                                  <span className="text-sm font-medium">{progress.paid ? '✓ Payment Made' : 'Payment Made'}</span>
                                  <p className="text-xs text-gray-500 mt-0.5">You have processed the payment</p>
                                </div>
                              </div>

                              {/* Content Published */}
                              <div className="relative">
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 -ml-[7px] rounded-full ${progress.contentPublished ? 'bg-green-500' : 'bg-gray-300'} ring-4 ring-white`} />
                                <div className="ml-4">
                                  <span className="text-sm font-medium">{progress.contentPublished ? '✓ Content Published' : 'Content Published'}</span>
                                  <p className="text-xs text-gray-500 mt-0.5">Influencer has published the content</p>
                                </div>
                              </div>

                              {/* Payment Released */}
                              <div className="relative">
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 -ml-[7px] rounded-full ${progress.paymentReleased ? 'bg-green-500' : 'bg-gray-300'} ring-4 ring-white`} />
                                <div className="ml-4">
                                  <span className="text-sm font-medium">{progress.paymentReleased ? '✓ Payment Released' : 'Payment Released'}</span>
                                  <p className="text-xs text-gray-500 mt-0.5">Payment has been released to influencer</p>
                                </div>
                              </div>
                      </div>
                    </div>
                  </CardContent>
                      </CollapsibleContent>
                      <CardFooter className="pt-2 flex flex-col gap-4">
                        {/* Submitted Content Review */}
                        {deal.submittedContent && deal.submittedContent.length > 0 && (
                          <div className="w-full p-4 bg-gray-50 rounded-lg mb-4">
                            <h4 className="font-medium mb-3">Submitted Content</h4>
                            <div className="space-y-4">
                              {deal.submittedContent.map((content, index) => (
                                <div key={index} className={`p-3 rounded border ${content.status === 'approved' ? 'bg-green-50 border-green-200' : content.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="font-medium capitalize">{content.type}</span>
                                      <div className="text-sm text-blue-600 break-all">
                                        <a href={content.url} target="_blank" rel="noopener noreferrer">
                                          {content.url}
                                        </a>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        Submitted: {formatDate(content.submittedAt)}
                                      </div>
                                    </div>
                                    <Badge className={`ml-2 ${content.status === 'approved' ? 'bg-green-100 text-green-800' : content.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                      {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                                    </Badge>
                                  </div>

                                  {content.status === 'pending' && (
                                    <div className="mt-3 flex flex-col gap-3">
                                      <div className="flex gap-2">
                                        <Button
                                          className="flex-1 bg-green-600 hover:bg-green-700"
                                          onClick={() => {
                                            setContentToApprove({dealId: deal._id, contentId: content._id as string});
                                            setApprovalDialogOpen(true);
                                          }}
                                        >
                                          Approve
                                        </Button>
                                        <Button
                                          className="flex-1 bg-red-600 hover:bg-red-700"
                                          onClick={() => {
                                            setSelectedContentId(content._id as string);
                                            setRejectionComment('');
                                          }}
                                        >
                                          Reject
                                        </Button>
                                      </div>

                                      {selectedContentId === content._id && (
                                        <div className="p-3 bg-gray-100 rounded">
                                          <label className="block text-sm font-medium mb-1">Rejection Reason</label>
                                          <textarea
                                            className="w-full p-2 border rounded-md mb-2"
                                            placeholder="Provide feedback for rejection"
                                            rows={2}
                                            value={rejectionComment}
                                            onChange={(e) => setRejectionComment(e.target.value)}
                                          />
                                          <div className="flex gap-2">
                                            <Button
                                              className="flex-1 bg-red-600 hover:bg-red-700"
                                              disabled={!rejectionComment.trim()}
                                              onClick={() => {
                                                if (rejectionComment.trim()) {
                                                  handleContentAction(deal._id, content._id as string, 'reject', rejectionComment);
                                                  setSelectedContentId(null);
                                                }
                                              }}
                                            >
                                              Submit Rejection
                                            </Button>
                                            <Button
                                              variant="outline"
                                              className="flex-1"
                                              onClick={() => setSelectedContentId(null)}
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {content.status === 'rejected' && content.comment && (
                                    <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                                      <strong>Feedback:</strong> {content.comment}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Payment Release Button */}
                        {(progress.contentPublished || deal.status === 'content_approved') && !progress.paymentReleased && (
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 mb-3"
                            onClick={() => handleDealAction(deal._id, 'release-payment')}
                          >
                            Release Payment
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50"
                          onClick={async () => {
                            try {
                              // For brands, we need to get the influencer ID
                              // If it's a single deal, use the first influencer
                              const influencerId = deal.influencers[0]?.id;

                              if (!influencerId || !user?._id) {
                                console.error("Missing influencer ID or current user ID");
                                return;
                              }

                              // Create or get existing conversation
                              const response = await axios.post("/api/conversation", {
                                currentUserId: user._id,
                                otherUserId: influencerId
                              });

                              if (response.data && response.data.conversationId) {
                                // Navigate to the chat with this conversation
                                router.push(`/brand/chat/${response.data.conversationId}`);
                              } else {
                                console.error("Failed to create conversation");
                              }
                            } catch (error) {
                              console.error("Error starting chat:", error);
                            }
                          }}
                        >
                          <MessageCircle className="h-5 w-5 text-blue-600" />
                          <span className="text-blue-600 font-medium">Message Influencer</span>
                      </Button>
                  </CardFooter>
                </Card>
                  </Collapsible>
                );
              })
            ) : (
              <div className="col-span-full flex justify-center items-center py-16">
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-8 py-10 max-w-md shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-green-100 p-3 rounded-full mb-4">
                      <Loader2 className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No ongoing deals</h3>
                    <p className="text-gray-500">Deals that are currently in progress will appear here.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
                <Card key={deal._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Collapsible>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Profile Picture - Only show for single influencer deals */}
                          {deal.dealType === 'single' && (
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                              {deal.influencers[0]?.profilePictureUrl ? (
                                <Image
                                  src={deal.influencers[0].profilePictureUrl}
                                  alt={deal.influencers[0].name}
                                  className="w-full h-full object-cover"
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700">
                                  {deal.influencers[0]?.name?.charAt(0) || 'I'}
                                </div>
                              )}
                            </div>
                          )}
                          {/* Name and Deal Title */}
                          <div>
                            {/* For single influencer deals, show the name */}
                            {deal.dealType === 'single' && (
                              <CardTitle className="text-lg">{deal.influencers[0]?.name || 'Influencer'}</CardTitle>
                            )}
                            {/* For multiple influencer deals, show the deal name */}
                            {deal.dealType === 'multiple' && (
                              <div>
                                <CardTitle className="text-lg">
                                  {deal.dealName}
                                </CardTitle>
                                <CollapsibleTrigger className="text-xs text-blue-500 mt-1">
                                  View list
                                </CollapsibleTrigger>
                              </div>
                            )}
                          </div>
                        </div>
                      <Badge className={getStatusColor(deal.status)}>
                        {getStatusIcon(deal.status)}
                        {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                      </Badge>
                    </div>

                      {deal.dealType === 'multiple' && (
                        <CollapsibleContent>
                          <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-md">
                            <h4 className="text-sm font-medium">Influencer List:</h4>
                            {deal.influencers.map((influencer, index) => (
                              <div key={influencer.id || index} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
                                  {influencer.profilePictureUrl ? (
                                    <Image
                                      src={influencer.profilePictureUrl}
                                      alt={influencer.name}
                                      className="w-full h-full object-cover"
                                      width={24}
                                      height={24}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700 text-xs">
                                      {influencer.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm">{influencer.name}</span>
                                <Badge
                                  variant="outline"
                                  className={
                                    influencer.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                                    influencer.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  }
                                >
                                  {influencer.status.charAt(0).toUpperCase() + influencer.status.slice(1)}
                                </Badge>
                        </div>
                            ))}
                        </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {deal.status === 'counter-offered' ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Original Amount</span>
                            <span className="font-semibold flex items-center">
                              <IndianRupee className="h-4 w-4 mr-1" />
                              {formatAmount(deal.totalAmount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Counter Offer</span>
                            <span className="font-semibold flex items-center text-indigo-600">
                              <IndianRupee className="h-4 w-4 mr-1" />
                              {formatAmount(deal.influencers[0].counterOffer)}
                            </span>
                          </div>
                        </>
                      ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Total Amount</span>
                        <span className="font-semibold flex items-center">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {formatAmount(deal.totalAmount)}
                        </span>
                      </div>
                      )}

                      {/* Content Requirements */}
                      <div className="space-y-2">
                        {deal.contentRequirements.reels > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Reels</span>
                            <span className="text-sm font-medium">{deal.contentRequirements.reels}</span>
                          </div>
                        )}
                        {deal.contentRequirements.posts > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Posts</span>
                            <span className="text-sm font-medium">{deal.contentRequirements.posts}</span>
                          </div>
                        )}
                        {deal.contentRequirements.stories > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Stories</span>
                            <span className="text-sm font-medium">{deal.contentRequirements.stories}</span>
                          </div>
                        )}
                        {deal.contentRequirements.lives > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Lives</span>
                            <span className="text-sm font-medium">{deal.contentRequirements.lives}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Created</span>
                        <span className="text-sm">
                          {formatDate(deal.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Payment Status</span>
                        <Badge className={getPaymentStatusColor(deal.paymentStatus)}>
                          {deal.paymentStatus?.charAt(0).toUpperCase() + deal.paymentStatus?.slice(1) || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/brand/deals/${deal._id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex justify-center items-center py-16">
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-8 py-10 max-w-md shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-purple-100 p-3 rounded-full mb-4">
                      <CheckCircle2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No completed deals</h3>
                    <p className="text-gray-500">Your deal history will appear here once deals are completed or cancelled.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Content Approval Confirmation Dialog */}
      <AlertDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <AlertDialogContent className="bg-white border-2 border-gray-300 shadow-xl max-w-md mx-auto rounded-lg">
          <AlertDialogHeader className="pb-2">
            <AlertDialogTitle className="text-xl font-bold text-center text-blue-600 border-b pb-3">
              Confirm Content Approval
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-4 text-center text-gray-800 text-base">
              <div className="p-4">
                <p className="font-medium">Are you sure you want to approve this content?</p>
                <p className="mt-2 text-sm text-red-600 font-medium">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 pt-2 bg-white p-4 border-t border-gray-200">
            <AlertDialogCancel
              onClick={() => setContentToApprove(null)}
              className="bg-white border border-gray-300 font-medium text-gray-700 hover:bg-gray-100 transition-colors w-full sm:w-auto rounded-md"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (contentToApprove) {
                  handleContentAction(contentToApprove.dealId, contentToApprove.contentId, 'approve');
                  setContentToApprove(null);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-medium border-0 w-full sm:w-auto rounded-md"
            >
              Approve Content
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Dialog */}
      {selectedDealForPayment && (
        <PaymentSummaryDialog
          isOpen={paymentDialogOpen}
          onClose={() => {
            setPaymentDialogOpen(false);
            setSelectedDealForPayment(null);
            // Refresh deals after dialog is closed to get updated status
            fetchDeals();
          }}
          deal={selectedDealForPayment}
        />
      )}
    </div>
  );
};

export default BrandDealsPage;