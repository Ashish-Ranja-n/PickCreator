'use server'

import { NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import User from "@/models/user";
import Post from "@/models/post";
import Comment from "@/models/comment";
import Question from "@/models/question";
import Answer from "@/models/answer";
import Vote from "@/models/vote";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect(); // Ensure database connection

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    // Find the user first to make sure they exist
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log(`Deleting user with ID: ${id}`);

    // Delete all posts created by the user
    const deletedPosts = await Post.deleteMany({ author: id });
    console.log(`Deleted ${deletedPosts.deletedCount} posts`);

    // Delete all comments created by the user
    const deletedComments = await Comment.deleteMany({ author: id });
    console.log(`Deleted ${deletedComments.deletedCount} comments`);

    // Delete all questions created by the user
    const deletedQuestions = await Question.deleteMany({ author: id });
    console.log(`Deleted ${deletedQuestions.deletedCount} questions`);

    // Delete all answers created by the user
    const deletedAnswers = await Answer.deleteMany({ author: id });
    console.log(`Deleted ${deletedAnswers.deletedCount} answers`);

    // Delete all votes created by the user
    const deletedVotes = await Vote.deleteMany({ user: id });
    console.log(`Deleted ${deletedVotes.deletedCount} votes`);

    // Delete the user
    await User.findByIdAndDelete(id);
    console.log(`User ${id} deleted successfully`);

    const response = NextResponse.json({
        message: "User and all associated content deleted successfully",
        success: true,
    })
    response.cookies.set("token", "", { httpOnly: true });
    return response;

  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
