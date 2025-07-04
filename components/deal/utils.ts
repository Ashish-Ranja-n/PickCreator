import { Deal, DealStatus, PaymentStatus } from './types';

// Helper function to safely format amounts for display
export const formatAmount = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return "0";
  return amount.toLocaleString();
};

// Helper function to safely format dates
export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid Date";
  }
};

// Helper function to get status color classes
export const getStatusColor = (status: DealStatus | PaymentStatus, type: 'deal' | 'payment'): string => {
  if (type === 'payment') {
    switch (status as PaymentStatus) {
      case 'unpaid':
        return 'bg-yellow-100/80 text-yellow-700 border border-yellow-300/50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50';
      case 'paid':
        return 'bg-green-100/80 text-green-700 border border-green-300/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    }
  }

  // Deal status colors
  switch (status as DealStatus) {
    case 'requested':
      return 'bg-blue-100/80 text-blue-700 border border-blue-300/50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50';
    case 'counter-offered':
      return 'bg-indigo-100/80 text-indigo-700 border border-indigo-300/50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/50';
    case 'accepted':
      return 'bg-yellow-100/80 text-yellow-700 border border-yellow-300/50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50';
    case 'ongoing':
      return 'bg-green-100/80 text-green-700 border border-green-300/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50';
    case 'content_approved':
      return 'bg-teal-100/80 text-teal-700 border border-teal-300/50 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700/50';
    case 'completed':
      return 'bg-violet-100/80 text-violet-700 border border-violet-300/50 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700/50';
    case 'cancelled':
      return 'bg-red-100/80 text-red-700 border border-red-300/50 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
  }
};

// Helper function to filter deals by tab
export const filterDealsByTab = (deals: Deal[], tab: string): Deal[] => {
  switch (tab) {
    case 'requested':
      return deals.filter(deal => deal.status === 'requested' || deal.status === 'counter-offered');
    case 'pending':
      return deals.filter(deal => deal.status === 'accepted');
    case 'ongoing':
      return deals.filter(deal => deal.status === 'ongoing' || deal.status === 'content_approved');
    case 'history':
      return deals.filter(deal => ['completed', 'cancelled'].includes(deal.status));
    default:
      return deals;
  }
};

// Helper function to get tab counts
export const getTabCounts = (deals: Deal[]) => {
  return {
    requested: deals.filter(deal => deal.status === 'requested' || deal.status === 'counter-offered').length,
    pending: deals.filter(deal => deal.status === 'accepted').length,
    ongoing: deals.filter(deal => deal.status === 'ongoing' || deal.status === 'content_approved').length,
    history: deals.filter(deal => ['completed', 'cancelled'].includes(deal.status)).length,
  };
};

// Helper function to get empty state messages
export const getEmptyStateMessage = (tab: string, userType: 'brand' | 'influencer') => {
  const messages = {
    brand: {
      requested: {
        title: "No Requested Deals",
        description: "You haven't sent any deal requests yet. Start by finding influencers and sending them collaboration requests."
      },
      pending: {
        title: "No Pending Deals",
        description: "No deals are waiting for payment. Once influencers accept your requests, they'll appear here."
      },
      ongoing: {
        title: "No Ongoing Deals",
        description: "No active collaborations at the moment. Paid deals will appear here for content tracking."
      },
      history: {
        title: "No Deal History",
        description: "Your completed and cancelled deals will appear here once you have some deal activity."
      }
    },
    influencer: {
      requested: {
        title: "No Deal Requests",
        description: "You haven't received any collaboration requests yet. Brands will send you deals based on your profile."
      },
      pending: {
        title: "No Pending Deals",
        description: "No deals are waiting for brand payment. Accepted deals will appear here once brands make payments."
      },
      ongoing: {
        title: "No Ongoing Deals",
        description: "No active collaborations at the moment. Paid deals will appear here for content submission."
      },
      history: {
        title: "No Deal History",
        description: "Your completed and cancelled deals will appear here once you have some collaboration history."
      }
    }
  };

  return messages[userType][tab as keyof typeof messages.brand] || {
    title: "No Deals Found",
    description: "No deals match the current filter."
  };
};
