import { NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import Post from "@/models/post";
import Comment from "@/models/comment";
import { getDataFromToken } from "@/helpers/getDataFromToken";
import mongoose from "mongoose";

// Get comments for a post
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    // Check if post exists
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Fetch comments for the post with pagination
    const comments = await Comment.find({ post: id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "name profilePictureUrl username instagramUsername role")
      .lean();

    // Get total count for pagination
    const totalComments = await Comment.countDocuments({ post: id });

    return NextResponse.json({
      comments,
      pagination: {
        total: totalComments,
        page,
        limit,
        pages: Math.ceil(totalComments / limit)
      }
    });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Add a comment to a post
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    
    // Get the current user from the token
    const userData = await getDataFromToken(req as any);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Use either id or _id
    const userId = userData.id || userData._id;
    
    if (!userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 401 });
    }
    
    const { id } = await params;
    const { content } = await req.json();
    
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }
    
    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    // Check if post exists
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    
    // Create the comment
    const comment = await Comment.create({
      content: content.trim(),
      author: userId,
      post: id
    });
    
    // Increment comment count on the post
    await Post.findByIdAndUpdate(id, { $inc: { commentCount: 1 } });
    
    // Populate author information for the response
    const populatedComment = await Comment.findById(comment._id)
      .populate("author", "name profilePictureUrl username instagramUsername role")
      .lean();
    
    return NextResponse.json(populatedComment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
