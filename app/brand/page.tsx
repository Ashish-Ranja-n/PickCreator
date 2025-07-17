'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { NextPage } from 'next';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Users,
  MapPin,
  Heart,
  Zap,
  X as XIcon,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Loader2,
  CheckIcon,
  Plus,
  Send,
  ExternalLink,
  Instagram,
  ChevronsUpDown,
  MapPinCheck,
  Phone,
  MessageCircle,
  Headphones,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { INDIAN_CITIES } from '../influencer/onboarding/data/indianCities';
import { format } from 'date-fns';
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
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [openCityPopover, setOpenCityPopover] = useState(false);
  const [sortBy, setSortBy] = useState<'followers' | 'instagramAnalytics.avgReelViews'>('followers');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  // State for city search input (like onboarding page)
  const [citySearchInput, setCitySearchInput] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // New: Description for the deal (connect popup)
  const [connectDescription, setConnectDescription] = useState('');

  // Contact button state
  const [showContactOptions, setShowContactOptions] = useState(false);

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

  // Load available cities on first render
  useEffect(() => {
    // Set available cities from the imported INDIAN_CITIES array (always new reference)
    setAvailableCities([...(INDIAN_CITIES || [])]);
  }, []);

  // Preselect city based on brand's location
  useEffect(() => {
    if (brandProfile?.location && !selectedCity && availableCities.length > 0) {
      // Check if the brand's location exists in the available cities list
      const userLocation = brandProfile.location.trim();

      // First try exact match (case-insensitive)
      let matchingCity = availableCities.find(city =>
        city.toLowerCase() === userLocation.toLowerCase()
      );

      // If no exact match, try partial match (in case user location contains extra info)
      if (!matchingCity) {
        matchingCity = availableCities.find(city =>
          userLocation.toLowerCase().includes(city.toLowerCase()) ||
          city.toLowerCase().includes(userLocation.toLowerCase())
        );
      }

      if (matchingCity) {
        console.log(`Preselecting city: ${matchingCity} based on brand location: ${userLocation}`);
        setSelectedCity(matchingCity);
      } else {
        console.log(`Brand location "${userLocation}" not found in available cities list`);
      }
    }
  }, [brandProfile?.location, selectedCity, availableCities]);

  // No useMemo, filter inline in render (like onboarding page)

  // Fetch influencers from API
  const fetchInfluencers = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      // Build the query parameters
      const params = new URLSearchParams();
      if (selectedCity) params.append('city', selectedCity);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
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

  // Effect to fetch influencers when filters change
  useEffect(() => {
    fetchInfluencers(1); // Reset to page 1 when filters change
  }, [selectedCity, sortBy, sortOrder]);

  // Toggle sort order and update sort
  const toggleSort = (field: 'followers' | 'instagramAnalytics.avgReelViews') => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Get sort icon based on current sort
  const getSortIcon = (field: 'followers' | 'instagramAnalytics.avgReelViews') => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

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
        className={page === 1 ? "" : "dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800"}
      >
        1
      </Button>
    );

    // Add ellipsis if needed
    if (page > 3) {
      pages.push(<span key="ellipsis1" className="px-2">...</span>);
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
          className={page === i ? "" : "dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800"}
        >
          {i}
        </Button>
      );
    }

    // Add ellipsis if needed
    if (page < totalPages - 2) {
      pages.push(<span key="ellipsis2" className="px-2">...</span>);
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
          className={page === totalPages ? "" : "dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800"}
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
    <div className="container mx-auto px-4 py-6 pb-16 max-w-7xl flex flex-col min-h-screen overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-violet-950/50 scrollbar-hide">
      {/* Header */}


      {/* Filters Section - Visible in both modes */}
        {!isCampaignMode && <div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-gray-900 dark:text-white kanit">
          Search Influencers
        </h1>
        <p className="text-lg text-muted-foreground dark:text-zinc-300">
          Find influencers and make a deal.
        </p>
        </div> }
      <div className="flex flex-wrap gap-4 mb-8 items-center p-4 bg-gradient-to-br from-amber-50/95 via-yellow-50/90 to-orange-50/95 dark:from-amber-900/20 dark:via-yellow-900/15 dark:to-orange-900/20 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200/60 dark:border-amber-700/30">
        {/* City Filter */}
        <div className="flex-1 min-w-[200px]">
          <Popover open={openCityPopover} onOpenChange={setOpenCityPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                type="button"
                aria-expanded={openCityPopover}
                className="w-full justify-between h-10"
              >
                <span className="text-gray-900 dark:text-white">{selectedCity || "Select a city"}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 shadow-lg dark:bg-zinc-900 dark:border-zinc-700" align="start">
              <div className="sticky top-0 bg-white dark:bg-zinc-900 p-2 rounded-t-md">
                <div className="relative">
                  <input
                    className="flex h-10 w-full rounded-xl border-2 border-input bg-background dark:bg-zinc-800 dark:border-zinc-600 dark:text-white pl-4 pr-10 text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Type to search cities..."
                    onChange={(e) => {
                      const list = document.querySelector('.cities-list');
                      const items = list?.querySelectorAll('.city-item');
                      const search = e.target.value.toLowerCase();
                      items?.forEach((item) => {
                        const text = item.textContent?.toLowerCase() || '';
                        item.classList.toggle('hidden', !text.includes(search));
                      });
                    }}
                  />
                </div>
              </div>
              <div className="cities-list max-h-[400px] overflow-auto">
                {availableCities.length === 0 ? (
                  <div className="text-base text-center py-8 text-muted-foreground dark:text-zinc-400">
                    No cities found
                  </div>
                ) : (
                  <>
                    <div
                      className="city-item relative flex cursor-pointer select-none items-center px-4 py-3 text-base hover:bg-accent/5 dark:hover:bg-zinc-700 border-b border-input/10 dark:border-zinc-700 text-gray-900 dark:text-white"
                      onClick={() => {
                        setSelectedCity(null);
                        setOpenCityPopover(false);
                      }}
                    >
                      All Cities
                    </div>
                    {availableCities.map(city => (
                      <div
                        key={city}
                        className={cn(
                          "city-item relative flex cursor-pointer select-none items-center px-4 py-3 text-base text-gray-900 dark:text-white",
                          "hover:bg-accent/5 dark:hover:bg-zinc-700",
                          "border-b border-input/10 dark:border-zinc-700",
                          selectedCity === city && "bg-accent/5 dark:bg-zinc-700 font-medium"
                        )}
                        onClick={() => {
                          setSelectedCity(city);
                          setOpenCityPopover(false);
                        }}
                      >
                        {city}
                        {selectedCity === city && (
                          <CheckIcon className="ml-auto h-5 w-5 text-primary" />
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Sort Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={sortBy === 'followers' ? "default" : "outline"}
            size="sm"
            onClick={() => toggleSort('followers')}
            className={`flex items-center gap-1 ${sortBy === 'followers' ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800' : 'border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-white'}`}
          >
            <Users className="h-4 w-4 mr-1" />
            Followers
            {getSortIcon('followers')}
          </Button>

          <Button
            variant={sortBy === 'instagramAnalytics.avgReelViews' ? "default" : "outline"}
            size="sm"
            onClick={() => toggleSort('instagramAnalytics.avgReelViews')}
            className={`flex items-center gap-1 ${sortBy === 'instagramAnalytics.avgReelViews' ? 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800' : 'border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 dark:text-white'}`}
          >
            <Zap className="h-4 w-4 mr-1" />
            Avg. Reel Views
            {getSortIcon('instagramAnalytics.avgReelViews')}
          </Button>

          {selectedCity && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCity(null)}
              className="flex items-center gap-1 dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800"
            >
              <MapPin className="h-4 w-4 mr-1" />
              {selectedCity}
              <XIcon className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Influencer Grid - Always visible */}
      <div className="relative min-h-[500px]">
        {loading ? (
          // Loading state with skeletons
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-6">
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-500 dark:text-red-400 mb-2">
              {error}
            </p>
            <Button onClick={() => fetchInfluencers(1)} className="dark:bg-red-600 dark:hover:bg-red-700">
              Try Again
            </Button>
          </div>
        ) : influencers.length === 0 ? (
          // Empty state
          <div className="border-dashed border-2 border-gray-300 dark:border-zinc-600 rounded-lg p-10 text-center">
            <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">No influencers found</h3>
            <p className="text-muted-foreground dark:text-zinc-400 mb-4">
              Try adjusting your filters or select a different city
            </p>
            {selectedCity && (
              <Button onClick={() => setSelectedCity(null)} className="dark:bg-blue-600 dark:hover:bg-blue-700">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          // Influencer cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {influencers.map((influencer) => (
              <Card
                key={influencer.id}
                className={cn(
                  "overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-200/30 dark:hover:shadow-blue-900/30 border-2 border-blue-200/70 dark:border-zinc-600 bg-gradient-to-br from-blue-100/80 via-white to-indigo-50/70 dark:from-zinc-800/95 dark:via-zinc-700/90 dark:to-zinc-800/95 hover:from-blue-200/90 hover:via-blue-50/80 hover:to-indigo-100/80 dark:hover:from-zinc-700/95 dark:hover:via-zinc-600/90 dark:hover:to-zinc-700/95 hover:scale-[1.02] hover:-translate-y-1",
                  isCampaignMode && selectedInfluencers.some(inf => inf.id === influencer.id) && "border-2 border-blue-500 dark:border-blue-400 from-blue-200/90 via-blue-100/80 to-indigo-200/70 shadow-lg shadow-blue-300/40"
                )}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-3">
                    {isCampaignMode && (
                      <div className="flex-shrink-0 mr-1">
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
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-200 flex-shrink-0 border-2 border-blue-200 shadow-lg relative">
                      {influencer.profilePictureUrl ? (
                        <Image
                          src={influencer.profilePictureUrl}
                          alt={influencer.name}
                          className="w-full h-full object-cover"
                          width={80}
                          height={80}
                          unoptimized={isInstagramUrl(influencer.profilePictureUrl)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-2xl font-bold text-blue-600">
                          {influencer.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-xl font-semibold truncate text-gray-900 dark:text-white">
                          {influencer.name}
                        </CardTitle>
                        {/* Show Instagram verified badge only if verified */}
                        {influencer.isInstagramVerified && (
                          <span title="Instagram Verified" className="inline-flex items-center ml-1">
                            <Instagram className="w-6 h-6 text-pink-600" />
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="ml-1">
                              <circle cx="10" cy="10" r="9" fill="#22c55e" />
                              <path d="M6.5 10.5l2.2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        )}
                      </div>
                      {/* Gender below name */}
                      {influencer.gender && (
                        <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1 capitalize">
                          {influencer.gender === 'male' && 'Male'}
                          {influencer.gender === 'female' && 'Female'}
                          {influencer.gender === 'other' && 'Other'}
                        </div>
                      )}
                      <div className="flex items-center text-muted-foreground dark:text-zinc-400 gap-1">
                        <MapPinCheck className="w-4 h-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                        <span className="text-sm truncate font-medium">{influencer.city} <span className="ml-1">🇮🇳</span></span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2">
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-100 dark:border-blue-800 px-3 py-1">
                      <Users className="w-4 h-4 text-blue-500 dark:text-blue-400 mr-1" />
                      <span className="font-semibold text-blue-700 dark:text-blue-300 text-base">{formatCompactNumber(influencer.followers || 0)}</span>
                      <span className="text-xs text-muted-foreground dark:text-zinc-400 ml-1">Followers</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-line">
                      {influencer.bio || "No bio available"}
                    </p>
                  </div>

                  {/* Brand Preferences (Preferred Industries) */}
                  {influencer.brandPreferences?.preferredBrandTypes && influencer.brandPreferences.preferredBrandTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {influencer.brandPreferences.preferredBrandTypes.slice(0, 3).map((brandType) => (
                        <span key={brandType} className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                          {brandType}
                        </span>
                      ))}
                      {influencer.brandPreferences.preferredBrandTypes.length > 3 && (
                        <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 text-xs font-medium">
                          +{influencer.brandPreferences.preferredBrandTypes.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Professional Pricing Section */}
                  {influencer.pricingModels?.fixedPricing?.enabled && (
                    <div className="flex flex-wrap gap-3 mb-4">
                      {[
                        { label: 'Reel', price: influencer.pricingModels.fixedPricing.reelPrice },
                        { label: 'Post', price: influencer.pricingModels.fixedPricing.postPrice },
                        { label: 'Story', price: influencer.pricingModels.fixedPricing.storyPrice },
                        { label: 'Live', price: influencer.pricingModels.fixedPricing.livePrice },
                      ].filter(item => item.price).map(item => (
                        <div key={item.label} className="flex items-center border border-gray-200 dark:border-zinc-600 rounded-md px-3 py-1 bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 text-xs font-medium shadow-sm">
                          <span className="font-semibold mr-1">{item.label}:</span>
                          <span>₹{item.price?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <div className="text-xs text-muted-foreground dark:text-zinc-400">
                    {influencer.lastUpdated ?
                      `Last seen: ${format(new Date(influencer.lastUpdated), 'MMM d, yyyy')}` :
                      'Last seen: Recently'}
                  </div>
                  {isCampaignMode ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInfluencer(influencer)}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 rounded-full px-4 font-semibold"
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
                          "bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 font-semibold" :
                          "border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 rounded-full px-4 font-semibold"}
                      >
                        {selectedInfluencers.some(inf => inf.id === influencer.id) ? "Selected" : "Select"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInfluencer(influencer)}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 rounded-full px-4 font-semibold"
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
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 font-semibold shadow"
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
              className="dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800"
            >
              Previous
            </Button>

            {renderPagination()}

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800"
            >
              Next
            </Button>
          </div>
        )}
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
                  className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700"
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
                                  : "bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
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
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white h-12 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
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
    </>
  );
};

export default Brand;