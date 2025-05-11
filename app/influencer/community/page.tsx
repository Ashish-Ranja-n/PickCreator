import InfluencerFeedClient from "@/components/influencer/feed/InfluencerFeedClient";

export default function CommunityPage() {
  return (
    <div className="container mx-auto px-1 min-h-screen bg-white dark:bg-black">
      <div className="pt-[108px] md:pt-8">
        <InfluencerFeedClient />
      </div>
    </div>
  );
}
