import InfluencerFeedClient from "@/components/influencer/feed/InfluencerFeedClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QnAClient from '@/components/influencer/qna/QnAClient';
import { BarChart, Users, HelpCircle, Trophy } from 'lucide-react';
import AnalyticsTab from "@/components/influencer/analytics/AnalyticsTab";

// Page is a server component
export default function InfluencerPage() {
  return (
    <div className="container m-0 px-1 min-h-screen bg-black">
      <Tabs defaultValue="analytics" className="w-full flex flex-col h-full">
        {/* Fixed tab bar at the top */}
        <div className="sticky top-[50px] left-0 right-0 z-10 bg-black/95 backdrop-blur-sm pt-2 pb-1 border-b border-zinc-800/50">
          <TabsList className="grid w-full grid-cols-4 bg-transparent bg-zinc-900 p-1 rounded-lg shadow-inner">
            <TabsTrigger
              value="analytics"
              className="font-medium text-white transition-all duration-200
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600
                data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-fuchsia-500/20
                hover:bg-zinc-800 hover:text-white"
            >
              <BarChart className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Analytics & News</span>
            </TabsTrigger>
            <TabsTrigger
              value="feed"
              className="font-medium text-white transition-all duration-200
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600
                data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-fuchsia-500/20
                hover:bg-zinc-800 hover:text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Influencer Feed</span>
            </TabsTrigger>
            <TabsTrigger
              value="qna"
              className="font-medium text-white transition-all duration-200
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600
                data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-fuchsia-500/20
                hover:bg-zinc-800 hover:text-white"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Q&A</span>
            </TabsTrigger>
            <TabsTrigger
              value="competitions"
              className="font-medium text-white transition-all duration-200
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600
                data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-fuchsia-500/20
                hover:bg-zinc-800 hover:text-white"
            >
              <Trophy className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Competitions</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Scrollable content area with padding to account for fixed header */}
        <div className="flex-1 overflow-y-auto pt-4">
          <TabsContent value="analytics" className="h-full pt-8">
            <Card className="bg-zinc-900/90 border-zinc-800/50 shadow-md text-white">
              <CardContent className="pt-6">
                <AnalyticsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feed" className="h-full pt-4">
            <InfluencerFeedClient />
          </TabsContent>

          <TabsContent value="qna" className="h-full pt-8">
            <Card className="bg-zinc-900/90 border-zinc-800/50 shadow-md text-white">
              <CardContent className="pt-6">
                <QnAClient />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitions" className="h-full pt-8">
            <Card className="bg-zinc-900/90 border-zinc-800/50 shadow-md text-white">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">Daily Competitions</h2>
                  <p className="text-zinc-400">Stay tuned for exciting daily competitions between influencers!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}