export interface ContentSubmission {
  _id?: string;
  type: 'reel' | 'post' | 'story' | 'live';
  url: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  reviewedAt?: string;
}

export interface Deal {
  _id: string;
  dealName: string;
  dealType: 'single' | 'multiple';
  status: 'requested' | 'counter-offered' | 'accepted' | 'ongoing' | 'completed' | 'cancelled' | 'content_approved';
  paymentStatus: 'paid' | 'unpaid';
  totalAmount: number;
  createdAt: string;
  brandName: string;
  brandProfilePic: string;
  brandId?: string;
  companyName?: string;
  location?: string;
  visitRequired?: boolean;
  description?: string;
  contentRequirements: {
    reels: number;
    posts: number;
    stories: number;
    lives: number;
  };
  influencers: Array<{
    id: string;
    name: string;
    profilePictureUrl?: string;
    avatar?: string;
    status: 'pending' | 'accepted' | 'rejected';
    offeredPrice: number;
    counterOffer?: number;
    city?: string;
  }>;
  isNegotiating?: boolean;
  submittedContent?: ContentSubmission[];
  contentPublished: boolean;
  paymentReleased: boolean;
}

export interface DealProgress {
  paid: boolean;
  contentPublished: boolean;
  paymentReleased: boolean;
}

export type DealStatus = Deal['status'];
export type PaymentStatus = Deal['paymentStatus'];

export interface DealCardProps {
  deal: Deal;
  userType: 'brand' | 'influencer';
  onDealAction?: (dealId: string, action: string, data?: any) => void;
  onContentAction?: (dealId: string, contentId: string, action: 'approve' | 'reject', comment?: string) => void;
  onContentSubmission?: (dealId: string, data: any) => void;
  onChatAction?: (dealId: string, otherUserId: string) => void;
  className?: string;
}

export interface StatusBadgeProps {
  status: DealStatus | PaymentStatus;
  type: 'deal' | 'payment';
  className?: string;
}

export interface ContentRequirementsProps {
  requirements: Deal['contentRequirements'];
  variant?: 'compact' | 'detailed';
  className?: string;
}

export interface DealProgressProps {
  progress: DealProgress;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export interface DealTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  deals: Deal[];
  userType: 'brand' | 'influencer';
  className?: string;
}
