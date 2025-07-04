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
      return "relative flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 dark:data-[state=active]:from-violet-600 dark:data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/25 dark:text-zinc-300 text-zinc-600 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-300";
    }
    return "relative flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 dark:data-[state=active]:shadow-blue-500/10 data-[state=active]:border data-[state=active]:border-blue-200 dark:data-[state=active]:border-blue-800 dark:text-zinc-300 text-zinc-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300";
  };

  const getTabsListClass = (userType: 'brand' | 'influencer') => {
    if (userType === 'influencer') {
      return "grid w-full grid-cols-4 mb-8 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-900/80 dark:to-zinc-800/80 rounded-xl p-2 gap-2 relative shadow-inner dark:shadow-zinc-900/50";
    }
    return "grid w-full grid-cols-4 mb-8 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-900/80 dark:to-zinc-800/80 rounded-xl p-2 gap-2 relative shadow-inner dark:shadow-zinc-900/50 border border-gray-200 dark:border-zinc-700";
  };

  const triggerClass = getTabTriggerClass(userType);
  const tabsListClass = getTabsListClass(userType);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={className}>
      <TabsList className={tabsListClass}>
        <TabsTrigger value="requested" className={triggerClass}>
          <span className="whitespace-nowrap">Requested</span>
          {getTabCount('requested') > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border-2 border-white dark:border-zinc-800">
              {getTabCount('requested')}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="pending" className={triggerClass}>
          <span className="whitespace-nowrap">Pending</span>
          {getTabCount('pending') > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 border-2 border-white dark:border-zinc-800">
              {getTabCount('pending')}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="ongoing" className={triggerClass}>
          <span className="whitespace-nowrap">Ongoing</span>
          {getTabCount('ongoing') > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30 border-2 border-white dark:border-zinc-800">
              {getTabCount('ongoing')}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="history" className={triggerClass}>
          <span className="whitespace-nowrap">History</span>
          {getTabCount('history') > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-gradient-to-r from-slate-500 to-gray-500 text-white shadow-lg shadow-slate-500/30 border-2 border-white dark:border-zinc-800">
              {getTabCount('history')}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default DealTabs;
