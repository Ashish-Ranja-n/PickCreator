import React from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { DealTabsProps } from './types';

export const DealTabs: React.FC<DealTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  deals, 
  userType,
  className = '' 
}) => {
  const getTabCount = (tabType: string) => {
    switch (tabType) {
      case 'requested':
        return deals.filter(deal => deal.status === 'requested' || deal.status === 'counter-offered').length;
      case 'pending':
        return deals.filter(deal => deal.status === 'accepted').length;
      case 'ongoing':
        return deals.filter(deal => deal.status === 'ongoing' || deal.status === 'content_approved').length;
      case 'history':
        return deals.filter(deal => ['completed', 'cancelled'].includes(deal.status)).length;
      default:
        return 0;
    }
  };

  const getTabTriggerClass = (userType: 'brand' | 'influencer') => {
    // Simplified, professional styling for both user types
    return "relative flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200";
  };

  const getTabsListClass = (userType: 'brand' | 'influencer') => {
    // Clean, minimal styling for both user types
    return "grid w-full grid-cols-4 mb-8 bg-gray-100 dark:bg-zinc-900 rounded-lg p-1 gap-1 border border-gray-200 dark:border-zinc-800";
  };

  const triggerClass = getTabTriggerClass(userType);
  const tabsListClass = getTabsListClass(userType);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={className}>
      <TabsList className={tabsListClass}>
        <TabsTrigger value="requested" className={triggerClass}>
          <span className="whitespace-nowrap">Requested</span>
          {getTabCount('requested') > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-blue-500 text-white border-2 border-white dark:border-zinc-900">
              {getTabCount('requested')}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="pending" className={triggerClass}>
          <span className="whitespace-nowrap">Pending</span>
          {getTabCount('pending') > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-amber-500 text-white border-2 border-white dark:border-zinc-900">
              {getTabCount('pending')}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="ongoing" className={triggerClass}>
          <span className="whitespace-nowrap">Ongoing</span>
          {getTabCount('ongoing') > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-green-500 text-white border-2 border-white dark:border-zinc-900">
              {getTabCount('ongoing')}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="history" className={triggerClass}>
          <span className="whitespace-nowrap">History</span>
          {getTabCount('history') > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-gray-500 text-white border-2 border-white dark:border-zinc-900">
              {getTabCount('history')}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default DealTabs;
