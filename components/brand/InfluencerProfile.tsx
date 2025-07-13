'use client';
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Send, XIcon, Play, Instagram } from "lucide-react";


// Utility functions
// Utility functions copied from app/brand/page.tsx
const isInstagramUrl = (url: string): boolean => {
  return Boolean(url && (url.includes('cdninstagram.com') || url.includes('fbcdn.net')));
};

const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

interface InfluencerProfileProps {
  influencer: any;
  isCampaignMode: boolean;
  selectedInfluencers: any[];
  setSelectedInfluencers: (fn: (prev: any[]) => any[]) => void;
  setShowConnectPopup: (show: boolean) => void;
  setConnectInfluencer: (inf: any) => void;
  setSelectedInfluencer: (inf: any | null) => void;
  user: any;
  toast: (args: any) => void;
}

const InfluencerProfile: React.FC<InfluencerProfileProps> = ({
  influencer: selectedInfluencer,
  isCampaignMode,
  selectedInfluencers,
  setSelectedInfluencers,
  setShowConnectPopup,
  setConnectInfluencer,
  setSelectedInfluencer,
  user,
  toast,
}) => {
  // State for video modal
  const [selectedVideo, setSelectedVideo] = React.useState<string | null>(null);

  // Debug: Log video data
  React.useEffect(() => {
    if (selectedInfluencer.videos) {
      console.log('Influencer videos:', selectedInfluencer.videos);
    }
  }, [selectedInfluencer.videos]);

  // Prevent background scroll when modal is open
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Mobile-first, modern, professional layout
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[120] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm"
      style={{ pointerEvents: 'auto' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
        className="w-full h-full bg-white dark:bg-zinc-900 rounded-none md:rounded-2xl shadow-2xl overflow-y-auto flex flex-col border border-zinc-200 dark:border-zinc-700"
        style={{ zIndex: 130 }}
      >
        {/* Header - mobile style, sticky, with avatar */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-700 flex items-center px-4 py-3 md:py-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-200 shadow-md flex-shrink-0">
              {selectedInfluencer.profilePictureUrl ? (
                <Image
                  src={selectedInfluencer.profilePictureUrl}
                  alt={selectedInfluencer.name}
                  className="w-full h-full object-cover"
                  width={56}
                  height={56}
                  unoptimized={isInstagramUrl(selectedInfluencer.profilePictureUrl)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-zinc-700 text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {selectedInfluencer.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white truncate">{selectedInfluencer.name}</span>
                {selectedInfluencer.instagramUsername && (
                  <a
                    href={`https://instagram.com/${selectedInfluencer.instagramUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1"
                  >
                    <Instagram className="w-5 h-5 text-pink-500" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-400 mt-1">
                <MapPin className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span className="truncate font-medium">{selectedInfluencer.city}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedInfluencer(null)}
            className="ml-2 h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400"
          >
            <XIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Main content - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 bg-gray-50 dark:bg-zinc-800/30">
          {/* Metrics row - Only Followers */}
          <div className="flex justify-start items-center mb-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm">
              <Users className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-zinc-300 font-medium">Followers:</span>
                <span className="font-bold text-blue-700 dark:text-blue-300 text-lg">{formatCompactNumber(selectedInfluencer.followers || 0)}</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {selectedInfluencer.bio && (
            <div className="mb-4">
              <h4 className="text-base font-semibold mb-1 text-gray-800">Bio</h4>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {selectedInfluencer.bio}
              </p>
            </div>
          )}

          {/* Connect button - full width */}
          {!isCampaignMode && (
            <div className="mb-4">
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-base py-3 shadow-lg font-semibold"
                onClick={() => {
                  if (!user?._id) {
                    toast({
                      title: "Error",
                      description: "You need to be logged in to create a deal",
                      variant: "destructive",
                    });
                    return;
                  }
                  setConnectInfluencer(selectedInfluencer);
                  setShowConnectPopup(true);
                  setSelectedInfluencer(null);
                }}
              >
                <Send className="h-5 w-5" />
                <span>Connect</span>
              </Button>
            </div>
          )}

          {/* Pricing Section */}
          {selectedInfluencer.pricingModels && (
            <div className="mb-6 mt-2">
              <div className="font-bold mb-3 text-blue-800 text-lg flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
                Pricing Information
              </div>
              {/* Fixed Pricing */}
              {selectedInfluencer.pricingModels.fixedPricing?.enabled && (
                <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                  <div className="font-semibold mb-2 text-blue-700">Content Rates</div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedInfluencer.pricingModels.fixedPricing.reelPrice && (
                      <div className="flex justify-between items-center p-2 bg-white rounded-md text-sm">
                        <span>Reel</span>
                        <span className="font-bold text-blue-700">₹{selectedInfluencer.pricingModels.fixedPricing.reelPrice.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedInfluencer.pricingModels.fixedPricing.postPrice && (
                      <div className="flex justify-between items-center p-2 bg-white rounded-md text-sm">
                        <span>Post</span>
                        <span className="font-bold text-blue-700">₹{selectedInfluencer.pricingModels.fixedPricing.postPrice.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedInfluencer.pricingModels.fixedPricing.storyPrice && (
                      <div className="flex justify-between items-center p-2 bg-white rounded-md text-sm">
                        <span>Story</span>
                        <span className="font-bold text-blue-700">₹{selectedInfluencer.pricingModels.fixedPricing.storyPrice.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedInfluencer.pricingModels.fixedPricing.livePrice && (
                      <div className="flex justify-between items-center p-2 bg-white rounded-md text-sm">
                        <span>Live</span>
                        <span className="font-bold text-blue-700">₹{selectedInfluencer.pricingModels.fixedPricing.livePrice.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Package Deals */}
              {selectedInfluencer.pricingModels.packageDeals?.enabled &&
                selectedInfluencer.pricingModels.packageDeals.packages &&
                selectedInfluencer.pricingModels.packageDeals.packages.length > 0 && (
                <div className="mb-4 bg-purple-50 p-3 rounded-lg">
                  <div className="font-semibold mb-2 text-purple-700">Package Deals</div>
                  <div className="space-y-2">
                    {selectedInfluencer.pricingModels.packageDeals.packages.map((pkg: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-white rounded-md text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{pkg.name}</div>
                          <div className="text-xs text-gray-600">{pkg.includedServices}</div>
                        </div>
                        <div className="font-bold text-purple-700">₹{pkg.totalPrice}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other pricing options */}
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedInfluencer.pricingModels.negotiablePricing && (
                  <div className="px-4 py-2 rounded-full bg-blue-100 text-sm text-blue-800 font-medium">
                    Negotiable Pricing Available
                  </div>
                )}
                {selectedInfluencer.pricingModels.barterDeals?.enabled && (
                  <div className="px-4 py-2 rounded-full bg-green-100 text-sm text-green-800 font-medium">
                    Barter/Exchange Deals Accepted
                  </div>
                )}
              </div>

              {/* Barter Deals Details */}
              {selectedInfluencer.pricingModels.barterDeals?.enabled &&
                selectedInfluencer.pricingModels.barterDeals.acceptedCategories &&
                selectedInfluencer.pricingModels.barterDeals.acceptedCategories.length > 0 && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg">
                  <div className="font-medium mb-1 text-green-800">Accepted Product Categories:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedInfluencer.pricingModels.barterDeals.acceptedCategories.map((cat: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">{cat}</span>
                    ))}
                  </div>
                  {selectedInfluencer.pricingModels.barterDeals.restrictions && (
                    <div className="text-xs text-gray-600 mt-2">{selectedInfluencer.pricingModels.barterDeals.restrictions}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Video Showcase Section */}
          {selectedInfluencer.videos && selectedInfluencer.videos.length > 0 && (
            <div className="mb-6">
              <div className="font-bold mb-4 text-purple-800 dark:text-purple-300 text-lg flex items-center gap-2">
                <span className="w-1.5 h-5 bg-purple-500 rounded-full"></span>
                Showcase Videos ({selectedInfluencer.videos.length})
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                {selectedInfluencer.videos.map((video: any, index: number) => (
                  <div
                    key={`video-${index}-${video.url}`}
                    className="group relative bg-black rounded-xl overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-gray-200 dark:border-gray-700"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Video clicked:', video.url, video.title);
                      setSelectedVideo(video.url);
                    }}
                  >
                    {/* 9:16 aspect ratio for reel format */}
                    <div className="relative aspect-[9/16]">
                      <video
                        src={video.url}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                        poster=""
                        onError={(e) => {
                          console.error('Video load error:', e);
                          console.error('Video URL:', video.url);
                        }}
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-all duration-300">
                        <div className="w-14 h-14 bg-white/95 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                          <Play className="w-7 h-7 text-gray-800 ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                      {/* Video title */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                        <p className="text-white text-xs font-semibold truncate leading-tight">{video.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedInfluencer.videos.length === 1 && (
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
                  More showcase videos coming soon
                </p>
              )}
            </div>
          )}

          {/* Brand Preferences */}
          {selectedInfluencer.brandPreferences && (
            <div className="mb-6">
              <div className="font-bold mb-3 text-purple-800 text-lg flex items-center gap-2">
                <span className="w-1.5 h-5 bg-purple-500 rounded-full"></span>
                Brand Preferences
              </div>
              {selectedInfluencer.brandPreferences.preferredBrandTypes &&
                selectedInfluencer.brandPreferences.preferredBrandTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedInfluencer.brandPreferences.preferredBrandTypes.map((type: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">{type}</span>
                  ))}
                </div>
              )}
              {selectedInfluencer.brandPreferences.exclusions &&
                selectedInfluencer.brandPreferences.exclusions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="font-medium text-xs text-gray-500">Exclusions:</span>
                  {selectedInfluencer.brandPreferences.exclusions.map((type: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{type}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Availability */}
          {selectedInfluencer.availability && selectedInfluencer.availability.length > 0 && (
            <div className="mb-6">
              <div className="font-bold mb-3 text-green-800 text-lg flex items-center gap-2">
                <span className="w-1.5 h-5 bg-green-500 rounded-full"></span>
                Availability
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedInfluencer.availability.map((slot: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">{slot}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Close button - sticky for mobile */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-700 shadow-md py-3 px-4 flex justify-center gap-2 z-10">
          {isCampaignMode && (
            <Button
              variant={selectedInfluencers.some((inf) => inf.id === selectedInfluencer.id) ? "default" : "outline"}
              className={`flex-1 mr-2 ${
                selectedInfluencers.some((inf) => inf.id === selectedInfluencer.id)
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              }`}
              onClick={() => {
                setSelectedInfluencers((prev) => {
                  const isSelected = prev.some((inf) => inf.id === selectedInfluencer.id);
                  if (isSelected) {
                    return prev.filter((inf) => inf.id !== selectedInfluencer.id);
                  } else {
                    return [...prev, selectedInfluencer];
                  }
                });
              }}
            >
              {selectedInfluencers.some((inf) => inf.id === selectedInfluencer.id)
                ? "Selected for Campaign"
                : "Add to Campaign"}
            </Button>
          )}
          <Button
            variant="default"
            className="flex-1 px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            onClick={() => setSelectedInfluencer(null)}
          >
            Close
          </Button>
        </div>
      </motion.div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedVideo(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <XIcon className="h-5 w-5" />
            </Button>

            {/* Video container with 9:16 aspect ratio */}
            <div className="relative aspect-[9/16] w-full bg-black rounded-xl overflow-hidden shadow-2xl">
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full h-full object-contain"
                playsInline // Important for mobile playback
                controlsList="nodownload"
                onError={(e) => {
                  console.error('Video playback error:', e);
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InfluencerProfile;