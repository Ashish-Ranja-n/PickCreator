import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Deal } from '@/models/deal';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { User } from '@/models';
import { sendBackgroundNotification } from '@/utils/dealNotifications';

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connect();

    // Get user data from token for authorization
    const userData = await getDataFromToken(request);
    if (!userData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 });
    }
    
    // Get the user ID from the token
    const userId = (userData as any).id || (userData as any)._id;
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token - No user ID' 
      }, { status: 401 });
    }
    
    // Get brand information
    const brand = await User.findById(userId).lean();
    if (!brand) {
      return NextResponse.json({ 
        success: false, 
        error: 'Brand not found' 
      }, { status: 404 });
    }

    // Get companyName and location if present (for Brand discriminator)
    const companyName = (brand as any).companyName || '';
    const location = (brand as any).location || '';
    
    // Parse request body
    const dealData = await request.json();
    
    // Validate required fields based on deal type
    if (!dealData.dealType || !['single', 'multiple'].includes(dealData.dealType)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid deal type' 
      }, { status: 400 });
    }

    if (!dealData.dealName || !dealData.influencers || dealData.influencers.length < 1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Calculate total amount based on deal type and requirements
    let totalAmount = 0;
    
    if (dealData.usePackageDeals && dealData.selectedPackage) {
      totalAmount = dealData.selectedPackage.totalPrice;
    } else if (dealData.isNegotiating) {
      totalAmount = dealData.offerAmount;
    } else if (dealData.isProductExchange) {
      totalAmount = dealData.productPrice;
    } else if (dealData.dealType === 'multiple') {
      totalAmount = dealData.payPerInfluencer * dealData.influencers.length;
    } else {
      totalAmount = dealData.totalAmount || 0;
    }
    
    // Create new deal
    const newDeal = new Deal({
      brandId: userId,
      brandName: (brand as any).name || 'Unknown Brand',
      brandProfilePic: (brand as any).profilePictureUrl || (brand as any).avatar || '',
      companyName,
      location,
      dealType: dealData.dealType,
      dealName: dealData.dealName,
      description: dealData.description || '',
      budget: dealData.budget || totalAmount,
      payPerInfluencer: dealData.payPerInfluencer || totalAmount,
      influencers: dealData.influencers.map((inf: any) => ({
        ...inf,
        profilePictureUrl: inf.profilePictureUrl || ''
      })),
      contentRequirements: dealData.contentRequirements || {
        reels: 0,
        posts: 0,
        stories: 0,
        lives: 0
      },
      usePackageDeals: dealData.usePackageDeals || false,
      selectedPackage: dealData.selectedPackage || null,
      visitRequired: dealData.visitRequired || false,
      isNegotiating: dealData.isNegotiating || false,
      offerAmount: dealData.offerAmount || 0,
      isProductExchange: dealData.isProductExchange || false,
      productName: dealData.productName || '',
      productPrice: dealData.productPrice || 0,
      status: "requested",
      paymentStatus: "unpaid",
      createdAt: new Date(),
      totalAmount: totalAmount
    });
    
    // Save the deal to the database
    await newDeal.save();
    
    // Send notifications to influencers for deal requests
    const brandName = (brand as any).name || 'A brand';
    
    // For single deals, notify the specific influencer
    if (dealData.dealType === 'single' && dealData.influencers.length === 1) {
      const influencerId = dealData.influencers[0].id;
      
      // Send notification to influencer in the background
      sendBackgroundNotification(
        influencerId,
        'New Connect Request',
        `${brandName} has sent you a collaboration request`,
        {
          url: `/influencer/deals?tab=requested&id=${newDeal._id.toString()}`,
          type: 'connect_request',
          brandName,
          dealName: dealData.dealName,
          dealId: newDeal._id.toString()
        }
      );
    } else if (dealData.dealType === 'multiple') {
      // For multiple deals, notify each influencer
      for (const influencer of dealData.influencers) {
        sendBackgroundNotification(
          influencer.id,
          'New Connect Request',
          `${brandName} has sent you a collaboration request`,
          {
            url: `/influencer/deals?tab=requested&id=${newDeal._id.toString()}`,
            type: 'connect_request',
            brandName,
            dealName: dealData.dealName,
            dealId: newDeal._id.toString()
          }
        );
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Deal created successfully',
      deal: newDeal
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connect();
    
    // Get user data from token for authorization
    const userData = await getDataFromToken(request);
    if (!userData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 });
    }
    
    // Get the user ID from the token
    const userId = (userData as any).id || (userData as any)._id;
    const userRole = (userData as any).role;
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token - No user ID' 
      }, { status: 401 });
    }
    
    let deals;
    
    // Filter deals based on user role
    if (userRole === 'Influencer') {
      // For influencers, find deals where they are included in the influencers array
      deals = await Deal.find({ 
        "influencers.id": userId.toString() 
      }).sort({ createdAt: -1 });
      
      console.log(`Found ${deals.length} deals for influencer ${userId}`);
    } else {
      // For brands, find deals they created
      deals = await Deal.find({ brandId: userId }).sort({ createdAt: -1 });
      console.log(`Found ${deals.length} deals for brand ${userId}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      deals
    });
    
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
} 