"use client";

import InfluencerFeedClient from "@/components/influencer/feed/InfluencerFeedClient";
import { useCurrentUser } from "@/hook/useCurrentUser";
import { useInfluencerProfile } from "@/hook/useInfluencerProfile";
import { ShieldCheck, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function CommunityPage() {
  const currentUser = useCurrentUser();
  const { data: profileData, isLoading: isLoadingProfile } = useInfluencerProfile();
  const router = useRouter();

  // Show loading state while user data is being fetched
  if (!currentUser || isLoadingProfile) {
    return (
      <div className="container mx-auto px-1 min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black">
        <div className="pt-[108px] md:pt-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
        </div>
      </div>
    );
  }

  // Check if user is Instagram verified - use profileData which has fresh data from database
  const isInstagramVerified = profileData?.isInstagramVerified || false;

  // If not verified, show the blurred/restricted access page
  if (!isInstagramVerified) {
    return (
      <div className="container mx-auto px-1 min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black">
        <div className="pt-[108px] md:pt-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md mx-4 bg-white/90 dark:bg-gray-800/90 border-[#C4B5FD]/30 dark:border-gray-700/50 shadow-lg">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#3B82F6] flex items-center justify-center">
                      <Lock className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Verification Required
                </h2>

                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  You will be able to join this community after you're verified.
                  Get your Instagram account verified to access exclusive community features and connect with other influencers.
                </p>

                <div className="flex items-center justify-center space-x-2 mb-6 text-sm text-gray-500 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>Join thousands of verified influencers</span>
                </div>

                <Button
                  onClick={() => router.push('/influencer/profile')}
                  className="w-full bg-gradient-to-r from-[#C4B5FD] to-[#3B82F6] hover:from-[#A78BFA] hover:to-[#2563EB] text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Get Verified Now
                </Button>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Verification is quick and helps maintain community quality
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If verified, show the normal community page
  return (
    <div className="container mx-auto px-1 min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black">
      <div className="pt-[108px] md:pt-8">
        <InfluencerFeedClient />
      </div>
    </div>
  );
}
