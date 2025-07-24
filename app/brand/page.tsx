'use client';

import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import axios from 'axios';
import { useRouter } from 'next/navigation';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  X as XIcon,
  Loader2,
  Send,
  Instagram,
  MapPinCheck,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/hook/useCurrentUser';
import { useBrandProfile } from '@/hook/useBrandProfile';
import InfluencerProfile from "@/components/brand/InfluencerProfile";

// Define the influencer interface based on our API data
interface Influencer {
  id: string;
  name: string;
  city: string;
  profilePictureUrl: string;
  followers: number;
  bio: string;
  instagramUsername: string;
  gender?: 'male' | 'female' | 'other';
  // Instagram Analytics data from the model
  instagramAnalytics?: {
    totalPosts: number;
    averageEngagement: number;
    avgReelViews: number;
    avgReelLikes: number;
    lastUpdated: Date;
  };
  // Videos for showcase
  videos?: Array<{
    url: string;
    title: string;
    uploadedAt: Date;
  }>;
  lastUpdated?: Date;
  // Onboarding data
  pricingModels?: {
    fixedPricing?: {
      enabled: boolean;
      storyPrice?: number;
      reelPrice?: number;
      postPrice?: number;
      livePrice?: number;
    };
    negotiablePricing?: boolean;
    packageDeals?: {
      enabled: boolean;
      packages?: {
        name: string;
        includedServices: string;
        totalPrice: number;
      }[];
    };
    barterDeals?: {
      enabled: boolean;
      acceptedCategories?: string[];
      restrictions?: string;
    };
  };
  brandPreferences?: {
    preferredBrandTypes?: string[];
    exclusions?: string[];
    collabStyles?: string[];
  };
  availability?: string[];
  isInstagramVerified?: boolean;
}

// Pagination interface
interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const initialPagination: Pagination = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0
};

// Add a helper function to check if a URL is from Instagram
const isInstagramUrl = (url: string): boolean => {
  return Boolean(url && (url.includes('cdninstagram.com') || url.includes('fbcdn.net')));
};

const Brand: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const user = useCurrentUser();
  const { profileData: brandProfile } = useBrandProfile();

  // State variables
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);

  // New: Description for the deal (connect popup)
  const [connectDescription, setConnectDescription] = useState('');



  // Campaign creation states
  const isCampaignMode = false;
  // const [campaignName, setCampaignName] = useState('');
  // const [contentRequirements, setContentRequirements] = useState({
  //   reelCount: 0,
  //   postCount: 0,
  //   storyCount: 0,
  //   liveCount: 0
  // });
  const [selectedInfluencers, setSelectedInfluencers] = useState<Influencer[]>([]);
  // const [formErrors, setFormErrors] = useState<{
  //   campaignName?: string;
  //   contentRequirements?: string;
  //   influencers?: string;
  // }>({});

  // Connect popup states
  const [showConnectPopup, setShowConnectPopup] = useState(false);
  const [connectInfluencer, setConnectInfluencer] = useState<Influencer | null>(null);
  const [usePackageDeals, setUsePackageDeals] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{name: string, includedServices: string, totalPrice: number} | null>(null);
  const [connectContentRequirements, setConnectContentRequirements] = useState({
    reels: 0,
    posts: 0,
    stories: 0,
    lives: 0
  });
  const [visitRequired, setVisitRequired] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [isProductExchange, setIsProductExchange] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState<number>(0);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectErrors, setConnectErrors] = useState<{[key: string]: string}>({});
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // Chat-related states removed as we're using connect functionality instead


  // Update useEffect to recalculate the amount when content requirements or selected influencers change


  // Format number with commas
  const formatNumber = (num: number): string => {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
  };

  // Format large numbers with K/M suffix
  const formatCompactNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };



  // No useMemo, filter inline in render (like onboarding page)

  // Fetch influencers from API
  const fetchInfluencers = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      // Build the query parameters - filter by brand's location if available
      const params = new URLSearchParams();
      if (brandProfile?.location) {
        params.append('city', brandProfile.location);
      }
      params.append('sortBy', 'followers');
      params.append('sortOrder', 'desc');
      params.append('page', page.toString());
      params.append('limit', '12'); // Show 12 influencers per page

      // Make the API request
      const response = await axios.get(`/api/influencer/search?${params.toString()}`);

      if (response.data.success) {
        setInfluencers(response.data.influencers);
        setPagination(response.data.pagination);
      } else {
        console.error('API returned error:', response.data.error);
        setError(response.data.error || 'Failed to fetch influencers');
        setInfluencers([]);
      }
    } catch (err: any) {
      console.error('Error fetching influencers:', err);
      setError(err?.message || 'An error occurred while fetching influencers');
      setInfluencers([]);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch influencers on component mount and when brand profile changes
  useEffect(() => {
    fetchInfluencers(1);
  }, [brandProfile?.location]);

  // Handle pagination
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchInfluencers(page);
  };

  // Render page numbers
  const renderPagination = () => {
    const pages = [];
    const { page, totalPages } = pagination;

    // Always show first page
    pages.push(
      <Button
        key="first"
        variant={page === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => goToPage(1)}
        disabled={page === 1}
        className={page === 1 ? "bg-[#3B82F6] active:bg-blue-700 text-white rounded-xl" : "border-gray-300 dark:border-zinc-600 text-[#283747] dark:text-white active:bg-gray-100 dark:active:bg-zinc-700 rounded-xl"}
      >
        1
      </Button>
    );

    // Add ellipsis if needed
    if (page > 3) {
      pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
    }

    // Add pages around current page
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (i <= 1 || i >= totalPages) continue;
      pages.push(
        <Button
          key={i}
          variant={page === i ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(i)}
          className={page === i ? "bg-[#3B82F6] active:bg-blue-700 text-white rounded-xl" : "border-gray-300 dark:border-zinc-600 text-[#283747] dark:text-white active:bg-gray-100 dark:active:bg-zinc-700 rounded-xl"}
        >
          {i}
        </Button>
      );
    }

    // Add ellipsis if needed
    if (page < totalPages - 2) {
      pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>);
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pages.push(
        <Button
          key="last"
          variant={page === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(totalPages)}
          disabled={page === totalPages}
          className={page === totalPages ? "bg-[#3B82F6] active:bg-blue-700 text-white rounded-xl" : "border-gray-300 dark:border-zinc-600 text-[#283747] dark:text-white active:bg-gray-100 dark:active:bg-zinc-700 rounded-xl"}
        >
          {totalPages}
        </Button>
      );
    }

    return pages;
  };

  // Calculate total amount based on selected options
  const calculateTotalAmount = () => {
    if (!connectInfluencer) return 0;

    // If negotiation is active, use the offer amount
    if (isNegotiating) {
      return offerAmount;
    }

    // If using package deals, use the selected package price
    if (usePackageDeals && selectedPackage) {
      return selectedPackage.totalPrice;
    }

    // If product exchange, use product price
    if (isProductExchange) {
      return productPrice;
    }

    // Otherwise calculate based on content requirements and fixed pricing
    let total = 0;
    const pricing = connectInfluencer.pricingModels?.fixedPricing;

    if (pricing?.enabled) {
      if (connectContentRequirements.reels > 0 && pricing.reelPrice) {
        total += connectContentRequirements.reels * pricing.reelPrice;
      }

      if (connectContentRequirements.posts > 0 && pricing.postPrice) {
        total += connectContentRequirements.posts * pricing.postPrice;
      }

      if (connectContentRequirements.stories > 0 && pricing.storyPrice) {
        total += connectContentRequirements.stories * pricing.storyPrice;
      }

      if (connectContentRequirements.lives > 0 && pricing.livePrice) {
        total += connectContentRequirements.lives * pricing.livePrice;
      }
    }

    return total;
  };

  // Update total amount whenever relevant state changes
  useEffect(() => {
    setTotalAmount(calculateTotalAmount());
  }, [
    connectInfluencer,
    usePackageDeals,
    selectedPackage,
    connectContentRequirements,
    isNegotiating,
    offerAmount,
    isProductExchange,
    productPrice
  ]);

  // Handle individual influencer connect request
  const handleConnectRequest = async () => {
    // Validate form inputs
    const errors: {[key: string]: string} = {};

    if (usePackageDeals && !selectedPackage) {
      errors.package = "Please select a package";
    }

    if (!usePackageDeals) {
      const totalContent =
        connectContentRequirements.reels +
        connectContentRequirements.posts +
        connectContentRequirements.stories +
        connectContentRequirements.lives;

      if (totalContent === 0) {
        errors.content = "At least one content type is required";
      }
    }

    if (isNegotiating && (offerAmount <= 0 || offerAmount > 99999)) {
      errors.offer = "Please enter a valid offer amount (1-99,999)";
    }

    if (isProductExchange) {
      if (!productName.trim()) {
        errors.productName = "Product name is required";
      }
      if (productPrice <= 0 || productPrice > 99999) {
        errors.productPrice = "Please enter a valid product price (1-99,999)";
      }
    }

    // If there are validation errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setConnectErrors(errors);
      return;
    }

    try {
      setConnectLoading(true);

      // Prepare request data using the new Deal model structure
      const dealData = {
        dealType: "single", // Single influencer deal
        dealName: `Deal with ${connectInfluencer?.name || "Influencer"}`,
        description: connectDescription.trim() || `Single influencer collaboration with ${connectInfluencer?.name || "Influencer"}`,
        influencers: [{
          id: connectInfluencer?.id,
          name: connectInfluencer?.name,
          profilePictureUrl: connectInfluencer?.profilePictureUrl,
          status: "pending", // Use lowercase as expected by the schema
          offeredPrice: isNegotiating ? offerAmount : totalAmount
        }],
        usePackageDeals,
        selectedPackage: usePackageDeals ? selectedPackage : null,
        contentRequirements: {
          reels: connectContentRequirements.reels,
          posts: connectContentRequirements.posts,
          stories: connectContentRequirements.stories,
          lives: connectContentRequirements.lives
        },
        visitRequired,
        isNegotiating,
        offerAmount: isNegotiating ? offerAmount : 0,
        isProductExchange,
        productName: isProductExchange ? productName : '',
        productPrice: isProductExchange ? productPrice : 0,
        status: "pending", // Use lowercase as expected by the schema
        paymentStatus: "pending",
        totalAmount: totalAmount
      };

      // Send the deal request to the new API endpoint
      const response = await axios.post('/api/deals', dealData);

      if (response.data.success) {
        console.log("Deal request sent successfully:", response.data);

        // Reset form and close popup
        setShowConnectPopup(false);
        setConnectInfluencer(null);
        setUsePackageDeals(false);
        setSelectedPackage(null);
        setConnectContentRequirements({
          reels: 0,
          posts: 0,
          stories: 0,
          lives: 0
        });
        setVisitRequired(false);
        setIsNegotiating(false);
        setOfferAmount(0);
        setIsProductExchange(false);
        setProductName('');
        setProductPrice(0);
        setConnectErrors({});
        setConnectDescription('');

        // Redirect to deals page
        router.push('/brand/deals?tab=requested');
      } else {
        throw new Error(response.data.error || "Failed to send deal request");
      }
    } catch (error: any) {
      console.error("Error sending deal request:", error);
      setConnectErrors({
        submit: error.message || "Failed to send request. Please try again."
      });
    } finally {
      setConnectLoading(false);
    }
  };

  // Calculate amount based on the selected influencers and content requirements
  // const calculateCampaignAmount = () => {
  //   if (selectedInfluencers.length === 0) return 0;

  //   let totalAmount = 0;

  //   selectedInfluencers.forEach(influencer => {
  //     let influencerAmount = 0;
  //     const pricing = influencer.pricingModels?.fixedPricing;

  //     if (pricing?.enabled) {
  //       // Calculate based on content requirements
  //       if (contentRequirements.reelCount > 0 && pricing.reelPrice) {
  //         influencerAmount += contentRequirements.reelCount * pricing.reelPrice;
  //       }

  //       if (contentRequirements.postCount > 0 && pricing.postPrice) {
  //         influencerAmount += contentRequirements.postCount * pricing.postPrice;
  //       }

  //       if (contentRequirements.storyCount > 0 && pricing.storyPrice) {
  //         influencerAmount += contentRequirements.storyCount * pricing.storyPrice;
  //       }

  //       if (contentRequirements.liveCount > 0 && pricing.livePrice) {
  //         influencerAmount += contentRequirements.liveCount * pricing.livePrice;
  //       }
  //     } else {
  //       // Use average price if pricing not available
  //       influencerAmount = 500 * (
  //         contentRequirements.reelCount +
  //         contentRequirements.postCount +
  //         contentRequirements.storyCount +
  //         contentRequirements.liveCount
  //       );
  //     }

  //     totalAmount += influencerAmount;
  //   });

  //   return totalAmount;
  // };

  // const resetCampaignForm = () => {
  //   setCampaignName('');
  //   setContentRequirements({
  //     reelCount: 0,
  //     postCount: 0,
  //     storyCount: 0,
  //     liveCount: 0
  //   });
  //   setSelectedInfluencers([]);
  //   setFormErrors({});
  //   setIsCampaignMode(false);
  // };

  // const saveCampaignAndRedirect = async () => {
  //   // Create validation object
  //   const errors: FormErrors = {};

  //   // Validate campaign name
  //   if (!campaignName.trim()) {
  //     errors.campaignName = "Campaign name is required";
  //   }

  //   // Validate content requirements (at least one required)
  //   const totalContentCount =
  //     contentRequirements.reelCount +
  //     contentRequirements.postCount +
  //     contentRequirements.storyCount +
  //     contentRequirements.liveCount;

  //   if (totalContentCount === 0) {
  //     errors.contentRequirements = "At least one content type is required";
  //   }

  //   // Validate influencer selection (at least 2 required)
  //   if (selectedInfluencers.length < 2) {
  //     errors.influencers = "Please select at least 2 influencers";
  //   }

  //   // If there are errors, set them and stop
  //   if (Object.keys(errors).length > 0) {
  //     setFormErrors(errors);
  //     return;
  //   }

  //   try {
  //     // Use the pre-calculated amount from state
  //     const totalBudget = calculatedAmount;

  //     // Prepare deal data with the new structure
  //     const dealData = {
  //       dealType: "multiple", // Multiple influencer deal
  //       dealName: campaignName,
  //       description: `Campaign requiring ${contentRequirements.reelCount > 0 ? `${contentRequirements.reelCount} Reels, ` : ''}${contentRequirements.postCount > 0 ? `${contentRequirements.postCount} Posts, ` : ''}${contentRequirements.storyCount > 0 ? `${contentRequirements.storyCount} Stories, ` : ''}${contentRequirements.liveCount > 0 ? `${contentRequirements.liveCount} Lives` : ''}`.trim().replace(/,\s*$/, ''),
  //       budget: totalBudget,
  //       totalAmount: totalBudget,
  //       influencers: selectedInfluencers.map(inf => {
  //         // Calculate individual influencer amount for each influencer based on their pricing
  //         let influencerAmount = 0;
  //         const pricing = inf.pricingModels?.fixedPricing;

  //         if (pricing?.enabled) {
  //           if (contentRequirements.reelCount > 0 && pricing.reelPrice) {
  //             influencerAmount += contentRequirements.reelCount * pricing.reelPrice;
  //           }
  //           if (contentRequirements.postCount > 0 && pricing.postPrice) {
  //             influencerAmount += contentRequirements.postCount * pricing.postPrice;
  //           }
  //           if (contentRequirements.storyCount > 0 && pricing.storyPrice) {
  //             influencerAmount += contentRequirements.storyCount * pricing.storyPrice;
  //           }
  //           if (contentRequirements.liveCount > 0 && pricing.livePrice) {
  //             influencerAmount += contentRequirements.liveCount * pricing.livePrice;
  //           }
  //         } else {
  //           // Use average price if pricing not available
  //           influencerAmount = 500 * (
  //             contentRequirements.reelCount +
  //             contentRequirements.postCount +
  //             contentRequirements.storyCount +
  //             contentRequirements.liveCount
  //           );
  //         }

  //         return {
  //           id: inf.id,
  //           name: inf.name,
  //           profilePictureUrl: inf.profilePictureUrl,
  //           offeredPrice: influencerAmount || 0, // Default to zero if calculation results in NaN
  //           status: 'pending',
  //         };
  //       }),
  //       contentRequirements: {
  //         reels: contentRequirements.reelCount,
  //         posts: contentRequirements.postCount,
  //         stories: contentRequirements.storyCount,
  //         lives: contentRequirements.liveCount
  //       },
  //       status: "requested",
  //       paymentStatus: "unpaid"
  //     };

  //     console.log("Deal data to be saved:", dealData);

  //     // Save the deal data to the API - updated endpoint
  //     const response = await axios.post('/api/deals', dealData);

  //     if (response.data.success) {
  //       console.log("Deal saved successfully:", response.data);

  //       // Reset the form after successful submission
  //       resetCampaignForm();

  //       // Redirect to deals page with the requested tab active
  //       router.push('/brand/deals?tab=requested');
  //     } else {
  //       throw new Error(response.data.error || "Failed to save deal");
  //     }
  //   } catch (error: any) {
  //     console.error("Error saving deal:", error);
  //     alert(error.message || "Failed to save deal. Please try again.");
  //   }
  // };

  // Add a useEffect to log detailed info when influencers load
  useEffect(() => {
    if (influencers.length > 0) {
      console.log('Loaded influencers profile pictures:', influencers.map(inf => ({
        name: inf.name,
        hasUrl: !!inf.profilePictureUrl,
        urlType: typeof inf.profilePictureUrl,
        urlLength: inf.profilePictureUrl ? inf.profilePictureUrl.length : 0,
        urlStartsWith: inf.profilePictureUrl ? inf.profilePictureUrl.substring(0, 30) : 'none'
      })));
    }
  }, [influencers]);

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAF9] via-white to-gray-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800">
      {/* Floating Contact Button */}
      <div className="fixed bottom-24 right-4 z-40 md:bottom-6">
        <div className="flex flex-col gap-2">
          <motion.a
            href="tel:+917301677612"
            className="flex items-center justify-center w-14 h-14 bg-[#ff9700] active:bg-orange-700 text-white rounded-full shadow-lg transition-all duration-150"
            whileTap={{ scale: 0.95 }}
            title="Call Support"
          >
            <Phone className="w-6 h-6" />
          </motion.a>
          <motion.a
            href="https://wa.me/917301677612"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-14 h-14 bg-[#25D366] active:bg-green-700 text-white rounded-full shadow-lg transition-all duration-150"
            whileTap={{ scale: 0.95 }}
            title="WhatsApp Support"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.a>
        </div>
      </div>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800">
        {/* Upper Section - Advertise Your Business */}
        {!isCampaignMode && (
          <div className="relative overflow-hidden">
            {/* Premium gradient background with subtle pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-orange-50/40 to-blue-50/30 dark:from-zinc-900 dark:via-zinc-900/95 dark:to-zinc-800/80"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,151,0,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,151,0,0.03),transparent_50%)]"></div>

            <div className="relative container mx-auto px-4 py-16 text-center">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-8 text-[#283747] dark:text-white tracking-tight leading-tight">
                  Advertise your business!
                </h1>
                <p className="text-base md:text-lg text-gray-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                  Reach thousands of potential customers through authentic influencer partnerships
                </p>
                <Button
                  className="bg-gradient-to-r from-[#ff9700] to-[#ff7700] active:from-[#ff8600] active:to-[#ff6600] text-white font-semibold px-10 py-4 rounded-2xl shadow-lg active:shadow-md transition-all duration-150 active:scale-95"
                  size="lg"
                >
                  <span className="text-lg">Get Started</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Visual Separator */}
        {!isCampaignMode && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 dark:via-zinc-700 to-transparent h-px"></div>
            <div className="flex justify-center">
              <div className="bg-white dark:bg-zinc-900 px-6 py-2 rounded-full shadow-sm border border-gray-200 dark:border-zinc-700">
                <div className="w-2 h-2 bg-gradient-to-r from-[#ff9700] to-[#3B82F6] rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {/* Lower Section - Hire Individual Influencers */}
        <div className="container mx-auto px-4 py-12 pb-20 max-w-6xl">
          {!isCampaignMode && (
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-700 mb-8">
                <div className="w-3 h-3 bg-gradient-to-r from-[#3B82F6] to-[#ff9700] rounded-full animate-pulse"></div>
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#283747] dark:text-white tracking-tight leading-tight">
                  Hire individual influencers!
                </h2>
              </div>
              <p className="text-sm md:text-base text-gray-500 dark:text-zinc-500 max-w-xl mx-auto">
                Browse through our curated list of verified influencers and find the perfect match for your brand
              </p>
            </div>
          )}

        {/* Influencer Grid */}
        <div className="relative min-h-[500px]">
          {loading ? (
            // Loading state with skeletons
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-4 w-5/6 mb-3" />
                  <div className="flex gap-3 mt-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4 font-medium">
                {error}
              </p>
              <Button
                onClick={() => fetchInfluencers(1)}
                className="bg-red-600 active:bg-red-700 text-white rounded-xl px-6"
              >
                Try Again
              </Button>
            </div>
          ) : influencers.length === 0 ? (
            // Empty state
            <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-2xl p-12 text-center">
              <h3 className="text-xl font-semibold mb-2 text-[#283747] dark:text-white">No influencers found</h3>
              <p className="text-gray-600 dark:text-zinc-400 mb-6">
                We couldn't find any influencers at the moment. Please try again later.
              </p>
            </div>
          ) : (
            // Influencer cards
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {influencers.map((influencer) => (
                <Card
                  key={influencer.id}
                  className={cn(
                    "overflow-hidden transition-all duration-150 active:scale-[0.98] border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm",
                    isCampaignMode && selectedInfluencers.some(inf => inf.id === influencer.id) && "border-2 border-[#3B82F6] dark:border-blue-400 shadow-lg shadow-blue-200/30"
                  )}
                >
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-start gap-4">
                      {isCampaignMode && (
                        <div className="flex-shrink-0 mt-1">
                          <input
                            type="checkbox"
                            checked={selectedInfluencers.some(inf => inf.id === influencer.id)}
                            onChange={() => {
                              setSelectedInfluencers(prev => {
                                const isSelected = prev.some(inf => inf.id === influencer.id);
                                if (isSelected) {
                                  return prev.filter(inf => inf.id !== influencer.id);
                                } else {
                                  return [...prev, influencer];
                                }
                              });
                            }}
                            className="h-5 w-5 rounded border-gray-300 text-[#3B82F6] focus:ring-[#3B82F6]"
                          />
                        </div>
                      )}
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-700 flex-shrink-0 border-2 border-gray-200 dark:border-zinc-600 relative">
                        {influencer.profilePictureUrl ? (
                          <Image
                            src={influencer.profilePictureUrl}
                            alt={influencer.name}
                            className="w-full h-full object-cover"
                            width={64}
                            height={64}
                            unoptimized={isInstagramUrl(influencer.profilePictureUrl)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-zinc-700 text-xl font-bold text-[#3B82F6]">
                            {influencer.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg font-semibold truncate text-[#283747] dark:text-white">
                            {influencer.name}
                          </CardTitle>
                          {/* Show Instagram verified badge only if verified */}
                          {influencer.isInstagramVerified && (
                            <span title="Instagram Verified" className="inline-flex items-center">
                              <Instagram className="w-5 h-5 text-pink-600" />
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="ml-1">
                                <circle cx="10" cy="10" r="9" fill="#22c55e" />
                                <path d="M6.5 10.5l2.2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-zinc-400 gap-1 mb-2">
                          <MapPinCheck className="w-4 h-4 flex-shrink-0 text-[#3B82F6]" />
                          <span className="text-sm truncate">{influencer.city}</span>
                        </div>
                        {/* Followers count */}
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-[#3B82F6]" />
                          <span className="text-sm font-semibold text-[#283747] dark:text-white">
                            {formatCompactNumber(influencer.followers || 0)} Followers
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-0">
                    {/* Bio */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-zinc-400 line-clamp-2">
                        {influencer.bio || "Lifestyle influencer sharing daily inspiration and authentic moments."}
                      </p>
                    </div>

                    {/* Brand Preferences (Preferred Industries) */}
                    {influencer.brandPreferences?.preferredBrandTypes && influencer.brandPreferences.preferredBrandTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {influencer.brandPreferences.preferredBrandTypes.slice(0, 3).map((brandType, index) => (
                          <span
                            key={brandType}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              index === 0
                                ? 'bg-[#ff9700]/10 text-[#ff9700] border border-[#ff9700]/20'
                                : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300'
                            }`}
                          >
                            {brandType}
                          </span>
                        ))}
                        {influencer.brandPreferences.preferredBrandTypes.length > 3 && (
                          <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 text-xs font-medium">
                            +{influencer.brandPreferences.preferredBrandTypes.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Professional Pricing Section */}
                    {influencer.pricingModels?.fixedPricing?.enabled && (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {[
                          { label: 'Reel', price: influencer.pricingModels.fixedPricing.reelPrice, color: 'bg-[#ff9700]/10 text-[#ff9700] border-[#ff9700]/20' },
                          { label: 'Post', price: influencer.pricingModels.fixedPricing.postPrice, color: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20' },
                          { label: 'Story', price: influencer.pricingModels.fixedPricing.storyPrice, color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700' },
                          { label: 'Live', price: influencer.pricingModels.fixedPricing.livePrice, color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700' },
                        ].filter(item => item.price).map(item => (
                          <div key={item.label} className={`flex flex-col items-center border rounded-lg px-3 py-2 ${item.color} text-xs font-medium`}>
                            <span className="font-semibold">{item.label}</span>
                            <span>₹{item.price?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="p-6 pt-0 flex flex-col gap-3">
                    {isCampaignMode ? (
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInfluencer(influencer)}
                          className="flex-1 border-gray-300 dark:border-zinc-600 text-[#283747] dark:text-white active:bg-gray-100 dark:active:bg-zinc-700 rounded-xl font-medium"
                        >
                          View Profile
                        </Button>
                        <Button
                          variant={selectedInfluencers.some(inf => inf.id === influencer.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedInfluencers(prev => {
                              const isSelected = prev.some(inf => inf.id === influencer.id);
                              if (isSelected) {
                                return prev.filter(inf => inf.id !== influencer.id);
                              } else {
                                return [...prev, influencer];
                              }
                            });
                          }}
                          className={selectedInfluencers.some(inf => inf.id === influencer.id) ?
                            "flex-1 bg-[#3B82F6] active:bg-blue-700 text-white rounded-xl font-medium" :
                            "flex-1 border-gray-300 dark:border-zinc-600 text-[#283747] dark:text-white active:bg-gray-100 dark:active:bg-zinc-700 rounded-xl font-medium"}
                        >
                          {selectedInfluencers.some(inf => inf.id === influencer.id) ? "Selected" : "Select"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInfluencer(influencer)}
                          className="flex-1 border-gray-300 dark:border-zinc-600 text-[#283747] dark:text-white active:bg-gray-100 dark:active:bg-zinc-700 rounded-xl font-medium"
                        >
                          View Profile
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setConnectInfluencer(influencer);
                            setShowConnectPopup(true);
                          }}
                          className="flex-1 bg-[#3B82F6] active:bg-blue-700 text-white rounded-xl font-medium shadow-sm"
                        >
                          Connect
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && influencers.length > 0 && (
            <div className="flex justify-center mt-8 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="border-gray-300 dark:border-zinc-600 text-[#283747] dark:text-white active:bg-gray-100 dark:active:bg-zinc-700 rounded-xl"
              >
                Previous
              </Button>

              {renderPagination()}

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="border-gray-300 dark:border-zinc-600 text-[#283747] dark:text-white active:bg-gray-100 dark:active:bg-zinc-700 rounded-xl"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Individual Connect Request Popup */}
      <AnimatePresence mode="wait">
        {showConnectPopup && connectInfluencer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowConnectPopup(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8
              }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/30 dark:bg-zinc-900/30 z-10 px-6 py-4 border-b dark:border-zinc-700 flex justify-between items-center backdrop-blur-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    {connectInfluencer.profilePictureUrl ? (
                      <Image
                        src={connectInfluencer.profilePictureUrl}
                        alt={connectInfluencer.name}
                        className="w-full h-full object-cover"
                        width={40}
                        height={40}
                        unoptimized={isInstagramUrl(connectInfluencer.profilePictureUrl)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        {connectInfluencer.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Connect with {connectInfluencer.name}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowConnectPopup(false)}
                  className="h-8 w-8 rounded-full active:bg-gray-200 dark:active:bg-zinc-600"
                >
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>

              {/* Main content */}
              <div className="p-6 space-y-5">
                {/* Description Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Tell me more about your promotion <span className="text-gray-400 dark:text-zinc-500">(optional)</span></label>
                  <textarea
                    className="w-full min-h-[48px] max-h-40 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 dark:text-white resize-y text-base transition-all"
                    rows={2}
                    placeholder="What and how do you want me to promote, in brief..."
                    value={connectDescription}
                    onChange={e => setConnectDescription(e.target.value)}
                  />
                </div>
                {/* Package Deals Toggle */}
                {connectInfluencer.pricingModels?.packageDeals?.enabled &&
                  connectInfluencer.pricingModels.packageDeals.packages &&
                  connectInfluencer.pricingModels.packageDeals.packages.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Use Package Deals</label>
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                        data-state={usePackageDeals ? "checked" : "unchecked"}
                        onClick={() => setUsePackageDeals(!usePackageDeals)}
                      >
                        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${usePackageDeals ? "translate-x-5" : "translate-x-0"}`} />
                      </div>
                    </div>

                    {usePackageDeals && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500 dark:text-zinc-400">Select a package from below:</p>
                        <div className="space-y-2">
                          {connectInfluencer.pricingModels.packageDeals.packages.map((pkg, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedPackage === pkg
                                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600"
                                  : "bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-600 active:bg-blue-50/50 dark:active:bg-blue-900/20"
                              }`}
                              onClick={() => setSelectedPackage(pkg)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{pkg.name}</div>
                                  <div className="text-sm text-gray-600 dark:text-zinc-400">{pkg.includedServices}</div>
                                </div>
                                <div className="font-bold text-blue-600 dark:text-blue-400">₹{pkg.totalPrice}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {connectErrors.package && (
                          <p className="text-sm text-red-500 dark:text-red-400">{connectErrors.package}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Content Requirements */}
                {(!usePackageDeals || !connectInfluencer.pricingModels?.packageDeals?.enabled) && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Content Requirements</label>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1 text-center">Reels</label>
                        <input
                          type="number"
                          min="0"
                          max="9"
                          value={connectContentRequirements.reels}
                          onChange={(e) => {
                            const value = Math.min(9, Math.max(0, parseInt(e.target.value) || 0));
                            setConnectContentRequirements({...connectContentRequirements, reels: value});
                          }}
                          onFocus={(e) => {
                            if (e.target.value === "0") {
                              e.target.value = "";
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center bg-white dark:bg-zinc-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1 text-center">Posts</label>
                        <input
                          type="number"
                          min="0"
                          max="9"
                          value={connectContentRequirements.posts}
                          onChange={(e) => {
                            const value = Math.min(9, Math.max(0, parseInt(e.target.value) || 0));
                            setConnectContentRequirements({...connectContentRequirements, posts: value});
                          }}
                          onFocus={(e) => {
                            if (e.target.value === "0") {
                              e.target.value = "";
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center bg-white dark:bg-zinc-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1 text-center">Stories</label>
                        <input
                          type="number"
                          min="0"
                          max="9"
                          value={connectContentRequirements.stories}
                          onChange={(e) => {
                            const value = Math.min(9, Math.max(0, parseInt(e.target.value) || 0));
                            setConnectContentRequirements({...connectContentRequirements, stories: value});
                          }}
                          onFocus={(e) => {
                            if (e.target.value === "0") {
                              e.target.value = "";
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center bg-white dark:bg-zinc-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1 text-center">Lives</label>
                        <input
                          type="number"
                          min="0"
                          max="9"
                          value={connectContentRequirements.lives}
                          onChange={(e) => {
                            const value = Math.min(9, Math.max(0, parseInt(e.target.value) || 0));
                            setConnectContentRequirements({...connectContentRequirements, lives: value});
                          }}
                          onFocus={(e) => {
                            if (e.target.value === "0") {
                              e.target.value = "";
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center bg-white dark:bg-zinc-800 dark:text-white"
                        />
                      </div>
                    </div>
                    {connectErrors.content && (
                      <p className="text-sm text-red-500 dark:text-red-400">{connectErrors.content}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">
                      Maximum 9 for each content type
                    </p>
                  </div>
                )}

                {/* Visit Required */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Visit Required?</label>
                  <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                    data-state={visitRequired ? "checked" : "unchecked"}
                    onClick={() => setVisitRequired(!visitRequired)}
                  >
                    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${visitRequired ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </div>

                {/* Negotiation */}
                {connectInfluencer.pricingModels?.negotiablePricing && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Negotiate Price</label>
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                        data-state={isNegotiating ? "checked" : "unchecked"}
                        onClick={() => setIsNegotiating(!isNegotiating)}
                      >
                        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${isNegotiating ? "translate-x-5" : "translate-x-0"}`} />
                      </div>
                    </div>

                    {isNegotiating && (
                      <div className="space-y-2">
                        <label className="block text-xs text-gray-500 dark:text-zinc-400">Your Offer (₹)</label>
                        <input
                          type="number"
                          min="1"
                          max="99999"
                          value={offerAmount}
                          onChange={(e) => {
                            const value = Math.min(99999, Math.max(0, parseInt(e.target.value) || 0));
                            setOfferAmount(value);
                          }}
                          onFocus={(e) => {
                            if (e.target.value === "0") {
                              e.target.value = "";
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 dark:text-white"
                          placeholder="Enter your offer amount"
                        />
                        {connectErrors.offer && (
                          <p className="text-sm text-red-500 dark:text-red-400">{connectErrors.offer}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                          Enter the amount you'd like to offer
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Product Exchange */}
                {connectInfluencer.pricingModels?.barterDeals?.enabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Product Exchange</label>
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                        data-state={isProductExchange ? "checked" : "unchecked"}
                        onClick={() => setIsProductExchange(!isProductExchange)}
                      >
                        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${isProductExchange ? "translate-x-5" : "translate-x-0"}`} />
                      </div>
                    </div>

                    {isProductExchange && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Product Name</label>
                          <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 dark:text-white"
                            placeholder="Enter product name"
                            maxLength={50}
                          />
                          {connectErrors.productName && (
                            <p className="text-sm text-red-500 dark:text-red-400">{connectErrors.productName}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Product Value (₹)</label>
                          <input
                            type="number"
                            min="1"
                            max="99999"
                            value={productPrice}
                            onChange={(e) => {
                              const value = Math.min(99999, Math.max(0, parseInt(e.target.value) || 0));
                              setProductPrice(value);
                            }}
                            onFocus={(e) => {
                              if (e.target.value === "0") {
                                e.target.value = "";
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 dark:text-white"
                            placeholder="Enter product value"
                          />
                          {connectErrors.productPrice && (
                            <p className="text-sm text-red-500 dark:text-red-400">{connectErrors.productPrice}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {connectErrors.submit && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-600 dark:text-red-400">
                    {connectErrors.submit}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t dark:border-zinc-700">
                {/* Total Amount Display */}
                {totalAmount > 0 && (
                  <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-blue-800 dark:text-blue-300">Estimated Total</h4>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-300">₹{formatNumber(totalAmount)}</div>
                    </div>

                    {/* Show breakdown based on what's selected */}
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {usePackageDeals && selectedPackage ? (
                        <p>Package: {selectedPackage.name}</p>
                      ) : isNegotiating ? (
                        <p>Your offer amount</p>
                      ) : isProductExchange ? (
                        <p>Product exchange value</p>
                      ) : (
                        <div>
                          {connectContentRequirements.reels > 0 && connectInfluencer?.pricingModels?.fixedPricing?.reelPrice && (
                            <div className="flex justify-between">
                              <span>{connectContentRequirements.reels} Reel{connectContentRequirements.reels > 1 ? 's' : ''}</span>
                              <span>₹{connectInfluencer.pricingModels.fixedPricing.reelPrice * connectContentRequirements.reels}</span>
                            </div>
                          )}
                          {connectContentRequirements.posts > 0 && connectInfluencer?.pricingModels?.fixedPricing?.postPrice && (
                            <div className="flex justify-between">
                              <span>{connectContentRequirements.posts} Post{connectContentRequirements.posts > 1 ? 's' : ''}</span>
                              <span>₹{connectInfluencer.pricingModels.fixedPricing.postPrice * connectContentRequirements.posts}</span>
                            </div>
                          )}
                          {connectContentRequirements.stories > 0 && connectInfluencer?.pricingModels?.fixedPricing?.storyPrice && (
                            <div className="flex justify-between">
                              <span>{connectContentRequirements.stories} Stor{connectContentRequirements.stories > 1 ? 'ies' : 'y'}</span>
                              <span>₹{connectInfluencer.pricingModels.fixedPricing.storyPrice * connectContentRequirements.stories}</span>
                            </div>
                          )}
                          {connectContentRequirements.lives > 0 && connectInfluencer?.pricingModels?.fixedPricing?.livePrice && (
                            <div className="flex justify-between">
                              <span>{connectContentRequirements.lives} Live{connectContentRequirements.lives > 1 ? 's' : ''}</span>
                              <span>₹{connectInfluencer.pricingModels.fixedPricing.livePrice * connectContentRequirements.lives}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 active:from-blue-600 active:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:active:from-blue-700 dark:active:to-blue-800 text-white h-12 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
                  onClick={handleConnectRequest}
                  disabled={connectLoading}
                >
                  {connectLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Request</span>
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Influencer Profile Modal - Full Screen */}
      <AnimatePresence mode="wait">
        {selectedInfluencer && (
          <InfluencerProfile
            influencer={selectedInfluencer}
            isCampaignMode={isCampaignMode}
            selectedInfluencers={selectedInfluencers}
            setSelectedInfluencers={setSelectedInfluencers}
            setShowConnectPopup={setShowConnectPopup}
            setConnectInfluencer={setConnectInfluencer}
            setSelectedInfluencer={setSelectedInfluencer}
            user={user}
            toast={toast}
          />
        )}
      </AnimatePresence>

      {/* Chat Confirmation Popup removed - using Connect functionality instead */}
        </div>
      </div>
    </>
  );
};

export default Brand;