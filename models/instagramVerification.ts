import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInstagramVerification extends Document {
  userId: Types.ObjectId;
  profilePicUrl: string;
  username: string;
  followerCount: number;
  randomCode: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const InstagramVerificationSchema = new Schema<IInstagramVerification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  profilePicUrl: { type: String },
  username: { type: String, required: true },
  followerCount: { type: Number, required: true },
  randomCode: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.InstagramVerification || mongoose.model<IInstagramVerification>('InstagramVerification', InstagramVerificationSchema);
