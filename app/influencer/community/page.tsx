import InfluencerFeedClient from "@/components/influencer/feed/InfluencerFeedClient";

export default function CommunityPage() {
  return (
    <div className="container mx-auto px-1 min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black">
      <div className="pt-[108px] md:pt-8">
        <InfluencerFeedClient />
      </div>
    </div>
  );
}
