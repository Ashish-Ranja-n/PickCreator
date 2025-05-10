import InfluencerFeedClient from "@/components/influencer/feed/InfluencerFeedClient";

export default function AdminCommunityPage() {
  return (
    <div className="container mx-auto px-1 min-h-screen bg-white dark:bg-black">
      <div className="pt-16 md:pt-8">
        <InfluencerFeedClient />
      </div>
    </div>
  );
}
