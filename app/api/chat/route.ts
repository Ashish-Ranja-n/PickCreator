import { connect } from "@/lib/mongoose";
import Message from "@/models/message";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    await connect();
    const conversationId = req.nextUrl.searchParams.get("conversationId");
  
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }
  
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    return NextResponse.json(messages);
  }
  