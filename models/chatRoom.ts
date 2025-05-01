import mongoose, { Schema, Document } from "mongoose";

export interface IChatRoom extends Document {
  name: string;
  accessType: "brand" | "influencer" | "all";
  createdBy: mongoose.Schema.Types.ObjectId;
  participants: mongoose.Schema.Types.ObjectId[];
  messages: mongoose.Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatRoomSchema = new Schema<IChatRoom>(
  {
    name: { type: String, required: true, trim: true },
    accessType: { 
      type: String, 
      enum: ["brand", "influencer", "all"], 
      required: true,
      default: "all"
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    participants: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User" 
    }],
    messages: [{ 
      type: Schema.Types.ObjectId, 
      ref: "Message" 
    }],
  },
  { timestamps: true }
);

// Create indexes for faster queries
ChatRoomSchema.index({ accessType: 1 });
ChatRoomSchema.index({ participants: 1 });

const ChatRoom = mongoose.models.ChatRoom || mongoose.model<IChatRoom>("ChatRoom", ChatRoomSchema);

export default ChatRoom; 