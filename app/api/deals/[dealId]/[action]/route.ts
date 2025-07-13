import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Deal } from '@/models/deal';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { sendBackgroundNotification } from '@/utils/dealNotifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; action: string }> }
) {
  try {
    // Connect to MongoDB
    await connect();

    // Extract parameters
    const { dealId, action } = await params;

    if (!dealId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters',
      }, { status: 400 });
    }

    // Validate user authentication
    const userData = await getDataFromToken(request);
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Invalid token',
      }, { status: 401 });
    }

    // Get the user ID from the token
    const userId = (userData as any).id || (userData as any)._id;
    const userRole = (userData as any).role;
    const userName = (userData as any).name || 'A user';

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token - No user ID',
      }, { status: 401 });
    }

    // Find the deal
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return NextResponse.json({
        success: false,
        error: 'Deal not found',
      }, { status: 404 });
    }

    // Process different actions
    switch (action.toLowerCase()) {
      case 'accept':
        // Both brands and influencers can accept deals
        if (userRole === 'Influencer') {
          // Verify that the influencer is in the deal
          const influencerInDeal = deal.influencers.find(
            (inf: any) => inf.id.toString() === userId.toString()
          );

          if (!influencerInDeal) {
            return NextResponse.json({
              success: false,
              error: 'You are not part of this deal',
            }, { status: 403 });
          }

          // Update the influencer's status to accepted
          await Deal.updateOne(
            { _id: dealId, 'influencers.id': userId.toString() },
            {
              $set: {
                'influencers.$.status': 'accepted',
                'status': 'accepted',
                // If there was a counter offer, update the total amount
                ...(deal.status === 'counter-offered' ? {
                  'totalAmount': deal.influencers[0].counterOffer
                } : {})
              }
            }
          );

          // Send notification to brand in the background
          sendBackgroundNotification(
            deal.brandId.toString(),
            'Deal Accepted',
            `${userName} has accepted your deal ${deal.dealName}`,
            {
              url: `/brand/deals?tab=pending&id=${dealId}`,
              type: 'deal_accepted',
              dealName: deal.dealName,
              dealId: dealId
            }
          );
        } else if (userRole === 'Brand' && deal.brandId.toString() === userId.toString()) {
          // Brand accepting a counter offer
          if (deal.status === 'counter-offered') {
            await Deal.updateOne(
              { _id: dealId },
              {
                $set: {
                  'status': 'accepted',
                  'totalAmount': deal.influencers[0].counterOffer
                }
              }
            );

            // Notify influencer their counter offer was accepted
            if (deal.influencers.length > 0) {
              const influencerId = deal.influencers[0].id;

              sendBackgroundNotification(
                influencerId,
                'Counter Offer Accepted',
                `${userName} has accepted your counter offer for deal ${deal.dealName}`,
                {
                  url: `/influencer/deals?tab=pending&id=${dealId}`,
                  type: 'counter_offer_accepted',
                  dealName: deal.dealName,
                  dealId: dealId
                }
              );
            }
          }
        } else {
          return NextResponse.json({
            success: false,
            error: 'You are not authorized to accept this deal',
          }, { status: 403 });
        }
        break;

      case 'counter-offer':
        // Only influencers can make counter offers
        if (userRole !== 'Influencer') {
          return NextResponse.json({
            success: false,
            error: 'Only influencers can make counter offers',
          }, { status: 403 });
        }

        // Find influencer in the deal
        const influencerMakingOffer = deal.influencers.find(
          (inf: any) => inf.id.toString() === userId.toString()
        );

        if (!influencerMakingOffer) {
          return NextResponse.json({
            success: false,
            error: 'You are not part of this deal',
          }, { status: 403 });
        }

        let requestBody;
        try {
          requestBody = await request.json();
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            error: 'Invalid request body - expected JSON with counterOffer',
          }, { status: 400 });
        }

        const { counterOffer } = requestBody;

        if (!counterOffer || counterOffer <= 0) {
          return NextResponse.json({
            success: false,
            error: 'Invalid counter offer amount',
          }, { status: 400 });
        }

        // Update the deal status and influencer's counter offer
        // Keep the original amount in totalAmount, store counter offer in influencer's record
        await Deal.updateOne(
          { _id: dealId, 'influencers.id': userId.toString() },
          {
            $set: {
              'status': 'counter-offered',
              'influencers.$.counterOffer': counterOffer,
              'offerAmount': deal.totalAmount, // Store original amount
            }
          }
        );

        // Notify brand about counter offer
        sendBackgroundNotification(
          deal.brandId.toString(),
          'Counter Offer Received',
          `${userName} has made a counter offer of ₹${counterOffer} for deal ${deal.dealName}`,
          {
            url: `/brand/deals?tab=requested&id=${dealId}`,
            type: 'counter_offer',
            dealName: deal.dealName,
            dealId: dealId,
            counterOffer: counterOffer
          }
        );
        break;

      case 'reject':
        // Both brands and influencers can reject deals
        if (userRole === 'Influencer') {
          // Find influencer in the deal
          const influencerInDeal = deal.influencers.find(
            (inf: any) => inf.id.toString() === userId.toString()
          );

          if (!influencerInDeal) {
            return NextResponse.json({
              success: false,
              error: 'You are not part of this deal',
            }, { status: 403 });
          }

          // Update the influencer's status to rejected
          await Deal.updateOne(
            { _id: dealId, 'influencers.id': userId.toString() },
            {
              $set: {
                'influencers.$.status': 'rejected',
              }
            }
          );

          // Check if all influencers have rejected, then update deal status
          const updatedDeal = await Deal.findById(dealId);
          const allRejected = updatedDeal.influencers.every(
            (inf: any) => inf.status === 'rejected'
          );

          if (allRejected) {
            updatedDeal.status = 'cancelled';
            await updatedDeal.save();
          }

          // Notify brand about rejection
          sendBackgroundNotification(
            deal.brandId.toString(),
            'Deal Rejected',
            `${userName} has rejected your deal ${deal.dealName}`,
            {
              url: `/brand/deals?tab=history&id=${dealId}`,
              type: 'deal_rejected',
              dealName: deal.dealName,
              dealId: dealId
            }
          );
        } else if (userRole === 'Brand' && deal.brandId.toString() === userId.toString()) {
          // The brand is rejecting a deal they created
          deal.status = 'cancelled';
          await deal.save();

          // Notify all influencers about cancellation
          if (deal.influencers && deal.influencers.length > 0) {
            for (const influencer of deal.influencers) {
              sendBackgroundNotification(
                influencer.id,
                'Deal Cancelled',
                `${userName} has cancelled the deal ${deal.dealName}`,
                {
                  url: `/influencer/deals?tab=history&id=${dealId}`,
                  type: 'deal_cancelled',
                  dealName: deal.dealName,
                  dealId: dealId
                }
              );
            }
          }
        } else {
          return NextResponse.json({
            success: false,
            error: 'You are not authorized to reject this deal',
          }, { status: 403 });
        }
        break;

      case 'submit':
        // Only influencers can submit content for deals
        if (userRole !== 'Influencer') {
          return NextResponse.json({
            success: false,
            error: 'Only influencers can submit content',
          }, { status: 403 });
        }

        // Find influencer in the deal
        const influencerSubmitting = deal.influencers.find(
          (inf: any) => inf.id.toString() === userId.toString()
        );

        if (!influencerSubmitting) {
          return NextResponse.json({
            success: false,
            error: 'You are not part of this deal',
          }, { status: 403 });
        }

        // Get content details from request body
        const contentData = await request.json();
        const { contentType, contentUrl } = contentData;

        if (!contentType || !contentUrl) {
          return NextResponse.json({
            success: false,
            error: 'Content type and URL are required',
          }, { status: 400 });
        }

        // Validate content type
        if (!['reel', 'post', 'story', 'live'].includes(contentType)) {
          return NextResponse.json({
            success: false,
            error: 'Invalid content type. Must be one of: reel, post, story, live',
          }, { status: 400 });
        }

        // Add the submitted content to the deal
        const newContent = {
          type: contentType,
          url: contentUrl,
          submittedBy: userId.toString(),
          submittedAt: new Date(),
          status: 'pending'
        };

        // Update the deal with the new content
        await Deal.updateOne(
          { _id: dealId },
          {
            $push: { submittedContent: newContent },
            $set: { status: 'ongoing' }
          }
        );

        // Notify the brand about the content submission
        sendBackgroundNotification(
          deal.brandId.toString(),
          'Content Submitted',
          `${userName} has submitted content for deal ${deal.dealName}`,
          {
            url: `/brand/deals?tab=ongoing&id=${dealId}`,
            type: 'content_submitted',
            dealName: deal.dealName,
            dealId: dealId,
            contentType: contentType
          }
        );
        break;

      case 'approve-content':
        // Only brands can approve content
        if (userRole !== 'Brand' || deal.brandId.toString() !== userId.toString()) {
          return NextResponse.json({
            success: false,
            error: 'Only the brand that created the deal can approve content',
          }, { status: 403 });
        }

        // Get content ID from request body
        const approveData = await request.json();
        const { contentId } = approveData;

        if (!contentId) {
          return NextResponse.json({
            success: false,
            error: 'Content ID is required',
          }, { status: 400 });
        }

        // Find the content in the deal
        const contentToApprove = deal.submittedContent?.find(
          (content: any) => content._id.toString() === contentId
        );

        if (!contentToApprove) {
          return NextResponse.json({
            success: false,
            error: 'Content not found',
          }, { status: 404 });
        }

        // Update the content status to approved
        await Deal.updateOne(
          { _id: dealId, 'submittedContent._id': contentId },
          {
            $set: {
              'submittedContent.$.status': 'approved',
              'submittedContent.$.reviewedAt': new Date(),
              'contentPublished': true
            }
          }
        );

        // Check if all required content is approved
        const updatedDealAfterApproval = await Deal.findById(dealId);
        const approvedContent = updatedDealAfterApproval.submittedContent?.filter(
          (content: any) => content.status === 'approved'
        ) || [];

        // Get total required content count
        const totalRequired =
          (deal.contentRequirements.reels || 0) +
          (deal.contentRequirements.posts || 0) +
          (deal.contentRequirements.stories || 0) +
          (deal.contentRequirements.lives || 0);

        // Update deal status to 'content_approved' if all required content is approved
        if (approvedContent.length >= totalRequired) {
          updatedDealAfterApproval.status = 'content_approved';
          await updatedDealAfterApproval.save();
        }

        // Notify the influencer about content approval
        sendBackgroundNotification(
          contentToApprove.submittedBy,
          'Content Approved',
          `Your content for deal ${deal.dealName} has been approved`,
          {
            url: `/influencer/deals?tab=ongoing&id=${dealId}`,
            type: 'content_approved',
            dealName: deal.dealName,
            dealId: dealId
          }
        );
        break;

      case 'reject-content':
        // Only brands can reject content
        if (userRole !== 'Brand' || deal.brandId.toString() !== userId.toString()) {
          return NextResponse.json({
            success: false,
            error: 'Only the brand that created the deal can reject content',
          }, { status: 403 });
        }

        // Get content ID and rejection comment from request body
        const rejectData = await request.json();
        const { contentId: rejectContentId, comment } = rejectData;

        if (!rejectContentId) {
          return NextResponse.json({
            success: false,
            error: 'Content ID is required',
          }, { status: 400 });
        }

        if (!comment) {
          return NextResponse.json({
            success: false,
            error: 'Rejection comment is required',
          }, { status: 400 });
        }

        // Find the content in the deal
        const contentToReject = deal.submittedContent?.find(
          (content: any) => content._id.toString() === rejectContentId
        );

        if (!contentToReject) {
          return NextResponse.json({
            success: false,
            error: 'Content not found',
          }, { status: 404 });
        }

        // Update the content status to rejected with comment
        await Deal.updateOne(
          { _id: dealId, 'submittedContent._id': rejectContentId },
          {
            $set: {
              'submittedContent.$.status': 'rejected',
              'submittedContent.$.comment': comment,
              'submittedContent.$.reviewedAt': new Date()
            }
          }
        );

        // Notify the influencer about content rejection
        sendBackgroundNotification(
          contentToReject.submittedBy,
          'Content Rejected',
          `Your content for deal ${deal.dealName} has been rejected`,
          {
            url: `/influencer/deals?tab=ongoing&id=${dealId}`,
            type: 'content_rejected',
            dealName: deal.dealName,
            dealId: dealId,
            comment: comment
          }
        );
        break;

      case 'complete':
        // Only brands can mark deals as completed
        if (userRole !== 'Brand' || deal.brandId.toString() !== userId.toString()) {
          return NextResponse.json({
            success: false,
            error: 'Only the brand that created the deal can mark it as complete',
          }, { status: 403 });
        }

        deal.status = 'completed';
        await deal.save();
        break;

      case 'cancel':
        // Only brands can cancel their own deals
        if (userRole !== 'Brand' || deal.brandId.toString() !== userId.toString()) {
          return NextResponse.json({
            success: false,
            error: 'Only the brand that created the deal can cancel it',
          }, { status: 403 });
        }

        deal.status = 'cancelled';
        await deal.save();
        break;

      case 'pay':
        // Only brands can make payments
        if (userRole !== 'Brand' || deal.brandId.toString() !== userId.toString()) {
          return NextResponse.json({
            success: false,
            error: 'Only the brand that created the deal can make payments',
          }, { status: 403 });
        }

        // Redirect to payment initiation endpoint
        // This is now handled by the payment API
        return NextResponse.json({
          success: true,
          message: 'Please use the payment API to initiate payment',
          redirectToPayment: true,
          dealId: dealId
        });
        break;

      case 'release-payment':
        // Only brands can release payments
        if (userRole !== 'Brand' || deal.brandId.toString() !== userId.toString()) {
          return NextResponse.json({
            success: false,
            error: 'Only the brand that created the deal can release payments',
          }, { status: 403 });
        }

        // Check if payment has already been released
        if (deal.paymentReleased) {
          return NextResponse.json({
            success: false,
            error: 'Payment has already been released for this deal',
          }, { status: 400 });
        }

        // Check if deal is in the correct state for payment release (ongoing or content_approved)
        if (deal.status !== 'ongoing' && deal.status !== 'content_approved') {
          return NextResponse.json({
            success: false,
            error: `Payment can only be released for ongoing deals. Current status: ${deal.status}`,
          }, { status: 400 });
        }

        console.log(`Releasing payment for deal ${dealId} - Current status: ${deal.status}`);

        // Update payment released status and deal status to completed
        const updateResult = await Deal.updateOne(
          { _id: dealId },
          {
            $set: {
              'paymentReleased': true,
              'status': 'completed'
            }
          }
        );

        console.log(`Deal update result:`, updateResult);

        if (updateResult.modifiedCount === 0) {
          console.error(`Failed to update deal ${dealId} - no documents modified`);
          return NextResponse.json({
            success: false,
            error: 'Failed to update deal status',
          }, { status: 500 });
        }

        // Notify influencers about payment release (don't let notification errors affect the main operation)
        try {
          if (deal.influencers && deal.influencers.length > 0) {
            for (const influencer of deal.influencers) {
              sendBackgroundNotification(
                influencer.id,
                'Payment Released',
                `${userName} has released payment for deal ${deal.dealName}`,
                {
                  url: `/influencer/deals?tab=completed&id=${dealId}`,
                  type: 'payment_released',
                  dealName: deal.dealName,
                  dealId: dealId,
                  amount: deal.totalAmount
                }
              );
            }
          }
        } catch (notificationError) {
          console.error('Error sending payment release notifications:', notificationError);
          // Don't fail the main operation if notifications fail
        }

        console.log(`Payment released successfully for deal ${dealId} - Status updated to completed`);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Deal ${action} successful`,
    });
  } catch (error: any) {
    console.error(`Error handling deal action:`, error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}