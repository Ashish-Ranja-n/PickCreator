import { NextResponse } from "next/server";
import Message from "@/models/message";
import Conversation from "@/models/conversation";
import User from "@/models/user";
import {connect} from "@/lib/mongoose";
import { Types } from "mongoose";

// Define message type for cursor pagination
interface MessageDocument {
  _id: Types.ObjectId;
  conversation: string;
  sender: string;
  text?: string;
  media?: Array<any>;
  createdAt: Date;
}

export async function GET(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    await connect();
    const { conversationId } = await params;
    
    // Get URL parameters for pagination
    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor");
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 20; // Default to 20 messages
    
    // Build the query
    const query: any = { conversation: conversationId };
    
    // If cursor is provided, get messages older than the cursor
    if (cursor && Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }
    
    // Get messages with pagination - sorted by newest first for cursor pagination
    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Descending order (newest first)
      .limit(limit + 1) // Fetch one extra to determine if there are more
      .lean();
    
    // Check if there are more messages
    const hasMore = messages.length > limit;
    
    // Remove the extra message from the result set
    const paginatedMessages = hasMore ? messages.slice(0, limit) : messages;
    
    // Get the cursor for the next page (ID of the last/oldest message)
    const nextCursor = hasMore && paginatedMessages.length > 0 
      ? paginatedMessages[paginatedMessages.length - 1]._id 
      : null;
    
    // Since we fetched newest first for pagination, reverse to get chronological order for display
    const orderedMessages = [...paginatedMessages].reverse();

    const conversation = await Conversation.findById(conversationId).populate({
      path: "participants",
      select: "name role profilePictureUrl avatar instagram",
      model: User,
    });

    if (!conversation) {
      return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
    }

    const otherUserId = conversation.participants.find((user: any) => user._id.toString() !== req.headers.get("userId"));
    const otherUser = otherUserId ? await User.findById(otherUserId) : null;

    // Determine the avatar URL based on priority order
    let avatarUrl = "/default-avatar.png";
    
    // Check for Instagram profile picture first (especially for admins)
    if (otherUser?.instagram?.profilePicture) {
      avatarUrl = otherUser.instagram.profilePicture;
    }
    // Then check for profilePictureUrl (usually for influencers)
    else if (otherUser?.profilePictureUrl) {
      avatarUrl = otherUser.profilePictureUrl;
    } 
    // Then check for regular avatar
    else if (otherUser?.avatar) {
      avatarUrl = otherUser.avatar;
    }

    return NextResponse.json({
      messages: orderedMessages,
      otherUser: otherUser ? { 
        _id: otherUser._id, 
        name: otherUser.name, 
        avatar: avatarUrl,
        profilePictureUrl: otherUser.profilePictureUrl,
        instagram: otherUser.instagram,
        role: otherUser.role 
      } : null,
      nextCursor: nextCursor ? nextCursor.toString() : null, // Convert ObjectId to string
      hasMore // Include flag indicating if there are more messages
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
