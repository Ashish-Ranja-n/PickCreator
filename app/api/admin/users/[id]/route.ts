import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import User from '@/models/user';
import { Influencer } from '@/models/influencer';
import { Brand } from '@/models/brand';
import { Admin } from '@/models/admin';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import mongoose from 'mongoose';

/**
 * API route for updating a specific user (admin only)
 * PATCH /api/admin/users/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params;
    
    // Validate the user ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid user ID' 
      }, { status: 400 });
    }
    
    // Get the update data from request body
    const updateData = await request.json();
    
    // Define allowed fields for each user type
    const allowedFields = {
      common: ['name', 'email', 'avatar', 'isVerified'],
      Influencer: [
        'instagramUsername', 
        'followerCount', 
        'isInstagramVerified',
        'instagramConnected',
        'onboardingCompleted',
        'city',
        'bio'
      ],
      Brand: [
        'companyName',
        'businessType',
        'website',
        'logo',
        'bio',
        'location',
        'onboardingCompleted',
        'verifiedBrand'
      ],
      Admin: [
        'permissions',
        'bio'
      ]
    };
    
    // First, find the user to determine their role
    const user = await User.findById(id).select('role');
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    // Filter update data to only include allowed fields
    const filteredUpdateData: any = {};
    
    // Add common fields
    allowedFields.common.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    });
    
    // Add role-specific fields
    if (user.role && allowedFields[user.role as keyof typeof allowedFields]) {
      allowedFields[user.role as keyof typeof allowedFields].forEach(field => {
        if (updateData[field] !== undefined) {
          filteredUpdateData[field] = updateData[field];
        }
      });
    }
    
    // Validate that we have at least one field to update
    if (Object.keys(filteredUpdateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid update fields provided'
      }, { status: 400 });
    }

    // Additional validation for specific fields
    if (filteredUpdateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(filteredUpdateData.email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    if (filteredUpdateData.followerCount && (filteredUpdateData.followerCount < 0 || !Number.isInteger(filteredUpdateData.followerCount))) {
      return NextResponse.json({
        success: false,
        error: 'Follower count must be a non-negative integer'
      }, { status: 400 });
    }

    if (filteredUpdateData.website && filteredUpdateData.website.trim() && !filteredUpdateData.website.match(/^https?:\/\/.+/)) {
      return NextResponse.json({
        success: false,
        error: 'Website must be a valid URL starting with http:// or https://'
      }, { status: 400 });
    }
    
    // Perform the update based on user role
    let updatedUser;
    
    if (user.role === 'Influencer') {
      updatedUser = await Influencer.findByIdAndUpdate(
        id,
        { $set: filteredUpdateData },
        { new: true, runValidators: true }
      ).select('-password -forgotPasswordToken -verifyToken -instagramToken');
    } else if (user.role === 'Brand') {
      updatedUser = await Brand.findByIdAndUpdate(
        id,
        { $set: filteredUpdateData },
        { new: true, runValidators: true }
      ).select('-password -forgotPasswordToken -verifyToken');
    } else if (user.role === 'Admin') {
      updatedUser = await Admin.findByIdAndUpdate(
        id,
        { $set: filteredUpdateData },
        { new: true, runValidators: true }
      ).select('-password -forgotPasswordToken -verifyToken');
    } else {
      // Fallback to base User model
      updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: filteredUpdateData },
        { new: true, runValidators: true }
      ).select('-password -forgotPasswordToken -verifyToken');
    }
    
    if (!updatedUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update user' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * API route for getting a specific user (admin only)
 * GET /api/admin/users/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Verify user is an admin
    const userRole = (userData as any).role;
    if (userRole !== 'Admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Admin privileges required' 
      }, { status: 403 });
    }
    
    const { id } = await params;
    
    // Validate the user ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid user ID' 
      }, { status: 400 });
    }
    
    // Find the user
    const user = await User.findById(id)
      .select('-password -forgotPasswordToken -verifyToken')
      .lean();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch user',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
