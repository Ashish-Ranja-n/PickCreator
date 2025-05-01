import { NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
// Import models from the index file to ensure proper loading order
import { User, Conversation, Message } from "@/models";

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await connect();
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    // Ensure User model is registered by accessing it
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const conversations = await Conversation.find({ participants: userId })
      .sort({ updatedAt: -1 }) // Sort by most recently updated
      .populate({
        path: "participants",
        select: "name avatar role _id profilePictureUrl instagram", // Add instagram field for admin profiles
        model: "User"
      })
      .populate({
        path: "lastMessage",
        select: "text media createdAt sender", // Include media and sender
        model: "Message"
      });

    const formattedConversations = await Promise.all(conversations.map(async (conv) => {
      const otherUser = conv.participants.find((p: any) => p._id.toString() !== userId) as any;
      
      // Fetch the last message for this conversation explicitly
      let lastMessage = null;
      if (!conv.lastMessage) {
        const lastMsg = await Message.findOne({ conversation: conv._id })
          .sort({ createdAt: -1 })
          .select("text media createdAt sender");
        if (lastMsg) {
          lastMessage = lastMsg;
        }
      } else {
        lastMessage = conv.lastMessage;
      }
      
      // Format the last message text, handling media attachments
      let lastMessageText = "";
      if (lastMessage) {
        const message = lastMessage as any;
        
        // Check if the message has media
        if (message.media && message.media.length > 0) {
          if (message.text) {
            // If there's text with media
            lastMessageText = message.text;
          } else {
            // If it's just media with no text
            const mediaType = message.media[0].type || 'file';
            lastMessageText = `[${mediaType}]`;
          }
        } else {
          // Text-only message
          lastMessageText = message.text || "";
        }
      }
      
      // Determine the avatar to use - try profilePictureUrl first, then avatar, then default
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
      
      return {
        _id: conv._id,
        name: otherUser?.name || "Unknown",
        role: otherUser?.role || "Unknown",
        avatar: avatarUrl,
        profilePictureUrl: otherUser?.profilePictureUrl || null,
        instagram: otherUser?.instagram || null,
        lastMessage: lastMessageText || null,
        lastMessageTime: lastMessage?.createdAt || conv.updatedAt,
        userId: otherUser?._id.toString() || "",
      };
    }));

    return NextResponse.json(formattedConversations, { status: 200 });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ message: "Internal Server Error", error: (error as Error).message }, { status: 500 });
  }
}
