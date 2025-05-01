import { NextResponse } from "next/server";
import Message from "@/models/message";
import { connect } from "@/lib/mongoose";

export async function POST(req: Request) {
  try {
    await connect();
    const { conversationId, sender, text, media } = await req.json();

    if (!conversationId || !sender || (!text && (!media || media.length === 0))) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Create message object with required fields
    const messageData: any = {
      conversation: conversationId,
      sender,
    };

    // Add optional fields if they exist
    if (text) {
      messageData.text = text;
    }

    if (media && media.length > 0) {
      messageData.media = media;
    }

    const message = new Message(messageData);
    await message.save();

    return NextResponse.json({ 
      message: "Message sent",
      messageId: message._id 
    }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
