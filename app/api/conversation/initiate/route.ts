import { NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import { User, Conversation, Message } from "@/models";

export async function POST(req: Request) {
  try {
    await connect();
    const { currentUserId, otherUserId, initialMessage } = await req.json();

    if (!currentUserId || !otherUserId) {
      return NextResponse.json({ message: "User IDs are required" }, { status: 400 });
    }

    // Ensure User model is registered by checking if users exist
    const currentUserExists = await User.exists({ _id: currentUserId });
    const otherUserExists = await User.exists({ _id: otherUserId });
    
    if (!currentUserExists || !otherUserExists) {
      return NextResponse.json({ message: "One or both users not found" }, { status: 404 });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [currentUserId, otherUserId] },
    });

    // If conversation doesn't exist, create a new one
    if (!conversation) {
      conversation = new Conversation({
        isGroup: false,
        participants: [currentUserId, otherUserId],
      });

      await conversation.save();
    }

    // If an initial message is provided, create and save it
    if (initialMessage && initialMessage.trim()) {
      const message = new Message({
        conversation: conversation._id,
        sender: currentUserId,
        text: initialMessage,
      });

      await message.save();

      // Update the conversation's lastMessage reference
      conversation.lastMessage = message._id;
      await conversation.save();
    }

    return NextResponse.json({ 
      success: true,
      conversationId: conversation._id 
    }, { status: 200 });
  } catch (error) {
    console.error("Error initiating conversation:", error);
    return NextResponse.json({ 
      success: false,
      message: "Internal Server Error", 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
