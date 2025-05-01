import mongoose, { Schema, Document } from "mongoose";
// Import User model to ensure it's registered before being referenced
import User from "./user";

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

interface IMessage extends Document {
  conversation: mongoose.Schema.Types.ObjectId; // Now required
  sender: mongoose.Schema.Types.ObjectId; // Reference to User model
  text?: string;
  media?: IMediaItem[]; // Array of media items
  seenBy: mongoose.Schema.Types.ObjectId[]; // Users who have seen the message
  createdAt: Date;
  updatedAt: Date;
}
  
const MessageSchema = new Schema<IMessage>(
  {
    conversation: { 
      type: Schema.Types.ObjectId, 
      ref: "Conversation",
      required: true
    }, 
    sender: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    text: { type: String, trim: true },
    media: [MediaItemSchema], // Array of media items with detailed information
    seenBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Add indexes for better query performance
MessageSchema.index({ conversation: 1, createdAt: 1 });
MessageSchema.index({ sender: 1 });
  
const Message = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
export default Message  