import mongoose, { Schema, Document } from "mongoose";
// Import User model to ensure it's registered before being referenced
import User from "./user";

interface IConversation extends Document {
  name?: string; // For group chats
  avatar?: string; // For group chats
  isGroup: boolean;
  participants: mongoose.Schema.Types.ObjectId[]; // Reference to User model
  lastMessage?: mongoose.Schema.Types.ObjectId; // Reference to the latest message
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    name: { type: String, trim: true }, // Only for group chats
    avatar: { type: String, trim: true }, // Only for group chats
    isGroup: { type: Boolean, required: true, default: false },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
  },
  { timestamps: true }
);

// Make sure to register models in the correct order
const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>("Conversation", ConversationSchema);
export default Conversation;