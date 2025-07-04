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
    if (userType === 'influencer') {
      return "relative flex items-center justify-center px-3 py-1.5 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600 data-[state=active]:text-white transition-all";
    }
    return "relative flex items-center justify-center px-3 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all";
  };

  const getTabsListClass = (userType: 'brand' | 'influencer') => {
    if (userType === 'influencer') {
      return "grid w-full grid-cols-4 mb-8 bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-1 gap-1 relative";
    }
    return "grid w-full grid-cols-4 mb-8 bg-gray-50 rounded-lg p-1 gap-1 relative";
  };

  const triggerClass = getTabTriggerClass(userType);
  const tabsListClass = getTabsListClass(userType);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={className}>
      <TabsList className={tabsListClass}>
        <TabsTrigger value="requested" className={triggerClass}>
          <span className="whitespace-nowrap">Requested</span>
          {getTabCount('requested') > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-blue-500 text-white">
              {getTabCount('requested')}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="pending" className={triggerClass}>
          <span className="whitespace-nowrap">Pending</span>
          {getTabCount('pending') > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-yellow-500 text-white">
              {getTabCount('pending')}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="ongoing" className={triggerClass}>
          <span className="whitespace-nowrap">Ongoing</span>
          {getTabCount('ongoing') > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-green-500 text-white">
              {getTabCount('ongoing')}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="history" className={triggerClass}>
          <span className="whitespace-nowrap">History</span>
          {getTabCount('history') > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-gray-500 text-white">
              {getTabCount('history')}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default DealTabs;
