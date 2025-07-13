import React, { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IndianRupee,
  Building2,
  MapPin,
  MapPinned,
  Clock,
  Check,
  XIcon,
  Send,
  User,
  MessageCircle,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DealCardProps } from './types';
import StatusBadge from './StatusBadge';
import ContentRequirements from './ContentRequirements';
import DealProgress from './DealProgress';
import PaymentReleaseDialog from './PaymentReleaseDialog';

export const DealCard: React.FC<DealCardProps> = ({
  deal,
  userType,
  onDealAction,
  onContentAction,
  onContentSubmission,
  onChatAction,
  className = ''
}) => {
  const [isNegotiating, setIsNegotiating] = useState(deal.isNegotiating || false);
  const [counterOffer, setCounterOffer] = useState<number>(0);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [contentFormData, setContentFormData] = useState({
    contentType: 'reel' as 'reel' | 'post' | 'story' | 'live',
    contentUrl: ''
  });
  const [submittingContent, setSubmittingContent] = useState(false);
  const [showPaymentReleaseDialog, setShowPaymentReleaseDialog] = useState(false);
  const [releasingPayment, setReleasingPayment] = useState(false);
  const [localPaymentReleased, setLocalPaymentReleased] = useState(false);

  // Reset local payment released state when deal data changes
  React.useEffect(() => {
    if (deal.paymentReleased) {
      setLocalPaymentReleased(true);
    }
  }, [deal.paymentReleased]);

  // Helper function to safely format amounts for display
  const formatAmount = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return "0";
    return amount.toLocaleString();
  };

  // Helper function to safely format dates
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  const getProgressStatus = () => {
    const hasApprovedContent = deal.submittedContent?.some(content => content.status === 'approved') || false;
    return {
      paid: deal.paymentStatus === 'paid',
      contentPublished: hasApprovedContent || deal.contentPublished || false,
      paymentReleased: deal.paymentReleased || false,
    };
  };

  const handleDealAction = (action: string, data?: any) => {
    if (onDealAction) {
      onDealAction(deal._id, action, data);
    }
  };

  const handleContentSubmission = async () => {
    if (!contentFormData.contentUrl.trim() || !onContentSubmission) return;

    setSubmittingContent(true);
    try {
      onContentSubmission(deal._id, {
        contentType: contentFormData.contentType,
        contentUrl: contentFormData.contentUrl
      });
      setContentFormData({ contentType: 'reel', contentUrl: '' });
    } finally {
      setSubmittingContent(false);
    }
  };

  const handlePaymentRelease = async () => {
    setReleasingPayment(true);
    try {
      await onDealAction?.(deal._id, 'release-payment');
      // Only close dialog and mark as released on successful payment release
      setLocalPaymentReleased(true);
      setShowPaymentReleaseDialog(false);
      console.log('Payment released successfully for deal:', deal._id);
    } catch (error) {
      console.error('Error releasing payment:', error);
      // Don't close dialog on error - let user try again or cancel manually
    } finally {
      setReleasingPayment(false);
    }
  };

  const handleChatAction = async () => {
    setIsChatLoading(true);
    try {
      let otherUserId: string | undefined;
      if (userType === 'brand') {
        otherUserId = deal.influencers[0]?.id;
      } else {
        otherUserId = deal.brandId;
      }

      if (otherUserId && onChatAction) {
        await onChatAction(deal._id, otherUserId);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const progress = getProgressStatus();

  return (
    <Card className={`group overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-purple-500/10 transition-all duration-300 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-gray-200/50 dark:border-zinc-700/50 hover:border-blue-300/50 dark:hover:border-purple-500/50 hover:-translate-y-1 ${className}`}>
      <CardHeader className={`${userType === 'influencer' ? "border-b border-gray-200/50 dark:border-zinc-700/50 pb-6" : "pb-6"} relative`}>
        {/* Subtle gradient overlay for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-950/20 dark:to-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Collapsible>
          <div className="flex items-start justify-between w-full gap-4 relative z-10">
            <div className="flex gap-4">
              {/* Enhanced Profile Picture */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 border-2 border-white dark:border-zinc-600 shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                {userType === 'brand' ? (
                  // Show influencer profile for brand view
                  deal.dealType === 'single' && deal.influencers[0]?.profilePictureUrl ? (
                    <Image
                      src={deal.influencers[0].profilePictureUrl}
                      alt={deal.influencers[0].name}
                      className="w-full h-full object-cover"
                      width={56}
                      height={56}
                    />
                  ) : (
                    <User className="w-full h-full p-2.5 text-gray-400 dark:text-zinc-500" />
                  )
                ) : (
                  // Show brand profile for influencer view
                  deal.brandProfilePic ? (
                    <Image
                      src={deal.brandProfilePic}
                      alt={deal.brandName}
                      className="w-full h-full object-cover"
                      width={56}
                      height={56}
                    />
                  ) : (
                    <Building2 className="w-full h-full p-2.5 text-gray-400 dark:text-zinc-500" />
                  )
                )}
              </div>

              {/* Enhanced Name and Details */}
              <div className="flex flex-col min-w-0 space-y-1">
                {userType === 'brand' ? (
                  // Brand view - show influencer name or deal name
                  deal.dealType === 'single' ? (
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {deal.influencers[0]?.name || 'Influencer'}
                      </CardTitle>
                      {deal.influencers[0]?.city && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <MapPin className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                          <span className="text-sm font-medium text-gray-600 dark:text-zinc-300">
                            {deal.influencers[0].city}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {deal.dealName}
                      </CardTitle>
                      <CollapsibleTrigger className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2 font-medium transition-colors">
                        View list
                      </CollapsibleTrigger>
                    </div>
                  )
                ) : (
                  // Influencer view - show brand/company name
                  <>
                    {deal.companyName && (
                      <h4 className="font-bold text-xl text-gray-900 dark:text-white truncate tracking-tight">
                        {deal.companyName}
                      </h4>
                    )}
                    <p className="text-sm font-medium text-gray-600 dark:text-zinc-300 truncate">{deal.brandName}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {deal.location && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 text-xs">
                          <MapPin className="h-3 w-3" />
                          {deal.location}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            <StatusBadge status={deal.status} type="deal" className="shrink-0" />
          </div>

          {/* Multiple influencers list for brand view */}
          {userType === 'brand' && deal.dealType === 'multiple' && (
            <CollapsibleContent>
              <div className="mt-3 space-y-2 bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Influencer List:</h4>
                {deal.influencers.map((influencer, index) => (
                  <div key={influencer.id || index} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800">
                      {influencer.profilePictureUrl ? (
                        <Image
                          src={influencer.profilePictureUrl}
                          alt={influencer.name}
                          className="w-full h-full object-cover"
                          width={24}
                          height={24}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs">
                          {influencer.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900 dark:text-white">{influencer.name}</span>
                      {influencer.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5 text-gray-400 dark:text-zinc-500" />
                          <span className="text-xs text-gray-400 dark:text-zinc-500">
                            {influencer.city}
                          </span>
                        </div>
                      )}
                    </div>
                    <StatusBadge
                      status={influencer.status as any}
                      type="deal"
                      className="text-xs ml-auto"
                    />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </CardHeader>

      <CardContent className="p-6 relative">
        <div className="space-y-6">
          {/* Enhanced Visit Required Notice for Influencer */}
          {userType === 'influencer' && deal.visitRequired && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-700/40 shadow-sm">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-800/30">
                <MapPinned className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-200">Visit Required</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">In-person presence needed for this deal</p>
              </div>
            </div>
          )}

          {/* Enhanced Description */}
          {deal.description && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wide">Description</h3>
              <p className="text-gray-900 dark:text-white text-sm leading-relaxed bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                {deal.description}
              </p>
            </div>
          )}

          {/* Amount and Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                {deal.status === 'counter-offered' ? 'Original Amount' : 'Total Amount'}
              </p>
              <p className="font-semibold flex items-center text-gray-900 dark:text-white text-lg">
                <IndianRupee className="h-4 w-4 mr-1" />
                {formatAmount(deal.totalAmount)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-zinc-400">Created</p>
              <p className="text-gray-900 dark:text-white">
                {formatDate(deal.createdAt)}
              </p>
            </div>
            <div className="col-span-2 space-y-1">
              <p className="text-sm text-gray-500 dark:text-zinc-400">Payment Status</p>
              <StatusBadge status={deal.paymentStatus} type="payment" />
            </div>
          </div>

          {/* Counter Offer Display */}
          {deal.status === 'counter-offered' && deal.influencers[0]?.counterOffer && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 border border-violet-100 dark:border-violet-800/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                  {userType === 'brand' ? 'Counter Offer' : 'Your Counter Offer'}
                </span>
                <span className="font-semibold flex items-center text-gray-900 dark:text-white">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  {formatAmount(deal.influencers[0].counterOffer)}
                </span>
              </div>
            </div>
          )}

          {/* Content Requirements */}
          <ContentRequirements 
            requirements={deal.contentRequirements} 
            variant={userType === 'brand' ? 'detailed' : 'compact'}
          />

          {/* Deal Progress for Ongoing Deals */}
          {(deal.status === 'ongoing' || deal.status === 'content_approved') && (
            <>
              {userType === 'brand' ? (
                /* Content Management for Brand Users */
                <div className="space-y-4">
                  {/* Payment Status */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status</span>
                    <Badge className={progress.paid ? 'bg-green-100/80 text-green-700 border border-green-300/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50' : 'bg-yellow-100/80 text-yellow-700 border border-yellow-300/50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50'}>
                      {progress.paid ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </div>

                  {/* Submitted Content Section */}
                  {deal.submittedContent && deal.submittedContent.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">Submitted Content</h4>
                      {deal.submittedContent.map((content, index) => (
                        <div key={content._id || index} className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {content.type.toUpperCase()}
                                </Badge>
                                <Badge className={
                                  content.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                  content.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                }>
                                  {content.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Submitted: {formatDate(content.submittedAt)}
                              </p>
                            </div>
                          </div>

                          {/* Content Preview */}
                          <div className="mb-3">
                            <a
                              href={content.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all"
                            >
                              {content.url}
                            </a>
                          </div>

                          {/* Action Buttons for Pending Content */}
                          {content.status === 'pending' && onContentAction && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => onContentAction(deal._id, content._id!, 'approve')}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => onContentAction(deal._id, content._id!, 'reject', 'Content needs revision')}
                                size="sm"
                                variant="destructive"
                              >
                                <XIcon className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}

                          {/* Show comment for rejected content */}
                          {content.status === 'rejected' && content.comment && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                              <p className="text-sm text-red-700 dark:text-red-300">
                                <strong>Rejection reason:</strong> {content.comment}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No content submitted yet
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Original Progress Component for Influencer Users */
                <DealProgress
                  progress={progress}
                  variant="compact"
                />
              )}
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t border-gray-200/50 dark:border-zinc-700/50 pt-6 bg-gray-50/30 dark:bg-zinc-800/30">
        {/* Enhanced Brand Actions */}
        {userType === 'brand' && (
          <>
            {deal.status === 'counter-offered' && (
              <div className="flex w-full gap-3">
                <Button
                  variant="destructive"
                  className="flex-1 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                  onClick={() => handleDealAction('reject')}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                  onClick={() => handleDealAction('accept')}
                >
                  Accept Counter Offer
                </Button>
              </div>
            )}
            {deal.status === 'requested' && (
              <Button
                variant="destructive"
                className="w-full shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                onClick={() => handleDealAction('cancel')}
              >
                Cancel Request
              </Button>
            )}
            {deal.status === 'accepted' && (
              <Button
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                onClick={() => handleDealAction('pay')}
              >
                Make Payment
              </Button>
            )}
            {/* Ongoing deal actions for brands */}
            {(deal.status === 'ongoing' || deal.status === 'content_approved') && deal.paymentStatus === 'paid' && (
              <div className="w-full space-y-3">
                {/* Chat with Influencer button */}
                <Button
                  onClick={handleChatAction}
                  disabled={isChatLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition-all duration-200"
                >
                  {isChatLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting Chat...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      Chat with Influencer
                    </>
                  )}
                </Button>

                {/* Release Payment button - only show after content is approved */}
                {deal.status === 'content_approved' && !deal.paymentReleased && !localPaymentReleased && (
                  <Button
                    onClick={() => {
                      console.log('Release Payment clicked - Deal status:', deal.status, 'Payment released:', deal.paymentReleased, 'Local released:', localPaymentReleased, 'Deal ID:', deal._id);
                      setShowPaymentReleaseDialog(true);
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white flex items-center justify-center gap-2"
                  >
                    <IndianRupee className="w-4 h-4" />
                    Release Payment
                  </Button>
                )}

                {/* Debug info - remove this later */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 mt-2">
                    Debug: Status: {deal.status}, PaymentReleased: {deal.paymentReleased ? 'true' : 'false'}, LocalReleased: {localPaymentReleased ? 'true' : 'false'}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Influencer Actions */}
        {userType === 'influencer' && (
          <>
            {deal.status === 'requested' && (
              <>
                {isNegotiating ? (
                  <div className="flex w-full flex-col gap-4">
                    <div className="flex w-full gap-4">
                      <div className="flex-1">
                        <input
                          type="number"
                          placeholder="Enter counter offer amount"
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white"
                          onChange={(e) => setCounterOffer(parseInt(e.target.value))}
                        />
                      </div>
                      <Button
                        onClick={() => {
                          if (counterOffer) {
                            handleDealAction('counter-offer', counterOffer);
                          }
                        }}
                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-600 dark:hover:from-violet-700 dark:hover:to-fuchsia-700 text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Counter Offer
                      </Button>
                    </div>
                    <div className="flex w-full gap-4">
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500 dark:border-red-600 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleDealAction('reject')}
                      >
                        <XIcon className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        className="flex-1 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white"
                        onClick={() => handleDealAction('accept')}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Accept Original Offer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500 dark:border-red-400 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                      onClick={() => handleDealAction('reject')}
                    >
                      <XIcon className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    
                    <Button
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 hover:from-green-600 hover:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                      onClick={() => handleDealAction('accept')}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                  </div>
                )}
              </>
            )}
            {deal.status === 'counter-offered' && (
              <div className="w-full p-4 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-center text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
                <Clock className="w-4 h-4 mx-auto mb-2 animate-pulse text-gray-400 dark:text-zinc-500" />
                Waiting for brand's response to your counter offer
              </div>
            )}
            {deal.status === 'accepted' && (
              <div className="w-full p-4 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-center text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
                <Clock className="w-4 h-4 mx-auto mb-2 animate-pulse text-gray-400 dark:text-zinc-500" />
                Waiting for brand payment
              </div>
            )}
            {(deal.status === 'ongoing' || deal.status === 'content_approved') && !progress.contentPublished && (
              <div className="w-full p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Submit Content</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content Type</label>
                    <select
                      className="w-full p-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-md"
                      value={contentFormData.contentType}
                      onChange={(e) => setContentFormData({
                        ...contentFormData,
                        contentType: e.target.value as 'reel' | 'post' | 'story' | 'live'
                      })}
                    >
                      <option value="reel">Instagram Reel</option>
                      <option value="post">Instagram Post</option>
                      <option value="story">Instagram Story</option>
                      <option value="live">Instagram Live</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content URL</label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/p/..."
                      className="w-full p-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-md"
                      value={contentFormData.contentUrl}
                      onChange={(e) => setContentFormData({
                        ...contentFormData,
                        contentUrl: e.target.value
                      })}
                    />
                  </div>
                  <Button
                    onClick={handleContentSubmission}
                    disabled={!contentFormData.contentUrl.trim() || submittingContent}
                    className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-600 dark:hover:from-violet-700 dark:hover:to-fuchsia-700 text-white"
                  >
                    {submittingContent ? 'Submitting...' : 'Submit Content'}
                  </Button>

                  {/* Chat Button for influencers - placed below submit content */}
                  {userType === 'influencer' && onChatAction && (
                    <Button
                      onClick={handleChatAction}
                      disabled={isChatLoading}
                      className="w-full mt-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {isChatLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Starting Chat...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4" />
                          Start Chat
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Request Release section for influencers - show after content is approved */}
            {deal.status === 'content_approved' && deal.paymentStatus === 'paid' && !deal.paymentReleased && (
              <div className="w-full space-y-3">
                {/* Chat Button for influencers */}
                {onChatAction && (
                  <Button
                    onClick={handleChatAction}
                    disabled={isChatLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isChatLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Starting Chat...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        Chat with Brand
                      </>
                    )}
                  </Button>
                )}

                {/* Request Release button (placeholder) */}
                <Button
                  onClick={() => {
                    // Placeholder functionality - just show a message for now
                    alert('Request sent to brand! They will be notified to release your payment.');
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white flex items-center justify-center gap-2"
                >
                  <IndianRupee className="w-4 h-4" />
                  Request Release
                </Button>
              </div>
            )}

          </>
        )}
      </CardFooter>

      {/* Payment Release Dialog */}
      <PaymentReleaseDialog
        isOpen={showPaymentReleaseDialog}
        onClose={() => {
          console.log('Payment Release Dialog closed - Deal status:', deal.status, 'Payment released:', deal.paymentReleased);
          setShowPaymentReleaseDialog(false);
        }}
        onConfirm={handlePaymentRelease}
        dealName={deal.dealName}
        amount={deal.influencers[0]?.offeredPrice || deal.totalAmount}
        influencerName={deal.influencers[0]?.name || 'Influencer'}
        isLoading={releasingPayment}
      />
    </Card>
  );
};

export default DealCard;
