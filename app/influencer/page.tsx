import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QnAClient from '@/components/influencer/qna/QnAClient';
import { BarChart, HelpCircle, Trophy } from 'lucide-react';
import AnalyticsTab from "@/components/influencer/analytics/AnalyticsTab";

// Page is a server component
export default function InfluencerPage() {
  return (
    <div className="container mx-auto px-1 min-h-screen bg-white dark:bg-black">
      <Tabs defaultValue="analytics" className="w-full flex flex-col h-full">
        {/* Fixed tab bar at the top */}
        <div className="sticky top-[50px] left-0 right-0 z-10 bg-white/95 dark:bg-black/95 backdrop-blur-sm pt-2 pb-1 border-b border-gray-200/50 dark:border-zinc-800/50">
          <TabsList className="grid grid-cols-3 bg-transparent bg-gray-100 dark:bg-zinc-900 p-1 rounded-lg shadow-inner mx-auto">
            <TabsTrigger
              value="analytics"
              className="font-medium text-gray-700 dark:text-white transition-all duration-200
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600
                data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-fuchsia-500/20
                hover:bg-gray-200 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
            >
              <BarChart className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Analytics & News</span>
            </TabsTrigger>
            <TabsTrigger
              value="qna"
              className="font-medium text-gray-700 dark:text-white transition-all duration-200
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600
                data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-fuchsia-500/20
                hover:bg-gray-200 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Q&A</span>
            </TabsTrigger>
            <TabsTrigger
              value="competitions"
              className="font-medium text-gray-700 dark:text-white transition-all duration-200
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600
                data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-fuchsia-500/20
                hover:bg-gray-200 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
            >
              <Trophy className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Competitions</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Scrollable content area with padding to account for fixed header */}
        <div className="flex-1 overflow-y-auto pt-4">
          <TabsContent value="analytics" className="h-full pt-8">
            <Card className="bg-white/90 dark:bg-zinc-900/90 border-gray-200/50 dark:border-zinc-800/50 shadow-md text-gray-900 dark:text-white">
              <CardContent className="pt-6">
                <AnalyticsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qna" className="h-full pt-8">
            <Card className="bg-white/90 dark:bg-zinc-900/90 border-gray-200/50 dark:border-zinc-800/50 shadow-md text-gray-900 dark:text-white">
              <CardContent className="pt-6">
                <QnAClient />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitions" className="h-full pt-8">
            <Card className="bg-white/90 dark:bg-zinc-900/90 border-gray-200/50 dark:border-zinc-800/50 shadow-md text-gray-900 dark:text-white">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">Daily Competitions</h2>
                  <p className="text-gray-500 dark:text-zinc-400">Stay tuned for exciting daily competitions between influencers!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}