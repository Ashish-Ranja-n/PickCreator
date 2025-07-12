import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import QnAClient from '@/components/influencer/qna/QnAClient';
import { BarChart, HelpCircle, Trophy } from 'lucide-react';
import AnalyticsTab from "@/components/influencer/analytics/AnalyticsTab";

// Page is a server component
export default function InfluencerPage() {
  return (
    <div className="container mx-auto px-1 min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black">
      <Tabs defaultValue="analytics" className="w-full flex flex-col h-full">
        {/* Fixed tab bar at the top */}
        <div className="sticky top-[50px] left-0 right-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm pt-2 pb-1 border-b border-[#C4B5FD]/30 dark:border-gray-700/50">
          <TabsList className="grid grid-cols-3 bg-[#C4B5FD]/20 dark:bg-gray-800 p-1 rounded-lg shadow-inner mx-auto">
            <TabsTrigger
              value="analytics"
              className="font-medium text-gray-700 dark:text-white transition-all duration-200
                data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-500/20"
            >
              <BarChart className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Analytics & News</span>
            </TabsTrigger>
            <TabsTrigger
              value="qna"
              className="font-medium text-gray-700 dark:text-white transition-all duration-200
                data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-500/20"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Q&A</span>
            </TabsTrigger>
            <TabsTrigger
              value="competitions"
              className="font-medium text-gray-700 dark:text-white transition-all duration-200
                data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-500/20"
            >
              <Trophy className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Competitions</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Scrollable content area with padding to account for fixed header */}
        <div className="flex-1 overflow-y-auto pt-4">
          <TabsContent value="analytics" className="h-full pt-2 flex justify-center">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="qna" className="h-full pt-8">
            <Card className="bg-white/90 dark:bg-gray-800/90 border-[#C4B5FD]/30 dark:border-gray-700/50 shadow-md text-gray-900 dark:text-white">
              <CardContent className="pt-6">
                <QnAClient />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitions" className="h-full pt-8">
            <Card className="bg-white/90 dark:bg-gray-800/90 border-[#C4B5FD]/30 dark:border-gray-700/50 shadow-md text-gray-900 dark:text-white">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[#C4B5FD] to-[#3B82F6] bg-clip-text text-transparent">Daily Competitions</h2>
                  <p className="text-gray-600 dark:text-gray-300">Stay tuned for exciting daily competitions between influencers!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}