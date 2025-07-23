import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { History, RefreshCw } from 'lucide-react';
import { DealCard } from './DealCard';
import { Deal } from './types';
import EmptyState from './EmptyState';

interface NativeDealsListProps {
  deals: Deal[];
  userType: 'brand' | 'influencer';
  loading: boolean;
  onDealAction?: (dealId: string, action: string, data?: any) => void;
  onContentAction?: (dealId: string, contentId: string, action: 'approve' | 'reject', comment?: string) => void;
  onContentSubmission?: (dealId: string, data: any) => void;
  onChatAction?: (dealId: string, otherUserId: string) => void;
  onRefresh?: () => void;
}

export const NativeDealsList: React.FC<NativeDealsListProps> = ({
  deals,
  userType,
  loading,
  onDealAction,
  onContentAction,
  onContentSubmission,
  onChatAction,
  onRefresh
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Filter deals based on current view
  const activeDeals = deals.filter(deal => 
    !['completed', 'cancelled'].includes(deal.status)
  );
  
  const historyDeals = deals.filter(deal => 
    ['completed', 'cancelled'].includes(deal.status)
  );

  const currentDeals = showHistory ? historyDeals : activeDeals;

  const toggleCardExpansion = (dealId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(dealId)) {
      newExpanded.delete(dealId);
    } else {
      newExpanded.add(dealId);
    }
    setExpandedCards(newExpanded);
  };

  const getEmptyStateMessage = () => {
    if (showHistory) {
      return {
        title: "No Deal History",
        description: userType === 'brand' 
          ? "You haven't completed any deals yet. Start collaborating with influencers to build your history."
          : "You haven't completed any deals yet. Accept collaboration requests to start building your portfolio."
      };
    } else {
      return {
        title: "No Active Deals",
        description: userType === 'brand'
          ? "You don't have any active deals. Start by connecting with influencers to create new collaborations."
          : "You don't have any active deals. Check back later for new collaboration opportunities."
      };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-10 w-10 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        </div>
        
        {/* Card Skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {showHistory ? 'Deal History' : 'My Deals'}
        </h2>
        
        <div className="flex items-center gap-2">
          {/* History Toggle Button */}
          <Button
            variant={showHistory ? "default" : "outline"}
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            {showHistory ? 'Show Active' : 'History'}
          </Button>
          
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            className="flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Deal Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {currentDeals.length} {showHistory ? 'completed' : 'active'} deal{currentDeals.length !== 1 ? 's' : ''}
      </div>

      {/* Deals List */}
      <div className="space-y-3">
        {currentDeals.length > 0 ? (
          currentDeals.map((deal) => (
            <DealCard
              key={deal._id}
              deal={deal}
              userType={userType}
              onDealAction={onDealAction}
              onContentAction={onContentAction}
              onContentSubmission={onContentSubmission}
              onChatAction={onChatAction}
              isMinimized={!expandedCards.has(deal._id)}
              onToggleMinimized={() => toggleCardExpansion(deal._id)}
              className="w-full"
            />
          ))
        ) : (
          <EmptyState 
            {...getEmptyStateMessage()}
            className="py-12"
          />
        )}
      </div>
    </div>
  );
};

export default NativeDealsList;
