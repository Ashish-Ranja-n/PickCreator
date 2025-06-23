import mongoose, { Schema, Document } from "mongoose";

// Common fields for all users
interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "Brand" | "Influencer" | "Admin";
  avatar:string;
  isVerified: boolean;
  forgotPasswordToken?: string;
  forgotPasswordTokenExpiry?: Date;
  verifyToken?: string;
  verifyTokenExpiry?: Date;
  phoneNumber?: string;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Brand", "Influencer", "Admin"], required: true },
    avatar:{ type: String },
    isVerified: { type: Boolean, default: false },
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,
    verifyToken: String,
    verifyTokenExpiry: Date,
    phoneNumber: { type: String },
  },
  { timestamps: true, discriminatorKey: "role" }
);

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
