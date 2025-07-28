import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/influencer';
import User from '@/models/user';
import { getDataFromToken } from '@/helpers/getDataFromToken';

/**
 * API route for getting the authenticated influencer's onboarding data
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connect();
    console.log("Influencer onboarding route: Connected to database");
    
    // Get user data from token for authorization
    const userData = await getDataFromToken(request);
    if (!userData) {
      console.log("Influencer onboarding route: No user data in token");
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 });
    }
    
    // Get the user ID from the token
    const userId = (userData as any).id || (userData as any)._id;
    if (!userId) {
      console.log("Influencer onboarding route: No user ID in token");
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token - No user ID' 
      }, { status: 401 });
    }
    
    console.log("Influencer onboarding route: Looking for influencer with user ID:", userId);
    
    // First try to find the influencer by direct ID
    let influencer = await Influencer.findById(userId).lean();
    
    // If not found by ID, try finding by user reference
    if (!influencer) {
      console.log("Influencer onboarding route: Not found by ID, trying user reference");
      influencer = await Influencer.findOne({ user: userId }).lean();
    }
    
    // If still not found, create a new influencer profile
    if (!influencer) {
      console.log("Influencer onboarding route: Influencer not found, creating new profile");
      
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
        console.log("Influencer onboarding route: Created new influencer profile");
        
        // Use the new influencer for the response
        influencer = newInfluencer.toObject();
      } else {
        console.log("Influencer onboarding route: User not found or not an influencer");
        return NextResponse.json({ 
          success: false, 
          error: 'User not found or not an influencer' 
        }, { status: 404 });
      }
    }
    
    // Extract only the onboarding-related fields
    const onboardingData = {
      influencer: {
        name: (influencer as any).name || '', // <-- Added
        age: (influencer as any).age || null,
        gender: (influencer as any).gender || '',
        bio: (influencer as any).bio || '',
        city: (influencer as any).city || '',
        onboardingCompleted: (influencer as any).onboardingCompleted || false,
        onboardingStep: (influencer as any).onboardingStep || 0,
        pricingModels: (influencer as any).pricingModels || {
          fixedPricing: {
            enabled: false
          },
          negotiablePricing: false,
          packageDeals: {
            enabled: false,
            packages: []
          },
          barterDeals: {
            enabled: false,
            acceptedCategories: []
          }
        },
        brandPreferences: (influencer as any).brandPreferences || {
          preferredBrandTypes: [],
          exclusions: [],
          collabStyles: []
        },
        availability: (influencer as any).availability || []
      }
    };
    
    console.log("Influencer onboarding route: Successfully retrieved onboarding data");
    
    // Return the onboarding data
    return NextResponse.json(onboardingData);
  } catch (error) {
    console.error("Error getting influencer onboarding data:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get influencer onboarding data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT: Update influencer onboarding data
export async function PUT(request: NextRequest) {
  try {
    // Get user data from token (automatically checks Authorization header and cookies)
    const userData = await getDataFromToken(request);
    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use either id or _id
    const userId = (userData as any).id || (userData as any)._id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Debug logging
    console.log('Onboarding PUT - Request body:', JSON.stringify(body));
    console.log('Onboarding PUT - User ID:', userId);
    
    // Connect to database
    await connect();
    
    // Format the data for update
    const updateData: any = {};
    
    // Handle personal info fields
    if ('name' in body) {
      updateData.name = body.name;
      console.log('Onboarding PUT - Setting name:', body.name);
    }
    if ('age' in body) {
      updateData.age = body.age;
      console.log('Onboarding PUT - Setting age:', body.age);
    }
    // Only update gender if it is present and not an empty string
    if ('gender' in body && body.gender !== undefined && body.gender !== '') {
      updateData.gender = body.gender;
      console.log('Onboarding PUT - Setting gender:', body.gender);
    }
    if ('mobile' in body) {
      updateData.mobile = body.mobile;
      console.log('Onboarding PUT - Setting mobile:', body.mobile);
    }
    // Handle basic info fields
    if ('bio' in body) {
      updateData.bio = body.bio;
      console.log('Onboarding PUT - Setting bio:', body.bio);
    }
    
    if ('city' in body) {
      updateData.city = body.city;
      console.log('Onboarding PUT - Setting city:', body.city);
    }
    
    // Handle pricing models
    if ('fixedPricing' in body || 'negotiablePricing' in body || 'packageDeals' in body || 'barterDeals' in body) {
      updateData.pricingModels = updateData.pricingModels || {};
      
      if ('fixedPricing' in body) {
        updateData.pricingModels.fixedPricing = body.fixedPricing;
        console.log('Onboarding PUT - Setting fixedPricing:', JSON.stringify(body.fixedPricing));
      }
      
      if ('negotiablePricing' in body) {
        updateData.pricingModels.negotiablePricing = body.negotiablePricing;
        console.log('Onboarding PUT - Setting negotiablePricing:', body.negotiablePricing);
      }
      
      if ('packageDeals' in body) {
        updateData.pricingModels.packageDeals = body.packageDeals;
        console.log('Onboarding PUT - Setting packageDeals:', JSON.stringify(body.packageDeals));
      }
      
      if ('barterDeals' in body) {
        updateData.pricingModels.barterDeals = body.barterDeals;
        console.log('Onboarding PUT - Setting barterDeals:', JSON.stringify(body.barterDeals));
      }
    }
    
    // Handle brand preferences
    if ('brandPreferences' in body) {
      updateData.brandPreferences = body.brandPreferences;
      console.log('Onboarding PUT - Setting brandPreferences:', JSON.stringify(body.brandPreferences));
    }
    
    // Handle availability
    if ('availability' in body) {
      updateData.availability = body.availability;
      console.log('Onboarding PUT - Setting availability:', JSON.stringify(body.availability));
    }
    
    // Handle onboarding status
    if ('onboardingCompleted' in body) {
      updateData.onboardingCompleted = body.onboardingCompleted;
      console.log('Onboarding PUT - Setting onboardingCompleted:', body.onboardingCompleted);
    }
    
    if ('onboardingStep' in body) {
      updateData.onboardingStep = body.onboardingStep;
      console.log('Onboarding PUT - Setting onboardingStep:', body.onboardingStep);
    }
    
    console.log('Onboarding PUT - Final update data:', JSON.stringify(updateData));
    
    // Check if we have data to update
    if (Object.keys(updateData).length === 0) {
      console.log('Onboarding PUT - No data to update');
      return NextResponse.json({ 
        success: false, 
        error: 'No data provided for update' 
      }, { status: 400 });
    }
    
    // Find the influencer first
    const existingInfluencer = await Influencer.findById(userId);
    
    if (!existingInfluencer) {
      console.log('Onboarding PUT - Influencer not found, creating new record');
      
      // Create a new influencer if it doesn't exist
      const newInfluencer = new Influencer({
        _id: userId,
        ...updateData
      });
      
      await newInfluencer.save();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Influencer profile created successfully',
        influencer: newInfluencer
      });
    }
    
    // Update the influencer
    const updatedInfluencer = await Influencer.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedInfluencer) {
      console.log('Onboarding PUT - Influencer not found for update');
      return NextResponse.json({ error: 'Influencer not found' }, { status: 404 });
    }
    
    console.log('Onboarding PUT - Update successful for influencer:', userId);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Influencer data updated successfully',
      influencer: {
        name: updatedInfluencer.name,
        bio: updatedInfluencer.bio,
        city: updatedInfluencer.city,
        pricingModels: updatedInfluencer.pricingModels,
        brandPreferences: updatedInfluencer.brandPreferences,
        availability: updatedInfluencer.availability,
        onboardingCompleted: updatedInfluencer.onboardingCompleted,
        onboardingStep: updatedInfluencer.onboardingStep
      }
    });
  } catch (error) {
    console.error('Error updating influencer onboarding data:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}