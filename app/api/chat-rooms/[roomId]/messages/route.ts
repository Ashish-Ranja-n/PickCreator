import { NextRequest, NextResponse } from "next/server";
import {connect} from "@/lib/mongoose";
import ChatRoom from "@/models/chatRoom";
import User from "@/models/user";
import RoomMessage from "@/models/roomMessage";
import mongoose from "mongoose";

// Helper function to get user profile picture
function getUserProfilePicture(user: any) {
  // Safety check in case user is undefined or null
  if (!user) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=default`;
  }

  // For admins with Instagram profile picture
  if (user.instagram && user.instagram.profilePicture && 
      typeof user.instagram.profilePicture === 'string' && 
      user.instagram.profilePicture.trim() !== '') {
    return user.instagram.profilePicture;
  }
  
  // For influencers, check profilePictureUrl first
  if (user.profilePictureUrl && typeof user.profilePictureUrl === 'string' && user.profilePictureUrl.trim() !== '') {
    return user.profilePictureUrl;
  }
  
  // For influencers, check profilePicture next
  if (user.profilePicture && typeof user.profilePicture === 'string' && user.profilePicture.trim() !== '') {
    return user.profilePicture;
  }
  
  // Check for admin/brand avatar
  if (user.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== '') {
    return user.avatar;
  }
  
  // Return default avatar with user's name for consistent fallback
  const seed = user.name || 'user';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}

// Get messages for a chat room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await connect();
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json({ message: "Invalid room ID" }, { status: 400 });
    }

    // Fetch the chat room to check if the user is a participant
    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      return NextResponse.json({ message: "Chat room not found" }, { status: 404 });
    }

    // Check if user is a participant in the room
    const isParticipant = chatRoom.participants.some(
      (p: mongoose.Types.ObjectId) => p.toString() === userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { message: "You are not a participant in this chat room" },
        { status: 403 }
      );
    }

    // Fetch messages for the chat room using the new RoomMessage model
    const messages = await RoomMessage.find({ chatRoom: roomId })
      .sort({ createdAt: 1 }) // Sort by timestamp ascending
      .populate("sender", "name role avatar profilePicture profilePictureUrl instagram");

    // Format messages with correct profile pictures
    const formattedMessages = messages.map(message => {
      try {
        const msg = message.toObject();
        return {
          ...msg,
          sender: {
            ...msg.sender,
            avatar: msg.sender ? getUserProfilePicture(msg.sender) : null
          }
        };
      } catch (err) {
        console.error("Error formatting message:", err);
        // Return a sanitized version of the message
        return {
          _id: message._id,
          content: message.content,
          chatRoom: message.chatRoom,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          sender: {
            _id: message.sender?._id || 'unknown',
            name: message.sender?.name || 'Unknown User',
            role: message.sender?.role || 'User',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=fallback`
          }
        };
      }
    });

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { message: "Error fetching messages" },
      { status: 500 }
    );
  }
}

// Create a new message in a chat room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await connect();
    const { roomId } = await params;
    const body = await request.json();
    const { content, senderId } = body;

    if (!content || !senderId) {
      return NextResponse.json(
        { message: "Content and sender ID are required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json({ message: "Invalid room ID" }, { status: 400 });
    }

    // Fetch the chat room to check if the user is a participant
    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      return NextResponse.json({ message: "Chat room not found" }, { status: 404 });
    }

    // Check if the sender is a participant
    const isParticipant = chatRoom.participants.some(
      (p: mongoose.Types.ObjectId) => p.toString() === senderId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { message: "You must be a participant to send messages in this room" },
        { status: 403 }
      );
    }

    // Create the new message using RoomMessage model
    const newMessage = new RoomMessage({
      content,
      sender: senderId,
      chatRoom: roomId,
    });

    await newMessage.save();

    // Fetch the sender's details with all possible profile picture fields
    const sender = await User.findById(senderId, "name role avatar profilePicture profilePictureUrl instagram");

    // Create a response with the sender's details included
    const messageWithSender = {
      ...newMessage.toObject(),
      sender: {
        ...sender?.toObject(),
        avatar: getUserProfilePicture(sender)
      }
    };

    return NextResponse.json(messageWithSender);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { message: "Error sending message" },
      { status: 500 }
    );
  }
}