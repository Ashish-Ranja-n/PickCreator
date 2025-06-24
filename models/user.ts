import mongoose, { Schema, Document } from "mongoose";

// Common fields for all users
interface IUser extends Document {
  name?: string;
  email?: string;
  password?: string;
  role?: "Brand" | "Influencer" | "Admin";
  avatar?: string;
  isVerified?: boolean;
  forgotPasswordToken?: string;
  forgotPasswordTokenExpiry?: Date;
  verifyToken?: string;
  verifyTokenExpiry?: Date;
  phoneNumber?: string;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    role: { type: String, enum: ["Brand", "Influencer", "Admin", "needed"] },
    avatar: { type: String },
    isVerified: { type: Boolean, default: false },
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,
    verifyToken: String,
    verifyTokenExpiry: Date,
    phoneNumber: { type: String, unique: true },
  },
  { timestamps: true, discriminatorKey: "role" }
);

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
