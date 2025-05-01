import { NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import Post from "@/models/post";
import { getDataFromToken } from "@/helpers/getDataFromToken";

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
    
    // Access params.id directly - no need to await or destructure
    const { id } = await params;
    const postId = id;
    const post = await Post.findById(postId);
    
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    
    // Check if user already liked the post
    const userIdStr = userId.toString();
    const userLiked = post.likes.some((likeId: any) => 
      likeId.toString() === userIdStr
    );
    
    // Toggle like status
    if (userLiked) {
      // Unlike: Remove user from likes array
      post.likes = post.likes.filter((likeId: any) => 
        likeId.toString() !== userIdStr
      );
    } else {
      // Like: Add user to likes array
      post.likes.push(userId);
    }
    
    await post.save();
    
    return NextResponse.json({ 
      liked: !userLiked,
      likesCount: post.likes.length 
    });
  } catch (error: any) {
    console.error("Error liking post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 