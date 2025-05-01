import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { User, Brand } from '@/models';
import { getDataFromToken } from '@/helpers/getDataFromToken';

interface UserDocument {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface BrandDocument {
  _id: string;
  companyName?: string;
  website?: string;
  logo?: string;
  bio?: string;
  phoneNumber?: string;
  location?: string;
}

/**
 * API route for getting the authenticated brand's profile data
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connect();
    console.log("Brand profile route: Connected to database");
    
    // Get user data from token for authorization
    const userData = await getDataFromToken(request);
    if (!userData) {
      console.log("Brand profile route: No user data in token");
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 });
    }
    
    // Get the user ID from the token
    const userId = (userData as any).id || (userData as any)._id;
    if (!userId) {
      console.log("Brand profile route: No user ID in token");
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token - No user ID' 
      }, { status: 401 });
    }
    
    // Find the brand by ID
    const brand = await Brand.findById(userId).lean() as BrandDocument | null;
    
    // If not found by direct ID, try finding by user reference
    if (!brand) {
      console.log("Brand profile route: Brand not found, retrieving user");
      
      // Get the user data with explicit type
      const user = await User.findById(userId, 'name email role avatar').lean() as UserDocument | null;
      
      if (!user) {
        console.log("Brand profile route: User not found");
        return NextResponse.json({ 
          success: false, 
          error: 'User not found' 
        }, { status: 404 });
      }
      
      // Return basic user info if user exists but no brand profile
      return NextResponse.json({
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        companyName: '',
        website: '',
        logo: '',
        bio: '',
        phoneNumber: '',
        location: ''
      });
    }
    
    // Get user data to include name, email and avatar with explicit type
    const user = await User.findById(userId, 'name email avatar').lean() as UserDocument | null;
    
    if (!user) {
      console.log("Brand profile route: User not found");
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    // Extract only the fields we need for the profile response
    const profileData = {
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      companyName: brand.companyName || '',
      website: brand.website || '',
      logo: brand.logo || '',
      bio: brand.bio || '',
      phoneNumber: brand.phoneNumber || '',
      location: brand.location || ''
    };
    
    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error getting brand profile:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get brand profile' 
    }, { status: 500 });
  }
}

/**
 * API route for updating the authenticated brand's profile data
 */
export async function PATCH(request: NextRequest) {
  try {
    // Connect to the database
    await connect();
    console.log("Brand profile update: Connected to database");
    
    // Get user data from token for authorization
    const userData = await getDataFromToken(request);
    if (!userData) {
      console.log("Brand profile update: No user data in token");
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 });
    }
    
    // Get the user ID from the token
    const userId = (userData as any).id || (userData as any)._id;
    if (!userId) {
      console.log("Brand profile update: No user ID in token");
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token - No user ID' 
      }, { status: 401 });
    }
    
    // Get the update data from the request body
    const updateData = await request.json();
    console.log("Brand profile update: Received update data:", updateData);
    
    // Only allow updating specific fields
    const allowedBrandFields = ['companyName', 'website', 'logo', 'bio', 'phoneNumber', 'location'];
    const allowedUserFields = ['name', 'avatar'];
    
    const brandUpdateData: Record<string, any> = {};
    const userUpdateData: Record<string, any> = {};
    
    // Filter out any fields that are not allowed
    for (const field of allowedBrandFields) {
      if (field in updateData) {
        brandUpdateData[field] = updateData[field];
      }
    }
    
    for (const field of allowedUserFields) {
      if (field in updateData) {
        userUpdateData[field] = updateData[field];
      }
    }
    
    // Update user data if needed
    if (Object.keys(userUpdateData).length > 0) {
      await User.updateOne(
        { _id: userId },
        { $set: userUpdateData }
      );
    }
    
    // Try updating brand using direct ID
    const result = await Brand.updateOne(
      { _id: userId },
      { $set: brandUpdateData }
    );
    
    // If no document was matched, try finding by creating a new brand profile
    if (result.matchedCount === 0) {
      console.log("Brand profile update: No brand found, creating a new one");
      
      // Create a new brand profile with the user ID
      const newBrand = new Brand({
        _id: userId,
        ...brandUpdateData
      });
      
      // Save the new brand profile
      await newBrand.save();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Brand profile created successfully'
      });
    }
    
    console.log("Brand profile update: Successfully updated profile");
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error updating brand profile:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update brand profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 