import mongoose, { Schema, Document } from "mongoose";
import User from "./user";
import ChatRoom from "./chatRoom";

// Define media item interface
interface IMediaItem {
  url: string;
  publicId: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
}

// Define media item schema
const MediaItemSchema = new Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['image', 'video', 'audio', 'document', 'other'],
    required: true 
  }
});

interface IRoomMessage extends Document {
  chatRoom: mongoose.Schema.Types.ObjectId; // Reference to ChatRoom model
  sender: mongoose.Schema.Types.ObjectId; // Reference to User model
  content: string;
  media?: IMediaItem[]; // Array of media items
  seenBy: mongoose.Schema.Types.ObjectId[]; // Users who have seen the message
  createdAt: Date;
  updatedAt: Date;
}
  
const RoomMessageSchema = new Schema<IRoomMessage>(
  {
    chatRoom: { 
      type: Schema.Types.ObjectId, 
      ref: "ChatRoom", 
      required: true 
    },
    sender: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    content: { 
      type: String, 
      trim: true,
      required: true
    },
    media: [MediaItemSchema], // Array of media items with detailed information
    seenBy: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User" 
    }],
  },
  { timestamps: true }
);

// Add indexes for better query performance
RoomMessageSchema.index({ chatRoom: 1, createdAt: 1 });
RoomMessageSchema.index({ sender: 1 });
  
const RoomMessage = mongoose.models.RoomMessage || mongoose.model<IRoomMessage>("RoomMessage", RoomMessageSchema);
export default RoomMessage; 