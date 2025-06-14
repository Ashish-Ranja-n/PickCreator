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
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  ArrowRightLeft,
  RefreshCw,
  Loader2Icon,
  MessageCircle,
  Check,
  CircleDashed,
  Film,
  Image as ImageIcon,
  MapPin,
  MapPinned,
  Send,
  Video,
  XIcon
} from 'lucide-react';
import { useCurrentUser } from '@/hook/useCurrentUser';
import { Collapsible } from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/use-toast";
import Image from 'next/image';

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
  brandId: string;
  companyName?: string;
  location?: string;
  visitRequired?: boolean;
  contentRequirements: {
    reels: number;
    posts: number;
    stories: number;
    lives: number;
  };
  influencers: Array<{
    id: string;
    name: string;
    avatar: string;
    status: 'pending' | 'accepted' | 'rejected';
    offeredPrice: number;
    counterOffer?: number;
  }>;
  isNegotiating: boolean;
  submittedContent?: ContentSubmission[];
  contentPublished: boolean;
  paymentReleased: boolean;
}

interface DealProgress {
  paid: boolean;
  contentPublished: boolean;
  paymentReleased: boolean;
}

interface ContentSubmissionFormData {
  contentType: 'reel' | 'post' | 'story' | 'live';
  contentUrl: string;
}

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
  const user = useCurrentUser();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('requested');
  const [contentFormData, setContentFormData] = useState<ContentSubmissionFormData>({
    contentType: 'reel',
    contentUrl: ''
  });
  const [submittingContent, setSubmittingContent] = useState(false);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/deals');
      if (response.data.success) {
        // The API now filters deals for the influencer's ID
        console.log(`Received ${response.data.deals.length} deals from API`);
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

  const handleDealAction = async (dealId: string, action: 'reject' | 'accept' | 'counter-offer', counterOffer?: number) => {
    try {
      // Map frontend actions to API endpoints
      const actionEndpoint = action === 'reject' ? 'reject' :
                            action === 'accept' ? 'accept' :
                            action === 'counter-offer' ? 'counter-offer' : action;

      const response = await axios.post(`/api/deals/${dealId}/${actionEndpoint}`,
        action === 'counter-offer' ? { counterOffer } : {}
      );
      if (response.data.success) {
        fetchDeals(); // Refresh the deals list
      } else {
        setError(response.data.error || `Failed to ${action} deal`);
      }
    } catch (err: any) {
      setError(err.message || `An error occurred while ${action}ing the deal`);
    }
  };

  const handleContentSubmission = async (dealId: string) => {
    try {
      setSubmittingContent(true);

      // Validate URL format
      if (!contentFormData.contentUrl.trim()) {
        setError('Please enter a valid content URL');
        return;
      }

      // Submit content
      const response = await axios.post(`/api/deals/${dealId}/submit`, {
        contentType: contentFormData.contentType,
        contentUrl: contentFormData.contentUrl
      });

      if (response.data.success) {
        // Reset form
        setContentFormData({
          contentType: 'reel',
          contentUrl: ''
        });

        // Refresh deals
        await fetchDeals();
      } else {
        setError(response.data.error || 'Failed to submit content');
      }
    } catch (error: any) {
      console.error('Error submitting content:', error);
      setError(error.response?.data?.error || error.message || 'An error occurred');
    } finally {
      setSubmittingContent(false);
    }
  };

  const getStatusColor = (status: Deal['status']) => {
    switch (status) {
      case 'requested':
        return 'bg-blue-100/80 text-blue-700 border border-blue-300/50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50';
      case 'counter-offered':
        return 'bg-indigo-100/80 text-indigo-700 border border-indigo-300/50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/50';
      case 'accepted':
        return 'bg-yellow-100/80 text-yellow-700 border border-yellow-300/50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50';
      case 'ongoing':
        return 'bg-green-100/80 text-green-700 border border-green-300/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50';
      case 'content_approved':
        return 'bg-teal-100/80 text-teal-700 border border-teal-300/50 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700/50';
      case 'completed':
        return 'bg-violet-100/80 text-violet-700 border border-violet-300/50 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700/50';
      case 'cancelled':
        return 'bg-red-100/80 text-red-700 border border-red-300/50 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    }
  };

  const getPaymentStatusColor = (status: Deal['paymentStatus']) => {
    switch (status) {
      case 'unpaid':
        return 'bg-yellow-100/80 text-yellow-700 border border-yellow-300/50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50';
      case 'paid':
        return 'bg-green-100/80 text-green-700 border border-green-300/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="flex items-center space-x-2">
          <Loader2Icon className="h-8 w-8 animate-spin text-fuchsia-500" />
          <span className="text-lg font-medium text-gray-900 dark:text-white">Loading deals...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black">
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchDeals} className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-white border border-gray-200 dark:border-zinc-700">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 min-h-screen overflow-y-auto bg-white dark:bg-black text-gray-900 dark:text-white">
      {/* Wrap the TabHandler in a Suspense boundary */}
      <Suspense fallback={null}>
        <TabHandler setActiveTab={setActiveTab} />
      </Suspense>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">My Deals</h1>
        <Button
          onClick={fetchDeals}
          className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-white border border-gray-200 dark:border-zinc-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        router.push(`/influencer/deals?tab=${value}`);
      }}>
        <TabsList className="grid w-full grid-cols-4 mb-8 bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-1 gap-1 relative">
          <TabsTrigger
            value="requested"
            className="relative flex items-center justify-center px-3 py-1.5 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600 data-[state=active]:text-white transition-all"
          >
            <span className="whitespace-nowrap">Requested</span>
            {deals.filter(deal => deal.status === 'requested' || deal.status === 'counter-offered').length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-blue-500 text-white">
                {deals.filter(deal => deal.status === 'requested' || deal.status === 'counter-offered').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="relative flex items-center justify-center px-3 py-1.5 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600 data-[state=active]:text-white transition-all"
          >
            <span className="whitespace-nowrap">Pending</span>
            {deals.filter(deal => deal.status === 'accepted').length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-yellow-500 text-white">
                {deals.filter(deal => deal.status === 'accepted').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="ongoing"
            className="relative flex items-center justify-center px-3 py-1.5 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600 data-[state=active]:text-white transition-all"
          >
            <span className="whitespace-nowrap">Ongoing</span>
            {deals.filter(deal => deal.status === 'ongoing' || deal.status === 'content_approved').length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-green-500 text-white">
                {deals.filter(deal => deal.status === 'ongoing' || deal.status === 'content_approved').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="relative flex items-center justify-center px-3 py-1.5 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600 data-[state=active]:text-white transition-all"
          >
            <span className="whitespace-nowrap">History</span>
            {deals.filter(deal => ['completed', 'cancelled'].includes(deal.status)).length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-gray-500 text-white">
                {deals.filter(deal => ['completed', 'cancelled'].includes(deal.status)).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requested">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
                <Card key={deal._id} className="overflow-hidden hover:shadow-lg transition-all duration-200 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                  <CardHeader className="border-b border-gray-200 dark:border-zinc-800 pb-4">
                    <div className="flex items-start justify-between w-full gap-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex-shrink-0">
                          {deal.brandProfilePic ? (
                            <Image
                              src={deal.brandProfilePic}
                              alt={deal.brandName}
                              className="w-full h-full object-cover"
                              width={48}
                              height={48}
                            />
                          ) : (
                            <Building2 className="w-full h-full p-2.5 text-gray-400 dark:text-zinc-500" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          {deal.companyName && (
                            <h4 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                              {deal.companyName}
                            </h4>
                          )}
                          <p className="text-sm text-gray-600 dark:text-zinc-300 truncate">{deal.brandName}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {deal.location && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 text-xs">
                                <MapPin className="h-3 w-3" />
                                {deal.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(deal.status)} shrink-0`}>
                        {getStatusIcon(deal.status)}
                        {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        {deal.visitRequired && (
                          <div className="col-span-2 mb-4">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                              <MapPinned className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                              <div>
                                <h4 className="font-medium text-amber-800 dark:text-amber-300">Visit Required</h4>
                                <p className="text-sm text-amber-600 dark:text-amber-400">In-person presence needed for this deal</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500 dark:text-zinc-400">Total Amount</p>
                          <p className="font-semibold flex items-center text-gray-900 dark:text-white text-lg">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            {formatAmount(deal.totalAmount)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500 dark:text-zinc-400">Created</p>
                          <p className="text-gray-900 dark:text-white">
                            {formatDate(deal.createdAt)}
                          </p>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <p className="text-sm text-gray-500 dark:text-zinc-400">Payment Status</p>
                          <Badge className={getPaymentStatusColor(deal.paymentStatus)}>
                            {deal.paymentStatus?.charAt(0).toUpperCase() + deal.paymentStatus?.slice(1) || 'Unknown'}
                          </Badge>
                        </div>
                      </div>

                      {/* Content Requirements */}
                      {(deal.contentRequirements.reels > 0 || deal.contentRequirements.posts > 0 || 
                        deal.contentRequirements.stories > 0 || deal.contentRequirements.lives > 0) && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500 dark:text-zinc-400">Content Requirements</p>
                          <div className="flex flex-wrap gap-2">
                            {deal.contentRequirements.reels > 0 && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300 text-xs font-medium">
                                <Film className="h-3.5 w-3.5 text-fuchsia-500 dark:text-fuchsia-400" />
                                {deal.contentRequirements.reels} Reel{deal.contentRequirements.reels > 1 ? 's' : ''}
                              </div>
                            )}
                            {deal.contentRequirements.posts > 0 && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-medium">
                                <ImageIcon className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                                {deal.contentRequirements.posts} Post{deal.contentRequirements.posts > 1 ? 's' : ''}
                              </div>
                            )}
                            {deal.contentRequirements.stories > 0 && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                <CircleDashed className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                                {deal.contentRequirements.stories} Stor{deal.contentRequirements.stories > 1 ? 'ies' : 'y'}
                              </div>
                            )}
                            {deal.contentRequirements.lives > 0 && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium">
                                <Video className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                                {deal.contentRequirements.lives} Live{deal.contentRequirements.lives > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {deal.status === 'counter-offered' && (
                        <div className="p-4 rounded-lg bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 border border-violet-100 dark:border-violet-800/30">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">Your Counter Offer</span>
                            <span className="font-semibold flex items-center text-gray-900 dark:text-white">
                              <IndianRupee className="h-4 w-4 mr-1" />
                              {formatAmount(deal.influencers[0].counterOffer)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t border-gray-200 dark:border-zinc-800 pt-4">
                    {deal.status === 'requested' && (
                      <>
                        {deal.isNegotiating ? (
                          <div className="flex w-full flex-col gap-4">
                            <div className="flex w-full gap-4">
                              <div className="flex-1">
                                <input
                                  type="number"
                                  placeholder="Enter counter offer amount"
                                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white"
                                  onChange={(e) => {
                                    const currentDeal = deals.find((d: Deal) => d._id === deal._id);
                                    if (currentDeal) {
                                      currentDeal.influencers[0].counterOffer = parseInt(e.target.value);
                                    }
                                  }}
                                />
                              </div>
                              <Button
                                onClick={() => {
                                  const currentDeal = deals.find((d: Deal) => d._id === deal._id);
                                  if (currentDeal?.influencers[0].counterOffer) {
                                    handleDealAction(deal._id, 'counter-offer', currentDeal.influencers[0].counterOffer);
                                  }
                                }}
                                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-600 dark:hover:from-violet-700 dark:hover:to-fuchsia-700 text-white"
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Send Counter Offer
                              </Button>
                            </div>
                            <div className="flex w-full gap-4">
                              <Button
                                variant="outline"
                                className="flex-1 border-red-500 dark:border-red-600 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleDealAction(deal._id, 'reject')}
                              >
                                <XIcon className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                className="flex-1 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white"
                                onClick={() => handleDealAction(deal._id, 'accept')}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Accept Original Offer
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex w-full gap-4">
                            <Button
                              variant="outline"
                              className="flex-1 border-red-500 dark:border-red-600 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleDealAction(deal._id, 'reject')}
                            >
                              <XIcon className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              className="flex-1 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white"
                              onClick={() => handleDealAction(deal._id, 'accept')}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Accept
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                    {deal.status === 'counter-offered' && (
                      <div className="w-full p-4 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-center text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
                        <Clock className="w-4 h-4 mx-auto mb-2 animate-pulse text-gray-400 dark:text-zinc-500" />
                        Waiting for brand's response to your counter offer
                      </div>
                    )}
                    {deal.status === 'accepted' && (
                      <div className="w-full p-4 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-center text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
                        <Clock className="w-4 h-4 mx-auto mb-2 animate-pulse text-gray-400 dark:text-zinc-500" />
                        Waiting for brand payment
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex justify-center items-center py-16">
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-8 py-10 max-w-md shadow-lg">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-blue-100/80 dark:bg-blue-900/30 p-3 rounded-full mb-4 border border-blue-300/50 dark:border-blue-700/50">
                      <Building2 className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No requested deals</h3>
                    <p className="text-gray-500 dark:text-zinc-400">Brand deal requests will appear here for your review.</p>
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
                <Card key={deal._id} className="overflow-hidden hover:shadow-lg transition-all duration-200 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                  <CardHeader className="border-b border-gray-200 dark:border-zinc-800 pb-4">
                    <div className="flex items-start justify-between w-full gap-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex-shrink-0">
                          {deal.brandProfilePic ? (
                            <Image
                              src={deal.brandProfilePic}
                              alt={deal.brandName}
                              className="w-full h-full object-cover"
                              width={48}
                              height={48}
                            />
                          ) : (
                            <Building2 className="w-full h-full p-2.5 text-gray-400 dark:text-zinc-500" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          {deal.companyName && (
                            <h4 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                              {deal.companyName}
                            </h4>
                          )}
                          <p className="text-sm text-gray-600 dark:text-zinc-300 truncate">{deal.brandName}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {deal.location && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 text-xs">
                                <MapPin className="h-3 w-3" />
                                {deal.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(deal.status)} shrink-0`}>
                        {getStatusIcon(deal.status)}
                        {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        {deal.visitRequired && (
                          <div className="col-span-2 mb-4">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                              <MapPinned className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                              <div>
                                <h4 className="font-medium text-amber-800 dark:text-amber-300">Visit Required</h4>
                                <p className="text-sm text-amber-600 dark:text-amber-400">In-person presence needed for this deal</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500 dark:text-zinc-400">Total Amount</p>
                          <p className="font-semibold flex items-center text-gray-900 dark:text-white text-lg">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            {formatAmount(deal.totalAmount)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500 dark:text-zinc-400">Created</p>
                          <p className="text-gray-900 dark:text-white">
                            {formatDate(deal.createdAt)}
                          </p>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <p className="text-sm text-gray-500 dark:text-zinc-400">Payment Status</p>
                          <Badge className={getPaymentStatusColor(deal.paymentStatus)}>
                            {deal.paymentStatus?.charAt(0).toUpperCase() + deal.paymentStatus?.slice(1) || 'Unknown'}
                          </Badge>
                        </div>
                      </div>

                      {/* Content Requirements */}
                      {(deal.contentRequirements.reels > 0 || deal.contentRequirements.posts > 0 || 
                        deal.contentRequirements.stories > 0 || deal.contentRequirements.lives > 0) && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500 dark:text-zinc-400">Content Requirements</p>
                          <div className="flex flex-wrap gap-2">
                            {deal.contentRequirements.reels > 0 && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300 text-xs font-medium">
                                <Film className="h-3.5 w-3.5 text-fuchsia-500 dark:text-fuchsia-400" />
                                {deal.contentRequirements.reels} Reel{deal.contentRequirements.reels > 1 ? 's' : ''}
                              </div>
                            )}
                            {deal.contentRequirements.posts > 0 && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-medium">
                                <ImageIcon className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                                {deal.contentRequirements.posts} Post{deal.contentRequirements.posts > 1 ? 's' : ''}
                              </div>
                            )}
                            {deal.contentRequirements.stories > 0 && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                <CircleDashed className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                                {deal.contentRequirements.stories} Stor{deal.contentRequirements.stories > 1 ? 'ies' : 'y'}
                              </div>
                            )}
                            {deal.contentRequirements.lives > 0 && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium">
                                <Video className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                                {deal.contentRequirements.lives} Live{deal.contentRequirements.lives > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t border-gray-200 dark:border-zinc-800 pt-4">
                    {deal.status === 'accepted' && (
                      <div className="w-full p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-md text-center text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
                        <Clock className="w-4 h-4 mx-auto mb-2 animate-pulse text-gray-400 dark:text-zinc-500" />
                        Waiting for brand payment
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex justify-center items-center py-16">
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-8 py-10 max-w-md shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-yellow-100/80 dark:bg-yellow-900/30 p-3 rounded-full mb-4 border border-yellow-300/50 dark:border-yellow-700/50">
                      <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pending deals</h3>
                    <p className="text-gray-500 dark:text-zinc-400">Deals you've accepted that are awaiting brand confirmation will appear here.</p>
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Brand Profile Picture */}
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                              {deal.brandProfilePic ? (
                                <Image
                                  src={deal.brandProfilePic}
                                  alt={deal.brandName}
                                  className="w-full h-full object-cover"
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <Building2 className="w-full h-full p-2 text-gray-400" />
                              )}
                            </div>
                        {/* Company Name, Brand Name, Location */}
                        <div>
                          {deal.companyName && (
                            <div className="font-bold text-base mb-0.5">{deal.companyName}</div>
                          )}
                          <CardTitle className="text-sm text-gray-700 font-normal">{deal.brandName}</CardTitle>
                          {deal.location && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline-block mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 10c-4.418 0-8-3.582-8-8 0-4.418 3.582-8 8-8s8 3.582 8 8c0 4.418-3.582 8-8 8z" /></svg>
                              {deal.location}
                            </div>
                          )}
                          {deal.visitRequired && (
                            <div className="text-xs text-amber-600 mt-0.5 font-medium">Visit Required</div>
                          )}
                        </div>
                          </div>
                          <Badge className={getStatusColor(deal.status)}>
                            {getStatusIcon(deal.status)}
                            {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                          </Badge>
                        </div>
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

                          {/* Content Requirements */}
                          {(deal.contentRequirements.reels > 0 || deal.contentRequirements.posts > 0 || 
                            deal.contentRequirements.stories > 0 || deal.contentRequirements.lives > 0) && (
                            <div className="space-y-2 mb-4">
                              <p className="text-sm text-gray-500 dark:text-zinc-400">Content Requirements</p>
                              <div className="flex flex-wrap gap-2">
                                {deal.contentRequirements.reels > 0 && (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300 text-xs font-medium">
                                    <Film className="h-3.5 w-3.5 text-fuchsia-500 dark:text-fuchsia-400" />
                                    {deal.contentRequirements.reels} Reel{deal.contentRequirements.reels > 1 ? 's' : ''}
                                  </div>
                                )}
                                {deal.contentRequirements.posts > 0 && (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-medium">
                                    <ImageIcon className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                                    {deal.contentRequirements.posts} Post{deal.contentRequirements.posts > 1 ? 's' : ''}
                                  </div>
                                )}
                                {deal.contentRequirements.stories > 0 && (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                    <CircleDashed className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                                    {deal.contentRequirements.stories} Stor{deal.contentRequirements.stories > 1 ? 'ies' : 'y'}
                                  </div>
                                )}
                                {deal.contentRequirements.lives > 0 && (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium">
                                    <Video className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                                    {deal.contentRequirements.lives} Live{deal.contentRequirements.lives > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Deal Status */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Payment Status</span>
                              <Badge className={progress.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {progress.paid ? 'Paid' : 'Unpaid'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Content Status</span>
                              <Badge className={progress.contentPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {progress.contentPublished ? 'Published' : 'Pending'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Payment Release</span>
                              <Badge className={progress.paymentReleased ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {progress.paymentReleased ? 'Released' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2 flex flex-col gap-4">
                        {/* Request Payment Button */}
                        {progress.contentPublished && !progress.paymentReleased && (
                          <Button
                            className="w-full bg-yellow-600 hover:bg-yellow-700 mb-3"
                            onClick={() => {
                              // This is a dummy button for now
                              toast({
                                title: "Payment Request Sent",
                                description: "The brand has been notified about your payment request.",
                                variant: "default",
                              });
                            }}
                          >
                            Request Payment
                          </Button>
                        )}

                        {/* Content Submission Form */}
                        {!progress.contentPublished && (
                          <div className="w-full p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-2">Submit Content</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content Type</label>
                                <select
                                  className="w-full p-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-md"
                                  value={contentFormData.contentType}
                                  onChange={(e) => setContentFormData({
                                    ...contentFormData,
                                    contentType: e.target.value as 'reel' | 'post' | 'story' | 'live'
                                  })}
                                >
                                  <option value="reel">Instagram Reel</option>
                                  <option value="post">Instagram Post</option>
                                  <option value="story">Instagram Story</option>
                                  <option value="live">Instagram Live</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content URL</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-md"
                                  placeholder="Paste Instagram link here"
                                  value={contentFormData.contentUrl}
                                  onChange={(e) => setContentFormData({
                                    ...contentFormData,
                                    contentUrl: e.target.value
                                  })}
                                />
                              </div>
                              <Button
                                className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                                disabled={submittingContent || !contentFormData.contentUrl.trim()}
                                onClick={() => handleContentSubmission(deal._id)}
                              >
                                {submittingContent ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  'Submit Content'
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Submitted Content List */}
                        {deal.submittedContent && deal.submittedContent.length > 0 && (
                          <div className="w-full p-4 bg-gray-50 rounded-lg mb-4">
                            <h4 className="font-medium mb-2">Submitted Content</h4>
                            <div className="space-y-3">
                              {deal.submittedContent.map((content, index) => (
                                <div key={index} className="p-3 bg-white rounded border">
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

                        <Button
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50"
                          onClick={async () => {
                            try {
                              // Get the brand ID from the deal
                              const brandId = deal.brandId;
                              if (!brandId || !user?._id) {
                                console.error("Missing brandId or current user ID");
                                return;
                              }

                              // Create or get existing conversation
                              const response = await axios.post("/api/conversation", {
                                currentUserId: user._id,
                                otherUserId: brandId
                              });

                              if (response.data && response.data.conversationId) {
                                // Navigate to the chat with this conversation
                                router.push(`/influencer/chat/${response.data.conversationId}`);
                              } else {
                                console.error("Failed to create conversation");
                              }
                            } catch (error) {
                              console.error("Error starting chat:", error);
                            }
                          }}
                        >
                          <MessageCircle className="h-5 w-5 text-blue-600" />
                          <span className="text-blue-600 font-medium">Message Brand</span>
                        </Button>
                      </CardFooter>
                    </Card>
                  </Collapsible>
                );
              })
            ) : (
              <div className="col-span-full flex justify-center items-center py-16">
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-8 py-10 max-w-md shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-green-100/80 dark:bg-green-900/30 p-3 rounded-full mb-4 border border-green-300/50 dark:border-green-700/50">
                      <Loader2 className="h-6 w-6 text-green-600 dark:text-green-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No ongoing deals</h3>
                    <p className="text-gray-500 dark:text-zinc-400">Deals that are currently in progress will appear here.</p>
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
                <Card key={deal._id} className="hover:shadow-lg transition-shadow bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                  <CardHeader className="border-b border-gray-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Brand Profile Picture */}
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                          {deal.brandProfilePic ? (
                            <Image
                              src={deal.brandProfilePic}
                              alt={deal.brandName}
                              className="w-full h-full object-cover"
                              width={40}
                              height={40}
                            />
                          ) : (
                            <Building2 className="w-full h-full p-2 text-gray-400 dark:text-zinc-500" />
                          )}
                        </div>
                        {/* Company Name, Brand Name, Location */}
                        <div>
                          {deal.companyName && (
                            <div className="font-bold text-base text-gray-900 dark:text-white mb-0.5">{deal.companyName}</div>
                          )}
                          <CardTitle className="text-sm text-gray-700 dark:text-zinc-300 font-normal">{deal.brandName}</CardTitle>
                          {deal.location && (
                            <div className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline-block mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 10c-4.418 0-8-3.582-8-8 0-4.418 3.582-8 8-8s8 3.582 8 8c0 4.418-3.582 8-8 8z" /></svg>
                              {deal.location}
                            </div>
                          )}
                          {deal.visitRequired && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-medium">Visit Required</div>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(deal.status)}>
                        {getStatusIcon(deal.status)}
                        {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">Total Amount</span>
                        <span className="font-semibold flex items-center text-gray-900 dark:text-white">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {formatAmount(deal.totalAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">Created</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatDate(deal.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">Payment Status</span>
                        <Badge className={getPaymentStatusColor(deal.paymentStatus)}>
                          {deal.paymentStatus?.charAt(0).toUpperCase() + deal.paymentStatus?.slice(1) || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-gray-200 dark:border-zinc-800 pt-4">
                    <Button
                      variant="outline"
                      className="w-full bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700"
                      onClick={() => router.push(`/influencer/deals/${deal._id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex justify-center items-center py-16">
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-8 py-10 max-w-md shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-purple-100/80 dark:bg-purple-900/30 p-3 rounded-full mb-4 border border-purple-300/50 dark:border-purple-700/50">
                      <CheckCircle2 className="h-6 w-6 text-purple-600 dark:text-purple-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No completed deals</h3>
                    <p className="text-gray-500 dark:text-zinc-400">Your deal history will appear here once deals are completed or cancelled.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InfluencerDealsPage;