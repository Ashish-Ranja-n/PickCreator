import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/influencer';
import User from '@/models/user';
import { getDataFromToken } from '@/helpers/getDataFromToken';


/**
 * API route for getting influencer profile data
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Connect to the database
    await connect();
    console.log("Influencer profile GET: Connected to database");
    
    // Get the influencer ID from the URL - properly awaiting params in Next.js 15
    const params = await context.params;
    const influencerId = params.id;
    console.log("Influencer profile GET: Looking for influencer with ID:", influencerId);
    
    // Get user data from token for authorization
    const userData = await getDataFromToken(request);
    if (!userData) {
      console.log("Influencer profile GET: No user data in token");
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 });
    }
    
    // Find the influencer in the database
    let influencer = await Influencer.findById(influencerId).lean();
    
    // If not found by ID, try finding by user reference
    if (!influencer) {
      console.log("Influencer profile GET: Not found by ID, trying user reference");
      influencer = await Influencer.findOne({ user: influencerId }).lean();
    }
    
    // If still not found, check if this is the authenticated user and create a new influencer profile
    if (!influencer) {
      console.log("Influencer profile GET: Influencer not found, checking if we should create one");
      
      // Get the user ID from the token
      const userId = (userData as any).id || (userData as any)._id;
      
      // Only create a new profile if the requested ID matches the authenticated user's ID
      if (userId === influencerId) {
        console.log("Influencer profile GET: Creating new influencer profile for user:", userId);
        
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
          console.log("Influencer profile GET: Created new influencer profile");
          
          // Use the new influencer for the response
          influencer = newInfluencer.toObject();
        } else {
          console.log("Influencer profile GET: User not found or not an influencer");
          return NextResponse.json({ 
            success: false, 
            error: 'User not found or not an influencer' 
          }, { status: 404 });
        }
      } else {
        console.log("Influencer profile GET: Influencer not found");
        return NextResponse.json({ 
          success: false, 
          error: 'Influencer not found' 
        }, { status: 404 });
      }
    }
    
    console.log("Influencer profile GET: Influencer found");
    
    // Get the user data to include name and email
    const user = await User.findById(influencerId, 'name email').lean();
    
    // Combine user and influencer data using type assertion to avoid TypeScript errors
    const profileData = {
      ...(influencer as any),
      name: (user as any)?.name || '',
      email: (user as any)?.email || '',
      // Add default values for fields that might be undefined
      bio: (influencer as any).bio || '',
      socialMediaLinks: (influencer as any).socialMediaLinks || [],
      rating: 0,
      completedDeals: 0,
      // Don't include sensitive information like tokens
      instagramConnected: !!(influencer as any).instagramConnected,
      instagramUsername: (influencer as any).instagramUsername || '',
      followerCount: (influencer as any).followerCount || 0,
      profilePictureUrl: (influencer as any).profilePictureUrl || ''
    };
    
    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error getting influencer profile:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get influencer profile' 
    }, { status: 500 });
  }
}

/**
 * API route for updating influencer profile data
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Connect to the database
    await connect();
    console.log("Influencer profile PATCH: Connected to database");
    
    // Get the influencer ID from the URL - properly awaiting params in Next.js 15
    const params = await context.params;
    const influencerId = params.id;
    console.log("Influencer profile PATCH: Updating influencer with ID:", influencerId);
    
    // Get user data from token for authorization
    const userData = await getDataFromToken(request);
    if (!userData) {
      console.log("Influencer profile PATCH: No user data in token");
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 });
    }
    
    // Check if the user is updating their own profile
    const userId = (userData as any).id || (userData as any)._id;
    if (userId !== influencerId) {
      console.log("Influencer profile PATCH: User trying to update someone else's profile");
      return NextResponse.json({ 
        success: false, 
        error: 'You can only update your own profile' 
      }, { status: 403 });
    }
    
    // Get the update data from the request body
    const updateData = await request.json();
    console.log("Influencer profile PATCH: Update data:", updateData);
    
    // Only allow certain fields to be updated
    const allowedFields = ['bio', 'socialMediaLinks'];
    const filteredData: any = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });
    
    if (Object.keys(filteredData).length === 0) {
      console.log("Influencer profile PATCH: No valid fields to update");
      return NextResponse.json({ 
        success: false, 
        error: 'No valid fields to update' 
      }, { status: 400 });
    }
    
    // Find and update the influencer
    let influencer = await Influencer.findById(influencerId);
    
    // If not found by ID, try finding by user reference
    if (!influencer) {
      console.log("Influencer profile PATCH: Not found by ID, trying user reference");
      influencer = await Influencer.findOne({ user: influencerId });
    }
    
    if (!influencer) {
      console.log("Influencer profile PATCH: Influencer not found");
      return NextResponse.json({ 
        success: false, 
        error: 'Influencer not found' 
      }, { status: 404 });
    }
    
    // Update the influencer document
    Object.keys(filteredData).forEach(key => {
      (influencer as any)[key] = filteredData[key];
    });
    
    // Ensure the user field is set
    if (!(influencer as any).user) {
      (influencer as any).user = userId;
    }
    
    await influencer.save();
    console.log("Influencer profile PATCH: Successfully updated influencer");
    
    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: influencer
    });
  } catch (error) {
    console.error('Error updating influencer profile:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update influencer profile' 
    }, { status: 500 });
  }
} 