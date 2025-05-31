import { NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import Post from "@/models/post";
import { getDataFromToken } from "@/helpers/getDataFromToken";

// Create a new post
export async function POST(req: Request) {
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

    const { content, media, hashtags, mentions } = await req.json();

    const post = await Post.create({
      content,
      media,
      hashtags,
      mentions,
      author: userId,
    });

    // Populate the author information for the response
    const populatedPost = await Post.findById(post._id)
      .populate("author", "name profilePictureUrl username instagram")
      .lean();

    return NextResponse.json(populatedPost, { status: 201 });
  } catch (error: any) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get all posts or filter by author
export async function GET(req: Request) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const author = searchParams.get("author");
    const userId = searchParams.get("userId");
    const hashtag = searchParams.get("hashtag");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sort = searchParams.get("sort") || "latest";

    // Build query
    const query: any = {};

    // Filter by hashtag if specified
    if (hashtag) {
      query.hashtags = hashtag;
    }

    // Filter by author if specified
    if (author) {
      if (author === "me") {
        // Get the current user from the token
        const userData = await getDataFromToken(req as any);
        if (!userData) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use either id or _id
        const currentUserId = userData.id || userData._id;
        if (!currentUserId) {
          return NextResponse.json({ error: "Invalid user ID" }, { status: 401 });
        }

        query.author = currentUserId;
      } else {
        query.author = author;
      }
    }

    // Filter by userId if specified
    if (userId) {
      query.author = userId;
    }

    // Execute query
    let posts;

    if (sort === "popular") {
      // For popular posts, we need to use aggregation to sort by the length of the likes array
      posts = await Post.aggregate([
        { $match: query },
        { $addFields: { likesCount: { $size: "$likes" } } },
        { $sort: { likesCount: -1, createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorDetails"
          }
        },
        { $unwind: "$authorDetails" },
        { $project: {
            _id: 1,
            content: 1,
            media: 1,
            likes: 1,
            commentCount: 1,
            views: 1,
            createdAt: 1,
            updatedAt: 1,
            hashtags: 1,
            mentions: 1,
            author: {
              _id: "$authorDetails._id",
              name: "$authorDetails.name",
              profilePictureUrl: "$authorDetails.profilePictureUrl",
              username: "$authorDetails.username",
              instagramUsername: "$authorDetails.instagramUsername",
              role: "$authorDetails.role"
            }
          }
        }
      ]);
    } else {
      // Default sort by creation date (descending)
      const sortOption = { createdAt: -1 as any };

      // Use regular find for latest posts
      posts = await Post.find(query)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("author", "name profilePictureUrl username instagramUsername role instagram")
        .lean();
    }

    return NextResponse.json(posts);
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}