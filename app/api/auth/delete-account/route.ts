import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import User from "@/models/user";
import { Influencer } from "@/models/influencer";
import { getDataFromToken } from "@/helpers/getDataFromToken";

/**
 * API route for deleting a user account
 * This is used when an influencer cannot connect their Instagram account
 */
export async function DELETE(request: NextRequest) {
  try {
    // Connect to the database
    await connect();
    console.log("Delete account: Connected to database");
    
    // Get user data from token for authentication
    const userData = await getDataFromToken(request);
    if (!userData) {
      console.log("Delete account: No user data in token");
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 });
    }
    
    // Get the email from the request body
    const requestData = await request.json();
    const { email } = requestData;
    
    if (!email) {
      console.log("Delete account: No email provided");
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 });
    }
    
    // Verify that the token user is the same as the requested deletion user
    const tokenUserEmail = (userData as any).email;
    
    if (tokenUserEmail !== email) {
      console.log("Delete account: Token user email doesn't match requested email");
      return NextResponse.json({ 
        success: false, 
        error: 'You can only delete your own account' 
      }, { status: 403 });
    }
    
    console.log(`Delete account: Deleting user with email ${email}`);
    
    // Find and delete the user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log("Delete account: User not found");
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    // Check if user is an influencer and delete related data
    if (user.role === 'Influencer') {
      console.log("Delete account: Deleting influencer data");
      await Influencer.findOneAndDelete({ user: user._id });
    }
    
    // Delete the user
    await User.findByIdAndDelete(user._id);
    
    console.log("Delete account: User successfully deleted");
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Account successfully deleted'
    });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete account' 
    }, { status: 500 });
  }
} 