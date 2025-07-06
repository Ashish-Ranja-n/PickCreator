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
  MessageSquare
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
  const [contentFormData, setContentFormData] = useState({
    contentType: 'reel' as 'reel' | 'post' | 'story' | 'live',
    contentUrl: ''
  });
  const [submittingContent, setSubmittingContent] = useState(false);
  const [showPaymentReleaseDialog, setShowPaymentReleaseDialog] = useState(false);
  const [releasingPayment, setReleasingPayment] = useState(false);

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
      setShowPaymentReleaseDialog(false);
    } catch (error) {
      console.error('Error releasing payment:', error);
    } finally {
      setReleasingPayment(false);
    }
  };

  const progress = getProgressStatus();

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-200 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 ${className}`}>
      <CardHeader className={userType === 'influencer' ? "border-b border-gray-200 dark:border-zinc-800 pb-4" : ""}>
        <Collapsible>
          <div className="flex items-start justify-between w-full gap-4">
            <div className="flex gap-4">
              {/* Profile Picture */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex-shrink-0">
                {userType === 'brand' ? (
                  // Show influencer profile for brand view
                  deal.dealType === 'single' && deal.influencers[0]?.profilePictureUrl ? (
                    <Image
                      src={deal.influencers[0].profilePictureUrl}
                      alt={deal.influencers[0].name}
                      className="w-full h-full object-cover"
                      width={48}
                      height={48}
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
                      width={48}
                      height={48}
                    />
                  ) : (
                    <Building2 className="w-full h-full p-2.5 text-gray-400 dark:text-zinc-500" />
                  )
                )}
              </div>

              {/* Name and Details */}
              <div className="flex flex-col min-w-0">
                {userType === 'brand' ? (
                  // Brand view - show influencer name or deal name
                  deal.dealType === 'single' ? (
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">
                        {deal.influencers[0]?.name || 'Influencer'}
                      </CardTitle>
                      {deal.influencers[0]?.city && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-gray-500 dark:text-zinc-400" />
                          <span className="text-xs text-gray-500 dark:text-zinc-400">
                            {deal.influencers[0].city}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">
                        {deal.dealName}
                      </CardTitle>
                      <CollapsibleTrigger className="text-xs text-blue-500 mt-1">
                        View list
                      </CollapsibleTrigger>
                    </div>
                  )
                ) : (
                  // Influencer view - show brand/company name
                  <>
                    {deal.companyName && (
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                        {deal.companyName}
                      </h4>
                    )}
                    <p className="text-sm text-gray-600 dark:text-zinc-300 truncate">{deal.brandName}</p>
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

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Visit Required Notice for Influencer */}
          {userType === 'influencer' && deal.visitRequired && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
              <MapPinned className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-300">Visit Required</h4>
                <p className="text-sm text-amber-600 dark:text-amber-400">In-person presence needed for this deal</p>
              </div>
            </div>
          )}

          {/* Description */}
          {deal.description && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-zinc-400">Description</p>
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

      <CardFooter className="flex justify-between border-t border-gray-200 dark:border-zinc-800 pt-4">
        {/* Brand Actions */}
        {userType === 'brand' && (
          <>
            {deal.status === 'counter-offered' && (
              <div className="flex w-full gap-4">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDealAction('reject')}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleDealAction('accept')}
                >
                  Accept Counter Offer
                </Button>
              </div>
            )}
            {deal.status === 'requested' && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => handleDealAction('cancel')}
              >
                Cancel Request
              </Button>
            )}
            {deal.status === 'accepted' && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
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
                  onClick={() => {
                    const otherUserId = deal.influencers[0]?.id;
                    if (otherUserId && onChatAction) {
                      onChatAction(deal._id, otherUserId);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat with Influencer
                </Button>

                {/* Release Payment button - only show after content is approved */}
                {deal.status === 'content_approved' && !deal.paymentReleased && (
                  <Button
                    onClick={() => setShowPaymentReleaseDialog(true)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white flex items-center justify-center gap-2"
                  >
                    <IndianRupee className="w-4 h-4" />
                    Release Payment
                  </Button>
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
                      className="flex-1 border-red-500 dark:border-red-600 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDealAction('reject')}
                    >
                      <XIcon className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-orange-500 dark:border-orange-600 text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                      onClick={() => setIsNegotiating(true)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Negotiate
                    </Button>
                    <Button
                      className="flex-1 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white"
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
                      onClick={() => {
                        let otherUserId: string | undefined;
                        if ((userType as string) === 'brand') {
                          otherUserId = deal.influencers[0]?.id;
                        } else {
                          otherUserId = deal.brandId;
                        }
                        if (otherUserId) {
                          onChatAction(deal._id, otherUserId);
                        }
                      }}
                      className="w-full mt-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Start Chat
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
                    onClick={() => {
                      const otherUserId = deal.brandId;
                      if (otherUserId) {
                        onChatAction(deal._id, otherUserId);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat with Brand
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
        onClose={() => setShowPaymentReleaseDialog(false)}
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
