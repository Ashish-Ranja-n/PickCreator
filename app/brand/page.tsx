'use client';

import React, { useState, useEffect } from 'react';
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
  Instagram,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { INDIAN_CITIES } from '../influencer/onboarding/data/indianCities';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/hook/useCurrentUser';

// Define the influencer interface based on our API data
interface Influencer {
  id: string;
  name: string;
  city: string;
  profilePictureUrl: string;
  followers: number;
  bio: string;
  instagramUsername: string;
  // Instagram Analytics data from the model
  instagramAnalytics?: {
    totalPosts: number;
    averageEngagement: number;
    avgReelViews: number;
    avgReelLikes: number;
    lastUpdated: Date;
  };
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
  const [searchQuery, setSearchQuery] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

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

  // Chat confirmation popup states
  const [showChatConfirmation, setShowChatConfirmation] = useState(false);
  const [chatInfluencer, setChatInfluencer] = useState<Influencer | null>(null);
  const [chatLoading, setChatLoading] = useState(false);


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
    // Set available cities from the imported INDIAN_CITIES array
    setAvailableCities(INDIAN_CITIES || []);
  }, []);

  // Filter cities by search query
  const filteredCities = searchQuery && availableCities.length > 0
    ? availableCities.filter(city => city.toLowerCase().includes(searchQuery.toLowerCase()))
    : availableCities;

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
        description: `Single influencer collaboration with ${connectInfluencer?.name || "Influencer"}`,
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
    <div className="container mx-auto px-4 py-6 pb-16 max-w-7xl flex flex-col min-h-screen overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50 scrollbar-hide">
      {/* Header */}


      {/* Filters Section - Visible in both modes */}
        {!isCampaignMode && <div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-gray-900 kanit">
          Find Influencers Near You.
        </h1>
        <p className="text-lg text-muted-foreground">
          Search influencers based on your location.
        </p>
        </div> }
      <div className="flex flex-wrap gap-4 mb-8 items-center p-4 bg-white/70 rounded-lg shadow-sm">
        {/* City Filter */}
        <div className="flex-1 min-w-[200px]">
          <Popover open={openCityPopover} onOpenChange={setOpenCityPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCityPopover}
                className="w-full justify-between h-10"
              >
                {selectedCity || "Select a city"}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full max-w-[300px] sm:w-[300px] p-0" align="start" sideOffset={4}>
              <div className="sticky top-0 bg-background p-2 border-b">
                {/* City search input */}
                <input
                  type="text"
                  placeholder="Search cities..."
                  className="flex h-8 w-full rounded-md border border-input bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={searchQuery}
                  onChange={(e) => {
                    const search = e.target.value.toLowerCase();
                    setSearchQuery(search);
                  }}
                />
              </div>
              <div className="cities-list max-h-[250px] sm:max-h-[350px] overflow-auto">
                {filteredCities.length === 0 && (
                  <div className="text-sm text-center py-4 text-muted-foreground">
                    No cities found
                  </div>
                )}

                <div
                  className="city-item relative flex cursor-pointer select-none items-center px-3 py-2 text-sm hover:bg-accent/5 border-b border-input/10"
                  onClick={() => {
                    setSelectedCity(null);
                    setOpenCityPopover(false);
                    setSearchQuery('');
                  }}
                >
                  All Cities
                </div>

                {filteredCities.map((city) => (
                  <div
                    key={city}
                    className={cn(
                      "city-item relative flex cursor-pointer select-none items-center px-3 py-1.5 text-sm",
                      "hover:bg-accent/5",
                      "border-b border-input/10",
                      selectedCity === city && "bg-accent/5 font-medium"
                    )}
                    onClick={() => {
                      setSelectedCity(city);
                      setOpenCityPopover(false);
                      setSearchQuery('');
                    }}
                  >
                    <MapPin className="mr-2 h-3 w-3" />
                    {city}
                    {selectedCity === city && (
                      <CheckIcon className="ml-auto h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
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
            className={`flex items-center gap-1 ${sortBy === 'followers' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-200 hover:bg-blue-50'}`}
          >
            <Users className="h-4 w-4 mr-1" />
            Followers
            {getSortIcon('followers')}
          </Button>

          <Button
            variant={sortBy === 'instagramAnalytics.avgReelViews' ? "default" : "outline"}
            size="sm"
            onClick={() => toggleSort('instagramAnalytics.avgReelViews')}
            className={`flex items-center gap-1 ${sortBy === 'instagramAnalytics.avgReelViews' ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-200 hover:bg-purple-50'}`}
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
              className="flex items-center gap-1"
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-500 mb-2">
              {error}
            </p>
            <Button onClick={() => fetchInfluencers(1)}>
              Try Again
            </Button>
          </div>
        ) : influencers.length === 0 ? (
          // Empty state
          <div className="border-dashed border-2 rounded-lg p-10 text-center">
            <h3 className="text-xl font-medium mb-2">No influencers found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or select a different city
            </p>
            {selectedCity && (
              <Button onClick={() => setSelectedCity(null)}>
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
                  "overflow-hidden transition-all hover:shadow-md border-gray-200 bg-white/90 hover:bg-white",
                  isCampaignMode && selectedInfluencers.some(inf => inf.id === influencer.id) && "border-2 border-blue-400"
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
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 flex-shrink-0 border border-blue-100">
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
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          {influencer.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-semibold mb-1 truncate">
                        {influencer.name}
                      </CardTitle>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="text-sm truncate">{influencer.city}</span>
                      </div>
                    </div>
                    {/* Hidden Connect button - keeping for future use */}
                    {!isCampaignMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 flex-shrink-0 border-blue-200 text-white bg-blue-600 hover:bg-blue-700 hover:text-white px-2 sm:px-3 hidden"
                        onClick={() => {
                          setConnectInfluencer(influencer);
                          setShowConnectPopup(true);
                          setSelectedInfluencer(null); // Close view profile popup if open
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        <span className="sm:inline">Connect</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2">
                  <div className="grid grid-cols-3 gap-2 my-3">
                    <div className="text-center p-2 bg-blue-50 rounded-md border border-blue-100">
                      <div className="text-sm text-muted-foreground flex items-center justify-center">
                        <Users className="w-3 h-3 mr-1 text-blue-500" />
                        Followers
                      </div>
                      <div className="font-semibold text-blue-700">
                        {formatCompactNumber(influencer.followers || 0)}
                      </div>
                    </div>

                    <div className="text-center p-2 bg-purple-50 rounded-md border border-purple-100">
                      <div className="text-sm text-muted-foreground flex items-center justify-center">
                        <Zap className="w-3 h-3 mr-1 text-purple-500" />
                        Avg. Views
                      </div>
                      <div className="font-semibold text-purple-700">
                        {formatCompactNumber(influencer.instagramAnalytics?.avgReelViews || 0)}
                      </div>
                    </div>

                    <div className="text-center p-2 bg-pink-50 rounded-md border border-pink-100">
                      <div className="text-sm text-muted-foreground flex items-center justify-center">
                        <Heart className="w-3 h-3 mr-1 text-pink-500" />
                        Avg. Likes
                      </div>
                      <div className="font-semibold text-pink-700">
                        {formatCompactNumber(influencer.instagramAnalytics?.avgReelLikes || 0)}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {influencer.bio || "No bio available"}
                  </p>
                </CardContent>

                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    {influencer.lastUpdated ?
                      `Updated ${format(new Date(influencer.lastUpdated), 'MMM d, yyyy')}` :
                      'Recently updated'}
                  </div>
                  {isCampaignMode ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInfluencer(influencer)}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
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
                          "bg-blue-600 hover:bg-blue-700 text-white" :
                          "border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"}
                      >
                        {selectedInfluencers.some(inf => inf.id === influencer.id) ? "Selected" : "Select"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setSelectedInfluencer(influencer)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      View Profile
                    </Button>
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
            >
              Previous
            </Button>

            {renderPagination()}

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
              className="bg-white rounded-3xl shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/30 z-10 px-6 py-4 border-b flex justify-between items-center backdrop-blur-lg">
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
                  <h2 className="text-xl font-semibold text-gray-800">Connect with {connectInfluencer.name}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowConnectPopup(false)}
                  className="h-8 w-8 rounded-full hover:bg-gray-100"
                >
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>

              {/* Main content */}
              <div className="p-6 space-y-5">
                {/* Package Deals Toggle */}
                {connectInfluencer.pricingModels?.packageDeals?.enabled &&
                  connectInfluencer.pricingModels.packageDeals.packages &&
                  connectInfluencer.pricingModels.packageDeals.packages.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Use Package Deals</label>
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                        data-state={usePackageDeals ? "checked" : "unchecked"}
                        onClick={() => setUsePackageDeals(!usePackageDeals)}
                      >
                        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${usePackageDeals ? "translate-x-5" : "translate-x-0"}`} />
                      </div>
                    </div>

                    {usePackageDeals && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500">Select a package from below:</p>
                        <div className="space-y-2">
                          {connectInfluencer.pricingModels.packageDeals.packages.map((pkg, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedPackage === pkg
                                  ? "bg-blue-50 border-blue-300"
                                  : "bg-white border-gray-200 hover:bg-blue-50/50"
                              }`}
                              onClick={() => setSelectedPackage(pkg)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-900">{pkg.name}</div>
                                  <div className="text-sm text-gray-600">{pkg.includedServices}</div>
                                </div>
                                <div className="font-bold text-blue-600">₹{pkg.totalPrice}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {connectErrors.package && (
                          <p className="text-sm text-red-500">{connectErrors.package}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Content Requirements */}
                {(!usePackageDeals || !connectInfluencer.pricingModels?.packageDeals?.enabled) && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Content Requirements</label>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 text-center">Reels</label>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 text-center">Posts</label>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 text-center">Stories</label>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 text-center">Lives</label>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center bg-white"
                        />
                      </div>
                    </div>
                    {connectErrors.content && (
                      <p className="text-sm text-red-500">{connectErrors.content}</p>
                    )}
                    <p className="text-xs text-gray-500 text-center">
                      Maximum 9 for each content type
                    </p>
                  </div>
                )}

                {/* Visit Required */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Visit Required?</label>
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
                      <label className="text-sm font-medium text-gray-700">Negotiate Price</label>
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                        data-state={isNegotiating ? "checked" : "unchecked"}
                        onClick={() => setIsNegotiating(!isNegotiating)}
                      >
                        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${isNegotiating ? "translate-x-5" : "translate-x-0"}`} />
                      </div>
                    </div>

                    {isNegotiating && (
                      <div className="space-y-2">
                        <label className="block text-xs text-gray-500">Your Offer (₹)</label>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder="Enter your offer amount"
                        />
                        {connectErrors.offer && (
                          <p className="text-sm text-red-500">{connectErrors.offer}</p>
                        )}
                        <p className="text-xs text-gray-500">
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
                      <label className="text-sm font-medium text-gray-700">Product Exchange</label>
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
                          <label className="block text-xs text-gray-500 mb-1">Product Name</label>
                          <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                            placeholder="Enter product name"
                            maxLength={50}
                          />
                          {connectErrors.productName && (
                            <p className="text-sm text-red-500">{connectErrors.productName}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Product Value (₹)</label>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                            placeholder="Enter product value"
                          />
                          {connectErrors.productPrice && (
                            <p className="text-sm text-red-500">{connectErrors.productPrice}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {connectErrors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600">
                    {connectErrors.submit}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t">
                {/* Total Amount Display */}
                {totalAmount > 0 && (
                  <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-blue-800">Estimated Total</h4>
                      <div className="text-xl font-bold text-blue-700">₹{formatNumber(totalAmount)}</div>
                    </div>

                    {/* Show breakdown based on what's selected */}
                    <div className="text-sm text-blue-600">
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
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-12 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8
              }}
              className="bg-white w-full h-full overflow-y-auto flex flex-col"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/95 z-10 px-6 py-4 border-b flex justify-between items-center backdrop-blur-lg shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-800">{selectedInfluencer.name}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedInfluencer(null)}
                  className="h-10 w-10 rounded-full hover:bg-gray-100"
                >
                  <XIcon className="h-6 w-6" />
                </Button>
              </div>

              {/* Main content container */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Profile Information Section - Left Column */}
                  <div className="lg:col-span-5 bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Profile header with image and basic info */}
                    <div className="flex items-start gap-5 p-6">
                      <div className="w-28 h-28 rounded-full overflow-hidden flex-shrink-0 border-2 border-blue-100 shadow-md">
                        {selectedInfluencer.profilePictureUrl ? (
                          <Image
                            src={selectedInfluencer.profilePictureUrl}
                            alt={selectedInfluencer.name}
                            className="w-full h-full object-cover"
                            width={112}
                            height={112}
                            unoptimized={isInstagramUrl(selectedInfluencer.profilePictureUrl)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            {selectedInfluencer.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{selectedInfluencer.name}</h3>
                        <div className="flex items-center text-gray-500 text-sm mb-3">
                          <MapPin className="w-4 h-4 mr-1 text-purple-500" />
                          <span>{selectedInfluencer.city}</span>
                        </div>

                        {/* Instagram username */}
                        {selectedInfluencer.instagramUsername && (
                          <div className="text-sm text-gray-600 mb-2">
                            @{selectedInfluencer.instagramUsername}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metrics row */}
                    <div className="grid grid-cols-3 gap-2 px-6 pb-6">
                      <div className="text-center p-2 bg-blue-50 rounded-md">
                        <div className="text-xs text-gray-600 flex items-center justify-center mb-1">
                          <Users className="w-3 h-3 mr-1 text-blue-500" />
                          Followers
                        </div>
                        <div className="font-semibold text-blue-700">
                          {formatCompactNumber(selectedInfluencer.followers || 0)}
                        </div>
                      </div>

                      <div className="text-center p-2 bg-purple-50 rounded-md">
                        <div className="text-xs text-gray-600 flex items-center justify-center mb-1">
                          <Zap className="w-3 h-3 mr-1 text-purple-500" />
                          Avg. Views
                        </div>
                        <div className="font-semibold text-purple-700">
                          {formatCompactNumber(selectedInfluencer.instagramAnalytics?.avgReelViews || 0)}
                        </div>
                      </div>

                      <div className="text-center p-2 bg-pink-50 rounded-md">
                        <div className="text-xs text-gray-600 flex items-center justify-center mb-1">
                          <Heart className="w-3 h-3 mr-1 text-pink-500" />
                          Avg. Likes
                        </div>
                        <div className="font-semibold text-pink-700">
                          {formatCompactNumber(selectedInfluencer.instagramAnalytics?.avgReelLikes || 0)}
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {selectedInfluencer.bio && (
                      <div className="px-6 pb-6">
                        <h4 className="text-base font-semibold mb-2 text-gray-800">Bio</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {selectedInfluencer.bio}
                        </p>
                      </div>
                    )}

                    {/* Connect buttons */}
                    {!isCampaignMode && (
                      <div className="px-6 pb-6 flex gap-3">
                        {/* Instagram button */}
                        <Button
                          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg flex items-center justify-center gap-2 transition-all"
                          asChild
                        >
                          <a href={`https://instagram.com/${selectedInfluencer.instagramUsername}`} target="_blank" rel="noopener noreferrer">
                            <Instagram className="h-4 w-4" />
                            <span>Instagram</span>
                          </a>
                        </Button>

                        {/* Chat button */}
                        <Button
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all"
                          onClick={() => {
                            if (!user?._id) {
                              toast({
                                title: "Error",
                                description: "You need to be logged in to start a conversation",
                                variant: "destructive"
                              });
                              return;
                            }

                            // Set the influencer for chat and show confirmation popup
                            setChatInfluencer(selectedInfluencer);
                            setShowChatConfirmation(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>Chat</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Pricing & Collaboration Details */}
                  <div className="lg:col-span-7">
                    {/* Pricing Section - Highlighted */}
                    {selectedInfluencer.pricingModels && (
                      <div className="bg-white rounded-xl shadow-sm mb-6">
                        <div className="p-5 border-b border-gray-100">
                          <h3 className="text-xl font-bold text-gray-800 flex items-center">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full mr-2"></span>
                            Pricing Information
                          </h3>
                        </div>

                        <div className="p-5">
                          {/* Fixed Pricing - Highlighted */}
                          {selectedInfluencer.pricingModels.fixedPricing?.enabled && (
                            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                              <div className="font-bold mb-3 text-blue-800">Content Rates</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedInfluencer.pricingModels.fixedPricing.reelPrice && (
                                  <div className="flex justify-between items-center p-3 bg-white rounded-md">
                                    <div className="flex items-center">
                                      <Zap className="w-4 h-4 mr-2 text-blue-500" />
                                      <span>Instagram Reel</span>
                                    </div>
                                    <span className="font-bold text-lg text-blue-700">₹{selectedInfluencer.pricingModels.fixedPricing.reelPrice}</span>
                                  </div>
                                )}
                                {selectedInfluencer.pricingModels.fixedPricing.postPrice && (
                                  <div className="flex justify-between items-center p-3 bg-white rounded-md">
                                    <div className="flex items-center">
                                      <span className="w-4 h-4 mr-2 flex items-center justify-center text-blue-500 font-bold">P</span>
                                      <span>Instagram Post</span>
                                    </div>
                                    <span className="font-bold text-lg text-blue-700">₹{selectedInfluencer.pricingModels.fixedPricing.postPrice}</span>
                                  </div>
                                )}
                                {selectedInfluencer.pricingModels.fixedPricing.storyPrice && (
                                  <div className="flex justify-between items-center p-3 bg-white rounded-md">
                                    <div className="flex items-center">
                                      <span className="w-4 h-4 mr-2 flex items-center justify-center text-blue-500 font-bold">S</span>
                                      <span>Instagram Story</span>
                                    </div>
                                    <span className="font-bold text-lg text-blue-700">₹{selectedInfluencer.pricingModels.fixedPricing.storyPrice}</span>
                                  </div>
                                )}
                                {selectedInfluencer.pricingModels.fixedPricing.livePrice && (
                                  <div className="flex justify-between items-center p-3 bg-white rounded-md">
                                    <div className="flex items-center">
                                      <span className="w-4 h-4 mr-2 flex items-center justify-center text-blue-500 font-bold">L</span>
                                      <span>Instagram Live</span>
                                    </div>
                                    <span className="font-bold text-lg text-blue-700">₹{selectedInfluencer.pricingModels.fixedPricing.livePrice}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Package Deals - If available */}
                          {selectedInfluencer.pricingModels.packageDeals?.enabled &&
                            selectedInfluencer.pricingModels.packageDeals.packages &&
                            selectedInfluencer.pricingModels.packageDeals.packages.length > 0 && (
                            <div className="mb-6">
                              <div className="font-bold mb-3 text-purple-800 flex items-center">
                                <span className="w-1 h-4 bg-purple-500 rounded-full mr-2"></span>
                                Package Deals
                              </div>
                              <div className="space-y-3">
                                {selectedInfluencer.pricingModels.packageDeals.packages.map((pkg, index) => (
                                  <div key={index} className="p-4 bg-purple-50 rounded-md">
                                    <div className="flex justify-between items-center mb-2">
                                      <div className="font-bold text-purple-900">{pkg.name}</div>
                                      <div className="font-bold text-lg text-purple-700">₹{pkg.totalPrice}</div>
                                    </div>
                                    <div className="text-sm text-gray-600">{pkg.includedServices}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Other pricing options */}
                          <div className="flex flex-wrap gap-2">
                            {selectedInfluencer.pricingModels.negotiablePricing && (
                              <div className="px-4 py-2 rounded-full bg-blue-100 text-sm text-blue-800 font-medium">
                                <span className="flex items-center">
                                  <span className="h-2 w-2 bg-blue-500 rounded-full mr-2"></span>
                                  Open to negotiation
                                </span>
                              </div>
                            )}

                            {selectedInfluencer.pricingModels.barterDeals?.enabled && (
                              <div className="px-4 py-2 rounded-full bg-green-100 text-sm text-green-800 font-medium">
                                <span className="flex items-center">
                                  <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                                  Open to Product Exchange
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Barter Deals Details - If enabled */}
                          {selectedInfluencer.pricingModels.barterDeals?.enabled &&
                           selectedInfluencer.pricingModels.barterDeals.acceptedCategories &&
                           selectedInfluencer.pricingModels.barterDeals.acceptedCategories.length > 0 && (
                            <div className="mt-4 p-4 bg-green-50 rounded-lg">
                              <div className="font-medium mb-2 text-green-800">Accepted Product Categories:</div>
                              <div className="flex flex-wrap gap-2">
                                {selectedInfluencer.pricingModels.barterDeals.acceptedCategories.map((category, index) => (
                                  <div key={index} className="px-3 py-1 rounded-full bg-white text-xs text-green-700">
                                    {category}
                                  </div>
                                ))}
                              </div>

                              {selectedInfluencer.pricingModels.barterDeals.restrictions && (
                                <div className="mt-3">
                                  <div className="font-medium text-green-800 mb-1">Restrictions:</div>
                                  <p className="text-sm text-gray-700">
                                    {selectedInfluencer.pricingModels.barterDeals.restrictions}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Brand Preferences */}
                  {selectedInfluencer.brandPreferences && (
                    <div className="bg-white rounded-xl shadow-sm mb-6">
                      <div className="p-5 border-b border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                          <span className="w-1.5 h-6 bg-purple-500 rounded-full mr-2"></span>
                          Brand Preferences
                        </h3>
                      </div>

                      <div className="p-5">
                        {/* Preferred Brand Types */}
                        {selectedInfluencer.brandPreferences.preferredBrandTypes &&
                        selectedInfluencer.brandPreferences.preferredBrandTypes.length > 0 && (
                          <div className="mb-4">
                            <div className="font-bold mb-3 text-purple-800">Preferred Industries</div>
                            <div className="flex flex-wrap gap-2">
                              {selectedInfluencer.brandPreferences.preferredBrandTypes.map((type, index) => (
                                <div key={index} className="px-3 py-1.5 rounded-full bg-purple-50 text-sm text-purple-700">
                                  {type}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Exclusions */}
                        {selectedInfluencer.brandPreferences.exclusions &&
                        selectedInfluencer.brandPreferences.exclusions.length > 0 && (
                          <div>
                            <div className="font-bold mb-3 text-red-800">Will Not Work With</div>
                            <div className="flex flex-wrap gap-2">
                              {selectedInfluencer.brandPreferences.exclusions.map((exclusion, index) => (
                                <div key={index} className="px-3 py-1.5 rounded-full bg-red-50 text-sm text-red-600">
                                  {exclusion}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  {selectedInfluencer.availability && selectedInfluencer.availability.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm">
                      <div className="p-5 border-b border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                          <span className="w-1.5 h-6 bg-green-500 rounded-full mr-2"></span>
                          Availability
                        </h3>
                      </div>

                      <div className="p-5">
                        <div className="flex flex-wrap gap-2">
                          {selectedInfluencer.availability.map((day, index) => (
                            <div key={index} className="px-3 py-1.5 rounded-full bg-green-50 text-sm text-green-700">
                              {day}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

              {/* Footer with Close button */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-lg border-t shadow-md py-4 px-6 flex justify-center">
                  {isCampaignMode && (
                    <Button
                      variant={selectedInfluencers.some(inf => inf.id === selectedInfluencer.id) ? "default" : "outline"}
                      className={`mr-3 ${
                        selectedInfluencers.some(inf => inf.id === selectedInfluencer.id)
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                      }`}
                      onClick={() => {
                        setSelectedInfluencers(prev => {
                          const isSelected = prev.some(inf => inf.id === selectedInfluencer.id);
                          if (isSelected) {
                            return prev.filter(inf => inf.id !== selectedInfluencer.id);
                          } else {
                            return [...prev, selectedInfluencer];
                          }
                        });
                      }}
                    >
                      {selectedInfluencers.some(inf => inf.id === selectedInfluencer.id)
                        ? "Selected for Campaign"
                        : "Add to Campaign"}
                    </Button>
                  )}
                  <Button
                    variant="default"
                    className="px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    onClick={() => setSelectedInfluencer(null)}
                  >
                    Close Profile
                  </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Confirmation Popup */}
      <AnimatePresence mode="wait">
        {showChatConfirmation && chatInfluencer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
              className="bg-white rounded-3xl shadow-lg max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Start Conversation</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChatConfirmation(false)}
                  className="h-8 w-8 rounded-full hover:bg-gray-100"
                >
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>

              {/* Main content */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    {chatInfluencer.profilePictureUrl ? (
                      <Image
                        src={chatInfluencer.profilePictureUrl}
                        alt={chatInfluencer.name}
                        className="w-full h-full object-cover"
                        width={48}
                        height={48}
                        unoptimized={isInstagramUrl(chatInfluencer.profilePictureUrl)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        {chatInfluencer.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{chatInfluencer.name}</h3>
                    <p className="text-sm text-gray-500">@{chatInfluencer.instagramUsername}</p>
                  </div>
                </div>

                <p className="text-gray-700">
                  Would you like to start a conversation with {chatInfluencer.name}? An initial message will be sent to express your interest in collaboration.
                </p>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-sm text-blue-700 italic">
                    "Hi {chatInfluencer.name}, I'm interested in collaborating with you. Let's discuss the details."
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowChatConfirmation(false)}
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                  disabled={chatLoading}
                  onClick={async () => {
                    if (!user?._id) {
                      toast({
                        title: "Error",
                        description: "You need to be logged in to start a conversation",
                        variant: "destructive"
                      });
                      return;
                    }

                    try {
                      setChatLoading(true);
                      // Create a conversation and send initial message
                      const response = await axios.post('/api/conversation/initiate', {
                        currentUserId: user._id,
                        otherUserId: chatInfluencer.id,
                        initialMessage: `Hi ${chatInfluencer.name}, I'm interested in collaborating with you. Let's discuss the details.`
                      });

                      if (response.data.success) {
                        // Close the confirmation popup
                        setShowChatConfirmation(false);
                        // Close the profile popup if open
                        setSelectedInfluencer(null);
                        // Show success message
                        toast({
                          title: "Success",
                          description: "Conversation started successfully!",
                          variant: "default"
                        });
                        // Redirect to the chat page
                        router.push(`/brand/chat/${response.data.conversationId}`);
                      } else {
                        throw new Error(response.data.message || "Failed to start conversation");
                      }
                    } catch (error: any) {
                      console.error("Error starting conversation:", error);
                      toast({
                        title: "Error",
                        description: error.message || "Failed to start conversation. Please try again.",
                        variant: "destructive"
                      });
                    } finally {
                      setChatLoading(false);
                    }
                  }}
                >
                  {chatLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Starting Chat...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      <span>Start Chat</span>
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Brand;