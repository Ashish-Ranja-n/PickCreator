import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import User from "@/models/user";
import { Influencer } from "@/models/influencer";
import Post from "@/models/post";
import Comment from "@/models/comment";
import Question from "@/models/question";
import Answer from "@/models/answer";
import Vote from "@/models/vote";
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

    // Find the user
    const user = await User.findOne({ email });

    if (!user) {
      console.log("Delete account: User not found");
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const userId = user._id;

    // Delete all posts created by the user
    const deletedPosts = await Post.deleteMany({ author: userId });
    console.log(`Deleted ${deletedPosts.deletedCount} posts`);

    // Delete all comments created by the user
    const deletedComments = await Comment.deleteMany({ author: userId });
    console.log(`Deleted ${deletedComments.deletedCount} comments`);

    // Delete all questions created by the user
    const deletedQuestions = await Question.deleteMany({ author: userId });
    console.log(`Deleted ${deletedQuestions.deletedCount} questions`);

    // Delete all answers created by the user
    const deletedAnswers = await Answer.deleteMany({ author: userId });
    console.log(`Deleted ${deletedAnswers.deletedCount} answers`);

    // Delete all votes created by the user
    const deletedVotes = await Vote.deleteMany({ user: userId });
    console.log(`Deleted ${deletedVotes.deletedCount} votes`);

    // Check if user is an influencer and delete related data
    if (user.role === 'Influencer') {
      console.log("Delete account: Deleting influencer data");
      await Influencer.findOneAndDelete({ user: userId });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    console.log("Delete account: User and all associated content successfully deleted");

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Account and all associated content successfully deleted'
    });
  } catch (error: any) {
    console.error('Error deleting account:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to delete account'
    }, { status: 500 });
  }
}