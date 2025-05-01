import { NextResponse } from "next/server";
import { connect } from "@/lib/mongoose";
import { User, ChatRoom } from "@/models";
import mongoose from "mongoose";

// Implement a helper function to get the user's profile picture
function getUserProfilePicture(user: any) {
  // For influencers, check profilePictureUrl first
  if (user.profilePictureUrl) {
    return user.profilePictureUrl;
  }
  
  // For influencers, check profilePicture next
  if (user.profilePicture) {
    return user.profilePicture;
  }
  
  // Check for admin/brand avatar
  if (user.avatar) {
    return user.avatar;
  }
  
  // For admins with Instagram profile picture
  if (user.instagram && user.instagram.profilePicture) {
    return user.instagram.profilePicture;
  }
  
  // Return default avatar with user's name for consistent fallback
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`;
}

// GET route to fetch a specific chat room details
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await connect();
    const { roomId } = await params;
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    // Find the chat room
    const chatRoom = await ChatRoom.findById(roomId)
      .populate({
        path: "createdBy",
        select: "name role avatar profilePicture profilePictureUrl instagram",
      })
      .populate({
        path: "participants",
        select: "name role avatar profilePicture profilePictureUrl instagram",
      });

    if (!chatRoom) {
      return NextResponse.json({ message: "Chat room not found" }, { status: 404 });
    }

    // Get user to check their role
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user has permission to access this room
    const hasAccess = 
      user.role === "Admin" || 
      chatRoom.accessType === "all" || 
      (user.role === "Brand" && chatRoom.accessType === "brand") || 
      (user.role === "Influencer" && chatRoom.accessType === "influencer");
    
    if (!hasAccess) {
      return NextResponse.json({ 
        message: "You don't have permission to access this room" 
      }, { status: 403 });
    }

    // Check if user is a participant
    const isUserInRoom = chatRoom.participants.some(
      (p: mongoose.Types.ObjectId) => p._id.toString() === userId
    );
    
    // Format creator with appropriate profile picture
    const createdBy = chatRoom.createdBy;
    const creatorProfilePic = getUserProfilePicture(createdBy);
    
    // Format participants with appropriate profile pictures
    const formattedParticipants = chatRoom.participants.map((p: any) => ({
      _id: p._id,
      name: p.name,
      role: p.role,
      avatar: getUserProfilePicture(p)
    }));
    
    // Format room details
    const formattedRoom = {
      _id: chatRoom._id,
      name: chatRoom.name,
      accessType: chatRoom.accessType,
      createdBy: {
        _id: createdBy._id,
        name: createdBy.name,
        role: createdBy.role,
        avatar: creatorProfilePic
      },
      participants: formattedParticipants,
      createdAt: chatRoom.createdAt,
      updatedAt: chatRoom.updatedAt,
      isUserInRoom
    };
    
    return NextResponse.json(formattedRoom);
  } catch (error) {
    console.error("Error fetching chat room:", error);
    return NextResponse.json({ 
      message: "Internal Server Error", 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// Update room details (admin only)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await connect();
    const { roomId } = await params;
    const { name, accessType } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json({ success: false, message: "Invalid room ID" }, { status: 400 });
    }

    // Find the room
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return NextResponse.json({ success: false, message: "Chat room not found" }, { status: 404 });
    }

    // Find the requester
    const requesterId = new URL(req.url).searchParams.get('userId');
    if (!requesterId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    const requester = await User.findById(requesterId);
    if (!requester) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Only admins can update chat rooms
    if (requester.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: "Only administrators can update chat rooms" },
        { status: 403 }
      );
    }

    // Update the room
    chatRoom.name = name || chatRoom.name;
    chatRoom.accessType = accessType || chatRoom.accessType;
    await chatRoom.save();

    return NextResponse.json({
      success: true,
      message: "Chat room updated successfully",
      chatRoom: {
        _id: chatRoom._id,
        name: chatRoom.name,
        accessType: chatRoom.accessType,
        createdBy: chatRoom.createdBy,
        participants: chatRoom.participants,
        createdAt: chatRoom.createdAt,
        updatedAt: chatRoom.updatedAt
      }
    });
  } catch (error: any) {
    console.error("Error updating chat room:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update chat room" },
      { status: 500 }
    );
  }
}

// POST route to join a chat room
export async function POST(
  req: Request, 
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await connect();
    const { roomId } = await params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    // Find the chat room
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return NextResponse.json({ message: "Chat room not found" }, { status: 404 });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user has permission to join this room
    const hasPermission = 
      user.role === "Admin" || 
      chatRoom.accessType === "all" || 
      (user.role === "Brand" && chatRoom.accessType === "brand") || 
      (user.role === "Influencer" && chatRoom.accessType === "influencer");
    
    if (!hasPermission) {
      return NextResponse.json({ 
        message: "You don't have permission to join this room" 
      }, { status: 403 });
    }

    // Check if user is already in the room
    const isAlreadyInRoom = chatRoom.participants.some(
      (p: mongoose.Types.ObjectId) => p.toString() === userId
    );

    if (isAlreadyInRoom) {
      return NextResponse.json({ 
        message: "You are already in this room" 
      }, { status: 409 });
    }

    // Add user to participants
    chatRoom.participants.push(userId as any);
    await chatRoom.save();

    // Get the formatted user data for the socket event
    const formattedUser = {
      _id: user._id.toString(),
      name: user.name || 'Unknown User',
      role: user.role || 'User',
      profilePicture: getUserProfilePicture(user),
      email: user.email
    };

    // Emit participant joined event using socket.io
    try {
      // Use server-side fetch to emit an event to the socket server
      const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:4000';
      const response = await fetch(`${socketServerUrl}/emit-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'participantJoined',
          data: {
            roomId,
            participant: formattedUser
          }
        })
      });
      
      if (!response.ok) {
        console.error('Failed to emit participantJoined event:', await response.text());
      }
    } catch (socketError) {
      console.error('Error emitting participantJoined event:', socketError);
      // Continue with the response even if socket emission fails
    }

    return NextResponse.json({ 
      success: true,
      message: "Joined chat room successfully" 
    }, { status: 200 });
  } catch (error) {
    console.error("Error joining chat room:", error);
    return NextResponse.json({ 
      message: "Internal Server Error", 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// Leave or delete a chat room
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await connect();
    const { roomId } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json({ success: false, message: "Invalid room ID" }, { status: 400 });
    }

    // Find the room
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return NextResponse.json({ success: false, message: "Chat room not found" }, { status: 404 });
    }

    // Find the user
    const userId = new URL(req.url).searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Check if user is admin (admins can delete rooms)
    if (user.role === 'Admin') {
      // Delete all messages from this room
      await mongoose.model('RoomMessage').deleteMany({ chatRoom: roomId });
      
      // Delete the room
      await ChatRoom.findByIdAndDelete(roomId);
      
      return NextResponse.json({
        success: true,
        message: "Chat room deleted successfully"
      });
    }

    // For non-admin users, handle leaving the room
    // Check if user is in the room
    const isParticipant = chatRoom.participants.some(
      (p: mongoose.Types.ObjectId) => p.toString() === userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, message: "You are not a member of this chat room" },
        { status: 400 }
      );
    }

    // Check if user is the creator and there are other participants
    const isCreator = chatRoom.createdBy.toString() === userId;
    if (isCreator && chatRoom.participants.length > 1) {
      return NextResponse.json(
        { 
          success: false, 
          message: "As the creator, you cannot leave while others are in the room. Delete the room instead." 
        },
        { status: 400 }
      );
    }

    // If user is the only participant or not the creator, handle accordingly
    if (chatRoom.participants.length === 1 || !isCreator) {
      // Emit participant left event before removing from room
      try {
        const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:4000';
        const socketResponse = await fetch(`${socketServerUrl}/emit-event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'participantLeft',
            data: {
              roomId,
              participantId: userId,
              participantName: user.name || 'Unknown User'
            }
          }),
          // Add a timeout to prevent hanging
          signal: AbortSignal.timeout(2000)
        }).catch(err => {
          console.error('Socket server fetch failed:', err);
          // Return null to indicate failure but allow the operation to continue
          return null;
        });
        
        if (socketResponse && !socketResponse.ok) {
          console.error('Failed to emit participantLeft event:', await socketResponse.text());
        }
      } catch (socketError) {
        console.error('Error emitting participantLeft event:', socketError);
        // Continue with the response even if socket emission fails
      }

      // Remove user from participants - proceed even if socket emit failed
      chatRoom.participants = chatRoom.participants.filter(
        (p: mongoose.Types.ObjectId) => p.toString() !== userId
      );
      
      // If room is now empty, delete it
      if (chatRoom.participants.length === 0) {
        // Delete all messages from this room
        await mongoose.model('RoomMessage').deleteMany({ chatRoom: roomId });
        
        // Delete the room
        await ChatRoom.findByIdAndDelete(roomId);
        
        return NextResponse.json({
          success: true,
          message: "You left the chat room and it was deleted as it's now empty"
        });
      }
      
      // Save the updated room with user removed
      await chatRoom.save();
      
      return NextResponse.json({
        success: true,
        message: "You have left the chat room"
      });
    }

    return NextResponse.json(
      { success: false, message: "Failed to leave chat room" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error leaving/deleting chat room:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to leave/delete chat room" },
      { status: 500 }
    );
  }
} 