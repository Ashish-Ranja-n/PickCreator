import { NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
// Import models from the index file to ensure proper loading order
import { User, Conversation } from "@/models";

export async function POST(req: Request) {
  try {
    await connect();
    const { currentUserId, otherUserId } = await req.json();

    if (!currentUserId || !otherUserId) {
      return NextResponse.json({ message: "User IDs are required" }, { status: 400 });
    }

    // Ensure User model is registered by checking if users exist
    const currentUserExists = await User.exists({ _id: currentUserId });
    const otherUserExists = await User.exists({ _id: otherUserId });
    
    if (!currentUserExists || !otherUserExists) {
      return NextResponse.json({ message: "One or both users not found" }, { status: 404 });
    }

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

    return NextResponse.json({ conversationId: conversation._id }, { status: 200 });
  } catch (error) {
    console.error("Error creating/getting conversation:", error);
    return NextResponse.json({ message: "Internal Server Error", error: (error as Error).message }, { status: 500 });
  }
}
