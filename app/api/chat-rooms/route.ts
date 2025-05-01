import { NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import { User, ChatRoom } from "@/models";

// POST route to create a new chat room
export async function POST(req: Request) {
  try {
    await connect();
    const { name, accessType, createdBy } = await req.json();

    if (!name || !accessType || !createdBy) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Validate creator exists
    const creatorExists = await User.exists({ _id: createdBy });
    if (!creatorExists) {
      return NextResponse.json({ message: "Creator user not found" }, { status: 404 });
    }

    // Create new chat room
    const chatRoom = new ChatRoom({
      name,
      accessType,
      createdBy,
      participants: [createdBy], // Creator is the first participant
    });

    await chatRoom.save();

    return NextResponse.json({ 
      success: true,
      message: "Chat room created successfully",
      chatRoom: {
        _id: chatRoom._id,
        name: chatRoom.name,
        accessType: chatRoom.accessType,
        createdBy: chatRoom.createdBy,
        createdAt: chatRoom.createdAt,
        participants: chatRoom.participants
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating chat room:", error);
    return NextResponse.json({ 
      success: false,
      message: "Internal Server Error", 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// GET route to fetch all chat rooms based on user role and access type
export async function GET(req: Request) {
  try {
    await connect();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    // Get user to check their role
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const query: any = {};
    
    // If user is not admin, filter rooms by access type
    if (user.role !== "Admin") {
      if (user.role === "Brand") {
        query.accessType = { $in: ["brand", "all"] };
      } else if (user.role === "Influencer") {
        query.accessType = { $in: ["influencer", "all"] };
      }
    }

    const chatRooms = await ChatRoom.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "createdBy",
        select: "name role avatar",
        model: "User"
      });

    // Format response
    const formattedRooms = chatRooms.map(room => ({
      _id: room._id,
      name: room.name,
      accessType: room.accessType,
      createdBy: (room.createdBy as any)._id,
      createdByName: (room.createdBy as any).name,
      createdAt: room.createdAt,
      participants: room.participants.length
    }));

    return NextResponse.json(formattedRooms, { status: 200 });
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    return NextResponse.json({ 
      success: false,
      message: "Internal Server Error", 
      error: (error as Error).message 
    }, { status: 500 });
  }
} 