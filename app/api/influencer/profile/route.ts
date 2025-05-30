import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/influencer';
import User from '@/models/user';
import { getDataFromToken } from '@/helpers/getDataFromToken';

/**
 * API route for getting the authenticated influencer's profile data
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connect();
    console.log("Influencer profile route: Connected to database");
    
    // Get user data from token for authorization
    const userData = await getDataFromToken(request);
    if (!userData) {
      console.log("Influencer profile route: No user data in token");
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 });
    }
    
    // Get the user ID from the token
    const userId = (userData as any).id || (userData as any)._id;
    if (!userId) {
      console.log("Influencer profile route: No user ID in token");
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token - No user ID' 
      }, { status: 401 });
    }
    
    console.log("Influencer profile route: Looking for influencer with user ID:", userId);
    
    // First try to find the influencer by direct ID
    let influencer = await Influencer.findById(userId).lean();
    
    // If not found by ID, try finding by user reference
    if (!influencer) {
      console.log("Influencer profile route: Not found by ID, trying user reference");
      influencer = await Influencer.findOne({ user: userId }).lean();
    }
    
    // If still not found, create a new influencer profile
    if (!influencer) {
      console.log("Influencer profile route: Influencer not found, checking if we should create one");
      
      // Get the user data to include name and email
      const user = await User.findById(userId, 'name email role').lean();
      
      // Only create if the user exists and has the Influencer role
      if (user && (user as any).role === 'Influencer') {
        // Create a new influencer profile
        const newInfluencer = new Influencer({
          _id: userId,
          bio: '',
          socialMediaLinks: [],
          instagramConnected: false,
          onboardingCompleted: false,
          onboardingStep: 0
        });
        
        // Save the new influencer profile
        await newInfluencer.save();
        console.log("Influencer profile route: Created new influencer profile");
        
        // Use the new influencer for the response
        influencer = newInfluencer.toObject();
      } else {
        console.log("Influencer profile route: User not found or not an influencer");
        return NextResponse.json({ 
          success: false, 
          error: 'User not found or not an influencer' 
        }, { status: 404 });
      }
    }
    
    // Get user data to include name and email
    const user = await User.findById(userId, 'name email role').lean();
    
    if (!user) {
      console.log("Influencer profile route: User not found");
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    // Extract only the fields we need for the profile response
    const profileData = {
      name: (user as any).name,
      email: (user as any).email,
      bio: (influencer as any).bio || '',
      socialMediaLinks: (influencer as any).socialMediaLinks || [],
      rating: (influencer as any).rating || 0,
      completedDeals: (influencer as any).completedDeals || 0,
      mobile: (influencer as any).mobile || '',
      city: (influencer as any).city || '',
      gender: (influencer as any).gender || '',
      age: (influencer as any).age || ''
    };
    
    console.log("Influencer profile route: Successfully retrieved profile data");
    
    // Return the profile data
    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Error getting influencer profile:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get influencer profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * API route for updating the authenticated influencer's profile data
 */
export async function PATCH(request: NextRequest) {
  try {
    // Connect to the database
    await connect();
    console.log("Influencer profile update: Connected to database");
    
    // Get user data from token for authorization
    const userData = await getDataFromToken(request);
    if (!userData) {
      console.log("Influencer profile update: No user data in token");
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 });
    }
    
    // Get the user ID from the token
    const userId = (userData as any).id || (userData as any)._id;
    if (!userId) {
      console.log("Influencer profile update: No user ID in token");
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token - No user ID' 
      }, { status: 401 });
    }
    
    // Get the update data from the request body
    const updateData = await request.json();
    console.log("Influencer profile update: Received update data:", updateData);
    
    // Only allow updating specific fields
    const allowedFields = ['bio', 'socialMediaLinks'];
    const filteredUpdateData: Record<string, any> = {};
    
    // Filter out any fields that are not allowed
    for (const field of allowedFields) {
      if (field in updateData) {
        filteredUpdateData[field] = updateData[field];
      }
    }
    
    if (Object.keys(filteredUpdateData).length === 0) {
      console.log("Influencer profile update: No valid update fields provided");
      return NextResponse.json({ 
        success: false, 
        error: 'No valid update fields provided' 
      }, { status: 400 });
    }
    
    // Try updating using direct ID first
    let result = await Influencer.updateOne(
      { _id: userId },
      { $set: filteredUpdateData }
    );
    
    // If no document was modified, try updating using user reference
    if (result.matchedCount === 0) {
      console.log("Influencer profile update: No match by ID, trying user reference");
      result = await Influencer.updateOne(
        { user: userId },
        { $set: filteredUpdateData }
      );
    }
    
    if (result.matchedCount === 0) {
      console.log("Influencer profile update: Influencer not found");
      return NextResponse.json({ 
        success: false, 
        error: 'Influencer not found' 
      }, { status: 404 });
    }
    
    console.log("Influencer profile update: Successfully updated profile");
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error updating influencer profile:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update influencer profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 