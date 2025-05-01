import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  user: mongoose.Types.ObjectId;
  targetType: 'question' | 'answer';
  targetId: mongoose.Types.ObjectId;
  voteType: 'upvote' | 'downvote';
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['question', 'answer'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    voteType: { type: String, enum: ['upvote', 'downvote'], required: true },
  },
  { timestamps: true }
);

// Create a compound index to ensure a user can only vote once on a specific target
VoteSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

export default mongoose.models.Vote || mongoose.model<IVote>('Vote', VoteSchema); 