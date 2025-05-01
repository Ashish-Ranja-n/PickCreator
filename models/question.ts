import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  tags: string[];
  views: number;
  upvotes: number;
  downvotes: number;
  isAnswered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String }],
    views: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    isAnswered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema); 