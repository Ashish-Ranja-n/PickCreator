import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer extends Document {
  content: string;
  question: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  upvotes: number;
  downvotes: number;
  isAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema: Schema = new Schema(
  {
    content: { type: String, required: true },
    question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    isAccepted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Answer || mongoose.model<IAnswer>('Answer', AnswerSchema); 