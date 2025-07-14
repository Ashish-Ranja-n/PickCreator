import { NextRequest, NextResponse } from 'next/server';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { paymentAnalytics } from '@/utils/paymentAnalytics';

export async function GET(request: NextRequest) {
  try {
    // Validate user authentication
    const userData = await getDataFromToken(request);
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Invalid token',
      }, { status: 401 });
    }

    // Extract user data
    const { id: userId, role: userRole } = userData;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID',
      }, { status: 401 });
    }

    // Only allow admin users to access analytics
    if (userRole !== 'Admin') {
      return NextResponse.json({
        success: false,
        error: 'Access denied - Admin role required',
      }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7');
    const dealId = url.searchParams.get('dealId');

    let analytics;

    if (dealId) {
      // Get analytics for a specific deal
      analytics = await paymentAnalytics.getDealAnalytics(dealId);
      
      if (!analytics) {
        return NextResponse.json({
          success: false,
          error: 'Failed to retrieve deal analytics',
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: {
          type: 'deal',
          dealId,
          analytics
        }
      });
    } else {
      // Get overall analytics
      analytics = await paymentAnalytics.getOverallAnalytics(days);
      
      if (!analytics) {
        return NextResponse.json({
          success: false,
          error: 'Failed to retrieve overall analytics',
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: {
          type: 'overall',
          period: `${days} days`,
          analytics
        }
      });
    }

  } catch (error: any) {
    console.error('Error retrieving payment flow analytics:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to retrieve analytics',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate user authentication
    const userData = await getDataFromToken(request);
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Invalid token',
      }, { status: 401 });
    }

    // Extract user data
    const { id: userId, role: userRole } = userData;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID',
      }, { status: 401 });
    }

    // Allow all authenticated users to track analytics events
    // Only restrict admin-level analytics viewing to admin users

    // Get request body
    const body = await request.json();
    const { eventType, dealId, merchantOrderId, metadata } = body;

    if (!eventType) {
      return NextResponse.json({
        success: false,
        error: 'Event type is required',
      }, { status: 400 });
    }

    // Track custom analytics event
    await paymentAnalytics.trackEvent({
      eventType,
      dealId,
      merchantOrderId,
      userId,
      userRole,
      metadata
    });

    return NextResponse.json({
      success: true,
      message: 'Analytics event tracked successfully'
    });

  } catch (error: any) {
    console.error('Error tracking analytics event:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to track analytics event',
    }, { status: 500 });
  }
}
