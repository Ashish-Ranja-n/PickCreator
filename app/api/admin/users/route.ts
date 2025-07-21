import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import User from '@/models/user';
import { Influencer } from '@/models/influencer';
import { Brand } from '@/models/brand';
import { Admin } from '@/models/admin';
import { getDataFromToken } from '@/helpers/getDataFromToken';

/**
 * API route for fetching users with filters (admin only)
 * GET /api/admin/users
 */
export async function GET(request: NextRequest) {
  try {
    await connect();
    
    // Get user data from token for authorization
    const userData = await getDataFromToken(request);
    if (!userData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 });
    }
    
    // Get the user ID and role from the token
    const userId = (userData as any).id || (userData as any)._id;
    const userRole = (userData as any).role;
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token - No user ID' 
      }, { status: 401 });
    }
    
    // Verify user is an admin
    if (userRole !== 'Admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Admin privileges required' 
      }, { status: 403 });
    }
    
    // Get query parameters for filtering
    const url = new URL(request.url);
    const userType = url.searchParams.get('userType'); // Brand, Influencer, Admin
    const isInstagramConnected = url.searchParams.get('isInstagramConnected');
    const isInstagramVerified = url.searchParams.get('isInstagramVerified');
    const onboardingCompleted = url.searchParams.get('onboardingCompleted');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    // Build query filters
    const filters: any = {};
    
    // Filter by user type
    if (userType && ['Brand', 'Influencer', 'Admin'].includes(userType)) {
      filters.role = userType;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    let users;
    
    if (userType === 'Influencer') {
      // For influencers, use the Influencer model to get additional fields
      const influencerFilters: any = {};
      
      // Add influencer-specific filters
      if (isInstagramConnected !== null && isInstagramConnected !== undefined) {
        influencerFilters.instagramConnected = isInstagramConnected === 'true';
      }
      
      if (isInstagramVerified !== null && isInstagramVerified !== undefined) {
        influencerFilters.isInstagramVerified = isInstagramVerified === 'true';
      }
      
      if (onboardingCompleted !== null && onboardingCompleted !== undefined) {
        influencerFilters.onboardingCompleted = onboardingCompleted === 'true';
      }
      
      users = await Influencer.find(influencerFilters)
        .select('-password -forgotPasswordToken -verifyToken -instagramToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
    } else if (userType === 'Brand') {
      // For brands, use the Brand model
      users = await Brand.find({})
        .select('-password -forgotPasswordToken -verifyToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
    } else if (userType === 'Admin') {
      // For admins, use the Admin model
      users = await Admin.find({})
        .select('-password -forgotPasswordToken -verifyToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
    } else {
      // Get all users if no specific type is requested
      users = await User.find(filters)
        .select('-password -forgotPasswordToken -verifyToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }
    
    // Get total count for pagination
    let totalCount;
    if (userType === 'Influencer') {
      const influencerFilters: any = {};
      if (isInstagramConnected !== null && isInstagramConnected !== undefined) {
        influencerFilters.instagramConnected = isInstagramConnected === 'true';
      }
      if (isInstagramVerified !== null && isInstagramVerified !== undefined) {
        influencerFilters.isInstagramVerified = isInstagramVerified === 'true';
      }
      if (onboardingCompleted !== null && onboardingCompleted !== undefined) {
        influencerFilters.onboardingCompleted = onboardingCompleted === 'true';
      }
      totalCount = await Influencer.countDocuments(influencerFilters);
    } else if (userType === 'Brand') {
      totalCount = await Brand.countDocuments({});
    } else if (userType === 'Admin') {
      totalCount = await Admin.countDocuments({});
    } else {
      totalCount = await User.countDocuments(filters);
    }
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
