import { NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import Post from "@/models/post";
import { getDataFromToken } from "@/helpers/getDataFromToken";

// Get a single post
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
    const post = await Post.findById(id)
      .populate("author", "name profilePictureUrl username role")
      .lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update a post
export async function PATCH(
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
    const { content, media, hashtags, mentions } = await req.json();

    const post = await Post.findOneAndUpdate(
      { _id: id, author: userId },
      { content, media, hashtags, mentions },
      { new: true }
    );

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a post
export async function DELETE(
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
    const userRole = userData.role;
    
    if (!userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 401 });
    }

    const { id } = await params;
    
    // If user is admin, allow deleting any post
    if (userRole === 'Admin') {
      const post = await Post.findByIdAndDelete(id);
      
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      
      return NextResponse.json({ message: "Post deleted successfully" });
    }
    
    // For regular users, only allow deleting their own posts
    const post = await Post.findOneAndDelete({
      _id: id,
      author: userId,
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found or not authorized to delete" }, { status: 404 });
    }

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 