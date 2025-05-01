import { connect } from "@/lib/mongoose";
import Conversation from "@/models/conversation";
import Message from "@/models/message";
import { NextRequest, NextResponse } from "next/server";

// Connect to MongoDB
connect();

/**
 * DELETE handler for deleting a conversation and all its messages
 * @param request - The incoming request
 * @param params - URL parameters including conversationId
 * @returns NextResponse with success or error message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;

    // Validate the conversation ID
    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    // Find the conversation to verify it exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Delete all messages associated with the conversation
    await Message.deleteMany({ conversation: conversationId });

    // Delete the conversation itself
    await Conversation.findByIdAndDelete(conversationId);

    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: "Conversation and all associated messages deleted successfully" 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting conversation:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete conversation", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
